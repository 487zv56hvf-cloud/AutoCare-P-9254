import { useEffect, useState, type FormEvent } from "react";
import {
  CarFront,
  ShieldCheck,
  ArrowRight,
  LoaderCircle,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { FaApple, FaGoogle } from "react-icons/fa";
import { Link } from "wouter";
import { authClient, captureToken, DELETED_KEY } from "../lib/auth";
import { t, type Lang } from "../lib/carcare";
import { Brand } from "../components/brand";

export function Login({
  lang,
  onLanguage,
  sessionError,
  onRetry,
}: {
  lang: Lang;
  onLanguage: () => void;
  sessionError: boolean;
  onRetry: () => void;
}) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [show, setShow] = useState(false);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  const [deleted] = useState(() => {
    try {
      return sessionStorage.getItem(DELETED_KEY) === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(DELETED_KEY);
    } catch {}
  }, []);
  async function social(provider: "apple" | "google") {
    setBusy(provider);
    setError("");
    try {
      const r = await authClient.managedAuth.signIn({ provider });
      if (
        r.error &&
        !["POPUP_CLOSED", "AUTH_SESSION_DISMISSED"].includes(r.error.code ?? "")
      )
        setError(t(lang, "authFailed"));
    } catch {
      setError(t(lang, "authFailed"));
    } finally {
      setBusy("");
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError(t(lang, "badEmail"));
    if (password.length < 8) return setError(t(lang, "shortPassword"));
    setBusy("email");
    try {
      const input = { email: email.trim().toLowerCase(), password };
      const r =
        mode === "signUp"
          ? await authClient.signUp.email(
              { ...input, name: input.email.split("@")[0] },
              { onSuccess: captureToken },
            )
          : await authClient.signIn.email(input, { onSuccess: captureToken });
      if (r.error) {
        const code = r.error.code ?? "";
        setError(
          t(
            lang,
            code === "USE_GOOGLE"
              ? "useGoogle"
              : code.includes("ALREADY_EXISTS")
                ? "emailTaken"
                : code.includes("INVALID")
                  ? "wrongLogin"
                  : "authFailed",
          ),
        );
      } else {
        authClient.$store.notify("$sessionSignal");
        await authClient.getSession();
      }
    } catch {
      setError(t(lang, "restoreError"));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="login-page" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="login-story">
        <Brand lang={lang} dark />
        <div className="story-copy">
          <span className="eyebrow">
            {lang === "ar" ? "لكل مشوار جاي" : "FOR THE ROAD AHEAD"}
          </span>
          <h1>{t(lang, "loginHeadline")}</h1>
          <p>{t(lang, "loginSubtitle")}</p>
        </div>
        <div className="road-art" aria-hidden="true">
          <div className="road-ring ring-one" />
          <div className="road-ring ring-two" />
          <CarFront size={145} strokeWidth={1} />
          <div className="art-label">
            <span className="art-dot" />
            {t(lang, "maintenancePlan")}
            <Check size={15} />
          </div>
        </div>
        <div className="story-footer">
          <ShieldCheck size={18} />
          <span>{t(lang, "privacyTitle")}</span>
          <span className="story-version">AutoCare / Egypt</span>
        </div>
      </aside>
      <main className="login-main">
        <div className="login-top">
          <div className="mobile-brand">
            <Brand lang={lang} />
          </div>
          <button
            className="btn btn-language"
            onClick={onLanguage}
            data-testid="lang-btn"
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </div>
        <div className="login-form-wrap" data-testid="login-screen">
          <span className="eyebrow">
            {lang === "ar" ? "مساحتك الخاصة" : "YOUR PERSONAL GARAGE"}
          </span>
          <h2>{t(lang, "welcomeBack")}</h2>
          <p className="muted">{t(lang, "accountRequired")}</p>
          {deleted && (
            <output
              className="success-message"
              data-testid="account-deleted"
            >
              {t(lang, "deleteAccountDone")}
            </output>
          )}
          {sessionError && (
            <div className="error" role="alert">
              {t(lang, "sessionError")}{" "}
              <button className="text-button" onClick={onRetry}>
                {t(lang, "tryAgain")}
              </button>
            </div>
          )}
          <div className="social-buttons">
            <button
              className="btn btn-apple"
              disabled={!!busy}
              onClick={() => social("apple")}
              data-testid="apple-btn"
            >
              {busy === "apple" ? (
                <LoaderCircle className="spin" size={20} />
              ) : (
                <FaApple size={22} />
              )}{" "}
              {t(lang, "continueApple")}
            </button>
            <button
              className="btn btn-social"
              disabled={!!busy}
              onClick={() => social("google")}
              data-testid="google-btn"
            >
              {busy === "google" ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <FaGoogle size={18} color="#4285f4" />
              )}
              {t(lang, "continueGoogle")}
            </button>
          </div>
          <div className="divider">
            <span>{t(lang, "orEmail")}</span>
          </div>
          <form onSubmit={submit} className="login-form">
            <label>
              {t(lang, "emailLabel")}
              <input
                aria-label={t(lang, "emailLabel")}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                dir="ltr"
                data-testid="email-input"
              />
            </label>
            <label>
              {t(lang, "passwordLabel")}
              <div className="password-input">
                <input
                  aria-label={t(lang, "passwordLabel")}
                  type={show ? "text" : "password"}
                  autoComplete={
                    mode === "signUp" ? "new-password" : "current-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  placeholder="••••••••"
                  data-testid="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={
                    lang === "ar"
                      ? "إظهار أو إخفاء كلمة السر"
                      : "Show or hide password"
                  }
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <button
              className="btn btn-primary"
              disabled={!!busy}
              data-testid="email-submit"
            >
              {busy === "email" ? (
                <LoaderCircle className="spin" size={18} />
              ) : null}
              {t(lang, mode)}
              <ArrowRight size={18} className="arrow" />
            </button>
          </form>
          <button
            className="mode-button"
            onClick={() => {
              setMode(mode === "signIn" ? "signUp" : "signIn");
              setError("");
            }}
            data-testid="auth-mode"
          >
            {t(lang, mode === "signIn" ? "noAccount" : "haveAccount")}
          </button>
          <div className="login-privacy">
            <ShieldCheck size={15} />
            {t(lang, "accountWhy")}
          </div>
          <nav className="legal-links">
            <Link to="/privacy" data-testid="login-privacy-link">
              {t(lang, "privacyPolicy")}
            </Link>
            <Link to="/support">{t(lang, "supportSite")}</Link>
          </nav>
        </div>
        <footer className="login-footer">
          AutoCare ·{" "}
          {lang === "ar" ? "مصمم لقيادة أريح" : "Made for a smoother journey"}
        </footer>
      </main>
    </div>
  );
}
