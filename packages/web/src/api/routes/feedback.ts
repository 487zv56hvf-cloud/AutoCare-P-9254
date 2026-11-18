import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { feedback as feedbackTable } from "../database/schema";
import { sendEmail } from "../services/email";
import { ownerEmail } from "../services/owner";

// Light abuse guard: at most 8 messages per sender per 10 minutes (per server instance).
const WINDOW = 10 * 60_000;
const LIMIT = 8;
const recent = new Map<string, number[]>();
function allow(key: string) {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < WINDOW);
  if (list.length >= LIMIT) return false;
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear();
  return true;
}

const KIND_LABEL = { idea: "Idea", problem: "Problem", other: "Other" } as const;
const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export const feedback = {
  /** Saves the feedback, then tries to email the owner. Saving never depends on email working. */
  send: authed
    .input(
      z.object({
        kind: z.enum(["idea", "problem", "other"]),
        rating: z.number().int().min(1).max(5).nullable().optional(),
        message: z.string().trim().min(3).max(2000),
        contact: z.string().trim().max(120).optional(),
        car: z.string().max(200).optional(),
        lang: z.enum(["ar", "en"]).optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const sender =
        context.user?.id ?? context.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? context.headers.get("x-real-ip") ?? "anon";
      if (!allow(sender)) throw new ORPCError("TOO_MANY_REQUESTS", { message: "Too many messages, try again later" });

      const contact = input.contact || context.user?.email || null;
      const [row] = await db
        .insert(feedbackTable)
        .values({
          userId: context.user?.id ?? null,
          kind: input.kind,
          rating: input.rating ?? null,
          message: input.message,
          contact,
          car: input.car ?? null,
          lang: input.lang ?? null,
        })
        .returning({ id: feedbackTable.id });

      const to = ownerEmail();
      let emailed = false;
      if (to) {
        const who = context.user?.email ?? "Guest (not signed in)";
        const stars = input.rating ? `${"★".repeat(input.rating)}${"☆".repeat(5 - input.rating)}` : "no rating";
        const text = [
          `New ${KIND_LABEL[input.kind].toLowerCase()} from AutoCare`,
          "",
          `From: ${who}`,
          `Reply to: ${contact ?? "not given"}`,
          `Car: ${input.car ?? "not set"}`,
          `Rating: ${stars}`,
          "",
          input.message,
          "",
          "Also saved in the app: Account (person icon) > Owner inbox > Feedback.",
        ].join("\n");
        const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
          <h2 style="color:#0B6E4F;margin:0 0 8px">New ${KIND_LABEL[input.kind].toLowerCase()} from AutoCare</h2>
          <p style="color:#555;margin:0 0 12px"><b>From:</b> ${esc(who)}<br><b>Reply to:</b> ${esc(contact ?? "not given")}<br>
          <b>Car:</b> ${esc(input.car ?? "not set")}<br><b>Rating:</b> ${stars}</p>
          <div dir="auto" style="padding:12px 14px;border-radius:10px;background:#E7F6EF;white-space:pre-wrap">${esc(input.message)}</div>
          <p style="color:#555;margin-top:16px">Also saved in the app: Account &gt; <b>Owner inbox</b> &gt; Feedback.</p></div>`;
        emailed = await sendEmail({ to, subject: `AutoCare feedback: ${KIND_LABEL[input.kind]}${input.rating ? ` (${input.rating}/5)` : ""}`, text, html });
        if (emailed && row) {
          await db.update(feedbackTable).set({ emailed: true }).where(eq(feedbackTable.id, row.id));
        }
      }
      return { ok: true, id: row?.id ?? null };
    }),
};
