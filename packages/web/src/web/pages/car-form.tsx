import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  CarFront,
  Gauge,
  Droplets,
  Search,
  Save,
  LoaderCircle,
} from "lucide-react";
import {
  t,
  toNumber,
  today,
  makesFor,
  modelsFor,
  enginesFor,
  engineTypeOf,
  classify,
  normalizePlate,
  validOilInterval,
  decodeVin,
  vinFoundNote,
  isPlausibleVin,
  matchMake,
  matchModel,
  matchEngine,
  typesFor,
  vehicleTitle,
  type Vehicle,
  type Lang,
  type EngineType,
} from "../lib/carcare";
import { useSaveCar, useVinDecode } from "../queries/cars";
import { VinGuide } from "../components/vin-guide";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label>
      {label}
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function CarForm({
  lang,
  initial,
  cars,
}: {
  lang: Lang;
  initial?: Vehicle;
  cars: Vehicle[];
}) {
  const [make, setMake] = useState(initial?.make ?? ""),
    [model, setModel] = useState(initial?.model ?? ""),
    [engine, setEngine] = useState(initial?.engine ?? "");
  const [type, setType] = useState<EngineType>(
    initial?.engineType ??
      (initial?.cls === "ev" ? "ev" : engineTypeOf(initial?.engine)),
  );
  const [vin, setVin] = useState(initial?.vin ?? ""),
    [year, setYear] = useState(String(initial?.year ?? "")),
    [plate, setPlate] = useState(initial?.plate ?? "");
  const [odo, setOdo] = useState(String(initial?.odometer ?? "")),
    [oil, setOil] = useState(String(initial?.last.oil ?? "")),
    [brakes, setBrakes] = useState(String(initial?.last.brakes ?? "")),
    [tires, setTires] = useState(String(initial?.last.tires ?? ""));
  const [oilType, setOilType] = useState<Vehicle["oilType"]>(
      initial?.oilType ?? "semi",
    ),
    [driving, setDriving] = useState<Vehicle["driving"]>(
      initial?.driving ?? "city",
    );
  const [viscosity, setViscosity] = useState(initial?.viscosity ?? ""),
    [interval, setInterval] = useState(String(initial?.oilInterval ?? ""));
  const [error, setError] = useState(""),
    [note, setNote] = useState(""),
    [decoding, setDecoding] = useState(false);
  // Year last filled in by a VIN lookup, so a later lookup without a year clears it.
  const vinYear = useRef("");
  const save = useSaveCar();
  const vinDecode = useVinDecode();
  const [, navigate] = useLocation();
  const isEv = type === "ev";
  function changeType(tp: EngineType) {
    setType(tp);
    if (!makesFor(tp).includes(make)) {
      setMake("");
      setModel("");
      setEngine("");
    } else if (!modelsFor(make, tp).includes(model)) {
      setModel("");
      setEngine("");
    } else {
      const options = enginesFor(make, model, tp);
      setEngine(
        options.includes(engine)
          ? engine
          : options.length === 1
            ? options[0]
            : "",
      );
    }
  }
  async function lookup() {
    setError("");
    setNote("");
    if (!isPlausibleVin(vin)) return setError(t(lang, "invalidVin"));
    setDecoding(true);
    try {
      const r = await decodeVin(vin, (v) => vinDecode.mutateAsync({ vin: v }));
      if (r.year) setYear((vinYear.current = String(r.year)));
      else if (vinYear.current && year === vinYear.current) {
        setYear("");
        vinYear.current = "";
      }
      const mk = matchMake(r.make);
      if (!mk)
        return setError(
          t(lang, r.source === "none" ? "vinFoundNone" : "notInEgypt"),
        );
      const md = matchModel(mk, r.model) ?? "";
      const available = md ? typesFor(mk, md) : [];
      const tp =
        r.cls === "ev"
          ? "ev"
          : available.includes(type)
            ? type
            : (available[0] ?? type);
      setType(tp);
      setMake(mk);
      setModel(md);
      const eng = md ? matchEngine(mk, md, r.litres) : null;
      const opts = md ? enginesFor(mk, md, tp) : [];
      const picked =
        eng && opts.includes(eng) ? eng : opts.length === 1 ? opts[0] : "";
      setEngine(picked);
      setNote(
        vinFoundNote(lang, {
          year: !!r.year,
          make: true,
          model: !!md,
          engine: !!picked || tp === "ev",
        }),
      );
    } catch {
      setError(t(lang, "notFound"));
    } finally {
      setDecoding(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const odometer = toNumber(odo),
      last = {
        oil: isEv ? null : toNumber(oil),
        brakes: toNumber(brakes),
        tires: toNumber(tires),
      };
    if (!make || !model) return setError(t(lang, "needMakeModel"));
    if (odometer === null) return setError(t(lang, "needNumber"));
    if (initial && odometer < initial.odometer)
      return setError(t(lang, "lower"));
    if (vin && !isPlausibleVin(vin)) return setError(t(lang, "invalidVinSave"));
    const clean = plate.trim() ? normalizePlate(plate) : "";
    if (clean === null) return setError(t(lang, "invalidPlate"));
    if (
      clean &&
      cars.some(
        (c) => c.id !== initial?.id && normalizePlate(c.plate ?? "") === clean,
      )
    )
      return setError(t(lang, "plateTaken"));
    if (Object.values(last).some((k) => k !== null && k > odometer))
      return setError(t(lang, "serviceAbove"));
    const oilInterval = isEv || !interval.trim() ? null : toNumber(interval);
    if (!isEv && interval.trim() && !validOilInterval(oilInterval))
      return setError(
        t(lang, "oilBadInterval", { min: "1,000", max: "30,000" }),
      );
    const log = [...(initial?.log ?? [])];
    if (!log.length || log[log.length - 1].km !== odometer)
      log.push({ date: today(), km: odometer });
    const vehicle: Vehicle = {
      ...initial,
      vin,
      make,
      model,
      engine: isEv ? undefined : engine || undefined,
      engineType: type,
      plate: clean || undefined,
      year: toNumber(year),
      cls: isEv ? "ev" : classify(make, engine),
      oilType,
      driving,
      odometer,
      last,
      log,
      viscosity: isEv ? undefined : viscosity,
      oilInterval,
    };
    try {
      const { id, ...data } = vehicle;
      const result = await save.mutateAsync({
        id: id ?? crypto.randomUUID(),
        title: vehicleTitle(vehicle).slice(0, 160),
        vehicle: data,
      });
      navigate(`/cars/${result.id}`);
    } catch {
      setError(t(lang, "backupFailed"));
    }
  }
  const selectOptions = (opts: string[]) =>
    opts.map((o) => (
      <option key={o} value={o}>
        {o}
      </option>
    ));
  return (
    <div>
      <Link
        to={initial ? `/cars/${initial.id}` : "/cars"}
        className="back-link"
      >
        <ArrowLeft size={16} />
        {t(lang, "back")}
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t(lang, "myCars")}</span>
          <h1>{t(lang, initial ? "edit" : "addCar")}</h1>
          <p>{t(lang, "catalogNote")}</p>
        </div>
      </div>
      <form onSubmit={submit} className="car-form">
        <section className="panel">
          <div className="form-section-heading">
            <span>01</span>
            <div>
              <h2>{t(lang, "identifyTitle")}</h2>
              <p>{t(lang, "vinSkip")}</p>
            </div>
            <CarFront size={24} />
          </div>
          <Field label={t(lang, "orVin")} hint={t(lang, "vinIntro")}>
            <div className="inline-input">
              <input
                aria-label={t(lang, "orVin")}
                value={vin}
                onChange={(e) =>
                  setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                maxLength={17}
                placeholder="JTDKB20U123456789"
                dir="ltr"
                data-testid="vin-input"
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => void lookup()}
                disabled={decoding}
                data-testid="vin-lookup"
              >
                {decoding ? (
                  <LoaderCircle className="spin" size={18} />
                ) : (
                  <Search size={18} />
                )}
                <span>{t(lang, "lookup")}</span>
              </button>
            </div>
          </Field>
          {note && <p className="success-message">{note}</p>}
          <VinGuide lang={lang} />
          <div className="form-grid">
            <Field label={t(lang, "powertrain")}>
              <select
                value={type}
                onChange={(e) => changeType(e.target.value as EngineType)}
                data-testid="engine-type"
              >
                {(["petrol", "diesel", "hybrid", "phev", "ev"] as const).map(
                  (tp) => (
                    <option key={tp} value={tp}>
                      {t(lang, tp)}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label={t(lang, "year")}>
              <input
                aria-label={t(lang, "year")}
                inputMode="numeric"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2020"
              />
            </Field>
            <Field label={t(lang, "make")}>
              <select
                required
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  setModel("");
                  setEngine("");
                }}
                data-testid="make-select"
              >
                <option value="">{t(lang, "selectMake")}</option>
                {selectOptions(makesFor(type))}
              </select>
            </Field>
            <Field label={t(lang, "model")}>
              <select
                required
                disabled={!make}
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  const opts = enginesFor(make, e.target.value, type);
                  setEngine(opts.length === 1 ? opts[0] : "");
                }}
                data-testid="model-select"
              >
                <option value="">{t(lang, "selectModel")}</option>
                {selectOptions(modelsFor(make, type))}
              </select>
            </Field>
            {!isEv && (
              <Field label={t(lang, "engine")}>
                <select
                  value={engine}
                  disabled={!model}
                  onChange={(e) => setEngine(e.target.value)}
                  data-testid="engine-select"
                >
                  <option value="">{t(lang, "selectEngine")}</option>
                  {selectOptions(enginesFor(make, model, type))}
                </select>
              </Field>
            )}
            <Field label={t(lang, "plate")} hint={t(lang, "plateHint")}>
              <input
                aria-label={t(lang, "plate")}
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder={t(lang, "platePlaceholder")}
                data-testid="plate-input"
              />
            </Field>
          </div>
        </section>
        <section className="panel">
          <div className="form-section-heading">
            <span>02</span>
            <div>
              <h2>{t(lang, "odometer")}</h2>
              <p>{t(lang, "leaveBlank")}</p>
            </div>
            <Gauge size={24} />
          </div>
          <div className="form-grid">
            <Field label={t(lang, "odometer")}>
              <input
                aria-label={t(lang, "odometer")}
                inputMode="numeric"
                required
                value={odo}
                onChange={(e) => setOdo(e.target.value)}
                placeholder="50000"
                data-testid="odometer-input"
              />
            </Field>
            {!isEv && (
              <Field label={t(lang, "lastOil")}>
                <input
                  aria-label={t(lang, "lastOil")}
                  inputMode="numeric"
                  value={oil}
                  onChange={(e) => setOil(e.target.value)}
                  data-testid="last-oil"
                />
              </Field>
            )}
            <Field label={t(lang, "lastBrakes")}>
              <input
                aria-label={t(lang, "lastBrakes")}
                inputMode="numeric"
                value={brakes}
                onChange={(e) => setBrakes(e.target.value)}
                data-testid="last-brakes"
              />
            </Field>
            <Field label={t(lang, "lastTires")}>
              <input
                aria-label={t(lang, "lastTires")}
                inputMode="numeric"
                value={tires}
                onChange={(e) => setTires(e.target.value)}
                data-testid="last-tires"
              />
            </Field>
          </div>
        </section>
        <section className="panel">
          <div className="form-section-heading">
            <span>03</span>
            <div>
              <h2>{t(lang, isEv ? "driving" : "oilType")}</h2>
              <p>{t(lang, isEv ? "evInfo" : "oilEveryHint")}</p>
            </div>
            <Droplets size={24} />
          </div>
          <div className="form-grid">
            {!isEv && (
              <>
                <Field label={t(lang, "oilType")}>
                  <select
                    value={oilType}
                    onChange={(e) =>
                      setOilType(e.target.value as Vehicle["oilType"])
                    }
                  >
                    {(["mineral", "semi", "synthetic"] as const).map((x) => (
                      <option key={x} value={x}>
                        {t(lang, x)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field
                  label={t(lang, "viscosity")}
                  hint={t(lang, "viscosityHint")}
                >
                  <input
                    aria-label={t(lang, "viscosity")}
                    value={viscosity}
                    onChange={(e) => setViscosity(e.target.value.toUpperCase())}
                    placeholder="5W-30"
                    maxLength={20}
                  />
                </Field>
                <Field
                  label={t(lang, "oilCustomLabel")}
                  hint={
                    lang === "ar"
                      ? "سيبها فاضية لاستخدام المقترح"
                      : "Leave blank to use the recommendation"
                  }
                >
                  <input
                    aria-label={t(lang, "oilCustomLabel")}
                    inputMode="numeric"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    placeholder={lang === "ar" ? "المقترح" : "Recommended"}
                  />
                </Field>
              </>
            )}
            <Field label={t(lang, "driving")}>
              <select
                value={driving}
                onChange={(e) =>
                  setDriving(e.target.value as Vehicle["driving"])
                }
              >
                {(["city", "mixed", "highway"] as const).map((x) => (
                  <option key={x} value={x}>
                    {t(lang, x)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="form-actions">
          <Link
            to={initial ? `/cars/${initial.id}` : "/cars"}
            className="btn btn-secondary"
          >
            {t(lang, "cancel")}
          </Link>
          <button
            className="btn btn-primary"
            disabled={save.isPending || decoding}
            data-testid="save-car"
          >
            {save.isPending ? (
              <LoaderCircle size={18} className="spin" />
            ) : (
              <Save size={18} />
            )}{" "}
            {t(lang, "save")}
          </button>
        </div>
        <p className="small-muted">{t(lang, "disclaimer")}</p>
      </form>
    </div>
  );
}
