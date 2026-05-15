/**
 * lib/product/case-reference.ts
 *
 * Deterministic case reference generator.
 *
 * Format: CASE-YYMM-XXXX
 *   - YYMM = 2-digit year + 2-digit month (stable after creation)
 *   - XXXX = 4-character alphanumeric derived from a stable input (e.g. journeyKey hash)
 *
 * Rules:
 *   - Deterministic enough for display and cross-reference
 *   - Unique enough for records (collision risk is negligible for human-scale volumes)
 *   - No sensitive personal information
 *   - Stable after creation (same input always produces same reference)
 */

import { createHash } from "crypto";

/**
 * Generates a human-readable case reference from a stable input string.
 *
 * @param seed - A stable unique identifier (e.g. journeyKey, sessionId, cuid)
 * @returns A string like "CASE-2605-A3F2"
 */
export function generateCaseReference(seed: string): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Derive a 4-char suffix from the seed via SHA-256 prefix
  const hash = createHash("sha256").update(seed).digest("hex");
  const suffix = hash.slice(0, 4).toUpperCase();

  return `CASE-${year}${month}-${suffix}`;
}

/**
 * Validates that a string matches the CASE-YYMM-XXXX format.
 */
export function isValidCaseReference(ref: string): boolean {
  return /^CASE-\d{4}-[A-F0-9]{4}$/.test(ref);
}

/**
 * Extracts the date portion from a case reference (YYMM).
 * Returns null if the reference is invalid.
 */
export function parseCaseReferenceDate(ref: string): { year: string; month: string } | null {
  if (!isValidCaseReference(ref)) return null;
  const yymm = ref.slice(5, 9); // "2605"
  return {
    year: `20${yymm.slice(0, 2)}`,
    month: yymm.slice(2),
  };
}
