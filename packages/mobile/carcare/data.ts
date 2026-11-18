export type VehicleClass = "economy" | "mainstream" | "premium" | "ev";

// Make -> service class. Covers brands common in the Egyptian market.
export const MAKE_CLASS: Record<string, VehicleClass> = {
  TOYOTA: "mainstream", HONDA: "mainstream", MITSUBISHI: "mainstream", SKODA: "mainstream",
  VOLKSWAGEN: "mainstream", PEUGEOT: "mainstream", OPEL: "mainstream", FORD: "mainstream",
  MAZDA: "mainstream", SEAT: "mainstream", CITROEN: "mainstream", SUBARU: "mainstream",
  HYUNDAI: "economy", KIA: "economy", NISSAN: "economy", CHEVROLET: "economy", SUZUKI: "economy",
  CHERY: "economy", MG: "economy", RENAULT: "economy", FIAT: "economy", GEELY: "economy",
  BYD: "economy", JETOUR: "economy", LADA: "economy", DACIA: "economy", DFSK: "economy",
  BAIC: "economy", HAVAL: "economy", CHANGAN: "economy", DAEWOO: "economy", PROTON: "economy",
  DS: "premium", BMW: "premium", MERCEDES: "premium", "MERCEDES-BENZ": "premium", AUDI: "premium",
  VOLVO: "premium", LEXUS: "premium", PORSCHE: "premium", "LAND ROVER": "premium",
  JAGUAR: "premium", INFINITI: "premium", MINI: "premium",
  JEEP: "mainstream", SPERANZA: "economy",
};

// Proper display names so "BMW" is not shown as "Bmw" or "Mercedes-benz".
export const MAKE_DISPLAY = [
  "Toyota", "Hyundai", "Kia", "Nissan", "Chevrolet", "Suzuki", "Chery", "MG", "Renault",
  "Skoda", "Peugeot", "Fiat", "Mitsubishi", "Honda", "Opel", "Geely", "BYD", "Jetour",
  "Volkswagen", "Ford", "Mazda", "BMW", "Mercedes-Benz", "Audi", "Volvo", "Lexus", "Lada",
  "Citroen", "Seat", "Subaru", "Dacia", "Proton", "Haval", "Changan", "BAIC", "DFSK",
  "DS", "Daewoo", "Porsche", "Land Rover", "Jaguar", "Infiniti", "Mini",
];

// Baseline intervals in km (manufacturer-typical, normal driving).
export const CLASS_INTERVALS: Record<VehicleClass, { oil: number | null; brakes: number; tires: number }> = {
  economy: { oil: 5000, brakes: 40000, tires: 50000 },
  mainstream: { oil: 7500, brakes: 45000, tires: 55000 },
  premium: { oil: 8000, brakes: 40000, tires: 50000 },
  ev: { oil: null, brakes: 70000, tires: 40000 },
};

// Egypt: heat, dust and stop-and-go traffic count as "severe service".
export const EGYPT_SEVERE_FACTOR = 0.85;

// Used when the user has fewer than two odometer readings a week apart.
export const DEFAULT_KM_PER_DAY = 30;
