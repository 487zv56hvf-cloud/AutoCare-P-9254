import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, CheckCircle2, LoaderCircle } from "lucide-react";
import {
  t,
  formatNumber,
  toNumber,
  today,
  validServiceDate,
  SERVICE_NOTE_MAX,
  SERVICE_DATE_MIN,
  type ItemKey,
  type Lang,
  type ServiceEntry,
} from "../lib/carcare";

/** Records a completed service: date (not in the future), odometer at service, optional description. */
export function ServiceDialog({
  lang,
  item,
  odometer,
  busy,
  error,
  onSave,
  onClose,
}: {
  lang: Lang;
  item: ItemKey;
  odometer: number;
  busy: boolean;
  error: string;
  onSave: (entry: ServiceEntry) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const now = today();
  const [date, setDate] = useState(now);
  const [km, setKm] = useState(String(odometer));
  const [note, setNote] = useState("");
  const [invalid, setInvalid] = useState("");
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  function submit(e: FormEvent) {
    e.preventDefault();
    const n = toNumber(km);
    if (!validServiceDate(date, now))
      return setInvalid(t(lang, "serviceDateInvalid"));
    if (n === null || n < 0 || n > odometer)
      return setInvalid(
        t(lang, "serviceKmInvalid", { n: formatNumber(lang, odometer) }),
      );
    if (note.trim().length > SERVICE_NOTE_MAX)
      return setInvalid(
        t(lang, "serviceNoteLong", { n: String(SERVICE_NOTE_MAX) }),
      );
    setInvalid("");
    onSave({ date, km: n, note: note.trim() || undefined });
  }
  const shown = invalid || error;
  return (
    <dialog
      ref={ref}
      className="confirm-dialog service-dialog"
      data-testid="service-sheet"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <form dir={lang === "ar" ? "rtl" : "ltr"} onSubmit={submit} noValidate>
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          disabled={busy}
          aria-label={t(lang, "close")}
        >
          <X size={20} />
        </button>
        <h2>{t(lang, "recordServiceTitle", { item: t(lang, item) })}</h2>
        <p>{t(lang, "recordServiceHint")}</p>
        <div className="service-dialog-grid">
          <label>
            {t(lang, "serviceDate")}
            <input
              type="date"
              aria-label={t(lang, "serviceDate")}
              value={date}
              min={SERVICE_DATE_MIN}
              max={now}
              required
              onChange={(e) => setDate(e.target.value)}
              data-testid="service-date"
            />
          </label>
          <label>
            {t(lang, "serviceKm")}
            <input
              inputMode="numeric"
              aria-label={t(lang, "serviceKm")}
              value={km}
              onChange={(e) => setKm(e.target.value)}
              data-testid="service-km"
            />
            <small>
              {t(lang, "serviceKmHint", { n: formatNumber(lang, odometer) })}
            </small>
          </label>
        </div>
        <label>
          {t(lang, "serviceNote")}
          <textarea
            aria-label={t(lang, "serviceNote")}
            value={note}
            maxLength={SERVICE_NOTE_MAX}
            rows={3}
            placeholder={t(lang, "serviceNotePlaceholder")}
            onChange={(e) => setNote(e.target.value)}
            data-testid="service-note"
          />
          <small>
            {t(lang, "charsLeft", {
              n: formatNumber(lang, SERVICE_NOTE_MAX - note.length),
            })}
          </small>
        </label>
        {shown && (
          <div className="error" role="alert">
            {shown}
          </div>
        )}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={busy}
          >
            {t(lang, "cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={busy}
            data-testid="service-save"
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <CheckCircle2 size={17} />
            )}
            {t(lang, "saveService")}
          </button>
        </div>
      </form>
    </dialog>
  );
}
