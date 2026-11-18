import { useRef, useState } from "react";
import { type ViewStyle, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, formatNumber, type Lang } from "../i18n";
import { isPlausibleVin, decodeVin, classify, vinFoundNote } from "../vin";
import { client } from "../../lib/api";
import {
  FUEL_TYPES,
  makesFor,
  modelsFor,
  enginesFor,
  typesFor,
  engineTypeOf,
  matchMake,
  matchModel,
  matchEngine,
  type EngineType,
} from "../egypt-models";
import { normalizePlate } from "../plate";
import {
  toNumber,
  today,
  recommendedOilInterval,
  validOilInterval,
  OIL_INTERVAL_CHOICES,
  OIL_INTERVAL_MIN,
  OIL_INTERVAL_MAX,
  type Vehicle,
  type OilType,
  type Driving,
} from "../maintenance";
import { notify } from "../confirm";
import { Field, Chips } from "./Field";
import { Select } from "./Select";
import { Plate } from "./Plate";
import { VinGuide } from "./VinGuide";
import { s, COLORS } from "./theme";

type Props = {
  lang: Lang;
  rtl: boolean;
  initial: Vehicle | null;
  onSave: (v: Vehicle) => void;
  /** Shown on first setup only: opens the account screen to restore a backed-up car. */
  onRestore?: () => void;
  /** Adding/editing while other cars exist: go back to the dashboard without saving. */
  onCancel?: () => void;
  /** Normalized plates of the user's other cars (a plate can belong to one car only). */
  otherPlates?: string[];
  /** Adding a second (or later) car: changes the heading. */
  adding?: boolean;
};

const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n));
const EV_GREEN = "#E7F6EF";

/** Powertrain of a saved vehicle; older saves have no engineType so it is derived. */
function initialType(v: Vehicle | null): EngineType {
  if (v?.engineType) return v.engineType;
  if (v?.cls === "ev") return "ev";
  return engineTypeOf(v?.engine);
}

