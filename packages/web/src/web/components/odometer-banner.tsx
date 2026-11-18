// Website stand-in for the phone's odometer notification: a banner per car that is due.
import { Link } from "wouter";
import { Gauge } from "lucide-react";
import {
  t,
  formatNumber,
  odometerDue,
  type Lang,
  type Vehicle,
} from "../lib/carcare";
import { dismissOdo, useOdoFrequency, useOdoLater } from "../lib/odometer";

/** Wraps the car name in <bdi> so an Arabic plate cannot scramble English text (and vice versa). */
function bodyWithCar(lang: Lang, name: string, days: number) {
  const [before, after = ""] = t(lang, "odoDueBody", {
    n: formatNumber(lang, days),
  }).split("{car}");
  return (
    <>
      {before}
      <bdi>{name}</bdi>
      {after}
    </>
  );
}

export function OdometerBanner({
  lang,
  cars,
  onUpdate,
}: {
  lang: Lang;
  cars: Vehicle[];
  /** On a car's own page: focus its odometer field instead of linking to it. */
  onUpdate?: () => void;
}) {
  const freq = useOdoFrequency();
  const later = useOdoLater();
  const due = cars
    .map((car) => ({ car, due: odometerDue(car, freq) }))
    .filter(
      (x): x is { car: Vehicle; due: { days: number; key: string } } =>
        !!x.due && !later.has(x.due.key),
    );
  if (!due.length) return null;
  return (
    <div className="odo-banners" data-testid="odo-banners">
      {due.map(({ car, due }) => {
        const name = [car.make, car.model, car.plate].filter(Boolean).join(" · ");
        return (
          <section
            key={car.id}
            className="odo-banner"
            data-testid="odo-banner"
          >
            <span className="odo-banner-icon">
              <Gauge size={20} />
            </span>
            <div className="odo-banner-text">
              <strong>{t(lang, "odoDueTitle")}</strong>
              <span>{bodyWithCar(lang, name, due.days)}</span>
            </div>
            <div className="odo-banner-actions">
              {onUpdate ? (
                <button
                  className="btn btn-primary"
                  onClick={onUpdate}
                  data-testid="odo-banner-update"
                >
                  {t(lang, "odoUpdateNow")}
                </button>
              ) : (
                <Link
                  to={`/cars/${car.id}#update`}
                  className="btn btn-primary"
                  data-testid="odo-banner-update"
                >
                  {t(lang, "odoUpdateNow")}
                </Link>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => dismissOdo(due.key)}
                data-testid="odo-banner-later"
              >
                {t(lang, "odoLater")}
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
