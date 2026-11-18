import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation, Route, Switch, Redirect } from "wouter";
import { LoaderCircle, CloudOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { authClient, hasToken, lastUserId, rememberUserId } from "../lib/auth";
import { t, fromBackup, type Lang, type Vehicle } from "../lib/carcare";
import { useCars, carsQueryOptions } from "../queries/cars";
import { Login } from "../pages/login";
import { Shell } from "./shell";
import "../lib/install";
import { InstallHint } from "./install-hint";
const loadCars = () => import("../pages/cars");
const loadDashboard = () => import("../pages/dashboard");
const CarsPage = lazy(() => loadCars().then((m) => ({ default: m.CarsPage })));
const DashboardPage = lazy(() =>
  loadDashboard().then((m) => ({ default: m.DashboardPage })),
);
// Returning user: fetch the garage and dashboard code now, alongside the session check,
// instead of after it.
const returningHint = hasToken() ? lastUserId() : null;
if (hasToken()) {
  void loadCars();
  void loadDashboard();
}
const CarForm = lazy(() =>
  import("../pages/car-form").then((m) => ({ default: m.CarForm })),
);
const OverviewPage = lazy(() =>
  import("../pages/overview").then((m) => ({ default: m.OverviewPage })),
);
const AccountPage = lazy(() =>
  import("../pages/account").then((m) => ({ default: m.AccountPage })),
);
const SettingsPage = lazy(() =>
  import("../pages/settings").then((m) => ({ default: m.SettingsPage })),
);
const HelpPage = lazy(() =>
  import("../pages/help").then((m) => ({ default: m.HelpPage })),
);
const FeedbackPage = lazy(() =>
  import("../pages/feedback").then((m) => ({ default: m.FeedbackPage })),
);

const PrivacyPage = lazy(() =>
  import("../pages/legal").then((m) => ({ default: m.PrivacyPage })),
);
const SupportPublicPage = lazy(() =>
  import("../pages/legal").then((m) => ({ default: m.SupportPublicPage })),
);
/** Pages anyone can open without signing in (App Store privacy policy and support URLs). */
const PUBLIC_PATHS = ["/privacy", "/support"];

const NEXT_KEY = "autocare.web.next";

export function AutoCare() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem("autocare.web.lang") === "en" ? "en" : "ar";
    } catch {
      return "ar";
    }
  });
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [path, navigate] = useLocation();
  const qc = useQueryClient();
  useEffect(() => {
    // Start loading the last account's cars in parallel with the session check.
    if (returningHint) void qc.prefetchQuery(carsQueryOptions(returningHint));
  }, [qc]);
  useEffect(() => {
    if (isPending) return;
    const id = session?.user.id ?? null;
    // Different (or no) account than guessed: drop the early copy so it is never shown.
    if (returningHint && id !== returningHint)
      qc.removeQueries({ queryKey: carsQueryOptions(returningHint).queryKey });
    if (id) rememberUserId(id);
    else if (!error) rememberUserId(null);
  }, [isPending, session?.user.id, error, qc]);
  const [returning, setReturning] = useState(true);
  useEffect(() => {
    void authClient.managedAuth
      .handleRedirect()
      .catch(() => undefined)
      .finally(() => setReturning(false));
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.title = t(lang, "appName");
    try {
      localStorage.setItem("autocare.web.lang", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    if (
      !isPending &&
      !returning &&
      !session &&
      path !== "/login" &&
      !PUBLIC_PATHS.includes(path)
    ) {
      // Remember the protected page so signing in returns there.
      try {
        if (path !== "/") sessionStorage.setItem(NEXT_KEY, path);
      } catch {}
      navigate("/login", { replace: true });
    }
  }, [session, isPending, returning, path, navigate]);
  const onLanguage = () => setLang(lang === "ar" ? "en" : "ar");
  if (PUBLIC_PATHS.includes(path))
    return (
      <Suspense
        fallback={
          <div className="full-loader">
            <LoaderCircle className="spin" size={30} />
          </div>
        }
      >
        {path === "/privacy" ? (
          <PrivacyPage lang={lang} onLanguage={onLanguage} />
        ) : (
          <SupportPublicPage lang={lang} onLanguage={onLanguage} />
        )}
      </Suspense>
    );
  if (isPending || returning)
    return (
      <div className="full-loader">
        <LoaderCircle className="spin" size={30} />
        <span>{t(lang, "appName")}</span>
      </div>
    );
  if (!session)
    return (
      <Login
        lang={lang}
        onLanguage={onLanguage}
        sessionError={!!error}
        onRetry={() => void refetch()}
      />
    );
  return (
    <Authenticated
      key={session.user.id}
      userId={session.user.id}
      email={session.user.email}
      lang={lang}
      onLanguage={onLanguage}
    />
  );
}

function Authenticated({
  userId,
  email,
  lang,
  onLanguage,
}: {
  userId: string;
  email: string;
  lang: Lang;
  onLanguage: () => void;
}) {
  const [path, navigate] = useLocation();
  useEffect(() => {
    // Idempotent (StrictMode runs effects twice): the key is cleared only once we have left /login.
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(NEXT_KEY);
      if (path !== "/login") sessionStorage.removeItem(NEXT_KEY);
    } catch {}
    if (path !== "/login") return;
    navigate(
      saved && saved.startsWith("/") && !saved.startsWith("//")
        ? saved
        : "/cars",
      { replace: true },
    );
  }, [path, navigate]);
  const needsCars =
    path.startsWith("/cars") ||
    path === "/overview" ||
    path === "/" ||
    path === "/login";
  const carsQuery = useCars(userId);
  const cars = (carsQuery.data ?? [])
    .map(fromBackup)
    .filter((v): v is Vehicle => !!v);
  const content =
    path === "/login" || (carsQuery.isPending && needsCars) ? (
      <div className="page-loader">
        <LoaderCircle className="spin" size={27} />
        <p>{t(lang, "lookingUp")}</p>
      </div>
    ) : carsQuery.error && needsCars ? (
      <div className="empty-state">
        <CloudOff size={40} />
        <h2>{t(lang, "restoreError")}</h2>
        <button
          className="btn btn-primary"
          onClick={() => void carsQuery.refetch()}
        >
          {t(lang, "tryAgain")}
        </button>
      </div>
    ) : (
      <Switch>
        <Route path="/cars/new">
          <CarForm lang={lang} cars={cars} />
        </Route>
        <Route path="/cars/:id/edit">
          {({ id }) => {
            const c = cars.find((c) => c.id === id);
            return c ? (
              <CarForm key={id} lang={lang} initial={c} cars={cars} />
            ) : (
              <Missing lang={lang} />
            );
          }}
        </Route>
        <Route path="/cars/:id">
          {({ id }) => {
            const c = cars.find((c) => c.id === id);
            return c ? (
              <DashboardPage key={id} lang={lang} car={c} />
            ) : (
              <Missing lang={lang} />
            );
          }}
        </Route>
        <Route path="/cars">
          <CarsPage lang={lang} cars={cars} />
        </Route>
        <Route path="/overview">
          <OverviewPage lang={lang} cars={cars} />
        </Route>
        <Route path="/account">
          <AccountPage
            lang={lang}
            email={email}
            cars={cars}
            loading={carsQuery.isPending}
            failed={!!carsQuery.error}
          />
        </Route>
        <Route path="/settings">
          <SettingsPage lang={lang} onLanguage={onLanguage} />
        </Route>
        <Route path="/help">
          <HelpPage lang={lang} userId={userId} />
        </Route>
        <Route path="/feedback">
          <FeedbackPage lang={lang} email={email} />
        </Route>
        <Route>
          <Redirect to="/cars" />
        </Route>
      </Switch>
    );
  return (
    <Shell lang={lang} onLanguage={onLanguage} email={email}>
      <Suspense
        fallback={
          <div className="page-loader">
            <LoaderCircle className="spin" size={27} />
          </div>
        }
      >
        {content}
      </Suspense>
      <InstallHint lang={lang} />
    </Shell>
  );
}
function Missing({ lang }: { lang: Lang }) {
  return (
    <div className="empty-state">
      <h2>{t(lang, "restoreNotFound")}</h2>
      <Redirect to="/cars" />
    </div>
  );
}
