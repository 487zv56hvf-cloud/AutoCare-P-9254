import { createAuthClient } from "better-auth/react";
import { managedAuthExpoClient } from "@runablehq/managed-auth/native";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { getRandomValues } from "expo-crypto";

// Hermes (iPhone/Android) has no Web Crypto. Managed Apple/Google sign-in calls
// crypto.getRandomValues for its PKCE nonce, so provide it from expo-crypto.
const g = globalThis as { crypto?: { getRandomValues?: unknown } };
if (!isNativeCryptoReady()) {
  g.crypto = { ...g.crypto, getRandomValues };
}
function isNativeCryptoReady() {
  return typeof g.crypto?.getRandomValues === "function";
}

// Platform-managed identity: never edit `expo.extra` or `expo.scheme` in app.json.
const extra = Constants.expoConfig?.extra ?? {};
const isWeb = Platform.OS === "web";
const TOKEN_KEY = "bearer_token";

/** One token store shared by Google (managed) and email/password sign-in. */
export function getToken(): string {
  try {
    if (isWeb) return localStorage.getItem(TOKEN_KEY) ?? "";
    return SecureStore.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setToken(token: string) {
  try {
    if (isWeb) {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } else if (token) SecureStore.setItem(TOKEN_KEY, token);
    else void SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // storage unavailable: session lasts until the app closes
  }
}

export const authClient = createAuthClient({
  baseURL: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
  basePath: "/api/auth",
  fetchOptions: {
    ...(isWeb ? { credentials: "omit" as const } : {}),
    auth: { type: "Bearer", token: () => getToken() },
    headers: isWeb ? {} : { "expo-origin": "mobile://" },
  },
  plugins: [
    managedAuthExpoClient({
      applicationId: extra.applicationId,
      issuer: extra.runableAuthIssuer,
      storage: { getToken, setToken, clearToken: () => setToken("") },
    }),
  ],
});

/** Pass as onSuccess to email sign-in/sign-up to keep the bearer token. */
export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) setToken(token);
}

export async function signOut() {
  const result=await authClient.signOut();
  if(result.error)throw new Error(result.error.message ?? "Sign-out failed");
  setToken("");
  authClient.$store.notify("$sessionSignal");
}
