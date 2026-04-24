/**
 * Admin Authority — canonical admin identity enforcement.
 *
 * SINGLE SOURCE OF TRUTH for all admin access control.
 * Used by: proxy, middleware, server guards, client nav, API routes.
 *
 * Access requires BOTH:
 * 1. Email in ADMIN_EMAILS
 * 2. Role is admin/owner/root
 */

import type { Session } from "next-auth";

export const ADMIN_EMAILS = [
  "info@abrahamoflondon.org",
  "seunadaramola@gmail.com",
  "abrahamadaramola@outlook.com",
] as const;

export type AdminRole = "owner" | "admin" | "root";

export function normalizeAdminEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function isAdminEmail(email: unknown): boolean {
  const normalized = normalizeAdminEmail(email);
  return (ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export function normalizeAdminRole(role: unknown): string {
  return typeof role === "string" ? role.trim().toLowerCase() : "";
}

export function isAdminRole(role: unknown): boolean {
  const normalized = normalizeAdminRole(role);
  return normalized === "owner" || normalized === "admin" || normalized === "root";
}

export function extractSessionRole(session: Session | null | undefined): unknown {
  return (
    (session?.user as any)?.role ??
    (session?.user as any)?.aol?.role ??
    (session as any)?.role ??
    null
  );
}

export function isAuthorizedAdminSubject(subject: {
  email?: unknown;
  role?: unknown;
}): boolean {
  return isAdminEmail(subject.email) && isAdminRole(subject.role);
}

export function isAuthorizedAdminSession(session: Session | null | undefined): boolean {
  return isAuthorizedAdminSubject({
    email: session?.user?.email,
    role: extractSessionRole(session),
  });
}
