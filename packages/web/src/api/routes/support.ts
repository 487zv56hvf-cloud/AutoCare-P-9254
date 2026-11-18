import { generateText, Output } from "ai";
import { asc, eq } from "drizzle-orm";
import dedent from "dedent";
import { z } from "zod";
import { authed } from "../middleware/auth";
import { gateway } from "../agent/gateway";
import { db } from "../database";
import { supportMessage } from "../database/schema";
import { sendEmail } from "../services/email";
import { ownerEmail } from "../services/owner";

const SYSTEM = dedent`
  You are the customer support assistant inside "AutoCare", a free car-maintenance
  app for drivers in Egypt. Reply in the user's language: Egyptian Arabic if they write Arabic, English otherwise.
  Keep answers short (2-5 sentences), friendly and practical. No emoji.

  What the app does:
  - The user can add as many cars as they want and open them from the My cars screen. Cars, Account and Settings are separate screens.
    A car is added by typing the VIN (chassis number, 17 characters) or by picking make → model → engine.
    The setup screen has pictures showing where to find the VIN: bottom corner of the windshield on the driver side,
    the sticker on the driver's door frame, and stamped in the engine bay (firewall). The VIN is NOT printed on the
    Egyptian driver's licence, so never tell users to look there. There is no photo identification.
  - Engine types: petrol, diesel, hybrid, plug-in hybrid, and a separate Electric car menu.
  - It shows km left and estimated days until the next oil change, brake pads and tires, based on
    typical manufacturer intervals shortened for Egyptian city driving (heat, dust, traffic).
    Oil intervals: mineral 5,000 km, semi-synthetic 7,500 km, full synthetic 10,000 km before the driving factor.
    Electric cars have no oil change.
  - "I just did this" resets an item to the current odometer. Updating the odometer improves the km/day estimate.
  - Signing in (Apple, Google or email) backs all their cars up to the cloud. On a new phone they just sign in and
    their cars come back. Sign-in is required to use the app or website. Each account only sees its own cars.
  - There is a Feedback screen (megaphone button at the top) to send ideas or report problems to the team.
  - A plate number alone cannot identify a car's make/model/VIN for a stranger; Egypt has no public registry.
  - Support FAQ is under the help (lifebuoy) button.

  Rules:
  - Car advice must be general and safe. Always tell them to follow the owner manual. For warning lights,
    brake problems, overheating, smoke, fuel smell or anything safety-related, tell them to stop driving
    if unsafe and see a qualified mechanic or the dealer.
  - Never invent prices, dealer phone numbers, addresses, warranty terms or app features that are not listed.
  - Never ask for passwords, card numbers or national ID numbers.
  - You cannot see the app's car list. If the user says their car is missing, do not confirm or deny it; say you've passed it on.
  - If you cannot solve it (bug, account problem, missing car in the list, complaint, feature request),
    say you've passed it to the AutoCare team and set needsHuman to true.
`;

const replySchema = z.object({
  reply: z.string().describe("The message to show the user"),
  needsHuman: z.boolean().describe("True if the team must follow up (bug, account issue, missing car, complaint, request)"),
});

export const support = {
  /** One chat turn: stores the user's message, answers it with the conversation so far, stores the reply. */
  send: authed
    .input(
      z.object({
        conversationId: z.string().min(8).max(64),
        text: z.string().trim().min(1).max(1500),
        car: z.string().max(200).optional(),
        /** The user agreed that chat messages are sent to the AI provider (App Store 5.1.2(i)). */
        aiConsent: z.boolean().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      if (input.aiConsent !== true) return { reply: "", needsHuman: false, error: "consent" as const };
      const userId = context.user?.id ?? null;
      const history = await db
        .select()
        .from(supportMessage)
        .where(eq(supportMessage.conversationId, input.conversationId))
        .orderBy(asc(supportMessage.id));
      // Conversation ids are random per device; refuse to continue someone else's signed-in chat.
      if (history.some((m) => m.userId && m.userId !== userId)) {
        return { reply: "", needsHuman: false, error: "forbidden" as const };
      }
      await db.insert(supportMessage).values({ conversationId: input.conversationId, userId, role: "user", content: input.text });

      const recent = history.slice(-20).map((m) => ({ role: m.role, content: m.content }));
      let reply = "";
      let needsHuman = false;
      try {
        const { output } = await generateText({
          model: gateway("google/gemini-3-flash"),
          output: Output.object({ schema: replySchema }),
          system: SYSTEM + (input.car ? `\n\nThe user's saved car: ${input.car}` : ""),
          messages: [...recent, { role: "user", content: input.text }],
        });
        reply = output.reply.trim();
        needsHuman = output.needsHuman;
      } catch {
        return { reply: "", needsHuman: false, error: "unavailable" as const };
      }
      await db
        .insert(supportMessage)
        .values({ conversationId: input.conversationId, userId, role: "assistant", content: reply, needsHuman });
      // Email the owner once per open case, not on every flagged message.
      const alreadyOpen = history.some((m) => m.needsHuman && !m.handled);
      if (needsHuman && !alreadyOpen) {
        void notifyOwner(input.conversationId, [...recent, { role: "user", content: input.text }, { role: "assistant", content: reply }], context.user?.email, input.car);
      }
      return { reply, needsHuman, error: null };
    }),
};

async function notifyOwner(conversationId: string, msgs: { role: string; content: string }[], email?: string | null, car?: string) {
  const to = ownerEmail();
  if (!to) return;
  const who = email ?? "Guest (not signed in)";
  const lines = msgs.slice(-10).map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`);
  const text = dedent`
    A customer chat in AutoCare needs your team.

    Customer: ${who}
    Car: ${car ?? "not set"}
    Conversation: ${conversationId}

    ${lines.join("\n\n")}

    Open the app > Account (person icon) > Support inbox to see it and mark it done.
    You must be signed in with Google as ${to}.
  `;
  const esc = (x: string) => x.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px">
    <h2 style="color:#0B6E4F;margin:0 0 8px">Customer chat needs your team</h2>
    <p style="color:#555;margin:0 0 16px"><b>Customer:</b> ${esc(who)}<br><b>Car:</b> ${esc(car ?? "not set")}</p>
    ${msgs
      .slice(-10)
      .map(
        (m) => `<div dir="auto" style="margin:8px 0;padding:10px 12px;border-radius:10px;background:${m.role === "user" ? "#E7F6EF" : "#F4F6F8"}">
        <div style="font-size:12px;color:#667380;margin-bottom:4px">${m.role === "user" ? "Customer" : "Assistant"}</div>${esc(m.content).replace(/\n/g, "<br>")}</div>`,
      )
      .join("")}
    <p style="color:#555;margin-top:16px">Open the app &gt; Account (person icon) &gt; <b>Support inbox</b> to mark it done.</p></div>`;
  await sendEmail({ to, subject: `AutoCare: customer needs help (${who})`, text, html });
}
