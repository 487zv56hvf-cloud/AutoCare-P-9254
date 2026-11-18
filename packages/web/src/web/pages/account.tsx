import { useState, type FormEvent } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  UserRound,
  ShieldCheck,
  Cloud,
  LogOut,
  Search,
  LoaderCircle,
  Inbox,
  Trash2,
} from "lucide-react";
import { authClient, rememberUserId, forgetAccount } from "../lib/auth";
import {
  t,
  formatNumber,
  normalizePlate,
  type Lang,
  type Vehicle,
} from "../lib/carcare";
import { useFindCar } from "../queries/cars";
import { useOwner } from "../queries/support";
import { OwnerInbox } from "../components/owner-inbox";
import { ConfirmDialog } from "../components/confirm-dialog";
import { useDeleteAccount } from "../queries/legal";
export function AccountPage({
  lang,
  email,
  cars,
  loading,
  failed,
}: {
  lang: Lang;
  email: string;
  cars: Vehicle[];
  loading: boolean;
  failed: boolean;
}) {
  const [plate, setPlate] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [inbox, setInbox] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteAccount();
  const find = useFindCar(),
    qc = useQueryClient(),
    [, navigate] = useLocation();
  const owner = useOwner();
  async function logout() {
    setBusy(true);
    setError("");
    try {
      const r = await authClient.signOut();
      if (r.error) throw new Error("signout");
      qc.clear();
      rememberUserId(null);
      navigate("/login");
    } catch {
      setError(t(lang, "restoreError"));
    } finally {
      setBusy(false);
    }
  }
  async function deleteAccount() {
    setError("");
    try {
      await del.mutateAsync({});
    } catch {
      setConfirmDelete(false);
      return setError(t(lang, "deleteAccountFailed"));
    }
    // The account is gone on the server; clear this browser and go to sign-in.
    forgetAccount();
    await authClient.signOut().catch(() => undefined);
    qc.clear();
    authClient.$store.notify("$sessionSignal");
    navigate("/login", { replace: true });
  }
  async function lookup(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!normalizePlate(plate)) return setError(t(lang, "invalidPlate"));
    try {
      const r = await find.mutateAsync({ plate });
      if (!r) setError(t(lang, "restoreNotFound"));
      else navigate(`/cars/${r.id}`);
    } catch {
      setError(t(lang, "restoreError"));
    }
  }
  if (inbox) return <OwnerInbox lang={lang} onBack={() => setInbox(false)} />;
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "account")}</span>
          <h1>{t(lang, "accountTitle")}</h1>
          <p>{t(lang, "privacyTitle")}</p>
        </div>
      </div>
      <div className="account-grid">
        <section className="panel account-profile">
          <div className="large-avatar">
            <UserRound size={34} />
          </div>
          <h2>{email.split("@")[0]}</h2>
          <p className="account-email" data-testid="signed-in-as">
            {email}
          </p>
          <span className="status-tag status-ok">
            <ShieldCheck size={14} />
            {t(lang, "privacyTitle")}
          </span>
          <div className="account-fact">
            <Cloud size={20} />
            <div>
              <strong>{t(lang, "accountCars")}</strong>
              <small>
                {loading ? "…" : failed ? "—" : formatNumber(lang, cars.length)}{" "}
                · {t(lang, "myCars")}
              </small>
            </div>
          </div>
          <p className="muted">
            {t(
              lang,
              failed ? "backupFailed" : loading ? "lookingUp" : "backupOn",
            )}
          </p>
          <button
            className="btn btn-secondary destructive full-width"
            disabled={busy}
            onClick={() => void logout()}
            data-testid="sign-out"
          >
            {busy ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <LogOut size={18} />
            )}{" "}
            {t(lang, "signOut")}
          </button>
        </section>
        <div>
          <section className="panel">
            <div className="panel-title">
              <Search size={21} />
              <h2>{t(lang, "restoreTitle")}</h2>
            </div>
            <p className="muted">{t(lang, "restoreHint")}</p>
            <form onSubmit={lookup}>
              <label>
                {t(lang, "plate")}
                <input
                  aria-label={t(lang, "plate")}
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  placeholder={t(lang, "platePlaceholder")}
                  data-testid="restore-plate"
                  required
                />
              </label>
              <button
                className="btn btn-primary"
                disabled={find.isPending}
                data-testid="restore-btn"
              >
                {find.isPending ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Search size={17} />
                )}{" "}
                {t(lang, "restoreBtn")}
              </button>
            </form>
            <p className="small-muted">{t(lang, "restoreOnlyOwn")}</p>
          </section>
          <section className="panel">
            <div className="panel-title">
              <ShieldCheck size={21} />
              <h2>{t(lang, "privacyTitle")}</h2>
            </div>
            <p className="muted">{t(lang, "privacyInfo")}</p>
            <Link className="text-button" to="/settings">
              {t(lang, "settings")}
            </Link>
          </section>
          <section className="panel">
            <div className="panel-title">
              <ShieldCheck size={21} />
              <h2>{t(lang, "legalSection")}</h2>
            </div>
            <nav className="legal-links settings-legal">
              <Link to="/privacy" data-testid="account-privacy-link">
                {t(lang, "privacyPolicy")}
              </Link>
              <Link to="/support">{t(lang, "supportSite")}</Link>
            </nav>
          </section>
          <section className="panel danger-panel">
            <div className="panel-title">
              <Trash2 size={21} />
              <h2>{t(lang, "deleteAccount")}</h2>
            </div>
            <p className="muted">{t(lang, "deleteAccountInfo")}</p>
            <p className="small-muted">{t(lang, "deleteAccountApple")}</p>
            <button
              className="btn btn-danger"
              onClick={() => setConfirmDelete(true)}
              data-testid="delete-account"
            >
              <Trash2 size={17} /> {t(lang, "deleteAccount")}
            </button>
          </section>
          {owner.data?.isOwner && (
            <button
              className="panel inbox-link"
              onClick={() => setInbox(true)}
              data-testid="inbox-btn"
            >
              <Inbox size={24} />
              <div>
                <h2>{t(lang, "inboxBtn")}</h2>
                <p>{t(lang, "inboxBtnHint")}</p>
              </div>
            </button>
          )}
        </div>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {confirmDelete && (
        <ConfirmDialog
          lang={lang}
          title={t(lang, "deleteAccount")}
          message={t(lang, "deleteAccountConfirm")}
          confirmLabel={t(lang, "deleteAccountYes")}
          danger
          busy={del.isPending}
          onConfirm={() => void deleteAccount()}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