export function Setup({ lang, rtl, initial, onSave, onRestore, onCancel, otherPlates = [], adding }: Props) {
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [type, setType] = useState<EngineType>(initialType(initial));
  // Older saved vehicles may hold free-typed names; keep them only if they match the Egypt catalog.
  const initMake = matchMake(initial?.make ?? "") ?? "";
  const initModel = initMake ? (matchModel(initMake, initial?.model ?? "") ?? "") : "";
  const [make, setMake] = useState(initMake);
  const [model, setModel] = useState(initModel);
  const [engine, setEngine] = useState(
    initModel && initial?.engine && enginesFor(initMake, initModel).includes(initial.engine) ? initial.engine : "",
  );
  const [year, setYear] = useState(str(initial?.year));
  // Year last filled in by a VIN lookup, so a later lookup without a year clears it.
  const vinYear = useRef("");
  const [plate, setPlate] = useState(initial?.plate ?? "");
  const [oilType, setOilType] = useState<OilType>(initial?.oilType ?? "semi");
  const [viscosity, setViscosity] = useState(initial?.viscosity ?? "");
  const [driving, setDriving] = useState<Driving>(initial?.driving ?? "city");
  // "rec" = app recommendation; a number string = quick pick; "other" = typed value.
  const initOwn = validOilInterval(initial?.oilInterval) ? initial.oilInterval : null;
  const [oilChoice, setOilChoice] = useState<string>(
    initOwn === null ? "rec" : (OIL_INTERVAL_CHOICES as readonly number[]).includes(initOwn) ? String(initOwn) : "other",
  );
  const [oilCustom, setOilCustom] = useState(
    initOwn !== null && !(OIL_INTERVAL_CHOICES as readonly number[]).includes(initOwn) ? String(initOwn) : "",
  );
  const [odo, setOdo] = useState(str(initial?.odometer));
  const [lastOil, setLastOil] = useState(str(initial?.last?.oil));
  const [lastBrakes, setLastBrakes] = useState(str(initial?.last?.brakes));
  const [lastTires, setLastTires] = useState(str(initial?.last?.tires));
  const [busy, setBusy] = useState<"" | "vin">("");
  const [note, setNoteState] = useState<{ text: string; error: boolean }>({ text: "", error: false });
  const setNote = (text: string, error = false) => setNoteState({ text, error });
  const [vinErr, setVinErr] = useState(false);
  const [plateTouched, setPlateTouched] = useState(false);
  const plateBad = !!plate.trim() && normalizePlate(plate) === null;
  const lookupId = useRef(0);

  const isEv = type === "ev";
  const recOil = recommendedOilInterval({ cls: classify(make, engine), oilType, driving }) ?? 0;
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row: "row" | "row-reverse" = rtl ? "row-reverse" : "row";
  const selectText = { searchPlaceholder: t(lang, "search"), emptyText: t(lang, "noResults"), cancelText: t(lang, "cancel") };

  /** Engine to preselect: the only option for this powertrain, if there is just one. */
  const onlyEngine = (mk: string, md: string, tp: EngineType) => {
    const list = enginesFor(mk, md, tp);
    return list.length === 1 ? list[0] : "";
  };

  function chooseType(tp: EngineType) {
    if (tp === type) return;
    setType(tp);
    if (make && !makesFor(tp).includes(make)) {
      setMake("");
      setModel("");
      setEngine("");
    } else if (model && !modelsFor(make, tp).includes(model)) {
      setModel("");
      setEngine("");
    } else if (model) {
      setEngine(engine && engineTypeOf(engine) === tp ? engine : onlyEngine(make, model, tp));
    }
  }

  function chooseMake(m: string) {
    if (m === make) return;
    setMake(m);
    setModel("");
    setEngine("");
  }

  function chooseModel(m: string) {
    if (m === model) return;
    setModel(m);
    setEngine(onlyEngine(make, m, type));
  }

  /** Applies a make/model found by VIN, switching the powertrain menu if needed. */
  function applyFound(mk: string, md: string, litres: number | null, hint?: EngineType) {
    let tp = type;
    if (md) {
      const types = typesFor(mk, md);
      tp = hint && types.includes(hint) ? hint : types.includes(type) ? type : (types[0] ?? type);
    } else if (!makesFor(type).includes(mk)) {
      const avail = (["petrol", "diesel", "hybrid", "phev", "ev"] as EngineType[]).filter((x) => makesFor(x).includes(mk));
      tp = hint && avail.includes(hint) ? hint : (avail[0] ?? type);
    }
    const byLitres = md ? matchEngine(mk, md, litres) : null;
    const eng = md ? (byLitres && engineTypeOf(byLitres) === tp ? byLitres : onlyEngine(mk, md, tp)) : "";
    setType(tp);
    setMake(mk);
    setModel(md);
    setEngine(eng);
    return eng;
  }

  async function runLookup() {
    const v = vin.toUpperCase().trim();
    if (!isPlausibleVin(v)) {
      setNote(t(lang, "invalidVin"), true);
      setVinErr(true);
      return;
    }
    const id = ++lookupId.current;
    setBusy("vin");
    setNote("");
    const r = await decodeVin(v, (x) => client.vin.decode({ vin: x }));
    if (id !== lookupId.current) return; // a newer lookup started; ignore this stale result
    setBusy("");
    setVin(v);
    if (r.year) setYear((vinYear.current = String(r.year)));
    else if (vinYear.current && year === vinYear.current) {
      setYear("");
      vinYear.current = "";
    }
    const m = matchMake(r.make);
    if (!m) {
      setNote(r.source === "none" ? t(lang, "vinNotFoundErr") : t(lang, "notInEgypt"), true);
      setVinErr(r.source === "none");
      return;
    }
    const mdl = matchModel(m, r.model) ?? "";
    const eng = applyFound(m, mdl, r.litres, r.cls === "ev" ? "ev" : undefined);
    setNote(vinFoundNote(lang, { year: !!r.year, make: true, model: !!mdl, engine: !!eng }));
  }

  function save() {
    const odometer = toNumber(odo);
    if (odometer === null) {
      notify(t(lang, "needNumber"));
      return;
    }
    if (!make || !model) {
      notify(t(lang, "needMakeModel"));
      return;
    }
    const vinClean = vin.toUpperCase().trim();
    if (vinClean && !isPlausibleVin(vinClean)) {
      setNote(t(lang, "invalidVinSave"), true);
      setVinErr(true);
      notify(t(lang, "invalidVinSave"));
      return;
    }
    const plateClean = plate.trim() ? normalizePlate(plate) : "";
    if (plateClean === null) {
      setPlateTouched(true);
      notify(t(lang, "invalidPlate"));
      return;
    }
    if (plateClean && otherPlates.includes(plateClean)) {
      setPlateTouched(true);
      notify(t(lang, "plateTaken"));
      return;
    }
    const last = { oil: isEv ? null : toNumber(lastOil), brakes: toNumber(lastBrakes), tires: toNumber(lastTires) };
    if (Object.values(last).some((km) => km !== null && km > odometer)) {
      notify(t(lang, "serviceAbove"));
      return;
    }
    let oilInterval: number | null = null;
    if (!isEv && oilChoice === "other") {
      const n = toNumber(oilCustom);
      if (!validOilInterval(n)) {
        notify(t(lang, "oilBadInterval", { min: formatNumber(lang, OIL_INTERVAL_MIN), max: formatNumber(lang, OIL_INTERVAL_MAX) }));
        return;
      }
      oilInterval = n;
    } else if (!isEv && oilChoice !== "rec") {
      oilInterval = Number(oilChoice);
    }
    const log = [...(initial?.log ?? [])];
    if (!log.length || log[log.length - 1].km !== odometer) {
      log.push({ date: today(), km: odometer });
    }
    const eng = isEv ? onlyEngine(make, model, "ev") || "Electric" : engine;
    onSave({
      id: initial?.id,
      vin: vinClean,
      make,
      model,
      engine: isEv ? undefined : eng || undefined,
      engineType: type,
      plate: plateClean || undefined,
      year: toNumber(year),
      cls: isEv ? "ev" : classify(make, eng),
      oilType,
      viscosity: isEv ? undefined : viscosity.trim().toUpperCase(),
      oilInterval: isEv ? null : oilInterval,
      driving,
      odometer,
      last,
      log,
      services: initial?.services,
    });
  }

  const tab = (active: boolean, ev: boolean): (ViewStyle | false)[] => [
    {
      flex: 1,
      flexDirection: row,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      paddingVertical: 11,
      borderRadius: 10,
    },
    active && { backgroundColor: ev ? COLORS.primary : COLORS.text },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {!initial && onRestore && (
          <TouchableOpacity
            style={[s.card, { flexDirection: row, alignItems: "center", gap: 10, paddingVertical: 12, backgroundColor: "#E7F6EF", borderColor: "#BFE3D2" }]}
            onPress={onRestore}
            testID="restore-link"
          >
            <Ionicons name="cloud-download-outline" size={20} color={COLORS.primary} />
            <Text style={[s.linkText, align, { flex: 1, fontSize: 14 }]}>{t(lang, "restoreSetupLink")}</Text>
            <Ionicons name={rtl ? "chevron-back" : "chevron-forward"} size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}
        {adding && (
          <View style={{ flexDirection: row, alignItems: "center", gap: 8, marginBottom: 12, marginHorizontal: 4 }}>
            <Ionicons name="add-circle" size={22} color={COLORS.primary} />
            <Text style={[s.itemTitle, align, { flex: 1 }]}>{t(lang, "addCarTitle")}</Text>
          </View>
        )}
        {/* 1. Identify: VIN with a picture guide; the lists below work without one */}
        <View style={s.card}>
          <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
            <Ionicons name="car-sport-outline" size={22} color={COLORS.primary} />
            <Text style={s.itemTitle}>{t(lang, "identifyTitle")}</Text>
          </View>
          <Text style={[s.muted, align, { marginTop: 6, marginBottom: 12, lineHeight: 19 }]}>{t(lang, "vinIntro")}</Text>

          <Text style={[s.label, align]}>{t(lang, "orVin")}</Text>
          <View style={{ flexDirection: row, gap: 10 }}>
            <TextInput
              style={[s.input, align, { flex: 1, letterSpacing: 1 }, vinErr && { borderColor: COLORS.overdue, borderWidth: 2 }]}
              value={vin}
              onChangeText={(x) => {
                setVin(x.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                setVinErr(false);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
              placeholder="JTDKB20U123456789"
              placeholderTextColor={COLORS.unknown}
              testID="vin-input"
              onSubmitEditing={runLookup}
              returnKeyType="search"
            />
            <TouchableOpacity style={[s.secondaryBtn, { paddingHorizontal: 14 }]} onPress={runLookup} disabled={!!busy} testID="vin-lookup" accessibilityLabel={t(lang, "orVin")}>
              <Ionicons name="search-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {!!busy && (
            <View style={{ marginTop: 12, alignItems: "center" }}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={s.muted}>{t(lang, "lookingUp")}</Text>
            </View>
          )}
          {!!note.text && (
            <View style={{ flexDirection: row, gap: 6, marginTop: 10, alignItems: "flex-start" }}>
              <Ionicons
                name={note.error ? "alert-circle" : "checkmark-circle"}
                size={17}
                color={note.error ? COLORS.overdue : COLORS.primary}
                style={{ marginTop: 1 }}
              />
              <Text style={[s.note, align, { flex: 1, marginTop: 0, color: note.error ? COLORS.overdue : COLORS.text }]}>{note.text}</Text>
            </View>
          )}
          <VinGuide lang={lang} rtl={rtl} />
          <Text style={[s.hint, align, { marginTop: 6 }]}>{t(lang, "vinSkip")}</Text>
        </View>

        {/* 2. Car details: fuel vs electric menus */}
        <View style={[s.card, isEv && { borderColor: COLORS.primary, backgroundColor: "#FBFEFC" }]}>
          <View style={{ flexDirection: row, backgroundColor: "#EEF1F4", borderRadius: 12, padding: 4, marginBottom: 14 }}>
            <TouchableOpacity style={tab(!isEv, false)} onPress={() => chooseType(FUEL_TYPES.includes(type) ? type : "petrol")}>
              <Ionicons name="flame-outline" size={17} color={!isEv ? "#fff" : COLORS.muted} />
              <Text style={[s.chipText, { color: !isEv ? "#fff" : COLORS.muted }]}>{t(lang, "fuelCar")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tab(isEv, true)} onPress={() => chooseType("ev")}>
              <Ionicons name="flash-outline" size={17} color={isEv ? "#fff" : COLORS.muted} />
              <Text style={[s.chipText, { color: isEv ? "#fff" : COLORS.muted }]}>{t(lang, "electricCar")}</Text>
            </TouchableOpacity>
          </View>

          {isEv ? (
            <View style={{ backgroundColor: EV_GREEN, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <View style={{ flexDirection: row, alignItems: "center", gap: 6 }}>
                <Ionicons name="flash" size={16} color={COLORS.primary} />
                <Text style={[s.label, { marginBottom: 0, color: COLORS.primary }]}>{t(lang, "evMenuTitle")}</Text>
              </View>
              <Text style={[s.hint, align]}>{t(lang, "evMenuHint")}</Text>
            </View>
          ) : (
            <View style={{ marginBottom: 14 }}>
              <Text style={[s.label, align]}>{t(lang, "powertrain")}</Text>
              <Chips<EngineType> rtl={rtl} value={type} onChange={chooseType} options={FUEL_TYPES.map((x) => [x, t(lang, x)])} />
            </View>
          )}

          <Select
            rtl={rtl}
            label={t(lang, "make")}
            value={make}
            placeholder={t(lang, "selectMake")}
            options={makesFor(type)}
            onChange={chooseMake}
            {...selectText}
          />
          <Select
            rtl={rtl}
            label={t(lang, "model")}
            value={model}
            placeholder={t(lang, "selectModel")}
            options={modelsFor(make, type)}
            onChange={chooseModel}
            disabled={!make}
            disabledText={t(lang, "pickMakeFirst")}
            {...selectText}
          />
          {!isEv && (
            <Select
              rtl={rtl}
              label={t(lang, "engine")}
              value={engine}
              placeholder={t(lang, "selectEngine")}
              options={enginesFor(make, model, type)}
              onChange={setEngine}
              disabled={!model}
              disabledText={t(lang, "pickModelFirst")}
              {...selectText}
            />
          )}
          <Field rtl={rtl} label={t(lang, "year")} value={year} onChange={setYear} numeric />

          <Text style={[s.label, align]}>{t(lang, "plate")}</Text>
          <TextInput
            style={[s.input, { textAlign: "right" }, plateTouched && plateBad && { borderColor: COLORS.overdue, borderWidth: 2 }]}
            value={plate}
            onChangeText={setPlate}
            onBlur={() => {
              setPlateTouched(true);
              const n = normalizePlate(plate);
              if (n) setPlate(n);
            }}
            autoCorrect={false}
            maxLength={16}
            placeholder={t(lang, "platePlaceholder")}
            placeholderTextColor={COLORS.unknown}
          />
          {plateTouched && plateBad ? (
            <Text style={[s.hint, align, { color: COLORS.overdue, fontWeight: "600" }]}>{t(lang, "invalidPlate")}</Text>
          ) : (
            <Text style={[s.hint, align]}>{t(lang, "plateHint")}</Text>
          )}
          {!!plate.trim() && !plateBad && (
            <View style={{ marginTop: 10, alignItems: rtl ? "flex-end" : "flex-start" }}>
              <Plate text={plate.trim()} small />
            </View>
          )}
          <Text style={[s.hint, align, { marginTop: 12 }]}>{t(lang, "catalogNote")}</Text>
        </View>

        {/* 3. Odometer + last services */}
        <View style={s.card}>
          <Field rtl={rtl} label={t(lang, "odometer")} value={odo} onChange={setOdo} numeric />
          {!isEv && <Field rtl={rtl} label={t(lang, "lastOil")} value={lastOil} onChange={setLastOil} numeric hint={t(lang, "leaveBlank")} />}
          <Field rtl={rtl} label={t(lang, "lastBrakes")} value={lastBrakes} onChange={setLastBrakes} numeric hint={t(lang, "leaveBlank")} />
          <Field rtl={rtl} label={t(lang, "lastTires")} value={lastTires} onChange={setLastTires} numeric hint={t(lang, "leaveBlank")} />
        </View>

        {/* 4. Oil + driving */}
        <View style={s.card}>
          {isEv ? (
            <Text style={[s.muted, align, { marginBottom: 6, lineHeight: 19 }]}>{t(lang, "evInfo")}</Text>
          ) : (
            <>
              <Text style={[s.label, align]}>{t(lang, "oilType")}</Text>
              <Chips<OilType>
                rtl={rtl}
                value={oilType}
                onChange={setOilType}
                options={[
                  ["mineral", t(lang, "mineral")],
                  ["semi", t(lang, "semi")],
                  ["synthetic", t(lang, "synthetic")],
                ]}
              />
              <View style={{ marginTop: 14 }}>
                <Text style={[s.label, align]}>{t(lang, "viscosity")}</Text>
                <TextInput
                  style={[s.input, align]}
                  value={viscosity}
                  onChangeText={setViscosity}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={20}
                  placeholder="5W-30"
                  placeholderTextColor={COLORS.unknown}
                />
                <Text style={[s.hint, align]}>{t(lang, "viscosityHint")}</Text>
              </View>
              <View style={{ marginTop: 14 }} testID="oil-interval">
                <Text style={[s.label, align]}>{t(lang, "oilEvery")}</Text>
                <Chips<string>
                  rtl={rtl}
                  value={oilChoice}
                  onChange={setOilChoice}
                  options={[
                    ["rec", t(lang, "oilRecommended", { n: formatNumber(lang, recOil) })],
                    ...OIL_INTERVAL_CHOICES.map((n): [string, string] => [String(n), formatNumber(lang, n)]),
                    ["other", t(lang, "oilOther")],
                  ]}
                />
                {oilChoice === "other" && (
                  <View style={{ marginTop: 10 }}>
                    <Field rtl={rtl} label={t(lang, "oilCustomLabel")} value={oilCustom} onChange={setOilCustom} numeric />
                  </View>
                )}
                <Text style={[s.hint, align, { marginTop: oilChoice === "other" ? 0 : 6 }]}>{t(lang, "oilEveryHint")}</Text>
              </View>
            </>
          )}
          <Text style={[s.label, align, { marginTop: 14 }]}>{t(lang, "driving")}</Text>
          <Chips<Driving>
            rtl={rtl}
            value={driving}
            onChange={setDriving}
            options={[
              ["city", t(lang, "city")],
              ["mixed", t(lang, "mixed")],
              ["highway", t(lang, "highway")],
            ]}
          />
        </View>

        <TouchableOpacity style={[s.primaryBtn, { marginBottom: onCancel ? 4 : 32 }]} onPress={save} testID="save-car">
          <Text style={s.primaryBtnText}>{t(lang, "save")}</Text>
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity style={[s.linkBtn, { marginBottom: 24 }]} onPress={onCancel} testID="setup-cancel">
            <Text style={[s.linkText, { color: COLORS.muted }]}>{t(lang, "cancel")}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
