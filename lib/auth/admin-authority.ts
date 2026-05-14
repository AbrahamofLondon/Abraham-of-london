/**
 * Admin Authority — session/edge admin identity helpers.
 *
 * The canonical bootstrap email source lives in lib/access/admin-emails.
 * Runtime page/API guards should prefer getUserAccess().permissions.isAdmin.
 */

import type { Session } from "next-auth";
import {
  ADMIN_EMAILS,
  isAdminEmail,
  isBootstrapAdminEmail,
  normalizeAdminEmail,
} from "@/lib/access/admin-emails";

export {
  ADMIN_EMAILS,
  isAdminEmail,
  isBootstrapAdminEmail,
  normalizeAdminEmail,
};

export type AdminRole = "owner" | "admin" | "root";

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
  return isAdminRole(subject.role) || isBootstrapAdminEmail(subject.email);
}

export function isAuthorizedAdminSession(session: Session | null | undefined): boolean {
  const accessAdmin = (session?.user as any)?.access?.permissions?.isAdmin;
  if (typeof accessAdmin === "boolean") {
    return accessAdmin;
  }

  return isAuthorizedAdminSubject({
    email: session?.user?.email,
    role: extractSessionRole(session),
  });
}
