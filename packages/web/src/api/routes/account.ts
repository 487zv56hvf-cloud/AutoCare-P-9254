import { eq, inArray } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { base } from "../__core/app";
import { db } from "../database";
import { account as authAccount, feedback, session, supportMessage, user, vehicleBackup } from "../database/schema";
import { ownerEmail } from "../services/owner";

export const account = {
  /**
   * Permanently deletes the signed-in account and everything stored for it:
   * backed-up cars (with service history), support chats, feedback, sign-in sessions and linked logins.
   * Rows are deleted explicitly (not only through foreign-key cascades) so nothing is left behind.
   */
  delete: authed.handler(async ({ context }) => {
    const id = context.user.id;
    const convs = await db
      .selectDistinct({ c: supportMessage.conversationId })
      .from(supportMessage)
      .where(eq(supportMessage.userId, id));
    if (convs.length)
      await db.delete(supportMessage).where(
        inArray(
          supportMessage.conversationId,
          convs.map((r) => r.c),
        ),
      );
    await db.delete(supportMessage).where(eq(supportMessage.userId, id));
    await db.delete(feedback).where(eq(feedback.userId, id));
    await db.delete(vehicleBackup).where(eq(vehicleBackup.userId, id));
    await db.delete(session).where(eq(session.userId, id));
    await db.delete(authAccount).where(eq(authAccount.userId, id));
    await db.delete(user).where(eq(user.id, id));
    return { ok: true as const };
  }),
};

export const legal = {
  /** Public contact address shown on the privacy policy and support pages. */
  contact: base.handler(() => ({ email: ownerEmail() || null })),
};
