import type { EngineType } from "./egypt-models";
import {
  CLASS_INTERVALS,
  EGYPT_SEVERE_FACTOR,
  DEFAULT_KM_PER_DAY,
  type VehicleClass,
} from "./data";

export type OilType = "mineral" | "semi" | "synthetic";
export type Driving = "city" | "mixed" | "highway";
export type ItemKey = "oil" | "brakes" | "tires";
export type Level = "ok" | "soon" | "due" | "overdue" | "unknown" | "na";

export type Reading = { date: string; km: number };
export type Vehicle = {
  /** Stable id for cloud backup; added the first time a signed-in user saves the car. */
  id?: string;
  vin: string;
  make: string;
  model: string;
  engine?: string;
  /** Missing on vehicles saved before powertrain support; derived from engine/cls then. */
  engineType?: EngineType;
  /** Egyptian plate text as the user typed or confirmed it. Backed up only when the user is signed in. */
  plate?: string;
  year: number | null;
  cls: VehicleClass;
  oilType: OilType;
  viscosity?: string;
  /** km between oil changes the owner actually uses. Missing/null = app recommendation. */
  oilInterval?: number | null;
  driving: Driving;
  odometer: number;
  last: Record<ItemKey, number | null>;
  log: Reading[];
  services?: ServiceRecord[];
};

export type ServiceRecord = {
  item: ItemKey;
  /** YYYY-MM-DD; empty for older readings saved without a date. */
  date: string;
  km: number;
  note?: string;
};

export type ItemStatus = {
  level: Level;
  interval: number;
  used: number;
  remaining: number;
  pct: number;
  days: number;
};

export const OIL_TYPES: Record<OilType, number> = {
  mineral: 5000,
  semi: 7500,
  synthetic: 10000,
};

// Driving-condition multipliers. Cairo / Alexandria stop-and-go + heat + dust = "city".
export const DRIVING: Record<Driving, number> = {
  city: EGYPT_SEVERE_FACTOR,
  mixed: 0.95,
  highway: 1.0,
};

export const ITEMS: ItemKey[] = ["oil", "brakes", "tires"];

/** Quick picks for the owner's own oil-change interval (km). */
export const OIL_INTERVAL_CHOICES = [5000, 6000, 7500, 10000] as const;
export const OIL_INTERVAL_MIN = 1000;
export const OIL_INTERVAL_MAX = 30000;

export function validOilInterval(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isFinite(n) &&
    n >= OIL_INTERVAL_MIN &&
    n <= OIL_INTERVAL_MAX
  );
}

/** Parses km typed with Latin, Arabic-Indic or Persian digits. Separators ignored; decimals dropped. */
export function toNumber(
  text: string | number | null | undefined,
): number | null {
  if (text === null || text === undefined) return null;
  const latin = String(text)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/[,\s٬]/g, "");
  if (latin === "") return null;
  const n = Number(latin);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}

/** Average km/day from dated odometer readings; falls back to a default for new users. */
export function estimateKmPerDay(log: Reading[] | undefined): number {
  if (!Array.isArray(log) || log.length < 2) return DEFAULT_KM_PER_DAY;
  const sorted = [...log].sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = (+new Date(last.date) - +new Date(first.date)) / 86400000;
  const km = last.km - first.km;
  if (days < 7 || km <= 0) return DEFAULT_KM_PER_DAY;
  return Math.max(5, Math.round(km / days));
}

/** App-recommended oil interval (oil type x driving), ignoring the owner's own choice. */
export function recommendedOilInterval(
  v: Pick<Vehicle, "cls" | "oilType" | "driving">,
): number | null {
  return buildIntervals({ cls: v.cls, oilType: v.oilType, driving: v.driving })
    .oil;
}

export function buildIntervals(
  v: Pick<Vehicle, "cls" | "oilType" | "driving"> &
    Partial<Pick<Vehicle, "oilInterval">>,
): Record<ItemKey, number | null> {
  const base = CLASS_INTERVALS[v.cls] || CLASS_INTERVALS.economy;
  const factor = DRIVING[v.driving] ?? DRIVING.city;
  const round100 = (n: number) => Math.round(n / 100) * 100;
  const oilBase = v.cls === "ev" ? null : OIL_TYPES[v.oilType] || base.oil;
  // The owner's own interval is used exactly as chosen (no driving adjustment).
  const own =
    v.cls !== "ev" && validOilInterval(v.oilInterval) ? v.oilInterval : null;
  return {
    oil: own ?? (oilBase ? round100(oilBase * factor) : null),
    brakes: round100(base.brakes * factor),
    tires: round100(base.tires * factor),
  };
}

