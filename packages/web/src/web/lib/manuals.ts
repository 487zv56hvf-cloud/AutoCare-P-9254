import type { Vehicle } from "./carcare";

export type Manual = {
  file: string;
  note: string;
  noteAr: string;
  /** [English label, Arabic label, PDF page] */
  pages: [string, string, number][];
};

const MANUALS: { make: string; model: string; years: [number, number]; manual: Manual }[] = [
  {
    make: "honda", model: "accord", years: [2006, 2007],
    manual: {
      file: "/manuals/honda-accord-2006.pdf",
      note: "Honda uses the Maintenance Minder (oil-life % and A/B service codes) on the dash.",
      noteAr: "هوندا بتستخدم Maintenance Minder (نسبة عمر الزيت وأكواد الصيانة A/B) على التابلوه.",
      pages: [["Maintenance Minder", "منبه الصيانة", 194], ["Dash indicators", "لمبات التابلوه", 56], ["Tire pressure", "ضغط الكاوتش", 229], ["Specifications", "المواصفات", 264], ["Flat tire", "الكاوتش الفاضي", 238]],
    },
  },
  {
    make: "chevrolet", model: "cruze", years: [2016, 2016],
    manual: {
      file: "/manuals/chevrolet-cruze-2016.pdf",
      note: "GM's Engine Oil Life System tells you when to change oil; reset it after each change.",
      noteAr: "نظام عمر الزيت من GM بيقولك إمتى تغيّر الزيت؛ صفّره بعد كل تغيير.",
      pages: [["Oil Life System", "نظام عمر الزيت", 230], ["Warning lights", "لمبات التحذير", 94], ["Tire pressure", "ضغط الكاوتش", 122], ["Capacities & specs", "السعات والمواصفات", 321], ["Flat tire", "الكاوتش الفاضي", 276]],
    },
  },
];

export function manualFor(v: Pick<Vehicle, "make" | "model" | "year">): Manual | null {
  const make = v.make.trim().toLowerCase(), model = v.model.trim().toLowerCase();
  const hit = MANUALS.find(
    (m) => make === m.make && model.startsWith(m.model) &&
      (v.year == null || (v.year >= m.years[0] && v.year <= m.years[1])),
  );
  return hit?.manual ?? null;
}

// ---- Owner-sourced manual links (saved in the vehicle JSON; backup.save passes extra fields through) ----
export type ManualLink = { label: string; url: string; added: string };
export const LINK_MAX = 10;
export const LINK_LABEL_MAX = 60;
export const LINK_URL_MAX = 500;

/** Only http(s) links; javascript:, data:, file: etc. are refused. Bare domains get https://. */
export function cleanManualUrl(raw: string): string | null {
  const s = raw.trim();
  if (!s || s.length > LINK_URL_MAX) return null;
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  if (!/\.[a-z]{2,}$/i.test(u.hostname)) return null; // real domain; refuses bare IPs like "5" -> 0.0.0.5
  return u.toString();
}

/** Saved links; malformed entries (older/other clients, hand edits) are dropped, never crash. */
export function linksOf(v: Vehicle): ManualLink[] {
  const raw = (v as Vehicle & { manuals?: unknown }).manuals;
  if (!Array.isArray(raw)) return [];
  const out: ManualLink[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const rawUrl = (m as ManualLink).url;
    const url = typeof rawUrl === "string" ? cleanManualUrl(rawUrl) : null;
    if (!url || out.some((x) => x.url === url)) continue;
    const label = (m as ManualLink).label;
    const added = (m as ManualLink).added;
    out.push({
      url,
      label: typeof label === "string" ? label.slice(0, LINK_LABEL_MAX) : "",
      added: typeof added === "string" ? added : "",
    });
    if (out.length >= LINK_MAX) break;
  }
  return out;
}

export type AddLinkResult = { ok: true; car: Vehicle } | { ok: false; reason: "url" | "full" | "duplicate" };

export function addLink(v: Vehicle, label: string, url: string, date: string): AddLinkResult {
  const clean = cleanManualUrl(url);
  if (!clean) return { ok: false, reason: "url" };
  const list = linksOf(v);
  if (list.length >= LINK_MAX) return { ok: false, reason: "full" };
  if (list.some((m) => m.url === clean)) return { ok: false, reason: "duplicate" };
  const entry = { label: label.trim().slice(0, LINK_LABEL_MAX), url: clean, added: date };
  return { ok: true, car: { ...v, manuals: [...list, entry] } as Vehicle };
}

export function removeLink(v: Vehicle, url: string): Vehicle {
  return { ...v, manuals: linksOf(v).filter((m) => m.url !== url) } as Vehicle;
}

/** Search shortcuts to source the manual for this exact car. */
export function manualSearches(v: Pick<Vehicle, "make" | "model" | "year">) {
  const name = [v.year, v.make, v.model].filter(Boolean).join(" ");
  const q = (s: string) => `https://www.google.com/search?q=${encodeURIComponent(s)}`;
  return {
    official: q(`${name} owner's manual ${v.make} official site`),
    pdf: q(`${name} owner's manual filetype:pdf`),
    schedule: q(`${name} maintenance schedule`),
  };
}

export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
