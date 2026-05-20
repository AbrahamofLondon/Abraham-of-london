import {
  getResolvedAdminEmails,
  getResolvedAdminEmailSet,
  isResolvedAdminEmail,
  normalizeAdminEmail,
} from "./admin-email-resolver";

export { normalizeAdminEmail };

export const BOOTSTRAP_ADMIN_EMAILS = getResolvedAdminEmailSet();

export function getBootstrapAdminEmails(): readonly string[] {
  return getResolvedAdminEmails();
}

export function isBootstrapAdminEmail(email: unknown): boolean {
  return isResolvedAdminEmail(email);
}

export const ADMIN_EMAILS = getBootstrapAdminEmails();

export function isAdminEmail(email: unknown): boolean {
  return isBootstrapAdminEmail(email);
}
