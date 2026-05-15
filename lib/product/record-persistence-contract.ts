/**
 * lib/product/record-persistence-contract.ts
 *
 * Canonical persistence vocabulary for client-facing product surfaces.
 * This answers one practical question:
 *
 * "If the visitor leaves this browser, what record still exists?"
 */

export type RecordPersistenceLevel =
  | "NONE"
  | "SESSION_PREVIEW"
  | "LOCAL_PREVIEW"
  | "ACCOUNT_RECORD"
  | "GOVERNED_CASE"
  | "PROVENANCE_BACKED"
  | "ANCHORED"
  | "PUBLIC_ROOT_PUBLISHED";

export type SurfaceRecordBoundary = {
  surfaceId: string;
  label: string;
  persistenceLevel: RecordPersistenceLevel;
  createsRecord: boolean;
  systemOfRecord?: "DECISION_CENTRE" | "STRATEGY_ROOM" | "OVERSIGHT" | "NONE";
  boundaryCopy: string;
};

export function describePersistenceLevel(level: RecordPersistenceLevel): string {
  switch (level) {
    case "NONE":
      return "No retained record is created.";
    case "SESSION_PREVIEW":
      return "Session-derived preview. Lost when the browser session ends.";
    case "LOCAL_PREVIEW":
      return "Local preview stored only in this browser.";
    case "ACCOUNT_RECORD":
      return "Account-bound record available across sessions and devices.";
    case "GOVERNED_CASE":
      return "Account-bound governed case with server-authoritative state.";
    case "PROVENANCE_BACKED":
      return "Governed case with hash-verifiable internal provenance.";
    case "ANCHORED":
      return "Record with configured external anchoring.";
    case "PUBLIC_ROOT_PUBLISHED":
      return "Non-sensitive public root published when available.";
  }
}

export function isLiveRecord(level: RecordPersistenceLevel): boolean {
  return (
    level === "ACCOUNT_RECORD" ||
    level === "GOVERNED_CASE" ||
    level === "PROVENANCE_BACKED" ||
    level === "ANCHORED"
  );
}

export function requiresBoundaryCopy(level: RecordPersistenceLevel): boolean {
  return (
    level === "NONE" ||
    level === "SESSION_PREVIEW" ||
    level === "LOCAL_PREVIEW" ||
    level === "PUBLIC_ROOT_PUBLISHED"
  );
}

export function getRecordBoundaryLabel(level: RecordPersistenceLevel): string {
  switch (level) {
    case "NONE":
      return "No retained record";
    case "SESSION_PREVIEW":
      return "Session-derived preview";
    case "LOCAL_PREVIEW":
      return "Local preview";
    case "ACCOUNT_RECORD":
      return "Account-bound record";
    case "GOVERNED_CASE":
      return "Account-bound governed case";
    case "PROVENANCE_BACKED":
      return "Hash-verifiable governed case";
    case "ANCHORED":
      return "Externally anchored record";
    case "PUBLIC_ROOT_PUBLISHED":
      return "Public root publication";
  }
}

/**
 * Known upper-bound persistence level by public/client-facing surface.
 * A page may show less than its maximum in a given environment, but it must
 * never claim more than this map allows.
 */
export const SURFACE_PERSISTENCE_MAP: Record<string, RecordPersistenceLevel> = {
  "fast-diagnostic": "GOVERNED_CASE",
  "purpose-alignment": "GOVERNED_CASE",
  "constitutional-diagnostic": "GOVERNED_CASE",
  "team-assessment": "GOVERNED_CASE",
  "enterprise-assessment": "GOVERNED_CASE",
  "executive-reporting": "GOVERNED_CASE",
  "executive-reporting-run": "GOVERNED_CASE",
  "strategy-room": "GOVERNED_CASE",
  "decision-centre": "GOVERNED_CASE",
  "oversight": "GOVERNED_CASE",
  "oversight-brief": "PROVENANCE_BACKED",
  "counsel-review": "GOVERNED_CASE",
  "boardroom": "GOVERNED_CASE",
  "return-brief": "GOVERNED_CASE",
  "portfolio": "GOVERNED_CASE",
  "proof-pack": "PROVENANCE_BACKED",
  "decision-delay-exposure-calculator": "SESSION_PREVIEW",
  "board-summary-preview": "SESSION_PREVIEW",
  "provenance-sample-export": "NONE",
  "public-anchor-log": "PUBLIC_ROOT_PUBLISHED",
};

export function assertLiveRecordClaimAllowed(
  surfaceId: string,
  claimedLevel: RecordPersistenceLevel,
): void {
  const expected = SURFACE_PERSISTENCE_MAP[surfaceId];
  if (!expected) {
    throw new Error(`Unknown surface "${surfaceId}". Add it to SURFACE_PERSISTENCE_MAP first.`);
  }

  const levelOrder: RecordPersistenceLevel[] = [
    "NONE",
    "SESSION_PREVIEW",
    "LOCAL_PREVIEW",
    "ACCOUNT_RECORD",
    "GOVERNED_CASE",
    "PROVENANCE_BACKED",
    "ANCHORED",
    "PUBLIC_ROOT_PUBLISHED",
  ];

  const claimedIndex = levelOrder.indexOf(claimedLevel);
  const expectedIndex = levelOrder.indexOf(expected);
  if (claimedIndex > expectedIndex) {
    throw new Error(
      `Surface "${surfaceId}" claims persistence level "${claimedLevel}" ` +
      `but its known maximum is "${expected}".`,
    );
  }
}

export function getSurfacePersistenceLevel(
  surfaceId: string,
): RecordPersistenceLevel | undefined {
  return SURFACE_PERSISTENCE_MAP[surfaceId];
}
