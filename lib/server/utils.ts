// lib/server/utils.ts
import crypto from "crypto";

/**
 * Extracts the last 6 characters of a key for safe logging/display.
 * Handles both legacy and icl_ prefixed keys.
 */
export function getKeySuffix(key: string): string {
  if (!key) return "unknown";
  const trimmed = key.trim();
  return trimmed.slice(-6);
}

/**
 * Generates a privacy-safe prefix of a SHA-256 hash.
 * Used for identifying members without storing full emails or hashes in logs.
 */
export function getHashPrefix(value: string, length: number = 10): string {
  const hash = crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
  return hash.slice(0, length);
}

/**
 * Validates the structure of an Inner Circle key.
 */
export function isValidKeyFormat(key: string): boolean {
  // Support legacy keys (ABCD-1234...) and new icl_ keys
  const legacyRegex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
  const iclRegex = /^icl_[A-Za-z0-9_-]{28}$/;
  return legacyRegex.test(key) || iclRegex.test(key);
}

/**
 * Standardized server-side audit logger.
 */
export function auditLog(action: string, metadata: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} | ${action} |`, JSON.stringify(metadata));
}
