import crypto from "crypto";

export const ADMIN_MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

export function createAdminMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashAdminMagicLinkToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function normalizeAdminMagicLinkEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}
