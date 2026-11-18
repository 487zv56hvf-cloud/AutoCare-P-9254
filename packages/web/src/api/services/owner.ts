/** The app owner's email (OWNER_EMAIL in .env). Lowercased; empty if unset. */
export const ownerEmail = () => (process.env.OWNER_EMAIL ?? "").trim().toLowerCase();

/**
 * Owner = signed in with the owner email AND that email is verified (Google sign-in).
 * Email/password accounts are never verified here, so they can't impersonate the owner.
 */
export function isOwner(user: { email?: string | null; emailVerified?: boolean | null } | null | undefined): boolean {
  const owner = ownerEmail();
  return !!owner && !!user?.emailVerified && (user.email ?? "").toLowerCase() === owner;
}
