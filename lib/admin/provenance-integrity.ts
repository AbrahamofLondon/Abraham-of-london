/**
 * lib/admin/provenance-integrity.ts
 *
 * Provenance hash integrity check — verifies that the hash stored in the
 * oversight cycle archive matches what the canonical composer would produce
 * for the same cycle state.
 *
 * Mismatch protocol:
 * If storedHash differs from recomputedHash:
 * - Do NOT silently overwrite the stored hash
 * - Return MISMATCH status with both hashes for forensic comparison
 * - The caller should surface this as a CRITICAL provenance gap
 * - Require operator/admin review before any automated resolution
 *
 * This is NOT a tamper-detection system. The hash proves that the composed
 * record matches the stored value. If the source data has changed, the hash
 * will differ — this is expected and indicates the record was recomposed
 * from updated data, not tampered with.
 */

import type { DecisionProvenanceRecord } from "./decision-provenance-record";

export type IntegrityStatus = "MATCH" | "MISMATCH" | "UNAVAILABLE";

export type ProvenanceIntegrityCheck = {
  status: IntegrityStatus;
  storedHash?: string | null;
  recomputedHash?: string | null;
  checkedAt: string;
  message: string;
};

/**
 * Check whether a stored provenance hash matches a freshly recomputed one.
 *
 * @param storedHash - The hash previously persisted (e.g. in AuditEvent metadata)
 * @param recomputedRecord - The freshly composed record to hash and compare
 * @returns IntegrityCheck with MATCH, MISMATCH, or UNAVAILABLE status
 */
export function checkProvenanceHashIntegrity(
  storedHash: string | null | undefined,
  recomputedRecord: DecisionProvenanceRecord,
): ProvenanceIntegrityCheck {
  const checkedAt = new Date().toISOString();

  if (!storedHash) {
    return {
      status: "UNAVAILABLE",
      storedHash: null,
      recomputedHash: recomputedRecord.provenanceHash,
      checkedAt,
      message:
        "No stored provenance hash exists for this record. The recomputed hash is available for initial storage.",
    };
  }

  const recomputedHash = recomputedRecord.provenanceHash;

  if (storedHash === recomputedHash) {
    return {
      status: "MATCH",
      storedHash,
      recomputedHash,
      checkedAt,
      message: "Stored provenance hash matches recomputed hash. Record integrity is consistent.",
    };
  }

  return {
    status: "MISMATCH",
    storedHash,
    recomputedHash,
    checkedAt,
    message:
      "Stored provenance hash does not match recomputed hash. This may indicate the source data has changed since the hash was stored, or the record has been altered. Do not overwrite automatically — require operator review.",
  };
}

/**
 * Verify that a ClientSafeProvenanceSummary's hash matches the full record.
 * This is a structural invariant: the client-safe summary must always use
 * the same hash as the internal record it was derived from.
 */
export function verifyClientSafeHashMatch(
  internalHash: string,
  clientSafeHash: string,
): ProvenanceIntegrityCheck {
  const checkedAt = new Date().toISOString();

  if (internalHash === clientSafeHash) {
    return {
      status: "MATCH",
      storedHash: internalHash,
      recomputedHash: clientSafeHash,
      checkedAt,
      message: "Client-safe provenance hash matches internal record hash.",
    };
  }

  return {
    status: "MISMATCH",
    storedHash: internalHash,
    recomputedHash: clientSafeHash,
    checkedAt,
    message:
      "Client-safe provenance hash does not match internal record hash. This is a structural integrity failure — the client-safe summary was not derived from the claimed internal record.",
  };
}
