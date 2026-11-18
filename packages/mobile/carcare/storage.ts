import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Lang } from "./i18n";
import type { Vehicle } from "./maintenance";
import { withId } from "./cloud";

const KEY = "carcare.egypt.v1";

/**
 * owner: account id the cars on this phone belong to (null = made while signed out).
 * removed: ids deleted on this phone whose cloud copy still has to be deleted (sent when online).
 */
export type Saved = {
  lang?: Lang;
  vehicles: Vehicle[];
  activeId: string | null;
  owner: string | null;
  removed: string[];
  synced?: Record<string, string>;
};

/** Version 1 of the app stored a single `vehicle`; it is read as a one-car list. */
type RawSaved = Partial<Saved> & { vehicle?: Vehicle | null };

export async function loadState(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as RawSaved;
    const list = Array.isArray(d.vehicles)
      ? d.vehicles
      : d.vehicle
        ? [d.vehicle]
        : [];
    const vehicles = list.filter((v) => v && typeof v === "object").map(withId);
    const activeId = vehicles.some((v) => v.id === d.activeId)
      ? (d.activeId as string)
      : (vehicles[0]?.id ?? null);
    return {
      lang: d.lang === "en" || d.lang === "ar" ? d.lang : undefined,
      vehicles,
      activeId,
      owner: typeof d.owner === "string" ? d.owner : null,
      removed: Array.isArray(d.removed)
        ? d.removed.filter((x): x is string => typeof x === "string")
        : [],
      synced:
        d.synced && typeof d.synced === "object"
          ? Object.fromEntries(
              Object.entries(d.synced).filter(([, v]) => typeof v === "string"),
            )
          : {},
    };
  } catch {
    return null;
  }
}

export async function saveState(state: Saved): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage is best-effort; the app keeps working in memory.
  }
}

const CHAT_KEY = "carcare.egypt.chat.v1";

export type ChatMsg = {
  role: "user" | "assistant";
  text: string;
  needsHuman?: boolean;
  failed?: boolean;
};
export type ChatState = { conversationId: string; messages: ChatMsg[] };

export async function loadChat(): Promise<ChatState | null> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_KEY);
    const c = raw ? (JSON.parse(raw) as ChatState) : null;
    return c &&
      typeof c.conversationId === "string" &&
      Array.isArray(c.messages)
      ? c
      : null;
  } catch {
    return null;
  }
}

export async function saveChat(chat: ChatState): Promise<void> {
  try {
    // Keep the device copy small; the server keeps the full history.
    await AsyncStorage.setItem(
      CHAT_KEY,
      JSON.stringify({ ...chat, messages: chat.messages.slice(-60) }),
    );
  } catch {
    // best-effort
  }
}

// App Store 5.1.2(i): the support chat sends messages to an AI provider only after the user agrees.
const AI_CONSENT_KEY = "carcare.egypt.aiConsent.v1";

export async function loadAiConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AI_CONSENT_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function saveAiConsent(on: boolean): Promise<void> {
  try {
    if (on) await AsyncStorage.setItem(AI_CONSENT_KEY, "1");
    else await AsyncStorage.removeItem(AI_CONSENT_KEY);
  } catch {
    // storage unavailable: the notice shows again next time
  }
}

/** After deleting the account: forget the support chat and the AI consent on this device. */
export async function clearAccountExtras(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([CHAT_KEY, AI_CONSENT_KEY]);
  } catch {
    // ignore
  }
}
