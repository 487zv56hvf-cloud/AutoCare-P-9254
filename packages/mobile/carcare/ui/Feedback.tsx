import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { client } from "../../lib/api";
import { t, type Lang } from "../i18n";
import { s, COLORS } from "./theme";

type Kind = "idea" | "problem" | "other";
type Props = { lang: Lang; rtl: boolean; car?: string; email: string | null; onClose: () => void };

const KINDS: { k: Kind; icon: "bulb-outline" | "warning-outline" | "chatbox-ellipses-outline" }[] = [
  { k: "idea", icon: "bulb-outline" },
  { k: "problem", icon: "warning-outline" },
  { k: "other", icon: "chatbox-ellipses-outline" },
];
const MAX = 2000;

/** Feedback form. The server always saves it (owner inbox) and emails the owner when email is set up. */
export function Feedback({ lang, rtl, car, email, onClose }: Props) {
  const [kind, setKind] = useState<Kind>("idea");
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;

  async function send() {
    const msg = message.trim();
    if (msg.length < 3) return setError(t(lang, "fbShort"));
    setError("");
    setSending(true);
    try {
      await client.feedback.send({ kind, rating, message: msg, contact: contact.trim() || undefined, car, lang });
      setSent(true);
    } catch (e) {
      const code = (e as { code?: string; status?: number } | null)?.code;
      const status = (e as { status?: number } | null)?.status;
      setError(t(lang, code === "TOO_MANY_REQUESTS" || status === 429 ? "fbTooMany" : "fbError"));
    } finally {
      setSending(false);
    }
  }

  function again() {
    setSent(false);
    setMessage("");
    setRating(null);
    setKind("idea");
  }

  return (
    <SafeAreaView style={[s.root, { backgroundColor: COLORS.card }]}>
      <View style={[s.header, { flexDirection: row }]}>
        <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
          <Ionicons name="megaphone-outline" size={22} color={COLORS.primary} />
          <Text style={[s.title, { fontSize: 20 }]}>{t(lang, "fbTitle")}</Text>
        </View>
        <TouchableOpacity onPress={onClose} accessibilityLabel={t(lang, "close")} style={{ padding: 6 }} testID="feedback-close">
          <Ionicons name="close" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={s.root} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={[s.card, { alignItems: "center", paddingVertical: 32, gap: 8 }]} testID="feedback-thanks">
              <Ionicons name="checkmark-circle" size={56} color={COLORS.ok} />
              <Text style={[s.itemTitle, { textAlign: "center" }]}>{t(lang, "fbThanks")}</Text>
              <Text style={[s.muted, { textAlign: "center", fontSize: 15 }]}>{t(lang, "fbThanksMsg")}</Text>
              <TouchableOpacity style={[s.primaryBtn, { marginTop: 16, alignSelf: "stretch" }]} onPress={onClose}>
                <Text style={s.primaryBtnText}>{t(lang, "close")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.linkBtn} onPress={again} testID="feedback-again">
                <Text style={s.linkText}>{t(lang, "fbAnother")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[s.body, align, { marginHorizontal: 4, marginBottom: 12, lineHeight: 23 }]}>{t(lang, "fbIntro")}</Text>
              <View style={s.card}>
                <Text style={[s.label, align]}>{t(lang, "fbKind")}</Text>
                <View style={{ flexDirection: row, gap: 8 }}>
                  {KINDS.map(({ k, icon }) => {
                    const on = kind === k;
                    return (
                      <TouchableOpacity
                        key={k}
                        onPress={() => setKind(k)}
                        style={[
                          s.chip,
                          { flex: 1, flexDirection: row, alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 8 },
                          on && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                        ]}
                        testID={`fb-kind-${k}`}
                        accessibilityState={{ selected: on }}
                      >
                        <Ionicons name={icon} size={16} color={on ? "#fff" : COLORS.primary} />
                        <Text style={[s.chipText, on && { color: "#fff" }]}>{t(lang, `fb_${k}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[s.label, align, { marginTop: 16 }]}>{t(lang, "fbRating")}</Text>
                <View style={{ flexDirection: row, gap: 6 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setRating(rating === n ? null : n)}
                      style={{ padding: 4 }}
                      accessibilityLabel={`${n}/5`}
                      testID={`fb-star-${n}`}
                    >
                      <Ionicons name={rating !== null && n <= rating ? "star" : "star-outline"} size={30} color={COLORS.due} />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[s.label, align, { marginTop: 16 }]}>{t(lang, "fbMessage")}</Text>
                <TextInput
                  style={[s.input, align, { minHeight: 120, textAlignVertical: "top", paddingTop: 12 }]}
                  value={message}
                  onChangeText={(x) => {
                    setMessage(x.slice(0, MAX));
                    if (error) setError("");
                  }}
                  multiline
                  placeholder={t(lang, "fbMessagePh")}
                  placeholderTextColor={COLORS.unknown}
                  testID="fb-message"
                />
                <Text style={[s.hint, { textAlign: rtl ? "left" : "right" }]}>
                  {message.length}/{MAX}
                </Text>

                <Text style={[s.label, align, { marginTop: 8 }]}>{t(lang, "fbContact")}</Text>
                <TextInput
                  style={[s.input, { textAlign: "left" }]}
                  value={contact}
                  onChangeText={setContact}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={120}
                  placeholder={email ?? "name@example.com"}
                  placeholderTextColor={COLORS.unknown}
                  testID="fb-contact"
                />
                {!!email && <Text style={[s.hint, align]}>{t(lang, "fbContactSigned", { e: email })}</Text>}
                {!!car && <Text style={[s.hint, align, { marginTop: 8 }]}>{t(lang, "fbCarNote")}</Text>}

                {!!error && (
                  <View style={{ flexDirection: row, gap: 6, marginTop: 12, alignItems: "flex-start" }} testID="fb-error">
                    <Ionicons name="alert-circle" size={17} color={COLORS.overdue} style={{ marginTop: 1 }} />
                    <Text style={[s.note, align, { flex: 1, marginTop: 0, color: COLORS.overdue }]}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity style={[s.primaryBtn, { marginTop: 16 }]} onPress={send} disabled={sending} testID="fb-send">
                  {sending ? <ActivityIndicator color="#fff" /> : <Ionicons name="send" size={17} color="#fff" style={rtl ? { transform: [{ scaleX: -1 }] } : undefined} />}
                  <Text style={s.primaryBtnText}>{t(lang, error && error !== t(lang, "fbShort") && !sending ? "tryAgain" : "fbSend")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
