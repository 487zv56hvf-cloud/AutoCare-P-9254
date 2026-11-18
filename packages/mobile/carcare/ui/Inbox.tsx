import { useState, type ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../../lib/api";
import { t, type Lang } from "../i18n";
import { s, COLORS } from "./theme";

type Props = { lang: Lang; rtl: boolean; onBack: () => void };
type Show = "open" | "done" | "all";

const when = (lang: Lang, d: Date | string) => {
  try {
    return new Date(d).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(d);
  }
};

/** Owner-only inbox: customer chats the assistant handed to the team, and feedback. */
export function Inbox({ lang, rtl, onBack }: Props) {
  const [tab, setTab] = useState<"chats" | "feedback">("chats");
  const [openId, setOpenId] = useState<string | null>(null);
  const counts = useQuery({ ...orpc.owner.counts.queryOptions(), refetchInterval: 30_000 });
  const newFb = counts.data?.newFeedback ?? 0;
  const row = rtl ? "row-reverse" : "row";
  if (openId) return <Thread lang={lang} rtl={rtl} id={openId} onBack={() => setOpenId(null)} />;
  const tabs = (
      <View style={{ flexDirection: row, gap: 8, paddingHorizontal: 16, paddingBottom: 10 }}>
        {(["chats", "feedback"] as const).map((k) => {
          const on = tab === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setTab(k)}
              style={[
                s.chip,
                { flex: 1, flexDirection: row, alignItems: "center", justifyContent: "center", gap: 6 },
                on && { backgroundColor: COLORS.text, borderColor: COLORS.text },
              ]}
              testID={`inbox-tab-${k}`}
            >
              <Ionicons name={k === "chats" ? "chatbubbles-outline" : "megaphone-outline"} size={16} color={on ? "#fff" : COLORS.text} />
              <Text style={[s.chipText, on && { color: "#fff" }]}>{t(lang, k === "chats" ? "inboxTabChats" : "inboxTabFeedback")}</Text>
              {k === "feedback" && newFb > 0 && (
                <View style={[s.badge, { backgroundColor: COLORS.due, paddingVertical: 1, paddingHorizontal: 7 }]}>
                  <Text style={[s.badgeText, { fontSize: 11 }]}>{newFb > 99 ? "99+" : newFb}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
  );
  return (
    <SafeAreaView style={[s.root, { backgroundColor: COLORS.card }]}>
      {tab === "chats" ? (
        <Chats lang={lang} rtl={rtl} onBack={onBack} tabs={tabs} onOpen={setOpenId} />
      ) : (
        <FeedbackList lang={lang} rtl={rtl} onBack={onBack} tabs={tabs} />
      )}
    </SafeAreaView>
  );
}

type ListProps = Props & { tabs: ReactNode };

function Chats({ lang, rtl, onBack, tabs, onOpen }: ListProps & { onOpen: (id: string) => void }) {
  const [show, setShow] = useState<Show>("open");
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const list = useQuery({ ...orpc.owner.inbox.queryOptions({ input: { show } }), refetchInterval: 30_000 });

  return (
    <View style={s.root}>
      <Header lang={lang} rtl={rtl} title={t(lang, "inboxBtn")} onBack={onBack} onRefresh={() => list.refetch()} />
      {tabs}
      <View style={{ flexDirection: row, gap: 8, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {(["open", "done", "all"] as const).map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setShow(k)}
            style={[s.chip, { flex: 1, alignItems: "center" }, show === k && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
            testID={`inbox-${k}`}
          >
            <Text style={[s.chipText, show === k && { color: "#fff" }]}>{t(lang, `inbox_${k}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={s.root} contentContainerStyle={s.scroll}>
        {list.isPending ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : list.isError ? (
          <Text style={[s.body, align, { color: COLORS.overdue }]}>{t(lang, "restoreError")}</Text>
        ) : !list.data.length ? (
          <View style={[s.center, { paddingVertical: 40, gap: 8 }]}>
            <Ionicons name="checkmark-done-circle-outline" size={44} color={COLORS.ok} />
            <Text style={[s.muted, { textAlign: "center" }]}>{t(lang, "inboxEmpty")}</Text>
          </View>
        ) : (
          list.data.map((c) => (
            <TouchableOpacity key={c.conversationId} style={s.card} onPress={() => onOpen(c.conversationId)} testID="inbox-item">
              <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
                <View style={[s.badge, { backgroundColor: c.open ? COLORS.due : COLORS.ok }]}>
                  <Text style={s.badgeText}>{t(lang, c.open ? "inbox_open" : "inbox_done")}</Text>
                </View>
                <Text style={[s.muted, align, { flex: 1, marginTop: 0 }]}>{when(lang, c.flaggedAt)}</Text>
              </View>
              <Text style={[s.body, align, { fontWeight: "700", marginTop: 8 }]}>{c.email ?? t(lang, "inboxGuest")}</Text>
              <Text style={[s.body, align, { marginTop: 4, color: COLORS.muted, fontSize: 14 }]} numberOfLines={2}>
                {c.preview}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

type FbShow = "new" | "read" | "all";
const FB_ICON = { idea: "bulb-outline", problem: "warning-outline", other: "chatbox-ellipses-outline" } as const;

function FeedbackList({ lang, rtl, onBack, tabs }: ListProps) {
  const [show, setShow] = useState<FbShow>("new");
  const qc = useQueryClient();
  const row = rtl ? "row-reverse" : "row";
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const list = useQuery({ ...orpc.owner.feedback.queryOptions({ input: { show } }), refetchInterval: 30_000 });
  const mark = useMutation({
    ...orpc.owner.setFeedbackRead.mutationOptions(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: orpc.owner.key() }),
  });

  return (
    <View style={s.root}>
      <Header lang={lang} rtl={rtl} title={t(lang, "inboxBtn")} onBack={onBack} onRefresh={() => list.refetch()} />
      {tabs}
      <View style={{ flexDirection: row, gap: 8, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        {(["new", "read", "all"] as const).map((k) => (
          <TouchableOpacity
            key={k}
            onPress={() => setShow(k)}
            style={[s.chip, { flex: 1, alignItems: "center" }, show === k && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }]}
            testID={`fb-${k}`}
          >
            <Text style={[s.chipText, show === k && { color: "#fff" }]}>{t(lang, k === "all" ? "inbox_all" : `fb_${k}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={s.root} contentContainerStyle={s.scroll}>
        {list.isPending ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />
        ) : list.isError ? (
          <Text style={[s.body, align, { color: COLORS.overdue }]}>{t(lang, "restoreError")}</Text>
        ) : !list.data.length ? (
          <View style={[s.center, { paddingVertical: 40, gap: 8 }]}>
            <Ionicons name="megaphone-outline" size={42} color={COLORS.unknown} />
            <Text style={[s.muted, { textAlign: "center" }]}>{t(lang, "fbEmpty")}</Text>
          </View>
        ) : (
          list.data.map((f) => (
            <View key={f.id} style={[s.card, !f.read && { borderColor: COLORS.due, borderWidth: 1.5 }]} testID="fb-item">
              <View style={{ flexDirection: row, alignItems: "center", gap: 8 }}>
                <Ionicons name={FB_ICON[f.kind as keyof typeof FB_ICON] ?? FB_ICON.other} size={19} color={COLORS.primary} />
                <Text style={[s.body, { fontWeight: "700", fontSize: 15 }]}>{t(lang, `fb_${f.kind}`)}</Text>
                {!!f.rating && <Text style={{ color: COLORS.due, fontSize: 14, letterSpacing: 1 }}>{"★".repeat(f.rating)}</Text>}
                <Text style={[s.muted, { flex: 1, marginTop: 0, textAlign: rtl ? "left" : "right" }]}>{when(lang, f.createdAt)}</Text>
              </View>
              <Text style={[s.body, align, { marginTop: 10, lineHeight: 23 }]} selectable>
                {f.message}
              </Text>
              <View style={{ marginTop: 10, gap: 2 }}>
                <Text style={[s.muted, align]} selectable>
                  {t(lang, "fbFrom", { e: f.account ?? t(lang, "inboxGuest") })}
                </Text>
                {!!f.contact && f.contact !== f.account && (
                  <Text style={[s.muted, align]} selectable>
                    {t(lang, "fbReply", { c: f.contact })}
                  </Text>
                )}
                {!!f.car && <Text style={[s.muted, align]}>{f.car}</Text>}
                <Text style={[s.hint, align, { color: f.emailed ? COLORS.ok : COLORS.muted }]}>{t(lang, f.emailed ? "fbEmailed" : "fbNotEmailed")}</Text>
              </View>
              <TouchableOpacity
                style={[s.secondaryBtn, { marginTop: 12 }]}
                onPress={() => mark.mutate({ id: f.id, read: !f.read })}
                disabled={mark.isPending}
                testID="fb-mark"
              >
                <Ionicons name={f.read ? "mail-unread-outline" : "checkmark-done"} size={18} color={COLORS.primary} />
                <Text style={s.secondaryBtnText}>{t(lang, f.read ? "fbMarkUnread" : "fbMarkRead")}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Thread({ lang, rtl, id, onBack }: { lang: Lang; rtl: boolean; id: string; onBack: () => void }) {
  const qc = useQueryClient();
  const msgs = useQuery(orpc.owner.conversation.queryOptions({ input: { conversationId: id } }));
  const mark = useMutation({
    ...orpc.owner.setHandled.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: orpc.owner.key() });
      onBack();
    },
  });
  const align = { textAlign: rtl ? "right" : "left" } as const;
  const open = (msgs.data ?? []).some((m) => m.needsHuman && !m.handled);

  return (
    <SafeAreaView style={[s.root, { backgroundColor: COLORS.card }]}>
      <Header lang={lang} rtl={rtl} title={t(lang, "inboxChat")} onBack={onBack} onRefresh={() => msgs.refetch()} />
      <ScrollView style={s.root} contentContainerStyle={{ padding: 16, gap: 10 }}>
        {msgs.isPending && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 30 }} />}
        {(msgs.data ?? []).map((m) => {
          const customer = m.role === "user";
          return (
            <View key={m.id} style={{ alignItems: customer === !rtl ? "flex-start" : "flex-end" }}>
              <Text style={[s.hint, { marginTop: 0, marginBottom: 3 }]}>
                {t(lang, customer ? "inboxCustomer" : "inboxBot")} · {when(lang, m.createdAt)}
              </Text>
              <View
                style={{
                  maxWidth: "88%",
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: customer ? "#E7F6EF" : COLORS.card,
                  borderWidth: 1,
                  borderColor: m.needsHuman ? COLORS.due : COLORS.border,
                }}
              >
                <Text style={[s.body, align, { fontSize: 15, lineHeight: 22 }]}>{m.content}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      {!!msgs.data && (
        <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border }}>
          {open ? (
            <TouchableOpacity
              style={s.primaryBtn}
              onPress={() => mark.mutate({ conversationId: id, handled: true })}
              disabled={mark.isPending}
              testID="mark-done"
            >
              {mark.isPending ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-done" size={19} color="#fff" />}
              <Text style={s.primaryBtnText}>{t(lang, "inboxMarkDone")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.secondaryBtn} onPress={() => mark.mutate({ conversationId: id, handled: false })} disabled={mark.isPending} testID="reopen">
              <Ionicons name="refresh-circle-outline" size={19} color={COLORS.primary} />
              <Text style={s.secondaryBtnText}>{t(lang, "inboxReopen")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ lang, rtl, title, onBack, onRefresh }: { lang: Lang; rtl: boolean; title: string; onBack: () => void; onRefresh: () => void }) {
  const row = rtl ? "row-reverse" : "row";
  return (
    <View style={[s.header, { flexDirection: row, borderBottomWidth: 0 }]}>
      <TouchableOpacity onPress={onBack} style={{ padding: 6 }} accessibilityLabel={t(lang, "back")} testID="inbox-back">
        <Ionicons name={rtl ? "arrow-forward" : "arrow-back"} size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={[s.title, { fontSize: 19, flex: 1, textAlign: "center" }]}>{title}</Text>
      <TouchableOpacity onPress={onRefresh} style={{ padding: 6 }} accessibilityLabel={t(lang, "refresh")}>
        <Ionicons name="refresh" size={22} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
}
