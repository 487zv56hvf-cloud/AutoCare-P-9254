import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  CarFront,
  LayoutDashboard,
  UserRound,
  Settings2,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  Cloud,
  ArrowUpRight,
} from "lucide-react";
import { Brand } from "./brand";
import { t, type Lang } from "../lib/carcare";
export function Shell({
  lang,
  onLanguage,
  email,
  children,
}: {
  lang: Lang;
  onLanguage: () => void;
  email: string;
  children: ReactNode;
}) {
  const [path] = useLocation();
  const links = [
    { to: "/cars", key: "myCars", icon: CarFront },
    { to: "/overview", key: "overview", icon: LayoutDashboard },
    { to: "/account", key: "account", icon: UserRound },
    { to: "/settings", key: "settings", icon: Settings2 },
    { to: "/help", key: "headerHelp", icon: HelpCircle },
    { to: "/feedback", key: "feedback", icon: MessageSquare },
  ];
  const current = path.startsWith("/cars")
    ? "myCars"
    : (links.find((x) => x.to === path)?.key ?? "myCars");
  return (
    <div className="workspace" dir={lang === "ar" ? "rtl" : "ltr"}>
      <aside className="sidebar">
        <Link to="/cars" className="brand-link">
          <Brand lang={lang} dark />
        </Link>
        <div className="nav-caption">
          {lang === "ar" ? "مساحة القيادة" : "YOUR WORKSPACE"}
        </div>
        <nav>
          {links.map(({ to, key, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${current === key ? "active" : ""}`}
              data-testid={`nav-${key}`}
            >
              <Icon size={19} />
              <span>{t(lang, key)}</span>
              {current === key && (
                <ChevronRight size={15} className="nav-chevron" />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <Cloud size={21} />
          <strong>{t(lang, "privacyTitle")}</strong>
          <p>
            {lang === "ar"
              ? "عربياتك محفوظة في حسابك، على الموبايل والموقع."
              : "Your saved cars, across your phone and the web."}
          </p>
          <Link to="/account">
            {t(lang, "accountTitle")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <Link to="/account" className="sidebar-user">
          <span className="avatar">{email[0]?.toUpperCase()}</span>
          <span>
            <strong>{email.split("@")[0]}</strong>
            <small>{t(lang, "account")}</small>
          </span>
          <Settings2 size={17} />
        </Link>
      </aside>
      <div className="main-area">
        <header className="workspace-header">
          <div className="mobile-brand">
            <Brand lang={lang} />
          </div>
          <div className="breadcrumb">
            <span>AutoCare</span>
            <ChevronRight size={14} />
            <strong>{t(lang, current)}</strong>
          </div>
          <div className="header-right">
            <button
              className="btn btn-language"
              onClick={onLanguage}
              data-testid="lang-btn"
            >
              {lang === "ar" ? "English" : "العربية"}
            </button>
            <Link
              to="/account"
              className="avatar header-avatar"
              aria-label={t(lang, "account")}
            >
              {email[0]?.toUpperCase()}
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="workspace-footer">
          {t(lang, "appName")}
          <span>
            {lang === "ar"
              ? "اهتمام بسيط. مشوار أريح."
              : "A little care goes a long way."}
          </span>
        </footer>
      </div>
      <nav className="mobile-nav">
        {links.slice(0, 4).map(({ to, key, icon: Icon }) => (
          <Link key={to} to={to} className={current === key ? "active" : ""}>
            <Icon size={20} />
            <span>{t(lang, key)}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
