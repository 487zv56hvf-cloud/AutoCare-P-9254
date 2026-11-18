import { buildIntervals, estimateKmPerDay, ITEMS, type Vehicle } from './maintenance';
import { t, formatNumber, type Lang } from './i18n';

export type Reminder = { id: string; carId: string; date: Date; title: string; body: string; overdue: boolean };
function localDay(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y,m,d] = s.split('-').map(Number);
  const date = new Date(y,m-1,d,9);
  return Number.isFinite(+date) ? date : null;
}
function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
/** Anchors predictions to the latest known reading. Opening the app cannot postpone a due date. */
export function reminderPlan(cars: Vehicle[], lang: Lang, now = new Date()): Reminder[] {
  const out: Reminder[] = [];
  for (const car of cars) {
    if (!car.id) continue;
    const readings = (car.log ?? []).filter(r => Number.isFinite(r.km) && r.km === car.odometer && localDay(r.date))
      .sort((a,b) => b.date.localeCompare(a.date));
    // Without a dated reading, we cannot safely predict a calendar date.
    const anchor = readings[0] ? localDay(readings[0].date) : null;
    if (!anchor) continue;
    const pace = estimateKmPerDay(car.log);
    const intervals = buildIntervals(car);
    const name = [car.make,car.model,car.plate].filter(Boolean).join(' · ') || t(lang,'appName');
    for (const item of ITEMS) {
      const interval = intervals[item], last = car.last?.[item];
      if (!interval || last == null || !Number.isFinite(last)) continue;
      const remaining = interval - Math.max(0, car.odometer-last);
      const due = new Date(anchor);
      due.setDate(due.getDate()+Math.ceil(Math.max(0,remaining)/Math.max(1,pace)));
      const base = `autocare:${car.id}:${item}:${last}:${interval}`;
      const title = `${t(lang,'appName')} · ${t(lang,item)}`;
      if (+due <= +now) {
        const date = new Date(now); date.setHours(9,0,0,0);
        if (+date <= +now) date.setDate(date.getDate()+1);
        out.push({id:`${base}:overdue`,carId:car.id,date,title,body:t(lang,'reminderDueBody',{car:name,item:t(lang,item)}),overdue:true});
        continue;
      }
      for (const before of [14,3,0]) {
        const date = new Date(due); date.setDate(date.getDate()-before);
        if (+date <= +now) continue; // Do not send missed advance alerts late.
        out.push({id:`${base}:${dayKey(due)}:${before}`,carId:car.id,date,title,
          body:t(lang,before ? 'reminderBeforeBody':'reminderDueBody',{car:name,item:t(lang,item),n:formatNumber(lang,before)}),overdue:false});
      }
    }
  }
  return out.sort((a,b) => +a.date-+b.date);
}
