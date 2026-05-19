/**
 * Privileged identity bootstrap list.
 *
 * Role assignment:
 *   info@abrahamoflondon.org      → OWNER  (official account, full control)
 *   admin@abrahamoflondon.org     → ADMIN  (administrative access)
 *   seunadaramola@gmail.com       → FALLBACK ADMIN
 *   abrahamadaramola@outlook.com  → FALLBACK ADMIN
 *
 * These emails are checked at NextAuth sign-in to assign User.role in the
 * database. The database role is the single source of truth for all access
 * checks via getUserAccess() → permissions.isAdmin / permissions.isOwner.
 */
export const BOOTSTRAP_ADMIN_EMAILS = new Set([
  "info@abrahamoflondon.org",
  "admin@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
]);

export function normalizeAdminEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function getBootstrapAdminEmails(): readonly string[] {
  return Array.from(BOOTSTRAP_ADMIN_EMAILS);
}

export function isBootstrapAdminEmail(email: unknown): boolean {
  const normalized = normalizeAdminEmail(email);
  return Boolean(normalized) && BOOTSTRAP_ADMIN_EMAILS.has(normalized);
}

export const ADMIN_EMAILS = getBootstrapAdminEmails();

export function isAdminEmail(email: unknown): boolean {
  return isBootstrapAdminEmail(email);
}
