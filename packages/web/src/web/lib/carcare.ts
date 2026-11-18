// Platform-independent business modules are shared with the phone app.
export {
  t,
  formatNumber,
  formatDate,
  type Lang,
} from "../../../../mobile/carcare/i18n";
export {
  computeAll,
  ITEMS,
  toNumber,
  today,
  recordService,
  serviceHistory,
  validServiceDate,
  SERVICE_NOTE_MAX,
  SERVICE_DATE_MIN,
  type ServiceEntry,
  validOilInterval,
  OIL_INTERVAL_MIN,
  OIL_INTERVAL_MAX,
  type Vehicle,
  type ItemKey,
  type Level,
} from "../../../../mobile/carcare/maintenance";
export {
  makesFor,
  modelsFor,
  enginesFor,
  engineTypeOf,
  matchMake,
  matchModel,
  matchEngine,
  typesFor,
  type EngineType,
} from "../../../../mobile/carcare/egypt-models";
export {
  classify,
  decodeVin,
  isPlausibleVin,
  vinFoundNote,
} from "../../../../mobile/carcare/vin";
export { normalizePlate } from "../../../../mobile/carcare/plate";
import type { Vehicle } from "../../../../mobile/carcare/maintenance";
export function vehicleTitle(v: Vehicle) {
  return [v.make, v.model, v.year].filter(Boolean).join(" ");
}
export function fromBackup(r: {
  id: string;
  vehicle: Record<string, unknown>;
}): Vehicle | null {
  const d = r.vehicle as Partial<Vehicle>;
  if (
    typeof d.make !== "string" ||
    typeof d.model !== "string" ||
    typeof d.odometer !== "number" ||
    !d.cls ||
    !d.oilType ||
    !d.driving
  )
    return null;
  return {
    ...d,
    id: r.id,
    last: {
      oil: d.last?.oil ?? null,
      brakes: d.last?.brakes ?? null,
      tires: d.last?.tires ?? null,
    },
    log: Array.isArray(d.log) ? d.log : [],
  } as Vehicle;
}
export {
  PRIVACY,
  PRIVACY_UPDATED,
} from "../../../../mobile/carcare/legal";
export {
  ODO_FREQUENCIES,
  odoFrequencyLabel,
  odometerDue,
  type OdoFrequency,
} from "../../../../mobile/carcare/odometer-reminders";
