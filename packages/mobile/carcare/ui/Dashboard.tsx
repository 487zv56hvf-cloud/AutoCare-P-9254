import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, formatNumber, formatDate, type Lang } from "../i18n";
import {
  computeAll,
  validOilInterval,
  toNumber,
  today,
  ITEMS,
  recordService,
  serviceHistory,
  type Vehicle,
  type ItemKey,
  type Level,
} from "../maintenance";
import { notify } from "../confirm";
import { engineTypeOf, type EngineType } from "../egypt-models";
import { Reminders, type ReminderStatus } from "./Reminders";
import { Plate } from "./Plate";
import { s, COLORS } from "./theme";
import { ServiceSheet } from "./ServiceSheet";

const LEVEL_COLOR: Record<Level, string> = {
  ok: COLORS.ok,
  soon: COLORS.soon,
  due: COLORS.due,
  overdue: COLORS.overdue,
  unknown: COLORS.unknown,
  na: COLORS.unknown,
};

const ITEM_ICON: Record<ItemKey, keyof typeof Ionicons.glyphMap> = {
  oil: "water",
  brakes: "disc",
  tires: "ellipse-outline",
};

type Props = {
  lang: Lang;
  rtl: boolean;
  vehicle: Vehicle;
  setVehicle: (updater: (v: Vehicle) => Vehicle) => void;
  onEdit: () => void;
  onDelete: () => void;
  remindersEnabled: boolean;
  reminderStatus: ReminderStatus;
  onToggleReminders: () => Promise<void>;
};

