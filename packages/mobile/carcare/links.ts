import Constants from "expo-constants";
import { Linking, Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

/** The AutoCare website (same server as the API). Its /privacy and /support pages need no sign-in. */
const site = String(
  Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? "",
).replace(/\/+$/, "");

export const siteUrl = (path: "privacy" | "support") => `${site}/${path}`;

/** Opens the privacy policy or support page in an in-app browser (a new tab on web). */
export async function openSitePage(path: "privacy" | "support"): Promise<void> {
  const url = siteUrl(path);
  if (Platform.OS === "web") {
    window.open(url, "_blank", "noopener");
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url).catch(() => undefined);
  }
}
