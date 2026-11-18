/**
 * Makes, models and engines sold in Egypt (current line-ups plus the common used-market
 * models still on Egyptian roads). Engine labels are displacement + type as marketed locally:
 * "T" = turbo petrol, "Diesel", "Hybrid", "Electric".
 *
 * To add a car: add the model under its make with its Egyptian-market engine options.
 */
export type ModelCatalog = Record<string, string[]>;

export const EGYPT_CATALOG: Record<string, ModelCatalog> = {
  Audi: {
    A3: ["1.0T", "1.4T"],
    A4: ["1.4T", "2.0T"],
    A6: ["2.0T", "3.0T"],
    Q2: ["1.0T", "1.4T"],
    Q3: ["1.4T", "2.0T"],
    Q5: ["2.0T"],
    Q7: ["2.0T", "3.0T"],
    "Q8 e-tron": ["Electric"],
  },
  BAIC: {
    X3: ["1.5"],
    X7: ["1.5T"],
    U5: ["1.5"],
  },
  BMW: {
    "1 Series": ["1.5T", "2.0T"],
    "2 Series Gran Coupe": ["1.5T", "2.0T"],
    "3 Series": ["1.5T", "1.6T", "2.0T", "3.0T", "2.0 Diesel", "3.0 Diesel", "2.0 Plug-in Hybrid"],
    // Badges span used/imported generations; select the engine for the car's year.
    "316i": ["1.6", "1.8", "1.6T"],
    "318i": ["1.5T", "2.0", "2.0T"],
    "320i": ["2.0", "1.6T", "2.0T"],
    "328i": ["2.0T"],
    "330i": ["2.0T", "3.0"],
    "335i": ["3.0T"],
    "340i": ["3.0T"],
    "M340i": ["3.0T"],
    "316d": ["2.0 Diesel"],
    "318d": ["2.0 Diesel"],
    "320d": ["2.0 Diesel"],
    "325d": ["2.0 Diesel", "3.0 Diesel"],
    "330d": ["3.0 Diesel"],
    "335d": ["3.0 Diesel"],
    "M340d": ["3.0 Diesel"],
    "330e": ["2.0 Plug-in Hybrid"],
    "530e": ["2.0 Plug-in Hybrid"],
    "545e": ["3.0 Plug-in Hybrid"],
    "550e": ["3.0 Plug-in Hybrid"],
    "740e": ["2.0 Plug-in Hybrid"],
    "745e": ["3.0 Plug-in Hybrid"],
    "750e": ["3.0 Plug-in Hybrid"],
    "X1 xDrive25e": ["1.5 Plug-in Hybrid"],
    "X3 xDrive30e": ["2.0 Plug-in Hybrid"],
    "X5 xDrive40e": ["2.0 Plug-in Hybrid"],
    "X5 xDrive45e": ["3.0 Plug-in Hybrid"],
    "X5 xDrive50e": ["3.0 Plug-in Hybrid"],
    "ActiveHybrid 3": ["3.0 Hybrid"],
    "ActiveHybrid 5": ["3.0 Hybrid"],
    "ActiveHybrid 7": ["3.0 Hybrid", "4.4 Hybrid"],
    "5 Series": ["2.0T", "2.0 Plug-in Hybrid", "3.0T"],
    "7 Series": ["3.0T", "4.4T"],
    X1: ["1.5T", "2.0T"],
    X2: ["1.5T", "2.0T"],
    X3: ["2.0T", "3.0T"],
    X4: ["2.0T"],
    X5: ["3.0T", "3.0 Plug-in Hybrid", "4.4T"],
    X6: ["3.0T", "4.4T"],
    iX: ["Electric"],
    i4: ["Electric"],
    iX3: ["Electric"],
  },
  BYD: {
    F3: ["1.5"],
    L3: ["1.5"],
    "Atto 3": ["Electric"],
    Dolphin: ["Electric"],
    Seal: ["Electric"],
    "Song Plus": ["1.5 Plug-in Hybrid"],
  },
  Changan: {
    Alsvin: ["1.5"],
    Eado: ["1.4T", "1.6"],
    "CS15": ["1.5"],
    "CS35 Plus": ["1.4T", "1.6"],
    "CS55 Plus": ["1.5T"],
    "CS75 Plus": ["1.5T", "2.0T"],
    "UNI-K": ["2.0T"],
    "UNI-T": ["1.5T"],
  },
  Chery: {
    "Arrizo 5": ["1.5"],
    "Tiggo 2 Pro": ["1.5"],
    "Tiggo 3": ["1.6"],
    "Tiggo 4 Pro": ["1.5", "1.5T"],
    "Tiggo 7": ["1.5T"],
    "Tiggo 7 Pro": ["1.5T"],
    "Tiggo 8 Pro": ["1.6T", "2.0T"],
    "Tiggo 8 Pro Max": ["2.0T"],
  },
  Chevrolet: {
    Aveo: ["1.4", "1.5", "1.6"],
    Captiva: ["1.5T", "2.4"],
    Cruze: ["1.6", "1.8", "1.4T"],
    Groove: ["1.5"],
    Lanos: ["1.5"],
    Optra: ["1.5", "1.6", "1.8"],
    Spark: ["1.0", "1.2"],
    "N300 Move": ["1.2"],
    "T-Series (truck)": ["2.5 Diesel"],
  },
  Citroen: {
    C3: ["1.2", "1.6"],
    "C3 Aircross": ["1.2T"],
    C4: ["1.2T", "1.6"],
    "C4 X": ["1.2T"],
    "C5 Aircross": ["1.6T"],
    "C-Elysee": ["1.6"],
  },
  DFSK: {
    "Glory 330": ["1.5"],
    "Glory 580": ["1.5T", "1.8"],
    "Mini Truck": ["1.3"],
  },
  DS: {
    DS3: ["1.2T", "1.6", "1.6T"],
    DS4: ["1.6T"],
    DS5: ["1.6T"],
    DS7: ["1.6T"],
  },
  Daewoo: {
    Lanos: ["1.5", "1.6"],
    Nubira: ["1.6", "2.0"],
    Leganza: ["2.0"],
  },
  Fiat: {
    "128": ["1.3"],
    "131 Shahin": ["1.3", "1.6"],
    Punto: ["1.4"],
    Tipo: ["1.4", "1.6"],
    "500": ["1.2", "1.4"],
    "500X": ["1.4T"],
    Uno: ["1.0"],
  },
  Geely: {
    Emgrand: ["1.5"],
    "Emgrand 7": ["1.5"],
    Coolray: ["1.5T"],
    Okavango: ["1.5T"],
    Tugella: ["2.0T"],
    Monjaro: ["2.0T"],
    Pandino: ["1.0"],
  },
  Haval: {
    H6: ["1.5T", "2.0T", "1.5 Hybrid"],
    Jolion: ["1.5T", "1.5 Hybrid"],
    Dargo: ["2.0T"],
  },
  Honda: {
    City: ["1.5"],
    Civic: ["1.5T", "1.6", "1.8", "2.0"],
    Accord: ["1.5T", "2.0", "2.4"],
    "CR-V": ["1.5T", "2.0", "2.4"],
    "HR-V": ["1.5", "1.8"],
    Jazz: ["1.3", "1.5"],
  },
  Hyundai: {
    Accent: ["1.4", "1.5", "1.6"],
    "Accent RB": ["1.4", "1.6"],
    "Accent HCi": ["1.4", "1.6"],
    Verna: ["1.5", "1.6"],
    Elantra: ["1.6", "2.0"],
    "Elantra HD": ["1.6"],
    "Elantra AD": ["1.6"],
    "Elantra CN7": ["1.6"],
    i10: ["1.1", "1.2"],
    "Grand i10": ["1.2"],
    i20: ["1.2", "1.4"],
    i30: ["1.6"],
    Bayon: ["1.0T", "1.4"],
    Creta: ["1.5", "1.6"],
    Tucson: ["1.6T", "2.0", "1.6 Hybrid"],
    "Santa Fe": ["2.4", "2.5", "1.6 Hybrid"],
    Matrix: ["1.6"],
    Kona: ["1.6T", "2.0", "Electric"],
    "Ioniq 5": ["Electric"],
  },
  Jeep: {
    Renegade: ["1.4T"],
    Compass: ["1.4T", "2.4"],
    Cherokee: ["2.4", "3.2"],
    "Grand Cherokee": ["3.6", "5.7"],
    Wrangler: ["2.0T", "3.6"],
  },
  Jetour: {
    X70: ["1.5T"],
    "X70 Plus": ["1.5T", "1.6T"],
    X90: ["1.5T", "1.6T", "2.0T"],
    Dashing: ["1.5T", "1.6T"],
    T2: ["2.0T"],
  },
  Kia: {
    Picanto: ["1.0", "1.2"],
    Rio: ["1.4", "1.6"],
    Pegas: ["1.4"],
    Soluto: ["1.4"],
    Cerato: ["1.6", "2.0"],
    "Cerato Koup": ["1.6", "2.0"],
    K5: ["1.6T", "2.0", "2.5"],
    Optima: ["2.0", "2.4"],
    Seltos: ["1.6"],
    Sonet: ["1.5"],
    Sportage: ["1.6", "1.6T", "2.0", "1.6 Hybrid"],
    Sorento: ["2.4", "2.5", "3.5"],
    Carens: ["1.5", "2.0"],
    Carnival: ["3.5"],
    EV6: ["Electric"],
  },
  Lada: {
    Granta: ["1.6"],
    Vesta: ["1.6"],
    "Niva Legend": ["1.7"],
    "2107": ["1.5", "1.6"],
    Largus: ["1.6"],
  },
  "Land Rover": {
    "Range Rover Evoque": ["2.0T"],
    "Range Rover Velar": ["2.0T", "3.0T"],
    "Range Rover Sport": ["3.0T", "4.4T"],
    "Discovery Sport": ["2.0T"],
    Defender: ["2.0T", "3.0T"],
  },
  Lexus: {
    ES: ["2.5", "2.5 Hybrid", "3.5"],
    NX: ["2.0T", "2.5 Hybrid"],
    RX: ["2.4T", "3.5", "2.5 Hybrid"],
    LX: ["3.4T", "5.7"],
  },
  MG: {
    "MG 3": ["1.5"],
    "MG 5": ["1.5"],
    "MG 6": ["1.5T"],
    "MG GT": ["1.5"],
    "MG ZS": ["1.5"],
    "MG ZS EV": ["Electric"],
    "MG HS": ["1.5T", "2.0T"],
    "MG RX5": ["1.5T"],
    "MG RX5 Plus": ["1.5T"],
    "MG 4": ["Electric"],
    "MG One": ["1.5T"],
  },
  Mazda: {
    "Mazda 3": ["1.6", "2.0"],
    "Mazda 6": ["2.0", "2.5"],
    "CX-3": ["2.0"],
    "CX-5": ["2.0", "2.5"],
    "CX-9": ["2.5T"],
  },
  "Mercedes-Benz": {
    "A-Class": ["1.3T", "2.0T"],
    "CLA": ["1.3T", "2.0T"],
    "C-Class": ["1.5T", "2.0T"],
    "E-Class": ["1.5T", "2.0T", "3.0T"],
    "S-Class": ["3.0T", "4.0T"],
    GLA: ["1.3T", "2.0T"],
    GLB: ["1.3T", "2.0T"],
    GLC: ["2.0T"],
    "GLC Coupe": ["2.0T"],
    GLE: ["2.0T", "3.0T"],
    GLS: ["3.0T", "4.0T"],
    "G-Class": ["4.0T"],
    EQA: ["Electric"],
    EQB: ["Electric"],
    EQS: ["Electric"],
  },
  Mini: {
    Cooper: ["1.5T", "2.0T"],
    Countryman: ["1.5T", "2.0T"],
    Clubman: ["1.5T", "2.0T"],
  },
  Mitsubishi: {
    Lancer: ["1.3", "1.6", "2.0"],
    "Lancer Shark": ["1.6"],
    Attrage: ["1.2"],
    Mirage: ["1.2"],
    Xpander: ["1.5"],
    "Xpander Cross": ["1.5"],
    ASX: ["1.6", "2.0"],
    "Eclipse Cross": ["1.5T"],
    Outlander: ["2.4", "2.5"],
    Pajero: ["3.0", "3.5", "3.8"],
    "Pajero Sport": ["2.4 Diesel", "3.0"],
    L200: ["2.4 Diesel", "2.5 Diesel"],
  },
  Nissan: {
    Sunny: ["1.5", "1.6"],
    Sentra: ["1.6", "2.0"],
    Tiida: ["1.6"],
    Juke: ["1.0T", "1.6"],
    Qashqai: ["1.2T", "1.3T", "1.6", "2.0"],
    "X-Trail": ["2.0", "2.5"],
    Patrol: ["4.0", "5.6"],
    Navara: ["2.5", "2.5 Diesel"],
    "Pickup (D22)": ["2.4", "2.5 Diesel"],
    Kicks: ["1.6"],
  },
  Opel: {
    Astra: ["1.2T", "1.4T", "1.6"],
    Corsa: ["1.2", "1.2T", "1.4"],
    Insignia: ["1.5T", "2.0T"],
    Crossland: ["1.2T"],
    Grandland: ["1.2T", "1.6T"],
    Mokka: ["1.2T", "1.4T"],
    Vectra: ["1.6", "1.8", "2.0"],
  },
  Peugeot: {
    "208": ["1.2", "1.2T", "1.6"],
    "2008": ["1.2T", "1.6"],
    "301": ["1.6"],
    "308": ["1.2T", "1.6", "1.6T"],
    "3008": ["1.6T"],
    "408": ["1.6T"],
    "5008": ["1.6T"],
    "508": ["1.6T"],
    "405": ["1.6", "1.8"],
    "406": ["1.8", "2.0"],
    Partner: ["1.6"],
  },
  Porsche: {
    Macan: ["2.0T", "2.9T"],
    Cayenne: ["3.0T", "4.0T", "3.0 Plug-in Hybrid"],
    Panamera: ["2.9T", "4.0T"],
    "911": ["3.0T"],
    Taycan: ["Electric"],
  },
  Proton: {
    Saga: ["1.3"],
    Persona: ["1.6"],
    Gen2: ["1.6"],
    Waja: ["1.6"],
  },
  Renault: {
    Logan: ["1.5", "1.6"],
    Sandero: ["1.6"],
    "Sandero Stepway": ["0.9T", "1.6"],
    Taliant: ["1.0T"],
    Duster: ["1.3T", "1.6", "2.0"],
    Megane: ["1.3T", "1.6"],
    Fluence: ["1.6", "2.0"],
    Kadjar: ["1.3T"],
    Austral: ["1.3T"],
    Captur: ["1.3T", "1.6"],
    Clio: ["1.2", "1.4", "1.6"],
    "9": ["1.4", "1.7"],
    Kangoo: ["1.6"],
  },
  Seat: {
    Ibiza: ["1.0T", "1.4", "1.6"],
    Leon: ["1.4T", "1.5T"],
    Arona: ["1.0T"],
    Ateca: ["1.4T", "1.5T"],
    Tarraco: ["1.4T", "2.0T"],
    Toledo: ["1.4T", "1.6"],
    Cordoba: ["1.6"],
  },
  Skoda: {
    Fabia: ["1.0T", "1.4", "1.6"],
    Rapid: ["1.6"],
    Scala: ["1.0T", "1.4T"],
    Octavia: ["1.0T", "1.2T", "1.4T", "1.6", "1.8T"],
    Superb: ["1.4T", "1.8T", "2.0T"],
    Kamiq: ["1.0T", "1.4T"],
    Karoq: ["1.4T", "1.5T"],
    Kodiaq: ["1.4T", "2.0T"],
  },
  Speranza: {
    A113: ["1.1"],
    A516: ["1.5"],
    A620: ["1.6", "2.0"],
    Tiggo: ["1.6", "2.0"],
    "Envy": ["1.5"],
    M11: ["1.6"],
    M12: ["1.6"],
  },
  Subaru: {
    Impreza: ["1.6", "2.0"],
    XV: ["1.6", "2.0"],
    Crosstrek: ["2.0"],
    Forester: ["2.0", "2.5"],
    Outback: ["2.5"],
    Legacy: ["2.0", "2.5"],
  },
  Suzuki: {
    Alto: ["0.8", "1.0"],
    Celerio: ["1.0"],
    "S-Presso": ["1.0"],
    Swift: ["1.2", "1.3", "1.5"],
    Dzire: ["1.2"],
    Ciaz: ["1.5"],
    Baleno: ["1.4", "1.5"],
    Ertiga: ["1.5"],
    Fronx: ["1.5"],
    Vitara: ["1.4T", "1.6"],
    "Grand Vitara": ["1.5 Hybrid", "2.0", "2.4"],
    Jimny: ["1.5"],
    Maruti: ["0.8"],
    "Van (Carry)": ["1.3"],
  },
  Toyota: {
    Corolla: ["1.2T", "1.3", "1.6", "1.8", "1.8 Hybrid"],
    Yaris: ["1.3", "1.5"],
    Belta: ["1.5"],
    Camry: ["2.5", "2.5 Hybrid", "3.5"],
    "C-HR": ["1.2T", "1.8 Hybrid", "2.0"],
    "Corolla Cross": ["1.8", "1.8 Hybrid", "2.0"],
    Raize: ["1.0T", "1.2"],
    Rush: ["1.5"],
    Urban: ["1.5"],
    RAV4: ["2.0", "2.5", "2.5 Hybrid"],
    Fortuner: ["2.7", "2.8 Diesel", "4.0"],
    Hilux: ["2.4 Diesel", "2.7", "2.8 Diesel"],
    "Land Cruiser": ["3.3T Diesel", "3.5T", "4.0", "4.6"],
    "Land Cruiser Prado": ["2.4T", "2.7", "2.8 Diesel", "4.0"],
    Hiace: ["2.5 Diesel", "2.7", "3.5"],
    "bZ4X": ["Electric"],
  },
  Volkswagen: {
    Polo: ["1.0T", "1.4", "1.6"],
    Golf: ["1.0T", "1.4T", "1.5T", "1.6", "2.0T"],
    Jetta: ["1.4T", "1.6", "2.0"],
    Passat: ["1.4T", "1.8T", "2.0T"],
    "T-Roc": ["1.0T", "1.4T", "1.5T"],
    "T-Cross": ["1.0T"],
    Tiguan: ["1.4T", "1.5T", "2.0T"],
    Touareg: ["3.0T", "3.6"],
    "ID.4": ["Electric"],
    "ID.6": ["Electric"],
    Caddy: ["1.6", "2.0 Diesel"],
    Transporter: ["2.0 Diesel", "2.0T"],
  },
  Volvo: {
    S60: ["2.0T", "2.0 Plug-in Hybrid"],
    S90: ["2.0T", "2.0 Plug-in Hybrid"],
    XC40: ["1.5T", "2.0T", "Electric"],
    XC60: ["2.0T", "2.0 Plug-in Hybrid"],
    XC90: ["2.0T", "2.0 Plug-in Hybrid"],
  },
};

