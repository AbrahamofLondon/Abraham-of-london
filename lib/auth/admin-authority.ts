/**
 * Admin Authority — canonical admin identity enforcement.
 *
 * Single source of truth for admin access control.
 * Used by: proxy, middleware, server guards, client nav, API routes.
 *
 * Access requires BOTH:
 * 1. Email in ADMIN_EMAILS
 * 2. Role is admin/owner/root
 *
 * No public fallback. No client-only permission. No email-only access.
 */

export const ADMIN_EMAILS = [
  "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
] as const;

export function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isAdminEmail(email: unknown): boolean {
  return (ADMIN_EMAILS as readonly string[]).includes(normalizeEmail(email));
}

export function isAdminRole(role: unknown): boolean {
  const r = typeof role === "string" ? role.trim().toLowerCase() : "";
  return r === "admin" || r === "owner" || r === "root";
}

export function isAuthorizedAdmin(subject: {
  email?: unknown;
  role?: unknown;
}): boolean {
  return isAdminEmail(subject.email) && isAdminRole(subject.role);
}
