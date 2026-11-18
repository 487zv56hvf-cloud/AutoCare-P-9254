import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { t, type Lang } from "../i18n";
import { openSitePage } from "../links";
import { s, COLORS } from "./theme";

/** Privacy policy + support website links (App Store 5.1.1(i)). */
export function LegalLinks({
  lang,
  rtl,
  card = true,
}: {
  lang: Lang;
  rtl: boolean;
  card?: boolean;
}) {
  const row = rtl ? "row-reverse" : "row";
  const links = [
    { key: "privacyPolicy", path: "privacy" as const, icon: "shield-checkmark-outline" as const },
    { key: "supportSite", path: "support" as const, icon: "globe-outline" as const },
  ];
  return (
    <View
      style={[
        card ? s.card : null,
        { flexDirection: row, flexWrap: "wrap", justifyContent: card ? "flex-start" : "center", gap: 14 },
      ]}
    >
      {links.map((l) => (
        <TouchableOpacity
          key={l.key}
          onPress={() => void openSitePage(l.path)}
          accessibilityRole="link"
          testID={`link-${l.path}`}
          style={{ flexDirection: row, alignItems: "center", gap: 6, paddingVertical: 6 }}
        >
          <Ionicons name={l.icon} size={17} color={COLORS.primary} />
          <Text style={[s.linkText, { fontSize: 14 }]}>{t(lang, l.key)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
