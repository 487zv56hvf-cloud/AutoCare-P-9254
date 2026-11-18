// Calls to the outside VIN decoders (auto.dev worldwide, NHTSA vPIC) and merging their answers.
// No database or auth imports, so it can be unit-tested on its own.

export type VinLookup = {
  make: string;
  model: string;
  /** Model year when a decoder is sure of it. */
  year: number | null;
  /** Candidate model years when the VIN alone cannot tell (e.g. [2021, 1991]). */
  years: number[];
  /** Raw engine text, e.g. "1.8, 4 Cylinder Engine". */
  engine: string;
  litres: number | null;
  fuel: string;
  sources: ("autodev" | "vpic")[];
};

export type Part = Partial<Omit<VinLookup, "sources">>;

const TIMEOUT_MS = 8000;


async function getJson(url: string, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    // 207 = auto.dev partial answer (e.g. make + year only); still useful.
    if (res.status !== 200 && res.status !== 207) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** "1.8, 4 Cylinder Engine" / "5.3L V8" / "8VNAG6.2" -> litres. */
export function litresFromText(text: string): number | null {
  const m = text.match(/(\d{1,2}\.\d)\s*(?:L\b|l\b|,|\s|$)/) ?? text.match(/(\d\.\d)/);
  const n = m ? parseFloat(m[1]) : NaN;
  return Number.isFinite(n) && n >= 0.6 && n <= 8.5 ? n : null;
}

export async function fromAutoDev(vin: string): Promise<Part | null> {
  const key = process.env.AUTODEV_API_KEY;
  if (!key) return null;
  const j = await getJson(`https://api.auto.dev/vin/${vin}`, { Authorization: `Bearer ${key}` });
  if (!j) return null;
  const vehicle = (j.vehicle ?? {}) as Record<string, unknown>;
  const make = str(j.make) || str(vehicle.make);
  if (!make) return null;
  const engine = str(j.engine);
  const years = Array.isArray(j.years) ? j.years.map(num).filter((y): y is number => !!y) : [];
  return {
    make,
    model: str(j.model) || str(vehicle.model),
    year: num(j.year) ?? num(vehicle.year),
    years,
    engine,
    litres: engine ? litresFromText(engine) : null,
    fuel: /electric|\bev\b/i.test(engine) ? "Electric" : /hybrid/i.test(engine) ? "Hybrid" : /diesel/i.test(engine) ? "Diesel" : "",
  };
}

export async function fromVpic(vin: string): Promise<Part | null> {
  const j = await getJson(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`);
  const r = (Array.isArray(j?.Results) ? j.Results[0] : null) as Record<string, unknown> | null;
  if (!r || !str(r.Make)) return null;
  const litres = num(r.DisplacementL);
  return {
    make: str(r.Make),
    model: str(r.Model),
    year: num(r.ModelYear),
    years: [],
    engine: litres ? `${litres.toFixed(1)}L` : "",
    litres,
    fuel: str(r.FuelTypePrimary),
  };
}

/** Takes each field from the first decoder that knows it (auto.dev wins over vPIC). */
export function mergeLookups(a: Part | null, vp: Part | null): VinLookup {
  const first = (m?: string) => (m ?? "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").trim().split(/\s+/)[0] ?? "";
  // Never mix two different cars: vPIC fills gaps only when it names the same make.
  const b = a && vp && first(a.make) !== first(vp.make) ? null : vp;
  const pick = <K extends keyof Part>(k: K) => (a?.[k] || b?.[k] || undefined) as Part[K];
  return {
    make: pick("make") ?? "",
    model: pick("model") ?? "",
    // When auto.dev lists candidate years it is unsure; vPIC's US cycle rule (position 7)
    // then picks the wrong decade for non-US cars (a 2023 Sportage read as 1993), so skip it.
    year: a?.year ?? (a?.years?.length ? null : (b?.year ?? null)),
    years: a?.years?.length ? a.years : (b?.years ?? []),
    engine: pick("engine") ?? "",
    litres: pick("litres") ?? null,
    fuel: pick("fuel") ?? "",
    sources: [...(a ? (["autodev"] as const) : []), ...(b ? (["vpic"] as const) : [])],
  };
}
