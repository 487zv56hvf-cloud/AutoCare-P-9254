import { Resend } from "resend";

const key = process.env.RESEND_API_KEY;
const resend = key ? new Resend(key) : null;

/** Sends an email; returns false (never throws) when the key is missing or the send fails. */
export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  if (!resend || !opts.to) return false;
  try {
    const { error } = await resend.emails.send({
      // Resend's shared sender works without a verified domain when mailing the account owner.
      from: process.env.EMAIL_FROM || "AutoCare <onboarding@resend.dev>",
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    if (error) console.error("[email]", error.message);
    return !error;
  } catch (e) {
    console.error("[email]", e);
    return false;
  }
}
