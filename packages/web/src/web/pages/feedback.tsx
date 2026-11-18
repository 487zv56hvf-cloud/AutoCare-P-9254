import { useState, type FormEvent } from "react";
import { MessageSquare, Star, Check, Send, LoaderCircle } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
import { useSendFeedback } from "../queries/support";
export function FeedbackPage({ lang, email }: { lang: Lang; email: string }) {
  const [kind, setKind] = useState<"idea" | "problem" | "other">("idea"),
    [rating, setRating] = useState<number | null>(null),
    [message, setMessage] = useState(""),
    [contact, setContact] = useState(""),
    [error, setError] = useState(""),
    [sent, setSent] = useState(false);
  const send = useSendFeedback();
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (message.trim().length < 3) return setError(t(lang, "fbShort"));
    try {
      await send.mutateAsync({
        kind,
        rating,
        message: message.trim(),
        contact: contact.trim() || undefined,
        lang,
      });
      setSent(true);
    } catch (e) {
      setError(
        t(
          lang,
          e instanceof Error && e.message.includes("Too many")
            ? "fbTooMany"
            : "fbError",
        ),
      );
    }
  }
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "feedback")}</span>
          <h1>{t(lang, "fbTitle")}</h1>
          <p>{t(lang, "fbIntro")}</p>
        </div>
        <MessageSquare size={30} className="heading-icon" />
      </div>
      <section className="panel feedback-panel">
        {sent ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Check size={32} />
            </span>
            <h2>{t(lang, "fbThanks")}</h2>
            <p>{t(lang, "fbThanksMsg")}</p>
            <button
              className="btn btn-primary"
              onClick={() => {
                setSent(false);
                setMessage("");
              }}
            >
              {t(lang, "fbAnother")}
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label>
              {t(lang, "fbKind")}
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                {(["idea", "problem", "other"] as const).map((x) => (
                  <option key={x} value={x}>
                    {t(lang, `fb_${x}`)}
                  </option>
                ))}
              </select>
            </label>
            <label>{t(lang, "fbRating")}</label>
            <div className="rating-buttons">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(rating === n ? null : n)}
                  aria-label={`${n}/5`}
                  aria-pressed={!!rating && n <= rating}
                >
                  <Star
                    size={26}
                    fill={rating && n <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <label>
              {t(lang, "fbMessage")}
              <textarea
                  aria-label={t(lang,"fbMessage")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                minLength={3}
                maxLength={2000}
                required
                placeholder={t(lang, "fbMessagePh")}
                data-testid="feedback-message"
              />
            </label>
            <label>
              {t(lang, "fbContact")}
              <input
                  aria-label={t(lang,"fbContact")}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={120}
                placeholder={email}
              />
              <small>{t(lang, "fbContactSigned", { e: email })}</small>
            </label>
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary" disabled={send.isPending}>
              {send.isPending ? (
                <LoaderCircle size={18} className="spin" />
              ) : (
                <Send size={18} />
              )}
              {t(lang, "fbSend")}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
