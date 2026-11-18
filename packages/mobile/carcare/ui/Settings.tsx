import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LegalLinks } from "./LegalLinks";
import { Ionicons } from "@expo/vector-icons";
import { t, type Lang } from "../i18n";
import { Reminders, type ReminderStatus } from "./Reminders";
import type { OdoFrequency } from "../odometer-reminders";
import { s, COLORS } from "./theme";
export function Settings({
  lang,
  onLanguage,
  enabled,
  status,
  onToggle,
  odo,
  onOdo,
  onHelp,
  onFeedback,
}: {
  lang: Lang;
  onLanguage: () => void;
  enabled: boolean;
  status: ReminderStatus;
  onToggle: () => Promise<void>;
  odo: OdoFrequency;
  onOdo: (f: OdoFrequency) => void;
  onHelp: () => void;
  onFeedback: () => void;
}) {
  const rtl = lang === "ar",
    align = { textAlign: rtl ? "right" : "left" } as const,
    row = rtl ? "row-reverse" : "row";
  return (
    <ScrollView contentContainerStyle={s.scroll} testID="settings-screen">
      <Text
        style={[
          s.title,
          align,
          { color: COLORS.navy, marginBottom: 22, fontSize: 28 },
        ]}
      >
        {t(lang, "settings")}
      </Text>
      <View style={s.card}>
        <View
          style={{
            flexDirection: row,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={s.itemTitle}>{t(lang, "language")}</Text>
          <TouchableOpacity
            onPress={onLanguage}
            style={s.langBtn}
            testID="settings-language"
          >
            <Text style={s.langBtnText}>{rtl ? "English" : "العربية"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={s.card}>
        <Text style={[s.itemTitle, align]}>{t(lang, "appearance")}</Text>
        <Text style={[s.muted, align, { lineHeight: 22, marginTop: 8 }]}>
          {t(lang, "appearanceInfo")}
        </Text>
        <Text style={[s.linkText, align, { marginTop: 12 }]}>
          {t(lang, "lightTheme")}
        </Text>
      </View>
      <Reminders
        lang={lang}
        rtl={rtl}
        enabled={enabled}
        status={status}
        onToggle={onToggle}
        odo={odo}
        onOdo={onOdo}
      />
      <View style={s.card}>
        <Text style={[s.itemTitle, align]}>{t(lang, "privacyTitle")}</Text>
        <Text style={[s.muted, align, { lineHeight: 22, marginTop: 8 }]}>
          {t(lang, "privacyInfo")}
        </Text>
        <LegalLinks lang={lang} rtl={rtl} card={false} />
      </View>
      {[
        {
          key: "headerHelp",
          icon: "help-buoy-outline" as const,
          press: onHelp,
          id: "support-btn",
        },
        {
          key: "feedback",
          icon: "chatbubble-ellipses-outline" as const,
          press: onFeedback,
          id: "feedback-btn",
        },
      ].map((x) => (
        <TouchableOpacity
          key={x.key}
          onPress={x.press}
          testID={x.id}
          style={[
            s.card,
            { flexDirection: row, alignItems: "center", gap: 12 },
          ]}
        >
          <Ionicons name={x.icon} size={22} color={COLORS.primary} />
          <Text style={[s.linkText, { flex: 1 }, align]}>{t(lang, x.key)}</Text>
          <Ionicons
            name={rtl ? "chevron-back" : "chevron-forward"}
            size={18}
            color={COLORS.muted}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
