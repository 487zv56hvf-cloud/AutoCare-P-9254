import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reminderPlan } from './reminder-plan';
import { odometerPlan, isOdoFrequency, DEFAULT_ODO_FREQUENCY, type OdoFrequency } from './odometer-reminders';
import { t, type Lang } from './i18n';
import type { Vehicle } from './maintenance';

const PREF = 'autocare.reminders.enabled.v1';
const SEEN = 'autocare.reminders.overdue.v1';
const ODO = 'autocare.reminders.odometer.v1';
const MAX_SCHEDULED = 60; // iOS keeps at most 64 pending local notifications per app.
export const supportsReminders = Platform.OS !== 'web';
let loaded: Promise<typeof import('expo-notifications')> | undefined;
async function api() {
  if (!supportsReminders) throw new Error('Phone only');
  loaded ??= import('expo-notifications').then(n => {
    n.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});
    return n;
  });
  return loaded;
}
export async function loadReminderPreference() { return await AsyncStorage.getItem(PREF) === 'true'; }
export async function saveReminderPreference(on: boolean) { await AsyncStorage.setItem(PREF, String(on)); }
export async function loadOdoFrequency(): Promise<OdoFrequency> {
  const v = await AsyncStorage.getItem(ODO).catch(() => null);
  return isOdoFrequency(v) ? v : DEFAULT_ODO_FREQUENCY;
}
export async function saveOdoFrequency(f: OdoFrequency) { await AsyncStorage.setItem(ODO, f); }
function granted(p: Awaited<ReturnType<typeof import('expo-notifications')['getPermissionsAsync']>>) {
  return p.granted || p.ios?.status === 3; // iOS provisional permission
}
export async function enableReminderPermission(): Promise<boolean> {
  const n = await api();
  if (Platform.OS === 'android') await n.setNotificationChannelAsync('service-reminders',{name:'Service reminders',importance:n.AndroidImportance.DEFAULT,sound:'default'});
  let p = await n.getPermissionsAsync();
  if (!granted(p)) p = await n.requestPermissionsAsync();
  return granted(p);
}
let queue: Promise<unknown> = Promise.resolve();
/** Serialized to keep rapid edits/sign-out from leaving another car's notifications behind. */
export function syncReminders(cars: Vehicle[], lang: Lang, enabled: boolean, odo: OdoFrequency = 'off'): Promise<'on'|'off'|'denied'> {
  const work = queue.catch(()=>undefined).then(async () => {
    if (!supportsReminders) return 'off' as const;
    const n = await api();
    const pending = (await n.getAllScheduledNotificationsAsync()).filter(r=>r.identifier.startsWith('autocare:'));
    const permission = enabled && granted(await n.getPermissionsAsync());
    if (!permission) {
      for (const r of pending) await n.cancelScheduledNotificationAsync(r.identifier);
      return enabled ? 'denied' as const : 'off' as const;
    }
    const seen = new Set<string>(JSON.parse(await AsyncStorage.getItem(SEEN) ?? '[]'));
    const existing = new Map(pending.map(r=>[r.identifier,r]));
    const service = reminderPlan(cars,lang).filter(p=>!p.overdue || !seen.has(p.id) || existing.has(p.id));
    // Service alerts come first; odometer nudges fill the remaining slots (always at least a few).
    const odoPlans = odometerPlan(cars,lang,odo).map(p=>({...p,overdue:false}));
    const odoSlots = Math.min(odoPlans.length, Math.max(8, MAX_SCHEDULED - service.length));
    const plans = [...service.slice(0, MAX_SCHEDULED - odoSlots), ...odoPlans.slice(0, odoSlots)];
    const wanted = new Set(plans.map(p=>p.id));
    for (const r of pending) if (!wanted.has(r.identifier)) await n.cancelScheduledNotificationAsync(r.identifier);
    for (const p of plans) {
      const prev = existing.get(p.id);
      // Preserve a pending overdue alert's original time (never postpone on reopening).
      const sig = JSON.stringify([p.title,p.body,p.overdue ? 'overdue' : +p.date]);
      if (prev?.content.data?.signature === sig) continue;
      if (prev) await n.cancelScheduledNotificationAsync(p.id);
      await n.scheduleNotificationAsync({identifier:p.id,content:{title:p.title,body:p.body,sound:'default',data:{carId:p.carId,signature:sig}},
        trigger:{type:n.SchedulableTriggerInputTypes.DATE,date:p.date,channelId:'service-reminders'}});
      if (p.overdue) { seen.add(p.id); await AsyncStorage.setItem(SEEN,JSON.stringify([...seen])); }
    }
    return 'on' as const;
  });
  queue = work;
  return work;
}
export async function testReminder(lang: Lang) {
  const n = await api();
  if (!await enableReminderPermission()) return false;
  await n.scheduleNotificationAsync({identifier:'autocare-test',content:{title:t(lang,'appName'),body:t(lang,'reminderTestBody'),sound:'default'},
    trigger:{type:n.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:10,channelId:'service-reminders'}});
  return true;
}
