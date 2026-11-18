import { useState, useEffect, type FormEvent } from "react";
import {
  HelpCircle,
  MessageCircle,
  Send,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { t, type Lang } from "../lib/carcare";
import { useSupport } from "../queries/support";
type Msg = { role: "user" | "assistant"; text: string; human?: boolean };
export function HelpPage({ lang, userId }: { lang: Lang; userId: string }) {
  const key = `autocare.web.chat.${userId}`;
  const [chat, setChat] = useState<{ id: string; messages: Msg[] }>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "null");
      if (typeof stored?.id === "string" && Array.isArray(stored.messages))
        return stored;
    } catch {}
    return { id: crypto.randomUUID(), messages: [] };
  });
  // App Store 5.1.2(i): ask before any message goes to the AI provider.
  const consentKey = `autocare.web.aiConsent.${userId}`;
  const [consent, setConsent] = useState(() => {
    try {
      return localStorage.getItem(consentKey) === "1";
    } catch {
      return false;
    }
  });
  const [later, setLater] = useState(false);
  function agree() {
    try {
      localStorage.setItem(consentKey, "1");
    } catch {}
    setConsent(true);
    setLater(false);
  }
  const [text, setText] = useState(""),
    [error, setError] = useState("");
  const send = useSupport();
  useEffect(() => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ ...chat, messages: chat.messages.slice(-60) }),
      );
    } catch {}
  }, [chat, key]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() || send.isPending) return;
    setError("");
    const input = text.trim();
    try {
      const r = await send.mutateAsync({
        conversationId: chat.id,
        text: input,
        aiConsent: true,
      });
      if (r.error === "consent") {
        setConsent(false);
        return;
      }
      if (r.error) throw new Error(r.error);
      setChat((c) => ({
        ...c,
        messages: [
          ...c.messages,
          { role: "user", text: input },
          { role: "assistant", text: r.reply, human: r.needsHuman },
        ],
      }));
      setText("");
    } catch {
      setError(t(lang, "chatUnavailable"));
    }
  }
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "headerHelp")}</span>
          <h1>{t(lang, "supportTitle")}</h1>
          <p>{t(lang, "chatNote")}</p>
        </div>
      </div>
      <div className="help-grid">
        <section>
          <div className="section-heading">
            <h2>
              <HelpCircle size={21} />
              {t(lang, "faqTitle")}
            </h2>
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <details className="faq" key={n}>
              <summary>{t(lang, `faq${n}q`)}</summary>
              <p>{t(lang, `faq${n}a`)}</p>
            </details>
          ))}
        </section>
        <section className="panel chat-panel">
          <div className="panel-title">
            <MessageCircle size={22} />
            <h2>{t(lang, "chatTab")}</h2>
            <button
              className="text-button"
              disabled={send.isPending}
              onClick={() => {
                setChat({ id: crypto.randomUUID(), messages: [] });
                setError("");
              }}
              aria-label={t(lang, "newChat")}
            >
              <RotateCcw size={17} />
            </button>
          </div>
          {!consent ? (
            <div className="ai-consent" data-testid="ai-consent">
              <ShieldCheck size={26} />
              <h3>{t(lang, "aiConsentTitle")}</h3>
              {later ? (
                <p className="muted">{t(lang, "aiConsentFaq")}</p>
              ) : (
                <p>{t(lang, "aiConsentBody")}</p>
              )}
              <div className="form-actions">
                {!later && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setLater(true)}
                    data-testid="ai-consent-later"
                  >
                    {t(lang, "aiConsentLater")}
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={later ? () => setLater(false) : agree}
                  data-testid="ai-consent-agree"
                >
                  {later ? t(lang, "chatTab") : t(lang, "aiConsentAgree")}
                </button>
              </div>
              <Link to="/privacy" className="small-muted">
                {t(lang, "privacyPolicy")}
              </Link>
            </div>
          ) : (
            <>
              <div className="chat-messages">
                <div className="chat-message assistant">
                  {t(lang, "chatHello")}
                </div>
                {chat.messages.map((m, i) => (
                  <div key={i} className={`chat-message ${m.role}`} dir="auto">
                    {m.text}
                    {m.human && <small>{t(lang, "chatHuman")}</small>}
                  </div>
                ))}
                {send.isPending && (
                  <p className="muted">{t(lang, "chatThinking")}</p>
                )}
              </div>
              {error && <p className="error">{error}</p>}
              <form onSubmit={submit} className="chat-form">
                <input
                  value={text}
                  maxLength={1500}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t(lang, "chatPlaceholder")}
                  aria-label={t(lang, "chatPlaceholder")}
                  required
                />
                <button
                  className="btn btn-primary"
                  disabled={send.isPending}
                  aria-label={t(lang, "send")}
                >
                  {send.isPending ? (
                    <LoaderCircle size={18} className="spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
              <p className="small-muted">{t(lang, "chatNote")}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
