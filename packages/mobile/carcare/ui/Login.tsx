import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LegalLinks } from "./LegalLinks";
import { SignedOut } from "./Account";
import { s, COLORS } from "./theme";
import { t, type Lang } from "../i18n";

export function Login({
  lang,
  onLanguage,
  error,
  onRetry,
}: {
  lang: Lang;
  onLanguage: () => void;
  error?: boolean;
  onRetry: () => void;
}) {
  const rtl = lang === "ar";
  const align = { textAlign: rtl ? "right" : "left" } as const;
  return (
    <SafeAreaView
      style={[s.root, { backgroundColor: COLORS.navy }]}
      testID="login-screen"
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: 28,
            backgroundColor: COLORS.bg,
            flexGrow: 1,
          }}
        >
          <View
            style={{
              backgroundColor: COLORS.navy,
              padding: 24,
              paddingBottom: 30,
            }}
          >
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <View
                style={{
                  flexDirection: rtl ? "row-reverse" : "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Ionicons
                  name="speedometer-outline"
                  size={28}
                  color="#8DD5CF"
                />
                <Text style={[s.title, { color: "#fff" }]}>
                  {t(lang, "appName")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onLanguage}
                testID="lang-btn"
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "#526576",
                  borderRadius: 12,
                  minHeight: 44,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {rtl ? "EN" : "عربي"}
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[
                s.title,
                align,
                { color: "#fff", fontSize: 29, lineHeight: 40 },
              ]}
            >
              {t(lang, "loginHeadline")}
            </Text>
            <Text
              style={[
                s.body,
                align,
                {
                  color: "#BCD0DD",
                  lineHeight: 23,
                  marginTop: 10,
                  fontSize: 14,
                },
              ]}
            >
              {t(lang, "loginSubtitle")}
            </Text>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={[s.vehicleTitle, align, { marginBottom: 18 }]}>
              {t(lang, "welcomeBack")}
            </Text>
            {error && (
              <View style={s.card}>
                <Text style={[s.body, align]}>{t(lang, "sessionError")}</Text>
                <TouchableOpacity style={s.linkBtn} onPress={onRetry}>
                  <Text style={s.linkText}>{t(lang, "tryAgain")}</Text>
                </TouchableOpacity>
              </View>
            )}
            <SignedOut lang={lang} rtl={rtl} />
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={COLORS.muted}
              />
              <Text style={s.muted}>{t(lang, "privacyTitle")}</Text>
            </View>
            <LegalLinks lang={lang} rtl={rtl} card={false} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
