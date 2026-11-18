import { randomUUID } from "expo-crypto";
import { client } from "../lib/api";
import type { Vehicle } from "./maintenance";

/** Cars get a stable id the first time they are backed up, so edits update the same cloud row. */
export function withId(v: Vehicle): Vehicle {
  return v.id ? v : { ...v, id: randomUUID() };
}

export function vehicleTitle(v: Pick<Vehicle, "make" | "model" | "year">): string {
  return [v.make, v.model, v.year ?? ""].filter(Boolean).join(" ").trim();
}

export async function backupVehicle(v: Vehicle & { id: string }) {
  const { id, ...vehicle } = v;
  return client.backup.save({ id, title: vehicleTitle(v).slice(0, 160), vehicle });
}

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const numOrNull = (x: unknown) => (isNum(x) ? x : null);

/** Turns a cloud backup back into a Vehicle, refusing anything that is not one. */
export function toVehicle(id: string, data: Record<string, unknown>): Vehicle | null {
  const d = data as Partial<Vehicle>;
  if (typeof d.make !== "string" || typeof d.model !== "string" || !isNum(d.odometer)) return null;
  if (!d.cls || !d.oilType || !d.driving) return null;
  const last = (d.last ?? {}) as Partial<Vehicle["last"]>;
  return {
    ...(d as Vehicle),
    id,
    last: { oil: numOrNull(last.oil), brakes: numOrNull(last.brakes), tires: numOrNull(last.tires) },
    log: Array.isArray(d.log) ? d.log.filter((r) => r && isNum(r.km) && typeof r.date === "string") : [],
  };
}

/** True for the "user closed the sign-in window" results, which are not errors. */
export function isDismissed(code: string | undefined) {
  return code === "AUTH_SESSION_DISMISSED" || code === "POPUP_CLOSED";
}
