/**
 * lib/product/governed-case-hash.ts
 *
 * Deterministic provenance hash for governed case records.
 *
 * Hashes only the safe canonical result payload — no internal notes,
 * suppression details, actor IDs, or unsupported provenance claims.
 *
 * Uses SHA-256 over stable canonical JSON.
 * Does NOT claim chain anchoring unless the case is actually anchored.
 */

import { createHash } from "crypto";

/**
 * Stable canonical representation of a record for hashing.
 * Sorts keys alphabetically, removes undefined values, and produces
 * a deterministic JSON string.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonicalize(v)]),
    );
  }
  return value;
}

/**
 * Builds a SHA-256 provenance hash from a safe canonical payload object.
 *
 * @param payload - The safe, client-safe payload to hash.
 * @returns Hex-encoded SHA-256 digest.
 */
export function buildGovernedCaseHash(payload: Record<string, unknown>): string {
  const canonical = canonicalize(payload);
  return createHash("sha256")
    .update(JSON.stringify(canonical))
    .digest("hex");
}

/**
 * Verifies that a payload matches a given provenance hash.
 *
 * @param payload - The payload to verify.
 * @param expectedHash - The expected hash value.
 * @returns True if the payload produces the expected hash.
 */
export function verifyGovernedCaseHash(
  payload: Record<string, unknown>,
  expectedHash: string,
): boolean {
  return buildGovernedCaseHash(payload) === expectedHash;
}
