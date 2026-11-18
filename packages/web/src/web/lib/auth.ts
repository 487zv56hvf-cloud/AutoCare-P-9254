import { createAuthClient } from "better-auth/react";
import { managedAuthClient } from "@runablehq/managed-auth/client";

// Email and managed login use the same browser token key (managed-auth 0.4).
const TOKEN_KEY = "runable.managed-auth.token";
/** A sign-in token is stored: probably a returning user (still confirmed by the session check). */
export function hasToken(): boolean {
  try {
    return !!localStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}
/** Last signed-in account id, used only to start loading its cars while the session is checked. */
const UID_KEY = "autocare.web.uid";
export function lastUserId(): string | null {
  try {
    return localStorage.getItem(UID_KEY);
  } catch {
    return null;
  }
}
export function rememberUserId(id: string | null) {
  try {
    if (id) localStorage.setItem(UID_KEY, id);
    else localStorage.removeItem(UID_KEY);
  } catch {}
}
export function captureToken(ctx: { response: Response }) {
  const token = ctx.response.headers.get("set-auth-token");
  if (token) localStorage.setItem(TOKEN_KEY, token);
}
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_WEBSITE_URL ?? window.location.origin,
  basePath: "/api/auth",
  plugins: [
    managedAuthClient({
      applicationId: import.meta.env.VITE_APPLICATION_ID,
      issuer: import.meta.env.VITE_RUNABLE_AUTH_ISSUER,
    }),
  ],
});
/** Shown once on the sign-in page after the account was deleted. */
export const DELETED_KEY = "autocare.web.deleted";
/** Clears every trace of the signed-in account from this browser (after deleting it). */
export function forgetAccount() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(UID_KEY);
    for (const k of Object.keys(localStorage))
      if (
        k.startsWith("autocare.web.chat.") ||
        k.startsWith("autocare.web.aiConsent.")
      )
        localStorage.removeItem(k);
    sessionStorage.setItem(DELETED_KEY, "1");
  } catch {}
}
