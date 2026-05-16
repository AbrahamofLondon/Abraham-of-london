/**
 * lib/product/public-provenance-demo-verify.ts
 *
 * Verification logic for the public provenance demo.
 *
 * The stored hash is recomputed from the canonical demo object and compared
 * to DEMO_PROVENANCE_HASH every time verifyDemoProvenance() is called.
 *
 * This is NOT hardcoded to return MATCH. If the demo record or its hash
 * constant drift out of sync, verifyDemoProvenance() returns MISMATCH,
 * which surfaces immediately in the demo page and in tests.
 *
 * This preserves the integrity discipline of the real provenance system even
 * for a public demonstration.
 */

import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";
import {
  PUBLIC_PROVENANCE_DEMO_RECORD,
  DEMO_PROVENANCE_HASH,
} from "@/lib/product/public-provenance-demo-record";

export type DemoVerifyStatus = "MATCH" | "MISMATCH" | "UNAVAILABLE";

export type PublicDemoVerifyResult = {
  status: DemoVerifyStatus;
  storedHash: string;
  recomputedHash: string;
  checkedAt: string;
  message: string;
};

/**
 * Recomputes the SHA-256 hash of the canonical demo record and compares it
 * to the stored DEMO_PROVENANCE_HASH.
 *
 * Returns MATCH only when the hashes are identical.
 * Returns MISMATCH when they differ (record or constant updated without sync).
 * Returns UNAVAILABLE on unexpected error.
 */
export function verifyDemoProvenance(): PublicDemoVerifyResult {
  const checkedAt = new Date().toISOString();

  try {
    const recomputedHash = buildGovernedCaseHash(
      PUBLIC_PROVENANCE_DEMO_RECORD as unknown as Record<string, unknown>,
    );

    const status: DemoVerifyStatus =
      recomputedHash === DEMO_PROVENANCE_HASH ? "MATCH" : "MISMATCH";

    return {
      status,
      storedHash: DEMO_PROVENANCE_HASH,
      recomputedHash,
      checkedAt,
      message:
        status === "MATCH"
          ? "The recomputed hash matches the stored provenance hash. The demonstration record has not been altered."
          : "The recomputed hash does not match the stored hash. The demonstration record or its stored hash constant are out of sync.",
    };
  } catch {
    return {
      status: "UNAVAILABLE",
      storedHash: DEMO_PROVENANCE_HASH,
      recomputedHash: "",
      checkedAt,
      message: "Verification could not be completed due to an unexpected error.",
    };
  }
}
