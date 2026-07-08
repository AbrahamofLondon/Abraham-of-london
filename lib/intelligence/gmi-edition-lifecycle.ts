/**
 * lib/intelligence/gmi-edition-lifecycle.ts
 *
 * Generic recurring-edition lifecycle for GMI.
 *
 * State machine: PLANNED → EVIDENCE_COLLECTION → DRAFT → RELEASE_CANDIDATE
 *   → RELEASE_AUTHORIZED → ACTIVE_UNTIL_SUPERSEDED → SUPERSEDED → ARCHIVED
 *
 * No edition-specific hardcoding. Works for any edition ID.
 * Transitions are validated. Forbidden transitions throw.
 */
export type GmiLifecycleState =
  | "PLANNED"
  | "EVIDENCE_COLLECTION"
  | "DRAFT"
  | "RELEASE_CANDIDATE"
  | "RELEASE_AUTHORIZED"
  | "ACTIVE_UNTIL_SUPERSEDED"
  | "SUPERSEDED"
  | "ARCHIVED";

export interface GmiEditionRecord {
  id: string;
  title: string;
  productFamily: string;
  periodStart: string;
  periodEnd: string;
  publicationTarget: string;
  dataLockRequiredAfter: string;
  dataLockedAt: string | null;
  releaseCandidateAt: string | null;
  ownerAuthorizedAt: string | null;
  publishedAt: string | null;
  lifecycleState: GmiLifecycleState;
  supersedes: string | null;
  supersededBy: string | null;
  publicVisible: boolean;
  purchasable: boolean;
  archiveVisible: boolean;
  version: string;
}

export interface ReleaseAuthorityRecord {
  editionId: string;
  authorizedBy: string;
  authorizedAt: string;
  authorityScope: string;
  candidateHash: string;
}

export interface ReleaseReceipt {
  editionId: string;
  sourceSnapshotHash: string;
  reportContentHash: string;
  methodologyVersion: string;
  pdfHash: string | null;
  releaseChecklistVersion: string;
  releaseAuthorityRef: string;
  publishedAt: string;
}

// ── State machine ──────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<GmiLifecycleState, GmiLifecycleState[]> = {
  PLANNED: ["EVIDENCE_COLLECTION"],
  EVIDENCE_COLLECTION: ["DRAFT", "PLANNED"],
  DRAFT: ["RELEASE_CANDIDATE", "EVIDENCE_COLLECTION"],
  RELEASE_CANDIDATE: ["RELEASE_AUTHORIZED", "DRAFT"],
  RELEASE_AUTHORIZED: ["ACTIVE_UNTIL_SUPERSEDED", "RELEASE_CANDIDATE"],
  ACTIVE_UNTIL_SUPERSEDED: ["SUPERSEDED"],
  SUPERSEDED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function validateTransition(from: GmiLifecycleState, to: GmiLifecycleState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertValidTransition(from: GmiLifecycleState, to: GmiLifecycleState): void {
  if (!validateTransition(from, to)) {
    throw new Error(`Illegal lifecycle transition: ${from} → ${to}`);
  }
}

// ── Generic lifecycle helpers ──────────────────────────────────────────────

export function getPriorReviewWindow(record: GmiEditionRecord): string | null {
  // The prior review window is the edition's decisionWindow — the period during
  // which prior-quarter calls were expected to be reviewed.
  // For Q2 2026 with decisionWindow "Q3 2026", the prior review window is "Q2 2026".
  // This is derived from the edition's own period label.
  const parsed = getEditionQuarter(record.id);
  if (!parsed) return null;
  return `${parsed.quarter} ${parsed.year}`;
}

export function getEditionQuarter(editionId: string): { quarter: string; year: number } | null {
  const match = editionId.match(/^GMI-Q([1-4])-(\d{4})$/);
  if (!match) return null;
  const q = match[1] ?? "1";
  const y = match[2] ?? "2026";
  return { quarter: `Q${q}`, year: parseInt(y, 10) };
}

export function getPredecessorEditionId(editionId: string): string | null {
  const parsed = getEditionQuarter(editionId);
  if (!parsed) return null;
  const q = parseInt(parsed.quarter[1] ?? "0");
  const year = parsed.year;
  if (q === 1) return `GMI-Q4-${year - 1}`;
  return `GMI-Q${q - 1}-${year}`;
}

export function getSuccessorEditionId(editionId: string): string | null {
  const parsed = getEditionQuarter(editionId);
  if (!parsed) return null;
  const q = parseInt(parsed.quarter[1] ?? "0");
  const year = parsed.year;
  if (q === 4) return `GMI-Q1-${year + 1}`;
  return `GMI-Q${q + 1}-${year}`;
}

// ── Temporal gate ──────────────────────────────────────────────────────────

export function isPublicationTargetReached(record: GmiEditionRecord, asOf: Date = new Date()): boolean {
  return asOf >= new Date(record.publicationTarget);
}

export function isDataLockComplete(record: GmiEditionRecord): boolean {
  return record.dataLockedAt !== null && record.dataLockedAt.length > 0;
}

export function isOwnerAuthorized(record: GmiEditionRecord): boolean {
  return record.ownerAuthorizedAt !== null && record.ownerAuthorizedAt.length > 0;
}

// ── Owner authority record ─────────────────────────────────────────────────

export interface ReleaseAuthorityRecord {
  editionId: string;
  authorizedBy: string;
  authorizedAt: string;
  authorityScope: string;
  candidateHash: string;
}

const authorityStore = new Map<string, ReleaseAuthorityRecord>();

export function registerOwnerAuthority(authority: ReleaseAuthorityRecord): void {
  authorityStore.set(authority.editionId, authority);
}

export function getOwnerAuthority(editionId: string): ReleaseAuthorityRecord | null {
  return authorityStore.get(editionId) ?? null;
}

export function clearOwnerAuthority(editionId: string): void {
  authorityStore.delete(editionId);
}

// ── Release gate result ────────────────────────────────────────────────────

export interface ReleaseGateResult {
  gate: string;
  status: "PASS" | "FAIL" | "NOT_APPLICABLE";
  evidenceRef: string;
  reason: string;
  blocking: boolean;
  checkedAt: string;
}

export function buildGateResult(gate: string, passed: boolean, evidenceRef: string, reason: string, blocking: boolean): ReleaseGateResult {
  return { gate, status: passed ? "PASS" : "FAIL", evidenceRef, reason, blocking, checkedAt: new Date().toISOString() };
}
