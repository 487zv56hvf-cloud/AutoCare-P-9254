import { Link } from "wouter";
import {
  Globe,
  Palette,
  Bell,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Smartphone,
  Gauge,
} from "lucide-react";
import {
  t,
  ODO_FREQUENCIES,
  odoFrequencyLabel,
  type Lang,
} from "../lib/carcare";
import { setOdoFrequency, useOdoFrequency } from "../lib/odometer";

function OdometerPanel({ lang }: { lang: Lang }) {
  const freq = useOdoFrequency();
  return (
    <section className="panel settings-row" data-testid="odo-settings">
      <Gauge size={24} />
      <div>
        <h2 id="odo-freq-title">{t(lang, "odoRemindersTitle")}</h2>
        <p>{t(lang, "odoWebInfo")}</p>
        <div
          className="odo-choices"
          aria-labelledby="odo-freq-title"
        >
          {ODO_FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={freq === f}
              className={freq === f ? "active" : ""}
              onClick={() => setOdoFrequency(f)}
              data-testid={`odo-freq-${f}`}
            >
              {odoFrequencyLabel(lang, f)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
import { useInstallState, promptInstall } from "../lib/install";

function InstallPanel({ lang }: { lang: Lang }) {
  const state = useInstallState();
  const ar = lang === "ar";
  const body =
    state === "installed"
      ? ar
        ? "AutoCare متثبّت على جهازك. افتحه من الشاشة الرئيسية."
        : "AutoCare is installed. Open it from your Home Screen."
      : state === "ios"
        ? ar
          ? "من Safari: اضغط زرار المشاركة ثم «إضافة إلى الشاشة الرئيسية»."
          : "In Safari, tap Share, then “Add to Home Screen”."
        : state === "prompt"
          ? ar
            ? "ثبّت AutoCare وافتحه زي أي تطبيق، من غير متجر."
            : "Install AutoCare and open it like any app, no store needed."
          : ar
            ? "آيفون: Safari ← مشاركة ← «إضافة إلى الشاشة الرئيسية». أندرويد: Chrome ← القائمة ⋮ ← «تثبيت التطبيق»."
            : "iPhone: Safari → Share → “Add to Home Screen”. Android: Chrome → menu ⋮ → “Install app”.";
  return (
    <section className="panel settings-row" data-testid="install-panel">
      <Smartphone size={24} />
      <div>
        <h2>{ar ? "ضيفه للشاشة الرئيسية" : "Add to Home Screen"}</h2>
        <p data-testid="install-text" data-state={state}>
          {body}
        </p>
      </div>
      {state === "prompt" && (
        <button
          className="btn btn-primary"
          onClick={() => void promptInstall()}
          data-testid="install-button"
        >
          {ar ? "تثبيت" : "Install"}
        </button>
      )}
    </section>
  );
}
export function SettingsPage({
  lang,
  onLanguage,
}: {
  lang: Lang;
  onLanguage: () => void;
}) {
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">AutoCare</span>
          <h1>{t(lang, "settings")}</h1>
          <p>
            {lang === "ar"
              ? "خلّي تجربتك أوضح وأسهل."
              : "Make yourself at home."}
          </p>
        </div>
      </div>
      <div className="settings-stack">
        <InstallPanel lang={lang} />
        <section className="panel settings-row">
          <Globe size={24} />
          <div>
            <h2>{t(lang, "language")}</h2>
            <p>{lang === "ar" ? "العربية · English" : "English · العربية"}</p>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onLanguage}
            data-testid="settings-language"
          >
            {lang === "ar" ? "English" : "العربية"}
          </button>
        </section>
        <section className="panel settings-row">
          <Palette size={24} />
          <div>
            <h2>{t(lang, "appearance")}</h2>
            <p>{t(lang, "appearanceInfo")}</p>
            <div className="palette-swatches">
              <i />
              <i />
              <i />
              <span>{t(lang, "lightTheme")}</span>
            </div>
          </div>
        </section>
        <section className="panel settings-row">
          <Bell size={24} />
          <div>
            <h2>{t(lang, "reminders")}</h2>
            <p>
              {lang === "ar"
                ? "الموقع مش بيبعت إشعارات. افتح AutoCare تلاقي الصيانة المتأخرة والقريبة في أول صفحة كل عربية."
                : "The website doesn’t send notifications. Open AutoCare to see overdue and upcoming services at the top of each car’s page."}
            </p>
          </div>
        </section>
        <OdometerPanel lang={lang} />
        <section className="panel settings-row">
          <ShieldCheck size={24} />
          <div>
            <h2>{t(lang, "privacyTitle")}</h2>
            <p>{t(lang, "privacyInfo")}</p>
            <nav className="legal-links settings-legal">
              <Link to="/privacy" data-testid="settings-privacy-link">
                {t(lang, "privacyPolicy")}
              </Link>
              <Link to="/support">{t(lang, "supportSite")}</Link>
            </nav>
          </div>
        </section>
        <div className="settings-links">
          <Link to="/help" className="btn btn-secondary">
            <HelpCircle size={18} />
            {t(lang, "headerHelp")}
          </Link>
          <Link to="/feedback" className="btn btn-secondary">
            <MessageSquare size={18} />
            {t(lang, "feedback")}
          </Link>
        </div>
      </div>
    </div>
  );
}
