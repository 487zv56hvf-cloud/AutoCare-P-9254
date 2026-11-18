import { MAKE_CLASS, MAKE_DISPLAY, type VehicleClass } from "./data";
import { t, type Lang } from "./i18n";

// Best-effort World Manufacturer Identifier (first 3 VIN characters) lookup, tuned for
// cars sold in Egypt (Korean, Japanese, Chinese, European and Turkish/Indian/Thai-built).
// Used offline and when the online decoders do not name the make.
const WMI: Record<string, string> = {
  // Toyota / Lexus (Japan, Turkey, Thailand, Indonesia, South Africa, UK, France, USA)
  JTD: "Toyota", JTE: "Toyota", JTM: "Toyota", JTN: "Toyota", JTF: "Toyota", JT3: "Toyota", JTK: "Toyota",
  NMT: "Toyota", MR0: "Toyota", MR1: "Toyota", MR2: "Toyota", MHF: "Toyota", AHT: "Toyota", SB1: "Toyota",
  VNK: "Toyota", "2T1": "Toyota", "4T1": "Toyota", "5YF": "Toyota",
  JTH: "Lexus", JTJ: "Lexus", "2T2": "Lexus",
  // Hyundai / Kia (Korea, Czechia, Slovakia, Turkey, India, Russia, USA)
  KMH: "Hyundai", KM8: "Hyundai", KMF: "Hyundai", TMA: "Hyundai", NLH: "Hyundai", MAL: "Hyundai", Z94: "Hyundai", "5NP": "Hyundai",
  KNA: "Kia", KND: "Kia", KNM: "Renault", KNE: "Kia", U5Y: "Kia", U6Y: "Kia", MZB: "Kia", "5XY": "Kia",
  // Nissan (Japan, India, Thailand, Spain, UK, Mexico)
  JN1: "Nissan", JN8: "Nissan", JN6: "Nissan", MDH: "Nissan", MNT: "Nissan", VSK: "Nissan", SJN: "Nissan", "3N1": "Nissan", "5N1": "Nissan",
  // GM / Daewoo (Korea, Uzbekistan, USA, Brazil)
  KL1: "Chevrolet", KL4: "Chevrolet", KL8: "Chevrolet", XWB: "Chevrolet", "1G1": "Chevrolet", "3G1": "Chevrolet", "9BG": "Chevrolet",
  KLA: "Daewoo", KLY: "Daewoo",
  // Suzuki (Japan, India, Hungary)
  JS1: "Suzuki", JS2: "Suzuki", JS3: "Suzuki", JSA: "Suzuki", MA3: "Suzuki", MBH: "Suzuki", TSM: "Suzuki",
  // Chinese makes
  LVV: "Chery", LNN: "Chery", LVT: "Chery",
  LSJ: "MG", SDP: "MG",
  L6T: "Geely", LB3: "Geely", LB2: "Geely",
  LC0: "BYD", LGX: "BYD",
  LGW: "Haval",
  LS5: "Changan", LS4: "Changan",
  LNB: "BAIC",
  LVZ: "DFSK",
  // Renault group (France, Romania, Russia, India, Morocco)
  VF1: "Renault", VF6: "Renault", X7L: "Renault", MEE: "Renault", VF8: "Renault",
  UU1: "Dacia", UU6: "Dacia",
  // Stellantis / PSA, Fiat, Opel, Jeep
  VF3: "Peugeot", VR3: "Peugeot", VF7: "Citroen", VR7: "Citroen", VR1: "DS",
  ZFA: "Fiat", ZFC: "Fiat", NM4: "Fiat", "3C3": "Fiat",
  W0L: "Opel", W0V: "Opel",
  ZAC: "Jeep", "1C4": "Jeep", "1J4": "Jeep",
  // Volkswagen group
  WVW: "Volkswagen", WVG: "Volkswagen", WV1: "Volkswagen", WV2: "Volkswagen", "3VW": "Volkswagen", AAV: "Volkswagen",
  TMB: "Skoda", TMP: "Skoda",
  VSS: "Seat",
  WAU: "Audi", WA1: "Audi", TRU: "Audi",
  WP0: "Porsche", WP1: "Porsche",
  // Japanese
  JMB: "Mitsubishi", JMY: "Mitsubishi", JA3: "Mitsubishi", JA4: "Mitsubishi", MMB: "Mitsubishi", MMT: "Mitsubishi",
  JHM: "Honda", MRH: "Honda", SHH: "Honda", "1HG": "Honda", "2HG": "Honda",
  JM1: "Mazda", JM3: "Mazda", JMZ: "Mazda",
  JF1: "Subaru", JF2: "Subaru",
  // German / British / Swedish premium
  WBA: "BMW", WBS: "BMW", WBY: "BMW", WBX: "BMW", "5UX": "BMW",
  WMW: "Mini",
  WDB: "Mercedes-Benz", WDC: "Mercedes-Benz", WDD: "Mercedes-Benz", WDF: "Mercedes-Benz", W1K: "Mercedes-Benz", W1N: "Mercedes-Benz", W1V: "Mercedes-Benz",
  SAL: "Land Rover",
  YV1: "Volvo", YV4: "Volvo", LYV: "Volvo",
  // Others
  "1FA": "Ford", "1FT": "Ford", WF0: "Ford", MAJ: "Ford",
  XTA: "Lada", XTT: "Lada",
  PL1: "Proton",
};

