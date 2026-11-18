import type { ReactNode } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import {
  t,
  formatDate,
  PRIVACY,
  PRIVACY_UPDATED,
  type Lang,
} from "../lib/carcare";
import { Brand } from "../components/brand";
import { useContact } from "../queries/legal";

/** Public pages (no sign-in): the App Store privacy policy and support URLs. */
function PublicFrame({
  lang,
  onLanguage,
  children,
}: {
  lang: Lang;
  onLanguage: () => void;
  children: ReactNode;
}) {
  const Back = lang === "ar" ? ArrowRight : ArrowLeft;
  return (
    <div className="public-page" dir={lang === "ar" ? "rtl" : "ltr"}>
      <header className="public-top">
        <Link to="/" aria-label={t(lang, "appName")}>
          <Brand lang={lang} />
        </Link>
        <button
          className="btn btn-language"
          onClick={onLanguage}
          data-testid="public-lang"
        >
          {lang === "ar" ? "English" : "العربية"}
        </button>
      </header>
      <main className="public-body">
        <Link to="/" className="text-button public-back">
          <Back size={16} /> {t(lang, "appName")}
        </Link>
        {children}
      </main>
      <footer className="public-footer">
        <Link to="/privacy">{t(lang, "privacyPolicy")}</Link>
        <span>·</span>
        <Link to="/support">{t(lang, "supportSite")}</Link>
      </footer>
    </div>
  );
}

function ContactEmail() {
  const contact = useContact();
  const email = contact.data?.email;
  if (!email) return <span>…</span>;
  return (
    <a href={`mailto:${email}`} dir="ltr" data-testid="contact-email">
      {email}
    </a>
  );
}

/** Replaces `{email}` in policy text with the contact link. */
function withEmail(text: string) {
  const parts = text.split("{email}");
  return parts.flatMap((p, i) =>
    i === 0 ? [p] : [<ContactEmail key={i} />, p],
  );
}

export function PrivacyPage({
  lang,
  onLanguage,
}: {
  lang: Lang;
  onLanguage: () => void;
}) {
  const doc = PRIVACY[lang];
  return (
    <PublicFrame lang={lang} onLanguage={onLanguage}>
      <article className="legal-doc" data-testid="privacy-page">
        <span className="eyebrow">
          <ShieldCheck size={15} /> {t(lang, "privacyPolicy")}
        </span>
        <h1>{doc.title}</h1>
        <p className="legal-updated">
          {lang === "ar" ? "آخر تحديث: " : "Last updated: "}
          {formatDate(lang, PRIVACY_UPDATED)}
        </p>
        <p>{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2>{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i}>{withEmail(p)}</p>
            ))}
          </section>
        ))}
      </article>
    </PublicFrame>
  );
}

export function SupportPublicPage({
  lang,
  onLanguage,
}: {
  lang: Lang;
  onLanguage: () => void;
}) {
  return (
    <PublicFrame lang={lang} onLanguage={onLanguage}>
      <article className="legal-doc" data-testid="support-page">
        <span className="eyebrow">
          <HelpCircle size={15} /> {t(lang, "supportSite")}
        </span>
        <h1>{t(lang, "supportTitle")}</h1>
        <div className="panel legal-contact">
          <Mail size={22} />
          <div>
            <h2>{lang === "ar" ? "كلمنا" : "Contact us"}</h2>
            <p>
              {lang === "ar"
                ? "ابعتلنا إيميل وهنرد عليك في أقرب وقت."
                : "Email us and we will get back to you as soon as we can."}
            </p>
            <ContactEmail />
          </div>
        </div>
        <h2>{t(lang, "faqTitle")}</h2>
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <details className="faq" key={n}>
            <summary>{t(lang, `faq${n}q`)}</summary>
            <p>{t(lang, `faq${n}a`)}</p>
          </details>
        ))}
        <h2>{t(lang, "deleteAccount")}</h2>
        <p>{t(lang, "deleteAccountInfo")}</p>
        <p className="muted">
          {lang === "ar"
            ? "من التطبيق أو الموقع: الحساب > امسح الحساب."
            : "In the app or on the website: Account > Delete account."}
        </p>
        <p>
          <Link to="/privacy">{t(lang, "privacyPolicy")}</Link>
        </p>
      </article>
    </PublicFrame>
  );
}
