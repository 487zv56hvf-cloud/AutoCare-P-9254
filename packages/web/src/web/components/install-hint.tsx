// One-time popup on phones explaining how to add AutoCare to the Home Screen.
import { useEffect, useRef, useState } from "react";
import { X, Share, SquarePlus, EllipsisVertical, Download } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
import {
  isIos,
  isStandalone,
  promptInstall,
  useInstallState,
} from "../lib/install";

const KEY = "autocare.web.installHint.v1";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isPhone(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    isIos() ||
    /Android/i.test(navigator.userAgent) ||
    window.matchMedia?.("(pointer: coarse) and (max-width: 900px)").matches
  );
}

function shouldShow(): boolean {
  if (isStandalone() || !isPhone()) return false;
  try {
    const v = localStorage.getItem(KEY);
    if (v === "done") return false;
    if (v && Date.now() - Number(v) < SNOOZE_MS) return false;
  } catch {
    // Storage blocked: still show, it just will not be remembered.
  }
  return true;
}

function remember(value: string) {
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // ignore
  }
}

export function InstallHint({ lang }: { lang: Lang }) {
  const [open, setOpen] = useState(false);
  const state = useInstallState();
  const ref = useRef<HTMLDialogElement>(null);
  const ar = lang === "ar";

  useEffect(() => {
    if (!shouldShow()) return;
    const id = window.setTimeout(() => setOpen(true), 1500);
    return () => window.clearTimeout(id);
  }, []);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
      // Focus the sheet itself, not the close button, so no focus ring flashes on open.
      ref.current?.focus();
    }
  }, [open]);
  useEffect(() => {
    if (open && state === "installed") close("done");
  }, [open, state]);

  function close(value: string) {
    remember(value);
    ref.current?.close();
    setOpen(false);
  }

  if (!open) return null;

  const ios = state === "ios" || isIos();
  const steps = ios
    ? [
        {
          icon: <Share size={18} />,
          text: ar
            ? "اضغط زرار المشاركة في Safari (المربع اللي فيه سهم لفوق)."
            : "Tap the Share button in Safari (the square with an arrow).",
        },
        {
          icon: <SquarePlus size={18} />,
          text: ar
            ? "انزل واختار «إضافة إلى الشاشة الرئيسية»."
            : "Scroll down and tap “Add to Home Screen”.",
        },
        {
          icon: <span className="install-step-word">{ar ? "إضافة" : "Add"}</span>,
          text: ar
            ? "اضغط «إضافة» فوق. خلاص!"
            : "Tap “Add” in the top corner. Done!",
        },
      ]
    : [
        {
          icon: <EllipsisVertical size={18} />,
          text: ar
            ? "اضغط قائمة Chrome ⋮ فوق."
            : "Tap the Chrome menu ⋮ at the top.",
        },
        {
          icon: <Download size={18} />,
          text: ar
            ? "اختار «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية»."
            : "Choose “Install app” or “Add to Home screen”.",
        },
        {
          icon: <span className="install-step-word">{ar ? "تثبيت" : "OK"}</span>,
          text: ar ? "أكّد. خلاص!" : "Confirm. Done!",
        },
      ];

  return (
    <dialog
      ref={ref}
      className="confirm-dialog install-hint"
      tabIndex={-1}
      data-testid="install-hint"
      onCancel={(e) => {
        e.preventDefault();
        close(String(Date.now()));
      }}
    >
      <div dir={ar ? "rtl" : "ltr"}>
        <button
          className="dialog-close"
          onClick={() => close(String(Date.now()))}
          aria-label={t(lang, "close")}
          data-testid="install-hint-close"
        >
          <X size={20} />
        </button>
        <div className="install-hint-head">
          <img src="/images/autocare-icon-180.png" alt="" width={56} height={56} className="install-hint-icon" />
          <div>
            <h2>{ar ? "ضيف AutoCare للشاشة الرئيسية" : "Add AutoCare to your Home Screen"}</h2>
            <p>
              {ar
                ? "افتحه بضغطة زي أي تطبيق. مجاني ومن غير متجر."
                : "Open it in one tap, like any app. Free, no app store."}
            </p>
          </div>
        </div>
        {state === "prompt" ? (
          <div className="form-actions">
            <button
              className="btn btn-secondary"
              onClick={() => close(String(Date.now()))}
            >
              {ar ? "مش دلوقتي" : "Not now"}
            </button>
            <button
              className="btn btn-primary"
              data-testid="install-hint-install"
              onClick={() =>
                void promptInstall().then((ok) =>
                  close(ok ? "done" : String(Date.now())),
                )
              }
            >
              <Download size={17} />
              {ar ? "تثبيت" : "Install"}
            </button>
          </div>
        ) : (
          <>
            <ol className="install-steps" data-testid="install-steps">
              {steps.map((s, i) => (
                <li key={i}>
                  <span className="install-step-num">{i + 1}</span>
                  <span className="install-step-icon">{s.icon}</span>
                  <span>{s.text}</span>
                </li>
              ))}
            </ol>
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={() => close(String(Date.now()))}
              >
                {ar ? "بعدين" : "Later"}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => close("done")}
                data-testid="install-hint-ok"
              >
                {ar ? "تمام" : "Got it"}
              </button>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
