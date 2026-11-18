import { useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { t, type Lang } from "../lib/carcare";
import {
  useOwnerFeedback,
  useOwnerChats,
  useConversation,
  useReadFeedback,
  useHandleChat,
} from "../queries/support";
export function OwnerInbox({
  lang,
  onBack,
}: {
  lang: Lang;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<"feedback" | "chats">("feedback"),
    [filter, setFilter] = useState<"new" | "read" | "all">("new"),
    [chatFilter, setChatFilter] = useState<"open" | "done" | "all">("open"),
    [conversationId, setConversationId] = useState("");
  const fb = useOwnerFeedback(filter, tab === "feedback"),
    chats = useOwnerChats(chatFilter, tab === "chats"),
    conversation = useConversation(conversationId),
    read = useReadFeedback(),
    handle = useHandleChat();
  const [error, setError] = useState("");
  async function toggleFeedback(id: number, value: boolean) {
    try {
      await read.mutateAsync({ id, read: value });
    } catch {
      setError(t(lang, "restoreError"));
    }
  }
  async function toggleChat(id: string, value: boolean) {
    try {
      await handle.mutateAsync({ conversationId: id, handled: value });
    } catch {
      setError(t(lang, "restoreError"));
    }
  }
  return (
    <div>
      <button className="back-link" onClick={onBack}>
        <ArrowLeft size={16} />
        {t(lang, "back")}
      </button>
      <h1>{t(lang, "inboxBtn")}</h1>
      <div className="segmented">
        {(["feedback", "chats"] as const).map((x) => (
          <button
            key={x}
            className={tab === x ? "selected" : ""}
            onClick={() => {
              setTab(x);
              setConversationId("");
            }}
          >
            {t(lang, x === "feedback" ? "inboxTabFeedback" : "inboxTabChats")}
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {tab === "feedback" ? (
        <>
          <select
            aria-label={t(lang, "refresh")}
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            {(["new", "read", "all"] as const).map((x) => (
              <option value={x} key={x}>
                {t(lang, x === "all" ? "inbox_all" : `fb_${x}`)}
              </option>
            ))}
          </select>
          {fb.isPending ? (
            <LoaderCircle className="spin" />
          ) : fb.error ? (
            <p className="error">{t(lang, "restoreError")}</p>
          ) : !fb.data?.length ? (
            <div className="empty-state">{t(lang, "fbEmpty")}</div>
          ) : (
            fb.data.map((r) => (
              <section className="panel" key={r.id}>
                <h3>{r.account ?? r.contact ?? t(lang, "inboxGuest")}</h3>
                <p className="small-muted">
                  {t(lang, `fb_${r.kind}`)} ·{" "}
                  {new Date(r.createdAt).toLocaleString(
                    lang === "ar" ? "ar-EG" : "en-GB",
                  )}
                  {r.rating ? ` · ${r.rating}/5` : ""}
                </p>
                <p className="inbox-message" dir="auto">
                  {r.message}
                </p>
                {r.contact && <p>{t(lang, "fbReply", { c: r.contact })}</p>}
                <button
                  className="btn btn-secondary"
                  disabled={read.isPending}
                  onClick={() => void toggleFeedback(r.id, !r.read)}
                >
                  {t(lang, r.read ? "fbMarkUnread" : "fbMarkRead")}
                </button>
              </section>
            ))
          )}
        </>
      ) : (
        <>
          <select
            value={chatFilter}
            aria-label={t(lang, "refresh")}
            onChange={(e) => setChatFilter(e.target.value as typeof chatFilter)}
          >
            {(["open", "done", "all"] as const).map((x) => (
              <option value={x} key={x}>
                {t(lang, `inbox_${x}`)}
              </option>
            ))}
          </select>
          {chats.isPending ? (
            <LoaderCircle className="spin" />
          ) : chats.error ? (
            <p className="error">{t(lang, "restoreError")}</p>
          ) : !chats.data?.length ? (
            <div className="empty-state">{t(lang, "inboxEmpty")}</div>
          ) : (
            chats.data.map((r) => (
              <section key={r.conversationId} className="panel">
                <h3>{r.email ?? t(lang, "inboxGuest")}</h3>
                <p dir="auto">{r.preview}</p>
                <div className="form-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setConversationId(r.conversationId)}
                  >
                    {t(lang, "chatTab")}
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={handle.isPending}
                    onClick={() => void toggleChat(r.conversationId, r.open)}
                  >
                    {t(lang, r.open ? "inboxMarkDone" : "inboxReopen")}
                  </button>
                </div>
                {conversationId === r.conversationId && (
                  <div>
                    {conversation.isPending ? (
                      <LoaderCircle className="spin" />
                    ) : conversation.error ? (
                      <p className="error">{t(lang, "restoreError")}</p>
                    ) : (
                      conversation.data?.map((m) => (
                        <div
                          className={`chat-message ${m.role}`}
                          key={m.id}
                          dir="auto"
                        >
                          {m.content}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
