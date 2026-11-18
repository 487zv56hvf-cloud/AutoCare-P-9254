import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  CarFront,
  Gauge,
  CalendarDays,
  Droplets,
  Disc3,
  CircleDot,
  Check,
  Plus,
  PenLine,
  Trash2,
  History,
  LoaderCircle,
  Info,
} from "lucide-react";
import {
  computeAll,
  ITEMS,
  t,
  formatNumber,
  formatDate,
  toNumber,
  today,
  recordService,
  serviceHistory,
  vehicleTitle,
  type Vehicle,
  type ItemKey,
  type ServiceEntry,
  type Lang,
} from "../lib/carcare";
import { useSaveCar, useRemoveCar } from "../queries/cars";
import { ConfirmDialog } from "../components/confirm-dialog";
import { ServiceDialog } from "../components/service-dialog";
import { OdometerBanner } from "../components/odometer-banner";

export function DashboardPage({ lang, car }: { lang: Lang; car: Vehicle }) {
  const { items, kmPerDay } = computeAll(car);
  const save = useSaveCar(),
    remove = useRemoveCar();
  const odoInput = useRef<HTMLInputElement>(null);
  function focusOdometer() {
    const el = odoInput.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  }
  useEffect(() => {
    // Arriving from a "Time to update your odometer" banner on the cars page.
    if (window.location.hash === "#update") {
      focusOdometer();
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  const [reading, setReading] = useState(""),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState<"delete" | null>(null),
    [serviceItem, setServiceItem] = useState<ItemKey | null>(null),
    [serviceError, setServiceError] = useState("");
  const [, navigate] = useLocation();
  const busy = save.isPending || remove.isPending;
  const icons = { oil: Droplets, brakes: Disc3, tires: CircleDot };
  async function persist(v: Vehicle) {
    const { id, ...vehicle } = v;
    return save.mutateAsync({
      id: id!,
      title: vehicleTitle(v).slice(0, 160),
      vehicle,
    });
  }
  async function update(e: FormEvent) {
    e.preventDefault();
    const n = toNumber(reading);
    setError("");
    if (n === null) return setError(t(lang, "needNumber"));
    if (n < car.odometer) return setError(t(lang, "lower"));
    try {
      await persist({
        ...car,
        odometer: n,
        log: [...car.log, { date: today(), km: n }],
      });
      setReading("");
    } catch {
      setError(t(lang, "backupFailed"));
    }
  }
  async function confirmAction() {
    if (!confirm) return;
    setError("");
    try {
      await remove.mutateAsync({ id: car.id! });
      navigate("/cars");
      setConfirm(null);
    } catch {
      setError(t(lang, "backupFailed"));
      setConfirm(null);
    }
  }
  async function saveService(entry: ServiceEntry) {
    if (!serviceItem) return;
    setServiceError("");
    try {
      await persist(recordService(car, serviceItem, entry));
      setServiceItem(null);
    } catch {
      setServiceError(t(lang, "backupFailed"));
    }
  }
  const sorted = [...ITEMS]
    .filter((k) => items[k].level !== "na")
    .sort(
      (a, b) =>
        ({ overdue: 0, due: 1, soon: 2, unknown: 3, ok: 4, na: 5 })[
          items[a].level
        ] -
        { overdue: 0, due: 1, soon: 2, unknown: 3, ok: 4, na: 5 }[
          items[b].level
        ],
    );
  return (
    <div data-testid="car-dashboard">
      <Link to="/cars" className="back-link">
        <ArrowLeft size={16} className="arrow" />
        {t(lang, "allCars")}
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "dashboard")}</span>
          <h1>
            {car.make} {car.model}
          </h1>
          <p>{[car.year, car.engine, car.plate].filter(Boolean).join(" · ")}</p>
        </div>
        <Link
          to={`/cars/${car.id}/edit`}
          className="btn btn-secondary"
          data-testid="edit-car"
        >
          <PenLine size={17} />
          {t(lang, "edit")}
        </Link>
      </div>
      <OdometerBanner lang={lang} cars={[car]} onUpdate={focusOdometer} />
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <section className="dashboard-hero">
        <div className="hero-car">
          <CarFront size={62} strokeWidth={1.3} />
          <div>
            <span>{t(lang, "odometer")}</span>
            <strong>
              {formatNumber(lang, car.odometer)} <small>{t(lang, "km")}</small>
            </strong>
            <span>{t(lang, "pace", { n: formatNumber(lang, kmPerDay) })}</span>
          </div>
        </div>
        <div className="hero-detail">
          <span>
            <Gauge size={18} />
            {t(lang, car.engineType ?? (car.cls === "ev" ? "ev" : "petrol"))}
          </span>
          {car.vin && <span className="vin-text">VIN · {car.vin}</span>}
          <span>
            <CalendarDays size={17} />
            {lang === "ar"
              ? "حدّث العداد لتقديرات أدق"
              : "Keep mileage current for better estimates"}
          </span>
        </div>
      </section>
      <div className="dashboard-grid">
        <section>
          <div className="section-heading">
            <h2>{t(lang, "maintenancePlan")}</h2>
            <span className="small-muted">
              {lang === "ar" ? "حسب قراءة العداد" : "Based on your mileage"}
            </span>
          </div>
          <div className="service-list">
            {sorted.map((k) => {
              const it = items[k],
                Icon = icons[k];
              return (
                <article className="service-card" key={k}>
                  <div className="service-head">
                    <span className="service-icon">
                      <Icon size={23} />
                    </span>
                    <div>
                      <h3>{t(lang, k)}</h3>
                      <p>
                        {t(lang, "every", {
                          n: formatNumber(lang, it.interval),
                        })}
                      </p>
                    </div>
                    <span className={`status-tag status-${it.level}`}>
                      {t(lang, it.level)}
                    </span>
                  </div>
                  {it.level !== "unknown" ? (
                    <>
                      <div className="service-metric">
                        <strong>
                          {formatNumber(lang, Math.abs(it.remaining))}
                        </strong>
                        <span>
                          {t(lang, it.remaining > 0 ? "kmLeft" : "kmOver")}
                        </span>
                        <small>
                          {it.remaining > 0
                            ? t(lang, "daysApprox", {
                                n: formatNumber(lang, it.days),
                              })
                            : t(lang, "attention")}
                        </small>
                      </div>
                      <div className={`progress progress-${it.level}`}>
                        <span
                          style={{ width: `${Math.round(it.pct * 100)}%` }}
                        />
                      </div>
                    </>
                  ) : (
                    <p className="service-unknown">{t(lang, "leaveBlank")}</p>
                  )}
                  {k === "oil" && car.viscosity && (
                    <p className="small-muted">
                      {t(lang, "viscosityShow", { v: car.viscosity })}
                    </p>
                  )}
                  <div className="service-footer">
                    <span>
                      {t(lang, "lastService")}:{" "}
                      {car.last[k] !== null
                        ? `${formatNumber(lang, car.last[k]!)} ${t(lang, "km")}`
                        : "—"}
                    </span>
                    <button
                      className="btn btn-service"
                      onClick={() => {
                        setServiceError("");
                        setServiceItem(k);
                      }}
                      disabled={busy}
                      data-testid={`done-${k}`}
                    >
                      <Check size={16} />
                      {t(lang, "done")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <aside className="dashboard-aside">
          <section className="panel">
            <div className="panel-title">
              <span className="service-icon">
                <Plus size={20} />
              </span>
              <h2>{t(lang, "updateOdo")}</h2>
            </div>
            <p className="muted">{t(lang, "faq2a")}</p>
            <form onSubmit={update}>
              <label>
                {t(lang, "newReading")}
                <input
                  aria-label={t(lang, "newReading")}
                  inputMode="numeric"
                  value={reading}
                  onChange={(e) => setReading(e.target.value)}
                  placeholder={String(car.odometer)}
                  ref={odoInput}
                  data-testid="new-odometer"
                  required
                />
              </label>
              <button
                className="btn btn-primary full-width"
                disabled={busy}
                data-testid="update-odometer"
              >
                {save.isPending ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Gauge size={17} />
                )}{" "}
                {t(lang, "update")}
              </button>
            </form>
          </section>
          <section
            className="panel history-panel"
            data-testid="service-history"
          >
            <div className="panel-title">
              <History size={20} />
              <h2>{t(lang, "serviceHistory")}</h2>
            </div>
            {!car.services?.length && (
              <p className="muted">{t(lang, "noServiceHistory")}</p>
            )}
            {serviceHistory(car)
              .slice(0, 10)
              .map((r, i) => (
                <div className="history-item" key={i}>
                  <span className="history-dot" />
                  <div>
                    <strong>{t(lang, r.item)}</strong>
                    <small>
                      {r.date
                        ? formatDate(lang, r.date)
                        : t(lang, "savedReading")}
                    </small>
                    {r.note && (
                      <span
                        className="history-note"
                        data-testid="service-note-text"
                      >
                        {r.note}
                      </span>
                    )}
                  </div>
                  <span>
                    {formatNumber(lang, r.km)} {t(lang, "km")}
                  </span>
                </div>
              ))}
          </section>
          <section className="panel">
            <div className="panel-title">
              <Gauge size={20} />
              <h2>{t(lang, "mileageHistory")}</h2>
            </div>
            {[...car.log]
              .reverse()
              .slice(0, 5)
              .map((r, i) => (
                <div className="reading-row" key={i}>
                  <span>{r.date}</span>
                  <strong>
                    {formatNumber(lang, r.km)} {t(lang, "km")}
                  </strong>
                </div>
              ))}
          </section>
        </aside>
      </div>
      <div className="safety-note">
        <Info size={19} />
        <p>{t(lang, "disclaimer")}</p>
      </div>
      <button
        className="text-button destructive"
        onClick={() => setConfirm("delete")}
        disabled={busy}
        data-testid="delete-car"
      >
        <Trash2 size={15} />
        {t(lang, "deleteCar")}
      </button>
      {serviceItem && (
        <ServiceDialog
          lang={lang}
          item={serviceItem}
          odometer={car.odometer}
          busy={save.isPending}
          error={serviceError}
          onClose={() => setServiceItem(null)}
          onSave={(entry) => void saveService(entry)}
        />
      )}
      {confirm && (
        <ConfirmDialog
          lang={lang}
          title={t(lang, "deleteCar")}
          message={t(lang, "deleteCarMsgCloud", { car: vehicleTitle(car) })}
          danger
          busy={busy}
          onClose={() => setConfirm(null)}
          onConfirm={() => void confirmAction()}
        />
      )}
    </div>
  );
}
