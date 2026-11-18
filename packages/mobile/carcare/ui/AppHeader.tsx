import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type Lang } from "../i18n";
import { s, COLORS } from "./theme";
export function AppHeader({
  lang,
  onLanguage,
}: {
  lang: Lang;
  onLanguage: () => void;
}) {
  const rtl = lang === "ar";
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;
  return (
    <View
      style={[s.header, { alignItems: "stretch", gap: 10 }]}
      testID="app-header"
    >
      <View style={{ flexDirection: row, alignItems: "center", gap: 12 }}>
        <View
          style={{
            backgroundColor: COLORS.tint,
            width: 42,
            height: 42,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="speedometer-outline"
            size={25}
            color={COLORS.primary}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.title, align, { color: COLORS.navy }]}>
            {t(lang, "appName")}
          </Text>
          <Text style={[s.subtitle, align, { lineHeight: 17, fontSize: 11 }]}>
            {t(lang, "tagline")}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            s.langBtn,
            {
              minHeight: 44,
              minWidth: 56,
              justifyContent: "center",
              alignItems: "center",
              flexShrink: 0,
            },
          ]}
          onPress={onLanguage}
          testID="lang-btn"
          accessibilityRole="button"
          accessibilityLabel={rtl ? "Switch to English" : "التبديل للعربية"}
        >
          <Text style={s.langBtnText}>{rtl ? "EN" : "عربي"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