// Renault and Dacia (and some other European makers) do not put the model year in
// position 10, so decoders "guess" a wrong year (a 2017 Duster reads as 2005).
const NO_YEAR_WMI = new Set(["VF1", "VF6", "VF8", "UU1", "UU6", "X7L"]);

type ModelRule = { wmi: string[]; at: number; code: string[]; model: string };

// Hand-checked model codes inside the VIN for popular Egypt-market cars that the global
// decoders often miss or get wrong. "at" is the 0-based position of the code.
const MODEL_RULES: ModelRule[] = [
  // Volkswagen group: positions 7-8 are the platform code.
  { wmi: ["TMB"], at: 6, code: ["1Z", "5E", "NX"], model: "Octavia" },
  { wmi: ["TMB"], at: 6, code: ["NJ", "PJ"], model: "Fabia" },
  { wmi: ["TMB"], at: 6, code: ["NH"], model: "Rapid" },
  { wmi: ["TMB"], at: 6, code: ["3T", "3V"], model: "Superb" },
  { wmi: ["TMB"], at: 6, code: ["NS"], model: "Kodiaq" },
  { wmi: ["TMB"], at: 6, code: ["NU"], model: "Karoq" },
  { wmi: ["WVW", "WVG", "AAV"], at: 6, code: ["5K", "AU", "CD"], model: "Golf" },
  { wmi: ["WVW", "AAV"], at: 6, code: ["6R", "AW"], model: "Polo" },
  { wmi: ["WVW"], at: 6, code: ["16"], model: "Jetta" },
  { wmi: ["WVW"], at: 6, code: ["3C", "3G"], model: "Passat" },
  { wmi: ["WVG"], at: 6, code: ["5N", "AD", "AX"], model: "Tiguan" },
  { wmi: ["WVG"], at: 6, code: ["A1"], model: "T-Roc" },
  { wmi: ["WVG"], at: 6, code: ["C1"], model: "T-Cross" },
  { wmi: ["WVG"], at: 6, code: ["7P", "CR"], model: "Touareg" },
  { wmi: ["VSS"], at: 6, code: ["6J"], model: "Ibiza" },
  { wmi: ["VSS"], at: 6, code: ["1P", "5F", "KL"], model: "Leon" },
  { wmi: ["WAU"], at: 6, code: ["8P", "8V", "8Y"], model: "A3" },
  { wmi: ["WAU"], at: 6, code: ["8K", "8W"], model: "A4" },
  { wmi: ["WAU"], at: 6, code: ["4F", "4A"], model: "A6" },
  { wmi: ["WAU", "TRU"], at: 6, code: ["GA"], model: "Q2" },
  { wmi: ["WAU", "WA1"], at: 6, code: ["8U", "F3"], model: "Q3" },
  { wmi: ["WAU", "WA1"], at: 6, code: ["8R", "FY"], model: "Q5" },
  { wmi: ["WAU", "WA1"], at: 6, code: ["4L", "4M"], model: "Q7" },
  // Hyundai / Kia: position 4 is the model line.
  { wmi: ["KMH", "KM8", "TMA", "NLH"], at: 3, code: ["J"], model: "Tucson" },
  { wmi: ["KMH", "TMA", "NLH", "Z94"], at: 3, code: ["C"], model: "Accent" },
  { wmi: ["KMH", "KM8"], at: 3, code: ["S"], model: "Santa Fe" },
  { wmi: ["KNA", "U5Y", "U6Y"], at: 3, code: ["P"], model: "Sportage" },
  { wmi: ["KNA", "U5Y"], at: 3, code: ["F"], model: "Cerato" },
  { wmi: ["KNA"], at: 3, code: ["B"], model: "Picanto" },
  { wmi: ["KNA"], at: 3, code: ["G"], model: "Optima" },
  // Chevrolet (GM Korea): position 4.
  { wmi: ["KL1"], at: 3, code: ["J"], model: "Cruze" },
  { wmi: ["KL1"], at: 3, code: ["T"], model: "Aveo" },
  // Toyota Turkey: position 4 "B" = Corolla; positions 7-8 "BX" = C-HR.
  { wmi: ["NMT"], at: 3, code: ["B"], model: "Corolla" },
  { wmi: ["NMT"], at: 6, code: ["BX"], model: "C-HR" },
  // Dacia / Renault Romania: position 4.
  { wmi: ["UU1"], at: 3, code: ["L"], model: "Logan" },
  { wmi: ["UU1"], at: 3, code: ["H"], model: "Duster" },
  { wmi: ["UU1"], at: 3, code: ["B"], model: "Sandero" },
  // Mitsubishi Japan: chassis codes CS/CY/CZ at positions 6-7.
  { wmi: ["JMB", "JMY"], at: 5, code: ["CS", "CY", "CZ"], model: "Lancer" },
];

