import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { authed, withUser } from "../middleware/auth";
import { db } from "../database";
import { feedback, supportMessage, user } from "../database/schema";
import { isOwner } from "../services/owner";

/** Only the owner (Google-verified OWNER_EMAIL) gets past this. */
const ownerOnly = authed.use(async ({ context, next }) => {
  if (!isOwner(context.user)) throw new ORPCError("FORBIDDEN");
  return next();
});

export const owner = {
  /** Lets the app show the Support inbox button only to the owner. */
  me: withUser.handler(async ({ context }) => ({ isOwner: isOwner(context.user) })),

  /** Conversations where the assistant asked for the team. Open ones first, newest first. */
  inbox: ownerOnly.input(z.object({ show: z.enum(["open", "done", "all"]).default("open") })).handler(async ({ input }) => {
    const flagged = await db
      .select({ conversationId: supportMessage.conversationId, handled: supportMessage.handled, createdAt: supportMessage.createdAt })
      .from(supportMessage)
      .where(eq(supportMessage.needsHuman, true))
      .orderBy(desc(supportMessage.createdAt));
    const byConv = new Map<string, { open: boolean; flaggedAt: Date }>();
    for (const f of flagged) {
      const cur = byConv.get(f.conversationId);
      if (!cur) byConv.set(f.conversationId, { open: !f.handled, flaggedAt: f.createdAt });
      else if (!f.handled) cur.open = true;
    }
    const ids = [...byConv.keys()].filter((id) => {
      const open = byConv.get(id)!.open;
      return input.show === "all" || (input.show === "open" ? open : !open);
    });
    if (!ids.length) return [];
    const msgs = await db
      .select({ conversationId: supportMessage.conversationId, role: supportMessage.role, content: supportMessage.content, userId: supportMessage.userId, createdAt: supportMessage.createdAt })
      .from(supportMessage)
      .where(inArray(supportMessage.conversationId, ids))
      .orderBy(asc(supportMessage.id));
    const userIds = [...new Set(msgs.map((m) => m.userId).filter((x): x is string => !!x))];
    const users = userIds.length ? await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, userIds)) : [];
    const emailOf = new Map(users.map((u) => [u.id, u.email]));
    return ids.map((id) => {
      const mine = msgs.filter((m) => m.conversationId === id);
      const firstUser = mine.find((m) => m.role === "user");
      const lastUser = [...mine].reverse().find((m) => m.role === "user");
      const uid = mine.find((m) => m.userId)?.userId;
      return {
        conversationId: id,
        open: byConv.get(id)!.open,
        flaggedAt: byConv.get(id)!.flaggedAt,
        email: uid ? (emailOf.get(uid) ?? null) : null,
        preview: (lastUser ?? firstUser)?.content.slice(0, 140) ?? "",
        count: mine.length,
      };
    });
  }),

  /** Full transcript of one conversation. */
  conversation: ownerOnly.input(z.object({ conversationId: z.string().min(8).max(64) })).handler(async ({ input }) => {
    return db
      .select({ id: supportMessage.id, role: supportMessage.role, content: supportMessage.content, needsHuman: supportMessage.needsHuman, handled: supportMessage.handled, createdAt: supportMessage.createdAt })
      .from(supportMessage)
      .where(eq(supportMessage.conversationId, input.conversationId))
      .orderBy(asc(supportMessage.id));
  }),

  /** Marks a conversation done (or re-opens it). */
  setHandled: ownerOnly.input(z.object({ conversationId: z.string().min(8).max(64), handled: z.boolean() })).handler(async ({ input }) => {
    await db.update(supportMessage).set({ handled: input.handled }).where(and(eq(supportMessage.conversationId, input.conversationId)));
    return { ok: true };
  }),

  /** Feedback sent from the app, newest first. */
  feedback: ownerOnly.input(z.object({ show: z.enum(["new", "read", "all"]).default("new") })).handler(async ({ input }) => {
    const where = input.show === "all" ? undefined : eq(feedback.read, input.show === "read");
    const rows = await db.select().from(feedback).where(where).orderBy(desc(feedback.createdAt)).limit(200);
    const userIds = [...new Set(rows.map((r) => r.userId).filter((x): x is string => !!x))];
    const users = userIds.length ? await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.id, userIds)) : [];
    const emailOf = new Map(users.map((u) => [u.id, u.email]));
    return rows.map((r) => ({ ...r, account: r.userId ? (emailOf.get(r.userId) ?? null) : null }));
  }),

  /** Marks feedback read / unread. */
  setFeedbackRead: ownerOnly.input(z.object({ id: z.number().int(), read: z.boolean() })).handler(async ({ input }) => {
    await db.update(feedback).set({ read: input.read }).where(eq(feedback.id, input.id));
    return { ok: true };
  }),

  /** Badge counts for the owner inbox button. */
  counts: ownerOnly.handler(async () => {
    const [fb] = await db.select({ n: count() }).from(feedback).where(eq(feedback.read, false));
    return { newFeedback: fb?.n ?? 0 };
  }),
};
