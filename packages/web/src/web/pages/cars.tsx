import { Link } from "wouter";
import {
  Plus,
  CarFront,
  ArrowRight,
  ArrowUpRight,
  Activity,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useState } from "react";
import { OdometerBanner } from "../components/odometer-banner";
import {
  t,
  formatNumber,
  computeAll,
  ITEMS,
  type Lang,
  type Vehicle,
} from "../lib/carcare";

export function CarsPage({ lang, cars }: { lang: Lang; cars: Vehicle[] }) {
  const [search, setSearch] = useState("");
  const attention = cars.reduce(
    (n, c) =>
      n +
      ITEMS.filter((k) =>
        ["due", "overdue", "soon"].includes(computeAll(c).items[k].level),
      ).length,
    0,
  );
  const filtered = cars.filter((c) =>
    `${c.make} ${c.model} ${c.plate ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div data-testid="cars-screen">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "myCars")}</span>
          <h1>{t(lang, "garageTitle")}</h1>
          <p>{t(lang, "garageIntro")}</p>
        </div>
        <Link to="/cars/new" className="btn btn-primary" data-testid="add-car">
          <Plus size={19} />
          {t(lang, "addCar")}
        </Link>
      </div>
      <OdometerBanner lang={lang} cars={cars} />
      <section className="garage-banner">
        <div>
          <span className="eyebrow">
            {lang === "ar" ? "كل مشوار يبدأ هنا" : "EVERY JOURNEY STARTS HERE"}
          </span>
          <h2>
            {lang === "ar"
              ? "الطريق أوضح لما عربيتك جاهزة."
              : "A clearer picture. A better drive."}
          </h2>
          <p>
            {lang === "ar"
              ? "حدّث العداد، راجع الصيانة، وكمّل مشوارك."
              : "Update your mileage, check your services, and keep moving."}
          </p>
        </div>
        <div className="banner-motif" aria-hidden="true">
          <CarFront size={112} strokeWidth={1} />
          <div />
        </div>
      </section>
      <div className="stats-row">
        <div className="stat">
          <span className="stat-icon">
            <CarFront size={21} />
          </span>
          <div>
            <span>{t(lang, "trackedCars")}</span>
            <strong>{formatNumber(lang, cars.length)}</strong>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon amber">
            <Activity size={21} />
          </span>
          <div>
            <span>{t(lang, "attention")}</span>
            <strong>{formatNumber(lang, attention)}</strong>
          </div>
        </div>
        <div className="stat">
          <span className="stat-icon">
            <ShieldCheck size={21} />
          </span>
          <div>
            <span>{t(lang, "privacyTitle")}</span>
            <strong className="stat-text">{t(lang, "synced")}</strong>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <h2>
          {t(lang, "myCars")}{" "}
          <span className="count-pill">{formatNumber(lang, cars.length)}</span>
        </h2>
        {!!cars.length && (
          <label className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(lang, "search")}
              aria-label={t(lang, "search")}
            />
          </label>
        )}
      </div>
      {!cars.length ? (
        <div className="empty-state">
          <div className="empty-icon">
            <CarFront size={42} />
          </div>
          <h2>{t(lang, "emptyCars")}</h2>
          <p>{t(lang, "emptyCarsHint")}</p>
          <Link to="/cars/new" className="btn btn-primary">
            <Plus size={18} />
            {t(lang, "addCar")}
          </Link>
        </div>
      ) : (
        <div className="cars-grid">
          {filtered.map((c) => {
            const items = computeAll(c).items;
            const flagged = ITEMS.filter((k) =>
              ["overdue", "due", "soon"].includes(items[k].level),
            );
            return (
              <Link
                to={`/cars/${c.id}`}
                key={c.id}
                className="vehicle-card"
                data-testid="garage-car"
              >
                <div className="vehicle-card-top">
                  <div className="car-icon">
                    <CarFront size={29} />
                  </div>
                  <span
                    className={`status-tag ${flagged.length ? "status-soon" : "status-ok"}`}
                  >
                    {flagged.length
                      ? t(lang, "attention")
                      : t(lang, "overview")}
                  </span>
                  <ArrowUpRight size={20} />
                </div>
                <h2>
                  {c.make} {c.model}
                </h2>
                <p>
                  {[c.year, c.engine, c.plate].filter(Boolean).join(" · ") ||
                    t(lang, c.engineType ?? "petrol")}
                </p>
                <div className="vehicle-mileage">
                  <span>{t(lang, "odometer")}</span>
                  <strong>
                    {formatNumber(lang, c.odometer)}{" "}
                    <small>{t(lang, "km")}</small>
                  </strong>
                </div>
                <div className="mini-services">
                  {ITEMS.filter((k) => items[k].level !== "na").map((k) => (
                    <span key={k}>
                      <i className={`dot ${items[k].level}`} />
                      {t(lang, k)}
                    </span>
                  ))}
                </div>
                <div className="card-bottom">
                  <span>{t(lang, "viewDashboard")}</span>
                  <ArrowRight size={17} className="arrow" />
                </div>
              </Link>
            );
          })}
          {!filtered.length && <p>{t(lang, "noResults")}</p>}
        </div>
      )}
    </div>
  );
}