export function Dashboard({
  lang,
  rtl,
  vehicle,
  setVehicle,
  onEdit,
  onDelete,
  remindersEnabled,
  reminderStatus,
  onToggleReminders,
}: Props) {
  const [newOdo, setNewOdo] = useState("");
  const [serviceItem, setServiceItem] = useState<ItemKey | null>(null);
  const { items, kmPerDay } = useMemo(() => computeAll(vehicle), [vehicle]);
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  function updateOdometer() {
    const n = toNumber(newOdo);
    if (n === null) {
      notify(t(lang, "needNumber"));
      return;
    }
    if (n < vehicle.odometer) {
      notify(t(lang, "lower"));
      return;
    }
    setVehicle((v) => ({
      ...v,
      odometer: n,
      log: [...(v.log || []), { date: today(), km: n }],
    }));
    setNewOdo("");
  }

  function markDone(key: ItemKey) {
    setServiceItem(key);
  }

  const type: EngineType =
    vehicle.engineType ??
    (vehicle.cls === "ev" ? "ev" : engineTypeOf(vehicle.engine));
  const isEv = type === "ev";
  const title =
    [vehicle.year, vehicle.make, vehicle.model, vehicle.engine]
      .filter(Boolean)
      .join(" ") ||
    vehicle.vin ||
    t(lang, "appName");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            s.card,
            {
              backgroundColor: COLORS.navy,
              borderColor: COLORS.navy,
              padding: 22,
            },
          ]}
        >
          <Text
            style={[
              s.muted,
              align,
              { color: "#8DD5CF", fontWeight: "700", marginBottom: 10 },
            ]}
          >
            {t(lang, "dashboard")}
          </Text>
          <Text style={[s.vehicleTitle, align, { color: "#fff" }]}>
            {title}
          </Text>
          {!!vehicle.vin && (
            <Text
              style={[
                s.muted,
                align,
                { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
              ]}
            >
              {vehicle.vin}
            </Text>
          )}
          <Text
            style={[
              s.odoBig,
              align,
              { color: "#fff", fontSize: 34, marginTop: 22 },
            ]}
          >
            {formatNumber(lang, vehicle.odometer)} {t(lang, "km")}
          </Text>
          <Text style={[s.muted, align, { color: "#BCD0DD" }]}>
            {t(lang, "pace", { n: formatNumber(lang, kmPerDay) })}
          </Text>
          <View
            style={{
              flexDirection: row,
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            <View
              style={[
                s.badge,
                {
                  flexDirection: row,
                  alignItems: "center",
                  gap: 4,
                  paddingVertical: 6,
                  backgroundColor: isEv ? COLORS.primary : COLORS.text,
                },
              ]}
            >
              <Ionicons
                name={isEv ? "flash" : "flame"}
                size={13}
                color="#fff"
              />
              <Text style={s.badgeText}>{t(lang, type)}</Text>
            </View>
            {!!vehicle.plate && <Plate text={vehicle.plate} small />}
          </View>
        </View>

        {isEv && (
          <View
            style={[
              s.card,
              { backgroundColor: "#E7F6EF", borderColor: COLORS.primary },
            ]}
          >
            <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
              <Ionicons name="flash" size={20} color={COLORS.primary} />
              <Text style={s.itemTitle}>{t(lang, "evMenuTitle")}</Text>
            </View>
            <Text
              style={[
                s.muted,
                align,
                { marginTop: 6, lineHeight: 19, color: COLORS.text },
              ]}
            >
              {t(lang, "evInfo")}
            </Text>
          </View>
        )}

        <Text style={[s.itemTitle, align, { marginBottom: 16 }]}>
          {t(lang, "maintenancePlan")}
        </Text>
        {ITEMS.map((key) => {
          const it = items[key];
          const color = LEVEL_COLOR[it.level];
          const heading = (
            <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
              <Ionicons
                name={ITEM_ICON[key]}
                size={20}
                color={COLORS.primary}
              />
              <Text style={s.itemTitle}>{t(lang, key)}</Text>
            </View>
          );
          if (it.level === "na") return null; // e.g. oil on an electric car
          return (
            <View key={key} style={s.card}>
              <View
                style={{
                  flexDirection: row,
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {heading}
                <View style={[s.badge, { backgroundColor: color }]}>
                  <Text style={s.badgeText}>{t(lang, it.level)}</Text>
                </View>
              </View>

              {it.level !== "unknown" && (
                <>
                  <Text style={[s.remaining, align, { color }]}>
                    {it.remaining > 0
                      ? `${formatNumber(lang, it.remaining)} ${t(lang, "kmLeft")}`
                      : `${formatNumber(lang, Math.abs(it.remaining))} ${t(lang, "kmOver")}`}
                  </Text>
                  <View style={s.barBg}>
                    <View
                      style={[
                        s.barFill,
                        {
                          width: `${Math.round(it.pct * 100)}%`,
                          backgroundColor: color,
                          alignSelf: rtl ? "flex-end" : "flex-start",
                        },
                      ]}
                    />
                  </View>
                  {it.remaining > 0 && (
                    <Text style={[s.muted, align]}>
                      {t(lang, "daysApprox", {
                        n: formatNumber(lang, it.days),
                      })}
                    </Text>
                  )}
                </>
              )}
              {key === "oil" && !!vehicle.viscosity && (
                <Text
                  style={[
                    s.muted,
                    align,
                    { marginTop: 4, fontWeight: "700", color: COLORS.text },
                  ]}
                >
                  {t(lang, "viscosityShow", { v: vehicle.viscosity })}
                </Text>
              )}
              <Text style={[s.muted, align, { marginTop: 4 }]}>
                {t(
                  lang,
                  key === "oil" && validOilInterval(vehicle.oilInterval)
                    ? "everyOwn"
                    : "every",
                  {
                    n: formatNumber(lang, it.interval),
                  },
                )}
              </Text>

              <TouchableOpacity
                style={[s.secondaryBtn, { marginTop: 12 }]}
                onPress={() => markDone(key)}
                testID={`done-${key}`}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={s.secondaryBtnText}>{t(lang, "done")}</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={s.card}>
          <Text style={[s.label, align]}>{t(lang, "newReading")}</Text>
          <View style={{ flexDirection: row, gap: 10 }}>
            <TextInput
              style={[s.input, align, { flex: 1, minWidth: 0 }]}
              value={newOdo}
              onChangeText={setNewOdo}
              keyboardType="number-pad"
              placeholder={formatNumber(lang, vehicle.odometer)}
              placeholderTextColor={COLORS.unknown}
              testID="new-odometer"
              accessibilityLabel={t(lang, "newReading")}
            />
            <TouchableOpacity
              style={[s.primaryBtn, { paddingHorizontal: 18 }]}
              onPress={updateOdometer}
              testID="update-odometer"
            >
              <Text style={s.primaryBtnText}>{t(lang, "update")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Reminders
          lang={lang}
          rtl={rtl}
          enabled={remindersEnabled}
          status={reminderStatus}
          onToggle={onToggleReminders}
        />

        <View style={s.card} testID="service-history">
          <Text style={[s.itemTitle, align, { marginBottom: 12 }]}>
            {t(lang, "serviceHistory")}
          </Text>
          {!vehicle.services?.length && (
            <Text
              style={[s.muted, align, { lineHeight: 21, marginBottom: 12 }]}
            >
              {t(lang, "noServiceHistory")}
            </Text>
          )}
          {serviceHistory(vehicle)
            .slice(0, 20)
            .map((r, i) => (
              <View
                key={i}
                style={{
                  flexDirection: row,
                  justifyContent: "space-between",
                  borderTopWidth: 1,
                  borderColor: COLORS.border,
                  paddingVertical: 12,
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[s.body, align, { fontSize: 14, fontWeight: "600" }]}
                  >
                    {t(lang, r.item)}
                  </Text>
                  <Text style={[s.muted, align]}>
                    {r.date
                      ? formatDate(lang, r.date)
                      : t(lang, "savedReading")}
                  </Text>
                  {!!r.note && (
                    <Text
                      style={[
                        s.body,
                        align,
                        { fontSize: 14, marginTop: 4, lineHeight: 20 },
                      ]}
                      testID="service-note-text"
                    >
                      {r.note}
                    </Text>
                  )}
                </View>
                <Text style={[s.body, { fontSize: 14 }]}>
                  {formatNumber(lang, r.km)} {t(lang, "km")}
                </Text>
              </View>
            ))}
        </View>
        <View style={{ flexDirection: row, justifyContent: "center", gap: 8 }}>
          <TouchableOpacity
            style={[s.linkBtn, { flexDirection: row, gap: 6 }]}
            onPress={onEdit}
            testID="edit-car"
          >
            <Ionicons name="create-outline" size={18} color={COLORS.primary} />
            <Text style={s.linkText}>{t(lang, "edit")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.linkBtn, { flexDirection: row, gap: 6 }]}
            onPress={onDelete}
            testID="delete-car"
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.overdue} />
            <Text style={[s.linkText, { color: COLORS.overdue }]}>
              {t(lang, "deleteCar")}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.disclaimer, align]}>{t(lang, "disclaimer")}</Text>
      </ScrollView>
      <ServiceSheet
        lang={lang}
        rtl={rtl}
        item={serviceItem}
        odometer={vehicle.odometer}
        onClose={() => setServiceItem(null)}
        onSave={(item, entry) => {
          setVehicle((v) => recordService(v, item, entry));
          setServiceItem(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