export function itemStatus(
  interval: number | null,
  current: number,
  last: number | null | undefined,
  kmPerDay: number,
): ItemStatus {
  if (!interval)
    return { level: "na", interval: 0, used: 0, remaining: 0, pct: 0, days: 0 };
  if (last === null || last === undefined) {
    return {
      level: "unknown",
      interval,
      used: 0,
      remaining: interval,
      pct: 0,
      days: 0,
    };
  }
  const used = Math.max(0, current - last);
  const remaining = interval - used;
  let level: Level = "ok";
  if (remaining <= 0) level = "overdue";
  else if (remaining <= Math.max(500, interval * 0.1)) level = "due";
  else if (remaining <= interval * 0.25) level = "soon";
  return {
    level,
    interval,
    used,
    remaining,
    pct: Math.min(1, used / interval),
    days: remaining > 0 ? Math.round(remaining / Math.max(1, kmPerDay)) : 0,
  };
}

export function computeAll(vehicle: Vehicle): {
  items: Record<ItemKey, ItemStatus>;
  kmPerDay: number;
} {
  const intervals = buildIntervals(vehicle);
  const kmPerDay = estimateKmPerDay(vehicle.log);
  const items = {} as Record<ItemKey, ItemStatus>;
  for (const key of ITEMS) {
    items[key] = itemStatus(
      intervals[key],
      vehicle.odometer,
      vehicle.last?.[key],
      kmPerDay,
    );
  }
  return { items, kmPerDay };
}

export const SERVICE_NOTE_MAX = 200;
export const SERVICE_DATE_MIN = "1980-01-01";

/** True for a real calendar date (YYYY-MM-DD) between 1980 and today. */
export function validServiceDate(date: string, now: string = today()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (
    d.getFullYear() !== Number(m[1]) ||
    d.getMonth() !== Number(m[2]) - 1 ||
    d.getDate() !== Number(m[3])
  )
    return false;
  return date >= SERVICE_DATE_MIN && date <= now;
}

/** Recorded services newest first (by date, then km); undated legacy readings follow. */
export function serviceHistory(v: Vehicle): ServiceRecord[] {
  const recorded = Array.isArray(v.services) ? v.services : [];
  const sorted = recorded
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      if (!!a.r.date !== !!b.r.date) return a.r.date ? -1 : 1;
      if (a.r.date !== b.r.date) return a.r.date < b.r.date ? 1 : -1;
      if (a.r.km !== b.r.km) return b.r.km - a.r.km;
      return b.i - a.i;
    })
    .map((x) => x.r);
  return [
    ...sorted,
    ...ITEMS.filter(
      (item) =>
        v.last[item] !== null &&
        !recorded.some((r) => r.item === item && r.km === v.last[item]),
    ).map((item) => ({ item, date: "", km: v.last[item]! })),
  ];
}

export type ServiceEntry = { date?: string; km?: number; note?: string };

/**
 * Records a completed service. Date defaults to today and km to the current odometer.
 * A backdated, lower-km entry is history only when a newer service already exists.
 */
export function recordService(
  v: Vehicle,
  item: ItemKey,
  entry: ServiceEntry = {},
): Vehicle {
  const date = entry.date ?? today();
  const km = entry.km ?? v.odometer;
  const note = entry.note?.trim().slice(0, SERVICE_NOTE_MAX);
  const recorded = [...(v.services ?? [])];
  const previous = v.last[item];
  if (
    previous !== null &&
    !recorded.some((r) => r.item === item && r.km === previous)
  ) {
    recorded.push({ item, date: "", km: previous });
  }
  recorded.push(note ? { item, date, km, note } : { item, date, km });
  const latest = previous === null || km >= previous ? km : previous;
  const isNow = date === today() && km === v.odometer;
  return {
    ...v,
    last: { ...v.last, [item]: latest },
    services: recorded,
    log: isNow ? [...v.log, { date, km }] : v.log,
  };
}

/** Local calendar date as YYYY-MM-DD (toISOString would shift to UTC and can be off by a day). */
export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
