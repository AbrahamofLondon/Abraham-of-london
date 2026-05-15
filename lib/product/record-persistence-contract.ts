/**
 * lib/product/record-persistence-contract.ts
 *
 * Defines the canonical persistence levels for product surfaces.
 * Every surface in the product surface registry should map to one of these levels.
 *
 * This contract answers: "If a user logs in from another device, what survives?"
 *
 * Levels (strictly ordered from least to most persistent):
 *   NONE              — No record is created or retained. Ephemeral calculation.
 *   SESSION_PREVIEW   — Session-bound preview. Lost on browser close.
 *   ACCOUNT_RECORD    — Persisted to account-level storage. Survives device change.
 *   GOVERNED_CASE     — Persisted as a governed case with server-authoritative state.
 *   PROVENANCE_BACKED — Governed case with chain-of-custody provenance hash.
 *   ANCHORED          — Cryptographically anchored to external immutable store.
 */

export type RecordPersistenceLevel =
  | "NONE"
  | "SESSION_PREVIEW"
  | "ACCOUNT_RECORD"
  | "GOVERNED_CASE"
  | "PROVENANCE_BACKED"
  | "ANCHORED";

/**
 * Human-readable description of each persistence level.
 */
export function describePersistenceLevel(level: RecordPersistenceLevel): string {
  switch (level) {
    case "NONE":
      return "No record is created or retained. Ephemeral calculation.";
    case "SESSION_PREVIEW":
      return "Session-bound preview. Lost on browser close. Not a governed record.";
    case "ACCOUNT_RECORD":
      return "Persisted to account-level storage. Survives device change.";
    case "GOVERNED_CASE":
      return "Persisted as a governed case with server-authoritative state. Survives device change.";
    case "PROVENANCE_BACKED":
      return "Governed case with chain-of-custody provenance hash. Survives device change.";
    case "ANCHORED":
      return "Cryptographically anchored to external immutable store. Highest assurance.";
  }
}

/**
 * Map of surface IDs to their expected persistence level.
 * This is the canonical reference for tests and runtime assertions.
 */
export const SURFACE_PERSISTENCE_MAP: Record<string, RecordPersistenceLevel> = {
  // ── DIAGNOSTICS ──
  "fast-diagnostic": "GOVERNED_CASE",
  "purpose-alignment": "GOVERNED_CASE",
  "constitutional-diagnostic": "GOVERNED_CASE",
  "team-assessment": "GOVERNED_CASE",
  "enterprise-assessment": "GOVERNED_CASE",

  // ── REPORTS ──
  "executive-reporting": "GOVERNED_CASE",
  "executive-reporting-run": "GOVERNED_CASE",

  // ── INTERVENTION ──
  "strategy-room": "GOVERNED_CASE",
  "decision-centre": "GOVERNED_CASE",

  // ── RETAINER ──
  "oversight": "GOVERNED_CASE",
  "oversight-brief": "PROVENANCE_BACKED",

  // ── ESCALATION ──
  "counsel-review": "GOVERNED_CASE",
  "boardroom": "GOVERNED_CASE",

  // ── CLIENT PORTAL ──
  "return-brief": "GOVERNED_CASE",
  "portfolio": "GOVERNED_CASE",

  // ── CONTENT ──
  "proof-pack": "PROVENANCE_BACKED",

  // ── PUBLIC / CLIENT TOOLS ──
  "decision-delay-exposure-calculator": "SESSION_PREVIEW",
  "board-summary-preview": "SESSION_PREVIEW",
  "provenance-sample-export": "NONE",
  "public-anchor-log": "NONE",
};

/**
 * Assert that a surface's claimed persistence level is valid.
 * Throws if the surface is not in the map or if the level is inconsistent
 * with the surface's known characteristics.
 */
export function assertLiveRecordClaimAllowed(
  surfaceId: string,
  claimedLevel: RecordPersistenceLevel,
): void {
  const expected = SURFACE_PERSISTENCE_MAP[surfaceId];
  if (!expected) {
    throw new Error(
      `Unknown surface "${surfaceId}". Add it to SURFACE_PERSISTENCE_MAP first.`,
    );
  }

  // A surface cannot claim a higher persistence level than its known maximum.
  const levelOrder: RecordPersistenceLevel[] = [
    "NONE",
    "SESSION_PREVIEW",
    "ACCOUNT_RECORD",
    "GOVERNED_CASE",
    "PROVENANCE_BACKED",
    "ANCHORED",
  ];

  const claimedIndex = levelOrder.indexOf(claimedLevel);
  const expectedIndex = levelOrder.indexOf(expected);

  if (claimedIndex > expectedIndex) {
    throw new Error(
      `Surface "${surfaceId}" claims persistence level "${claimedLevel}" ` +
      `but its known maximum is "${expected}". This would be a false claim.`,
    );
  }
}

/**
 * Get the expected persistence level for a surface.
 */
export function getSurfacePersistenceLevel(
  surfaceId: string,
): RecordPersistenceLevel | undefined {
  return SURFACE_PERSISTENCE_MAP[surfaceId];
}
