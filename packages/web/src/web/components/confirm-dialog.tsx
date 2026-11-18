import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
export function ConfirmDialog({
  lang,
  title,
  message,
  onConfirm,
  onClose,
  busy,
  danger = false,
  confirmLabel,
}: {
  lang: Lang;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
  danger?: boolean;
  confirmLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div dir={lang === "ar" ? "rtl" : "ltr"}>
        <button
          className="dialog-close"
          onClick={onClose}
          disabled={busy}
          aria-label={t(lang, "close")}
        >
          <X size={20} />
        </button>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="form-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={busy}
          >
            {t(lang, "cancel")}
          </button>
          <button
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={busy}
            data-testid="confirm-action"
          >
            {busy ? "…" : (confirmLabel ?? t(lang, danger ? "delete" : "yes"))}
          </button>
        </div>
      </div>
    </dialog>
  );
}
