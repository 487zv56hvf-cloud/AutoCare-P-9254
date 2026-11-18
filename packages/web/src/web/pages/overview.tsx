import { useState, useMemo, useEffect, useRef, Fragment, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  ExternalLink,
  CarFront,
  ArrowRight,
  ChevronDown,
  Check,
  Search,
  FileText,
  Link2,
  Trash2,
  LoaderCircle,
  AlertTriangle,
  Gauge,
} from "lucide-react";
import {
  t,
  formatNumber,
  computeAll,
  ITEMS,
  today,
  vehicleTitle,
  type Lang,
  type Vehicle,
  type Level,
  type ItemKey,
} from "../lib/carcare";
import { manualFor, linksOf, addLink, removeLink, manualSearches, hostOf, LINK_MAX, LINK_LABEL_MAX, LINK_URL_MAX } from "../lib/manuals";
import { useSaveCar } from "../queries/cars";

const RANK: Record<Level, number> = { overdue: 0, due: 1, soon: 2, unknown: 3, ok: 4, na: 5 };
const SEL_KEY = "autocare.web.overviewCar";

type Row = { car: Vehicle; result: ReturnType<typeof computeAll>; worst: Level };

export function OverviewPage({ lang, cars }: { lang: Lang; cars: Vehicle[] }) {
  const ar = lang === "ar";
  const L = (en: string, a: string) => (ar ? a : en);
  const [sel, setSel] = useState<string>(() => {
    try {
      return localStorage.getItem(SEL_KEY) ?? "";
    } catch {
      return "";
    }
  });
  // computeAll once per car per render, not once per item/sort comparison.
  const rows: Row[] = useMemo(
    () =>
      cars.map((car) => {
        const result = computeAll(car);
        const worst = ITEMS.map((k) => result.items[k].level).reduce<Level>(
          (w, l) => (RANK[l] < RANK[w] ? l : w),
          "na",
        );
        return { car, result, worst };
      }),
    [cars],
  );
  const current = rows.find((r) => r.car.id === sel) ?? rows[0];
  const choose = (id: string) => {
    setSel(id);
    try {
      localStorage.setItem(SEL_KEY, id);
    } catch {}
  };

  if (!current)
    return (
      <div className="ov-empty" data-testid="overview-empty">
        <CarFront size={34} />
        <h2>{L("No cars yet", "مفيش عربيات لسه")}</h2>
        <p>{L("Add a car to see its maintenance and manual here.", "ضيف عربية علشان تشوف صيانتها ودليلها هنا.")}</p>
        <Link to="/cars/new" className="btn btn-primary">{t(lang, "addCar")}</Link>
      </div>
    );

  const counts = { due: 0, soon: 0, unknown: 0 };
  const upcoming: { car: Vehicle; item: ItemKey; level: Level; remaining: number }[] = [];
  let totalKm = 0;
  for (const r of rows) {
    totalKm += r.car.odometer;
    for (const k of ITEMS) {
      const it = r.result.items[k];
      if (it.level === "due" || it.level === "overdue") counts.due++;
      else if (it.level === "soon") counts.soon++;
      else if (it.level === "unknown") counts.unknown++;
      if (it.level !== "na" && it.level !== "unknown")
        upcoming.push({ car: r.car, item: k, level: it.level, remaining: it.remaining });
    }
  }
  upcoming.sort((a, b) => a.remaining - b.remaining);
  const sorted = [...rows].sort((a, b) => RANK[a.worst] - RANK[b.worst]);
  const { car, result } = current;
  const info: [string, string][] = [
    [L("Make", "الماركة"), car.make],
    [L("Model", "الموديل"), car.model],
    [L("Year", "السنة"), car.year ? String(car.year) : "—"],
    [L("Engine", "الموتور"), car.engine || "—"],
    [L("Fuel", "الوقود"), t(lang, car.engineType ?? (car.cls === "ev" ? "ev" : "petrol"))],
    [L("Plate", "اللوحة"), car.plate || "—"],
    ["VIN", car.vin || "—"],
    [L("Oil", "الزيت"), [t(lang, car.oilType), car.viscosity].filter(Boolean).join(" · ")],
    [L("Driving", "القيادة"), t(lang, car.driving)],
    [L("Odometer", "العداد"), `${formatNumber(lang, car.odometer)} ${t(lang, "km")}`],
    [L("Average use", "متوسط الاستخدام"), `${formatNumber(lang, result.kmPerDay)} ${t(lang, "km")}/${L("day", "يوم")}`],
  ];

  return (
    <div className="ov" data-testid="overview-screen">
      <div className="ov-head">
        <div>
          <span className="eyebrow">{L("Owner dashboard", "لوحة المالك")}</span>
          <h1>{L("Maintenance overview", "متابعة الصيانة")}</h1>
          <p>{L("Every car, what's due, and where its manual is.", "كل عربياتك، اللي مستحق، ودليل كل عربية.")}</p>
        </div>
        <CarPicker lang={lang} rows={rows} value={car.id!} onChange={choose} />
      </div>

      <section className="ov-kpis" aria-label={L("Summary", "ملخص")}>
        <Kpi n={formatNumber(lang, rows.length)} label={L("Cars", "عربيات")} />
        <Kpi n={formatNumber(lang, totalKm)} label={L("Total km", "إجمالي الكيلومترات")} />
        <Kpi n={formatNumber(lang, counts.due)} label={L("Due / overdue", "مستحق / متأخر")} tone={counts.due ? "bad" : undefined} />
        <Kpi n={formatNumber(lang, counts.soon)} label={L("Coming soon", "قريب")} tone={counts.soon ? "warn" : undefined} />
        <Kpi n={formatNumber(lang, counts.unknown)} label={L("Not recorded", "مش متسجل")} />
      </section>

      {upcoming.length > 0 && (
        <section className="ov-card" data-testid="overview-next">
          <div className="ov-row">
            <h2><Gauge size={18} /> {L("Next up", "الجاي")}</h2>
            <span className="small-muted">{L("Across all cars, soonest first", "لكل العربيات، الأقرب الأول")}</span>
          </div>
          <ol className="ov-next">
            {upcoming.slice(0, 5).map((u) => (
              <li key={`${u.car.id}-${u.item}`}>
                <span className={`ov-dot lv-${u.level}`} />
                <strong>{t(lang, u.item)}</strong>
                <button type="button" className="ov-rowbtn" onClick={() => choose(u.car.id!)}>{vehicleTitle(u.car)}</button>
                <span className="ov-next-km">
                  {formatNumber(lang, Math.abs(u.remaining))} {t(lang, u.remaining > 0 ? "kmLeft" : "kmOver")}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="ov-grid">
        <section className="ov-card ov-dark" data-testid="overview-info">
          <div className="ov-row">
            <h2>{vehicleTitle(car)}</h2>
            <Link to={`/cars/${car.id}/edit`} className="ov-link-light">{L("Edit", "تعديل")}</Link>
          </div>
          <dl className="ov-dl">
            {info.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}
          </dl>
        </section>

        <section className="ov-card">
          <div className="ov-row">
            <h2>{L("Maintenance status", "حالة الصيانة")}</h2>
            <Link to={`/cars/${car.id}`} className="ov-more">{L("Open dashboard", "افتح اللوحة")} <ArrowRight size={15} className="arrow" /></Link>
          </div>
          {ITEMS.map((k) => {
            const it = result.items[k];
            return (
              <div className="ov-item" key={k}>
                <div className="ov-row">
                  <strong>{t(lang, k)}</strong>
                  <span className={`status-tag status-${it.level}`}>{t(lang, it.level)}</span>
                </div>
                {it.level !== "unknown" && it.level !== "na" ? (
                  <>
                    <div className={`progress progress-${it.level}`}><span style={{ width: `${Math.min(100, Math.round(it.pct * 100))}%` }} /></div>
                    <small>
                      {formatNumber(lang, Math.abs(it.remaining))} {t(lang, it.remaining > 0 ? "kmLeft" : "kmOver")}
                      {it.remaining > 0 && ` · ${t(lang, "daysApprox", { n: formatNumber(lang, it.days) })}`}
                    </small>
                  </>
                ) : it.level === "unknown" ? (
                  <small>{L("Last service not recorded — record it on the dashboard.", "آخر صيانة مش متسجلة — سجلها من اللوحة.")}</small>
                ) : null}
              </div>
            );
          })}
        </section>
      </div>

      <ManualCard key={car.id} lang={lang} car={car} />

      <section className="ov-card">
        <h2>{L("All my cars", "كل عربياتي")}</h2>
        <div className="ov-table-wrap">
          <table className="ov-table">
            <thead><tr><th>{L("Car", "العربية")}</th><th>{L("Plate", "اللوحة")}</th><th>{L("Odometer", "العداد")}</th>{ITEMS.map((k) => <th key={k}>{t(lang, k)}</th>)}</tr></thead>
            <tbody>
              {sorted.map(({ car: c, result: r }) => (
                <tr key={c.id} className={c.id === car.id ? "active" : ""}>
                  <td><button type="button" className="ov-rowbtn" onClick={() => choose(c.id!)} aria-pressed={c.id === car.id}>{vehicleTitle(c)}</button></td>
                  <td>{c.plate || "—"}</td>
                  <td>{formatNumber(lang, c.odometer)}</td>
                  {ITEMS.map((k) => <td key={k}><span className={`status-tag status-${r.items[k].level}`}>{t(lang, r.items[k].level)}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ n, label, tone }: { n: string; label: string; tone?: "bad" | "warn" }) {
  return (
    <div className={`ov-kpi ${tone ? `ov-kpi-${tone}` : ""}`}>
      <strong>{n}</strong>
      <span>{label}</span>
    </div>
  );
}

/** Accessible dropdown: each option shows the car, plate, odometer and its worst status. */
function CarPicker({ lang, rows, value, onChange }: { lang: Lang; rows: Row[]; value: string; onChange: (id: string) => void }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const sel = rows.find((r) => r.car.id === value) ?? rows[0];
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  useEffect(() => {
    if (open) (list.current?.children[active] as HTMLElement | undefined)?.focus();
  }, [active, open]);
  const show = () => {
    setActive(Math.max(0, rows.findIndex((r) => r.car.id === value)));
    setOpen(true);
  };
  const pick = (i: number) => {
    const r = rows[i];
    if (r) onChange(r.car.id!);
    setOpen(false);
    btn.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") setActive((a) => Math.min(rows.length - 1, a + 1));
    else if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(rows.length - 1);
        else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") btn.current?.focus();
      return;
    } else return;
    e.preventDefault();
  };
  return (
    <div className="ov-picker" ref={box}>
      <span className="ov-picker-label" id="ov-picker-label">{ar ? "العربية" : "Vehicle"}</span>
      <button
        ref={btn}
        type="button"
        className="ov-picker-btn"
        
        aria-expanded={open}
        aria-labelledby="ov-picker-label ov-picker-value"
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            show();
          }
        }}
        data-testid="overview-car"
      >
        <span className={`ov-dot lv-${sel.worst}`} />
        <span id="ov-picker-value" className="ov-picker-text">
          <strong>{vehicleTitle(sel.car)}</strong>
          <small>{[sel.car.plate, `${formatNumber(lang, sel.car.odometer)} ${t(lang, "km")}`].filter(Boolean).join(" · ")}</small>
        </span>
        <ChevronDown size={18} className={open ? "ov-flip" : ""} />
      </button>
      {open && (
        <div ref={list} className="ov-picker-list" data-testid="overview-car-list">
          {rows.map((r, i) => (
            <button
              type="button"
              key={r.car.id}
              aria-pressed={r.car.id === value}
              className={i === active ? "is-active" : ""}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => pick(i)}
              onKeyDown={onKey}
            >
              <span className={`ov-dot lv-${r.worst}`} />
              <span className="ov-picker-text">
                <strong>{vehicleTitle(r.car)}</strong>
                <small>
                  {[r.car.plate, r.car.engine, `${formatNumber(lang, r.car.odometer)} ${t(lang, "km")}`].filter(Boolean).join(" · ")}
                </small>
                <small className={`ov-opt-status lv-${r.worst}`}>
                  {ITEMS.filter((k) => r.result.items[k].level !== "na")
                    .map((k) => `${t(lang, k)}: ${t(lang, r.result.items[k].level)}`)
                    .join(" · ")}
                </small>
              </span>
              {r.car.id === value && <Check size={17} className="ov-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ManualCard({ lang, car }: { lang: Lang; car: Vehicle }) {
  const ar = lang === "ar";
  const L = (en: string, a: string) => (ar ? a : en);
  const manual = manualFor(car);
  const links = linksOf(car);
  const search = manualSearches(car);
  const save = useSaveCar();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  async function persist(v: Vehicle) {
    const { id, ...vehicle } = v;
    await save.mutateAsync({ id: id!, title: vehicleTitle(v).slice(0, 160), vehicle });
  }
  async function add(e: FormEvent) {
    e.preventDefault();
    setError("");
    const r = addLink(car, label, url, today());
    if (!r.ok)
      return setError(
        r.reason === "url"
          ? L("Enter a valid web link (https://…).", "اكتب لينك صحيح (https://…).")
          : r.reason === "full"
            ? L(`You can save up to ${LINK_MAX} links per car.`, `تقدر تحفظ لحد ${LINK_MAX} لينكات لكل عربية.`)
            : L("That link is already saved.", "اللينك ده محفوظ قبل كده."),
      );
    try {
      await persist(r.car);
      setLabel("");
      setUrl("");
    } catch {
      setError(t(lang, "backupFailed"));
    }
  }
  async function remove(u: string) {
    setError("");
    try {
      await persist(removeLink(car, u));
    } catch {
      setError(t(lang, "backupFailed"));
    }
  }
  return (
    <section className="ov-card" data-testid="overview-manual">
      <h2><BookOpen size={18} /> {L("Owner's manual", "دليل المالك")}</h2>
      {manual ? (
        <div className="ov-manual-hit">
          <p className="small-muted">{ar ? manual.noteAr : manual.note}</p>
          <div className="ov-links">
            <a href={manual.file} target="_blank" rel="noopener" className="ov-link-main">
              <FileText size={15} /> {L("Open full manual (PDF)", "افتح الدليل كامل (PDF)")} <ExternalLink size={13} />
            </a>
            {manual.pages.map(([en, a, p]) => (
              <a key={p} href={`${manual.file}#page=${p}`} target="_blank" rel="noopener">{ar ? a : en} · {L("p.", "ص")}{p}</a>
            ))}
          </div>
        </div>
      ) : (
        <p className="small-muted">{L("No built-in manual for this car yet. Find it below and save the link.", "مفيش دليل جاهز للعربية دي. دوّر عليه تحت واحفظ اللينك.")}</p>
      )}

      <div className="ov-sub">
        <h3><Search size={15} /> {L("Find it online", "دوّر عليه")}</h3>
        <div className="ov-links">
          <a href={search.official} target="_blank" rel="noopener noreferrer">{L("Official manual", "الدليل الرسمي")} <ExternalLink size={13} /></a>
          <a href={search.pdf} target="_blank" rel="noopener noreferrer">{L("PDF download", "تحميل PDF")} <ExternalLink size={13} /></a>
          <a href={search.schedule} target="_blank" rel="noopener noreferrer">{L("Service schedule", "جدول الصيانة")} <ExternalLink size={13} /></a>
        </div>
      </div>

      <div className="ov-sub">
        <h3><Link2 size={15} /> {L("My saved manuals", "الأدلة المحفوظة")} <span className="small-muted">{links.length}/{LINK_MAX}</span></h3>
        {links.length > 0 && (
          <ul className="ov-saved" data-testid="manual-links">
            {links.map((m) => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noopener noreferrer">
                  <strong>{m.label || hostOf(m.url)}</strong>
                  <small>{hostOf(m.url)}</small>
                </a>
                <button
                  type="button"
                  className="ov-icon-btn"
                  onClick={() => void remove(m.url)}
                  disabled={save.isPending}
                  aria-label={L(`Remove ${m.label || hostOf(m.url)}`, `امسح ${m.label || hostOf(m.url)}`)}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="ov-add" onSubmit={(e) => void add(e)} noValidate>
          <input
            aria-label={L("Name (optional)", "الاسم (اختياري)")}
            placeholder={L("Name, e.g. Owner's manual 2016", "الاسم، مثلاً دليل ٢٠١٦")}
            value={label}
            maxLength={LINK_LABEL_MAX}
            onChange={(e) => setLabel(e.target.value)}
            data-testid="manual-label"
          />
          <input
            aria-label={L("Link", "اللينك")}
            placeholder="https://"
            inputMode="url"
            dir="ltr"
            value={url}
            maxLength={LINK_URL_MAX}
            onChange={(e) => setUrl(e.target.value)}
            data-testid="manual-url"
            required
          />
          <button className="btn btn-primary" disabled={save.isPending || !url.trim()} data-testid="manual-add">
            {save.isPending ? <LoaderCircle size={16} className="spin" /> : <Link2 size={16} />}
            {L("Save link", "احفظ")}
          </button>
        </form>
        {error && (
          <p className="ov-error" role="alert"><AlertTriangle size={15} /> {error}</p>
        )}
      </div>
    </section>
  );
}