/** Make named by the VIN's manufacturer code, if known. */
export function makeFromVin(vin: string): string | null {
  return WMI[vin.slice(0, 3)] || null;
}

/** Model from the hand-checked VIN codes above, or null. */
export function modelFromVin(vin: string): string | null {
  const wmi = vin.slice(0, 3);
  const rule = MODEL_RULES.find((r) => r.wmi.includes(wmi) && r.code.some((c) => vin.startsWith(c, r.at)));
  return rule?.model ?? null;
}

/** False for makers whose VINs do not carry the model year. */
export function vinHasYear(vin: string): boolean {
  return !NO_YEAR_WMI.has(vin.slice(0, 3));
}

/**
 * Cleans decoder make names: "Chery, Karry, Riich…" -> "Chery",
 * "Hyundai - Passenger Cars" -> "Hyundai", and Dacia -> Renault (Egypt sells Logan,
 * Duster and Sandero as Renault).
 */
export function canonicalMake(raw: string): string {
  const base = String(raw || "").split(",")[0].split(" - ")[0].trim();
  if (/^dacia$/i.test(base)) return "Renault";
  if (/^mercedes/i.test(base)) return "Mercedes-Benz";
  return base;
}

// Model-year character (10th position). Cycles every 30 years.
const YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";
const VIN_RE = /[A-HJ-NPR-Z0-9]{17}/; // VINs never contain I, O or Q

/** Finds a 17-character VIN inside raw barcode / text data. Returns null if none. */
export function extractVin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const direct = cleaned.match(VIN_RE);
  if (direct) return direct[0];
  // Misreads of 0 as O/Q and 1 as I are certain errors (a real VIN never has those letters).
  const corrected = cleaned.replace(/[OQ]/g, "0").replace(/I/g, "1");
  const fixed = corrected.match(VIN_RE);
  return fixed ? fixed[0] : null;
}

export function isPlausibleVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

export function modelYearFromVin(vin: string, nowYear = new Date().getFullYear()): number | null {
  if (vin.length !== 17) return null;
  const i = YEAR_CODES.indexOf(vin[9]);
  if (i < 0) return null;
  const valid = [1980 + i, 2010 + i].filter((y) => y <= nowYear + 1);
  return valid.length ? Math.max(...valid) : null;
}

/** fuel may be an NHTSA fuel type or a catalog engine label ("Electric", "1.5T", "2.0 Plug-in Hybrid"). */
export function classify(make: string, fuel: string): VehicleClass {
  if (fuel && /electric/i.test(fuel) && !/gas|diesel|hybrid/i.test(fuel)) return "ev";
  return MAKE_CLASS[String(make || "").toUpperCase()] || "economy";
}

