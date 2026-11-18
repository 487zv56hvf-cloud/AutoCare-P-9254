import { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { randomUUID } from "expo-crypto";
import { client } from "../../lib/api";
import { t, type Lang } from "../i18n";
import { FAQ_KEYS } from "../faq";
import { loadChat, saveChat, loadAiConsent, saveAiConsent, type ChatState } from "../storage";
import { openSitePage } from "../links";
import { s, COLORS } from "./theme";

type Props = { lang: Lang; rtl: boolean; car?: string; onClose: () => void };

const newChat = (): ChatState => ({ conversationId: randomUUID(), messages: [] });

export function Support({ lang, rtl, car, onClose }: Props) {
  const [tab, setTab] = useState<"chat" | "faq">("chat");
  const row = rtl ? "row-reverse" : "row";

  return (
    <SafeAreaView style={[s.root, { backgroundColor: COLORS.card }]}>
      <View style={[s.header, { flexDirection: row, borderBottomWidth: 0 }]}>
        <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
          <Ionicons name="help-buoy-outline" size={22} color={COLORS.primary} />
          <Text style={[s.title, { fontSize: 20 }]}>{t(lang, "supportTitle")}</Text>
        </View>
        <TouchableOpacity onPress={onClose} accessibilityLabel={t(lang, "close")} style={{ padding: 6 }}>
          <Ionicons name="close" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: row, paddingHorizontal: 16, gap: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {(["chat", "faq"] as const).map((k) => {
          const on = tab === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setTab(k)}
              style={[s.chip, { flex: 1, alignItems: "center", flexDirection: row, justifyContent: "center", gap: 6 }, on && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
              testID={`tab-${k}`}
            >
              <Ionicons name={k === "chat" ? "chatbubbles-outline" : "list-outline"} size={16} color={on ? "#fff" : COLORS.text} />
              <Text style={[s.chipText, on && { color: "#fff" }]}>{t(lang, k === "chat" ? "chatTab" : "faqTab")}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === "chat" ? <Chat lang={lang} rtl={rtl} car={car} onFaq={() => setTab("faq")} /> : <Faq lang={lang} rtl={rtl} />}
    </SafeAreaView>
  );
}

function Chat({ lang, rtl, car, onFaq }: { lang: Lang; rtl: boolean; car?: string; onFaq: () => void }) {
  const [chat, setChat] = useState<ChatState | null>(null);
  // App Store 5.1.2(i): nothing is sent to the AI provider until the user agrees.
  const [consent, setConsent] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef<ScrollView>(null);
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";

  useEffect(() => {
    loadChat().then((c) => setChat(c ?? newChat()));
    loadAiConsent().then(setConsent);
  }, []);

  useEffect(() => {
    if (chat) saveChat(chat);
  }, [chat]);

  async function send() {
    const msg = text.trim();
    if (!msg || !chat || sending) return;
    setError("");
    setText("");
    setSending(true);
    let conv = chat;
    setChat({ ...conv, messages: [...conv.messages, { role: "user", text: msg }] });
    try {
      let r = await client.support.send({ conversationId: conv.conversationId, text: msg, car, aiConsent: true });
      if (r.error === "forbidden") {
        // This chat belongs to another signed-in account (e.g. after signing out): start a fresh one.
        conv = newChat();
        setChat({ ...conv, messages: [{ role: "user", text: msg }] });
        r = await client.support.send({ conversationId: conv.conversationId, text: msg, car, aiConsent: true });
      }
      if (r.error === "consent") {
        setConsent(false);
        throw new Error("consent");
      }
      if (r.error) throw new Error(r.error);
      setChat((c) =>
        c ? { ...c, conversationId: conv.conversationId, messages: [...c.messages, { role: "assistant", text: r.reply, needsHuman: r.needsHuman }] } : c,
      );
    } catch (e) {
      // Undo the optimistic bubble and give the text back so it can be resent.
      setChat((c) => (c ? { ...c, messages: c.messages.slice(0, -1) } : c));
      setText(msg);
      setError(t(lang, e instanceof Error && e.message === "unavailable" ? "chatUnavailable" : "chatOffline"));
    } finally {
      setSending(false);
    }
  }

  if (!chat || consent === null) return <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />;

  if (!consent)
    return (
      <ScrollView style={s.root} contentContainerStyle={s.scroll} testID="ai-consent">
        <View style={s.card}>
          <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
            <Ionicons name="shield-checkmark-outline" size={22} color={COLORS.primary} />
            <Text style={[s.itemTitle, align]}>{t(lang, "aiConsentTitle")}</Text>
          </View>
          <Text style={[s.body, align, { marginTop: 10, fontSize: 15, lineHeight: 23 }]}>{t(lang, "aiConsentBody")}</Text>
          <TouchableOpacity
            style={[s.primaryBtn, { marginTop: 16 }]}
            onPress={() => {
              setConsent(true);
              void saveAiConsent(true);
            }}
            testID="ai-consent-agree"
          >
            <Text style={s.primaryBtnText}>{t(lang, "aiConsentAgree")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, { marginTop: 10 }]} onPress={onFaq} testID="ai-consent-later">
            <Text style={s.secondaryBtnText}>{t(lang, "aiConsentLater")}</Text>
          </TouchableOpacity>
          <Text style={[s.hint, align, { marginTop: 12 }]}>{t(lang, "aiConsentFaq")}</Text>
          <TouchableOpacity onPress={() => void openSitePage("privacy")} style={{ paddingVertical: 8 }} accessibilityRole="link">
            <Text style={[s.linkText, align, { fontSize: 14 }]}>{t(lang, "privacyPolicy")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );

  const bubbles = [{ role: "assistant" as const, text: t(lang, "chatHello") }, ...chat.messages];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        ref={scroll}
        style={s.root}
        contentContainerStyle={{ padding: 16, paddingBottom: 12, gap: 10 }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        testID="chat-list"
      >
        {bubbles.map((m, i) => {
          const mine = m.role === "user";
          // "Mine" sits on the trailing side: right in English, left in Arabic.
          const side = mine === !rtl ? "flex-end" : "flex-start";
          return (
            <View key={i} style={{ alignItems: side }}>
              <View
                style={{
                  maxWidth: "85%",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: mine ? COLORS.primary : COLORS.card,
                  borderWidth: mine ? 0 : 1,
                  borderColor: COLORS.border,
                }}
                testID={mine ? "msg-user" : "msg-bot"}
              >
                <Text style={[s.body, align, { fontSize: 15, lineHeight: 22, color: mine ? "#fff" : COLORS.text }]}>{m.text}</Text>
              </View>
              {"needsHuman" in m && m.needsHuman && (
                <View style={{ flexDirection: row, alignItems: "center", gap: 4, marginTop: 4 }} testID="needs-human">
                  <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                  <Text style={[s.hint, { marginTop: 0, color: COLORS.primary }]}>{t(lang, "chatHuman")}</Text>
                </View>
              )}
            </View>
          );
        })}
        {sending && (
          <View style={{ alignItems: rtl ? "flex-end" : "flex-start" }}>
            <View style={{ flexDirection: row, gap: 8, alignItems: "center", padding: 10 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={s.muted}>{t(lang, "chatThinking")}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{ backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border, padding: 10 }}>
        {!!error && <Text style={[s.hint, align, { color: COLORS.overdue, marginTop: 0, marginBottom: 6, fontSize: 13 }]}>{error}</Text>}
        <View style={{ flexDirection: row, gap: 8, alignItems: "flex-end" }}>
          <TextInput
            style={[s.input, align, { flex: 1, maxHeight: 110, paddingVertical: 10 }]}
            value={text}
            onChangeText={setText}
            placeholder={t(lang, "chatPlaceholder")}
            placeholderTextColor={COLORS.unknown}
            multiline
            maxLength={1500}
            testID="chat-input"
            onKeyPress={(e) => {
              // Enter sends on web; Shift+Enter keeps a new line.
              const ne = e.nativeEvent as { key: string; shiftKey?: boolean };
              if (Platform.OS === "web" && ne.key === "Enter" && !ne.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <TouchableOpacity
            style={[s.primaryBtn, { width: 48, height: 48, paddingVertical: 0, borderRadius: 24 }, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={send}
            disabled={!text.trim() || sending}
            accessibilityLabel={t(lang, "send")}
            testID="chat-send"
          >
            <Ionicons name="send" size={19} color="#fff" style={rtl ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: row, alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
          <Text style={[s.hint, align, { flex: 1, marginTop: 0 }]}>{t(lang, "chatNote")}</Text>
          {chat.messages.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setError("");
                setChat(newChat());
              }}
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <Text style={[s.linkText, { fontSize: 13 }]}>{t(lang, "newChat")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function Faq({ lang, rtl }: { lang: Lang; rtl: boolean }) {
  const [open, setOpen] = useState<string | null>(FAQ_KEYS[0]);
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const row = rtl ? "row-reverse" : "row";
  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>
      <Text style={[s.label, align, { marginHorizontal: 4, marginBottom: 8 }]}>{t(lang, "faqTitle")}</Text>
      {FAQ_KEYS.map((k) => {
        const isOpen = open === k;
        return (
          <TouchableOpacity key={k} activeOpacity={0.8} style={[s.card, { paddingVertical: 14 }]} onPress={() => setOpen(isOpen ? null : k)}>
            <View style={{ flexDirection: row, alignItems: "center", gap: 10 }}>
              <Text style={[s.body, align, { flex: 1, fontWeight: "700" }]}>{t(lang, `${k}q`)}</Text>
              <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={18} color={COLORS.muted} />
            </View>
            {isOpen && <Text style={[s.body, align, { marginTop: 8, fontSize: 14, lineHeight: 21, color: COLORS.muted }]}>{t(lang, `${k}a`)}</Text>}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
