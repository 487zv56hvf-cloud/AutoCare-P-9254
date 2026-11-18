import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, formatNumber, type Lang } from "../i18n";
import { computeAll, ITEMS, type Vehicle } from "../maintenance";
import { s, COLORS } from "./theme";
export function Cars({
  lang,
  cars,
  onPick,
  onAdd,
  failed,
  onRetry,
}: {
  failed?: boolean;
  onRetry: () => void;
  lang: Lang;
  cars: Vehicle[];
  onPick: (id: string) => void;
  onAdd: () => void;
}) {
  const rtl = lang === "ar",
    align = { textAlign: rtl ? "right" : "left" } as const,
    row = rtl ? "row-reverse" : "row";
  return (
    <ScrollView contentContainerStyle={s.scroll} testID="cars-screen">
      <View style={{ marginBottom: 22 }}>
        <Text
          style={[
            s.muted,
            align,
            { color: COLORS.primary, fontWeight: "700", marginBottom: 8 },
          ]}
        >
          {t(lang, "myCars")}
        </Text>
        <Text
          style={[
            s.title,
            align,
            { color: COLORS.navy, fontSize: 27, lineHeight: 36 },
          ]}
        >
          {t(lang, "garageTitle")}
        </Text>
        <Text
          style={[
            s.body,
            align,
            { color: COLORS.muted, fontSize: 14, marginTop: 8, lineHeight: 22 },
          ]}
        >
          {t(lang, "garageIntro")}
        </Text>
      </View>
      {failed && (
        <View style={s.card}>
          <Text style={[s.body, align]}>{t(lang, "restoreError")}</Text>
          <TouchableOpacity onPress={onRetry} style={s.linkBtn}>
            <Text style={s.linkText}>{t(lang, "tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[s.primaryBtn, { marginBottom: 20 }]}
        onPress={onAdd}
        testID="add-car"
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={s.primaryBtnText}>{t(lang, "addCar")}</Text>
      </TouchableOpacity>
      {!cars.length && (
        <View style={[s.card, { paddingVertical: 40, alignItems: "center" }]}>
          <View
            style={{
              backgroundColor: COLORS.tint,
              padding: 18,
              borderRadius: 22,
              marginBottom: 18,
            }}
          >
            <Ionicons
              name="car-sport-outline"
              size={40}
              color={COLORS.primary}
            />
          </View>
          <Text style={[s.vehicleTitle, { textAlign: "center" }]}>
            {t(lang, "emptyCars")}
          </Text>
          <Text
            style={[
              s.body,
              {
                textAlign: "center",
                color: COLORS.muted,
                lineHeight: 23,
                fontSize: 14,
                marginTop: 10,
              },
            ]}
          >
            {t(lang, "emptyCarsHint")}
          </Text>
        </View>
      )}
      {cars.map((c) => {
        const items = computeAll(c).items;
        const attention = ITEMS.filter((k) =>
          ["overdue", "due", "soon"].includes(items[k].level),
        );
        return (
          <TouchableOpacity
            key={c.id}
            onPress={() => onPick(c.id!)}
            style={[s.card, { padding: 20 }]}
            testID="garage-car"
          >
            <View
              style={{
                flexDirection: row,
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  backgroundColor: COLORS.tint,
                  padding: 13,
                  borderRadius: 14,
                }}
              >
                <Ionicons
                  name={c.cls === "ev" ? "flash-outline" : "car-sport-outline"}
                  size={28}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.vehicleTitle, align]}>
                  {[c.make, c.model].join(" ")}
                </Text>
                <Text style={[s.muted, align, { marginTop: 5 }]}>
                  {[c.year, c.engine, c.plate].filter(Boolean).join(" · ")}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: row,
                justifyContent: "space-between",
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: COLORS.border,
                paddingTop: 16,
              }}
            >
              <Text style={[s.body, { fontWeight: "700" }]}>
                {formatNumber(lang, c.odometer)} {t(lang, "km")}
              </Text>
              <Text
                style={{
                  color: attention.length ? COLORS.due : COLORS.primary,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {attention.length
                  ? `${formatNumber(lang, attention.length)} · ${t(lang, "attention")}`
                  : t(lang, "overview")}
              </Text>
            </View>
            <View
              style={{
                flexDirection: row,
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 18,
              }}
            >
              <Text style={s.linkText}>{t(lang, "viewDashboard")}</Text>
              <Ionicons
                name={rtl ? "arrow-back" : "arrow-forward"}
                size={19}
                color={COLORS.primary}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