export const EGYPT_MAKES = Object.keys(EGYPT_CATALOG).sort((a, b) => a.localeCompare(b));

/** Powertrain. Petrol/diesel/hybrids use engine oil; electric cars do not. */
export type EngineType = "petrol" | "diesel" | "hybrid" | "phev" | "ev";
export const ENGINE_TYPES: EngineType[] = ["petrol", "diesel", "hybrid", "phev", "ev"];
export const FUEL_TYPES: EngineType[] = ["petrol", "diesel", "hybrid", "phev"];

/** Reads the powertrain from a catalog engine label ("2.5 Diesel", "2.0 Plug-in Hybrid", "Electric", "1.5T"). */
export function engineTypeOf(label: string | undefined | null): EngineType {
  const l = String(label ?? "");
  if (/plug-?in/i.test(l)) return "phev";
  if (/hybrid/i.test(l)) return "hybrid";
  if (/electric/i.test(l)) return "ev";
  if (/diesel/i.test(l)) return "diesel";
  return "petrol";
}

/** All engines for a make/model, optionally only those of one powertrain. */
export function enginesFor(make: string, model: string, type?: EngineType): string[] {
  const all = EGYPT_CATALOG[make]?.[model] ?? [];
  return type ? all.filter((e) => engineTypeOf(e) === type) : all;
}

