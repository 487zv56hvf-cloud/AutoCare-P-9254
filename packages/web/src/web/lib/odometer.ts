// Website odometer-reminder preference (per browser) and "Later" dismissals.
import { useSyncExternalStore } from "react";
import {
  DEFAULT_ODO_FREQUENCY,
  isOdoFrequency,
  type OdoFrequency,
} from "../../../../mobile/carcare/odometer-reminders";

const FREQ_KEY = "autocare.web.odoFreq.v1";
const LATER_KEY = "autocare.web.odoLater.v1";
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the choice lasts for this visit only.
  }
}

let freqCache: OdoFrequency | null = null;
function getFreq(): OdoFrequency {
  if (freqCache) return freqCache;
  const v = read(FREQ_KEY);
  freqCache = isOdoFrequency(v) ? v : DEFAULT_ODO_FREQUENCY;
  return freqCache;
}
export function setOdoFrequency(f: OdoFrequency) {
  freqCache = f;
  write(FREQ_KEY, f);
  notify();
}
export function useOdoFrequency(): OdoFrequency {
  return useSyncExternalStore(subscribe, getFreq, () => DEFAULT_ODO_FREQUENCY);
}

let laterCache: string | null = null;
function getLater(): string {
  laterCache ??= read(LATER_KEY) ?? "[]";
  return laterCache;
}
export function useOdoLater(): Set<string> {
  const raw = useSyncExternalStore(subscribe, getLater, () => "[]");
  try {
    return new Set<string>(JSON.parse(raw));
  } catch {
    return new Set();
  }
}
export function dismissOdo(key: string) {
  let list: string[] = [];
  try {
    list = JSON.parse(getLater());
  } catch {
    list = [];
  }
  // Keys change with each reminder day, so only the newest few matter.
  laterCache = JSON.stringify([...list.filter((k) => k !== key), key].slice(-50));
  write(LATER_KEY, laterCache);
  notify();
}
