import type { Vehicle } from "./maintenance";
import { normalizePlate } from "./plate";
export type Car = Vehicle & { id: string };
export const carSignature = (user: string, c: Car) =>
  `${user}:${JSON.stringify(c)}`;
/** Preserve unsynced local edits; replace clean copies with the account's latest cloud data. */
export function reconcileCars(
  local: Car[],
  cloud: Car[],
  removed: string[],
  user: string,
  synced: Record<string, string>,
) {
  const skip = new Set(removed);
  const out = local.filter((c) => {
    if (skip.has(c.id)) return false;
    // A clean car missing from cloud was deleted on another device. Legacy/dirty copies survive.
    return (
      synced[c.id] !== carSignature(user, c) ||
      cloud.some(
        (r) =>
          r.id === c.id ||
          (!!c.plate &&
            normalizePlate(r.plate ?? "") === normalizePlate(c.plate ?? "")),
      )
    );
  });
  for (const c of cloud) {
    if (skip.has(c.id)) continue;
    const p = normalizePlate(c.plate ?? "");
    const i = out.findIndex(
      (v) => v.id === c.id || (!!p && normalizePlate(v.plate ?? "") === p),
    );
    if (i < 0) {
      out.push(c);
      synced[c.id] = carSignature(user, c);
    } else if (
      synced[out[i].id] === carSignature(user, out[i]) ||
      carSignature(user, out[i]) === carSignature(user, c)
    ) {
      out[i] = c;
      synced[c.id] = carSignature(user, c);
    }
  }
  return out;
}