/** Models under a make, optionally only those offered with that powertrain in Egypt. */
export function modelsFor(make: string, type?: EngineType): string[] {
  const models = EGYPT_CATALOG[make];
  if (!models) return [];
  return Object.keys(models)
    .filter((m) => !type || enginesFor(make, m, type).length > 0)
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

/** Makes that sell at least one model with that powertrain. */
export function makesFor(type?: EngineType): string[] {
  return type ? EGYPT_MAKES.filter((m) => modelsFor(m, type).length > 0) : EGYPT_MAKES;
}

/** Powertrains a model is offered with, in a stable order. */
export function typesFor(make: string, model: string): EngineType[] {
  const set = new Set(enginesFor(make, model).map(engineTypeOf));
  return ENGINE_TYPES.filter((t) => set.has(t));
}

/** Compact "Make: A | B" listing used to restrict photo identification to Egypt-market cars. */
export function catalogText(): string {
  return EGYPT_MAKES.map((m) => `${m}: ${modelsFor(m).join(" | ")}`).join("\n");
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Matches a decoded/legacy make name to the catalog key ("MERCEDES-BENZ" -> "Mercedes-Benz"). */
export function matchMake(raw: string): string | null {
  if (!raw) return null;
  const n = norm(raw);
  if (n === "DSAUTOMOBILES") return "DS";
  return EGYPT_MAKES.find((m) => norm(m) === n) ?? EGYPT_MAKES.find((m) => n.startsWith(norm(m))) ?? null;
}

/** Matches a decoded model name (e.g. "Elantra GT", "CR-V") to a catalog model under the make. */
export function matchModel(make: string, raw: string): string | null {
  if (!raw) return null;
  const mk = norm(make);
  // Decoders say "ZS" where the catalog says "MG ZS", so compare without the make prefix too.
  const bare = (s: string) => (norm(s).startsWith(mk) && norm(s) !== mk ? norm(s).slice(mk.length) : norm(s));
  const n = bare(raw);
  const models = modelsFor(make);
  const exact = models.find((m) => bare(m) === n);
  if (exact) return exact;
  // Longest catalog name that the decoded model starts with ("Elantra GT" -> "Elantra").
  const partial = models.filter((m) => n.startsWith(bare(m))).sort((a, b) => b.length - a.length);
  return partial[0] ?? null;
}

/** Picks the catalog engine closest to a decoded displacement (litres), if any. */
export function matchEngine(make: string, model: string, litres: number | null): string | null {
  if (!litres) return null;
  const engines = enginesFor(make, model);
  const target = litres.toFixed(1);
  return engines.find((e) => e.startsWith(target)) ?? null;
}