export function displayMake(make: string): string {
  const upper = make.toUpperCase();
  const known = MAKE_DISPLAY.find((m) => m.toUpperCase() === upper);
  if (known) return known;
  return make
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** What the server's global VIN lookup (oRPC vin.decode) returns. */
export type RemoteVin = {
  make: string;
  model: string;
  year: number | null;
  years: number[];
  engine: string;
  litres: number | null;
  fuel: string;
};

/** Direct call to the free US vPIC service; only used when the app cannot reach our server. */
async function decodeVpic(vin: string): Promise<RemoteVin | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`, {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const r = json?.Results?.[0];
    if (!r || !r.Make) return null;
    const year = r.ModelYear ? parseInt(r.ModelYear, 10) : NaN;
    const litres = r.DisplacementL ? parseFloat(r.DisplacementL) : NaN;
    const ok = Number.isFinite(litres) && litres > 0;
    return {
      make: r.Make,
      model: r.Model || "",
      year: Number.isFinite(year) ? year : null,
      years: [],
      engine: ok ? `${litres.toFixed(1)}L` : "",
      fuel: r.FuelTypePrimary || "",
      litres: ok ? litres : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export type Decoded = {
  make: string;
  model: string;
  year: number | null;
  litres: number | null;
  /** Raw engine text from the decoder, e.g. "1.8, 4 Cylinder Engine" ("" if unknown). */
  engine: string;
  cls: VehicleClass;
  source: "online" | "offline" | "none";
};

/** Latest candidate year that is not in the future. */
function pickYear(years: number[], nowYear = new Date().getFullYear()): number | null {
  const ok = years.filter((y) => y >= 1980 && y <= nowYear + 1);
  return ok.length ? Math.max(...ok) : null;
}

/**
 * Reads year, make, model and engine from a VIN.
 * 1. `remote` (our server: auto.dev worldwide decoder + NHTSA vPIC). Falls back to calling
 *    vPIC directly if the server cannot be reached.
 * 2. Hand-checked VIN model codes for popular Egypt-market cars (override wrong guesses).
 * 3. Offline manufacturer table + model-year letter.
 * Anything not found stays empty so the user picks it from the Egypt lists.
 */
export async function decodeVin(vin: string, remote?: (vin: string) => Promise<RemoteVin | null>): Promise<Decoded> {
  let online: RemoteVin | null = null;
  if (remote) {
    try {
      online = await remote(vin);
    } catch {
      online = await decodeVpic(vin);
    }
  } else {
    online = await decodeVpic(vin);
  }
  if (online && !online.make) online = null;
  const offlineMake = makeFromVin(vin);
  const make = canonicalMake(online?.make || offlineMake || "");
  const fuel = online?.fuel || "";
  const year = vinHasYear(vin)
    ? online?.year || pickYear(online?.years ?? []) || modelYearFromVin(vin)
    : null;
  return {
    make: make ? displayMake(make) : "",
    model: modelFromVin(vin) || online?.model || "",
    year,
    litres: online?.litres ?? null,
    engine: online?.engine || "",
    cls: classify(make, fuel),
    source: online ? "online" : offlineMake ? "offline" : "none",
  };
}

export type VinFound = { year: boolean; make: boolean; model: boolean; engine: boolean };

/** "Found from the VIN: year, make and model. Please choose the engine from the list." */
export function vinFoundNote(lang: Lang, f: VinFound): string {
  const keys = ["year", "make", "model", "engine"] as const;
  const list = (ks: readonly string[]) => {
    const words = ks.map((k) => t(lang, k).toLowerCase());
    return words.length > 1 ? words.slice(0, -1).join(t(lang, "vinListSep")) + t(lang, "vinAnd") + words[words.length - 1] : words[0];
  };
  const found = keys.filter((k) => f[k]);
  const missing = keys.filter((k) => !f[k] && k !== "year");
  if (!found.length) return t(lang, "vinFoundNone");
  if (!missing.length) return t(lang, "vinFoundAll", { found: list(found) });
  return t(lang, "vinFoundSome", { found: list(found), missing: list(missing) });
}
