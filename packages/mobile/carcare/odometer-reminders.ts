// "Update your odometer" reminders. Pure logic shared by the phone app (local notifications)
// and the website (in-page banner). Counting restarts from each car's latest dated reading,
// so updating the odometer (even with the same number) pushes the next reminder out.
import type { Vehicle } from './maintenance';
import { t, formatNumber, type Lang } from './i18n';

export type OdoFrequency = 'off' | 'monthly' | 'biweekly' | 'weekly' | 'twice';
export const ODO_FREQUENCIES: OdoFrequency[] = ['off', 'monthly', 'biweekly', 'weekly', 'twice'];
export const DEFAULT_ODO_FREQUENCY: OdoFrequency = 'biweekly';
/** Days between reminders. Twice a week alternates 4 and 3 days (rounded 3.5). */
const DAYS: Record<Exclude<OdoFrequency, 'off'>, number> = { monthly: 30, biweekly: 14, weekly: 7, twice: 3.5 };
const LABEL: Record<OdoFrequency, string> = {
  off: 'odoFreqOff', monthly: 'odoFreqMonthly', biweekly: 'odoFreqBiweekly', weekly: 'odoFreqWeekly', twice: 'odoFreqTwice',
};
/** How many future alerts to keep scheduled per car; they are rebuilt every time the app opens. */
const AHEAD: Record<Exclude<OdoFrequency, 'off'>, number> = { monthly: 3, biweekly: 4, weekly: 6, twice: 8 };

export function isOdoFrequency(v: unknown): v is OdoFrequency {
  return typeof v === 'string' && (ODO_FREQUENCIES as string[]).includes(v);
}
export function odoFrequencyLabel(lang: Lang, f: OdoFrequency) {
  return t(lang, LABEL[f]);
}

function parseDay(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '');
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(+d) ? d : null;
}
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysBetween = (a: Date, b: Date) => Math.round((+startOfDay(b) - +startOfDay(a)) / 86400000);

/** Latest dated odometer reading (local midnight), or null when the car has none. */
export function lastReadingDay(car: Pick<Vehicle, 'log'>): Date | null {
  let best: Date | null = null;
  for (const r of car.log ?? []) {
    const d = parseDay(r?.date);
    if (d && (!best || +d > +best)) best = d;
  }
  return best;
}

/** Day offset of the k-th reminder after the last reading (k = 1, 2, ...). */
const offset = (days: number, k: number) => Math.round(k * days);

export type OdoReminder = { id: string; carId: string; date: Date; title: string; body: string };

export function odometerPlan(cars: Vehicle[], lang: Lang, freq: OdoFrequency, now = new Date()): OdoReminder[] {
  if (freq === 'off') return [];
  const days = DAYS[freq];
  const out: OdoReminder[] = [];
  for (const car of cars) {
    if (!car.id) continue;
    const anchor = lastReadingDay(car);
    if (!anchor) continue;
    const name = [car.make, car.model, car.plate].filter(Boolean).join(' · ') || t(lang, 'appName');
    const elapsed = Math.max(0, daysBetween(anchor, now));
    let k = Math.max(1, Math.floor(elapsed / days));
    let added = 0;
    for (let guard = 0; added < AHEAD[freq] && guard < 400; guard++, k++) {
      const date = new Date(anchor);
      date.setDate(date.getDate() + offset(days, k));
      date.setHours(9, 0, 0, 0);
      if (+date <= +now) continue;
      const since = daysBetween(anchor, date);
      out.push({
        id: `autocare:odo:${car.id}:${dayKey(anchor)}:${freq}:${dayKey(date)}`,
        carId: car.id,
        date,
        title: `${t(lang, 'appName')} · ${t(lang, 'updateOdo')}`,
        body: t(lang, 'odoReminderBody', { car: name, n: formatNumber(lang, since) }),
      });
      added++;
    }
  }
  return out.sort((a, b) => +a.date - +b.date);
}

/**
 * For the website banner: the car is due for an odometer update once the first reminder
 * day after its last reading has arrived. `key` changes with every new reminder day, so
 * "Later" hides the banner only until the next one.
 */
export function odometerDue(car: Vehicle, freq: OdoFrequency, now = new Date()): { days: number; key: string } | null {
  if (freq === 'off' || !car.id) return null;
  const anchor = lastReadingDay(car);
  if (!anchor) return null;
  const elapsed = daysBetween(anchor, now);
  const per = DAYS[freq];
  if (elapsed < offset(per, 1)) return null;
  let k = 1;
  while (offset(per, k + 1) <= elapsed) k++;
  return { days: elapsed, key: `${car.id}:${dayKey(anchor)}:${freq}:${k}` };
}
