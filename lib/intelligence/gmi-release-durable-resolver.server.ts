/**
 * lib/intelligence/gmi-release-durable-resolver.server.ts
 *
 * Durable release-state resolver. Combines:
 *   static recurring-edition definition, where present;
 *   + Postgres durable release state;
 *   + hash-bound owner authority;
 *   + canonical evidence providers.
 *
 * The output is the independent 10-gate release vector. QUALITY_GATE is a
 * derived aggregate elsewhere and is intentionally not an independent gate here.
 */
import { prisma } from "@/lib/prisma";
import {
  buildGateResult,
  getPriorReviewWindow,
  isPublicationTargetReached,
  type ReleaseGateResult,
} from "./gmi-edition-lifecycle";
import { getCallsPendingReview } from "./market-intelligence-call-ledger";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import {
  getBoardPulseEvidence,
  getDataProvenanceEvidence,
  getFalsificationEvidence,
  getPdfExportEvidence,
} from "./gmi-release-evidence";
import { getServerPdfExportEvidence } from "./gmi-release-evidence.server";
import {
  getCurrentValidAuthority,
  getDurableReceipt,
  getDurableReleaseState,
  type GmiDb,
} from "./gmi-release-store.server";

export const DURABLE_GMI_RELEASE_GATE_VECTOR = [
  "TEMPORAL_NOT_BEFORE",
  "DATA_LOCK",
  "OWNER_RELEASE_AUTHORITY",
  "LIFECYCLE_STATE",
  "CALL_REVIEW",
  "SOURCE_APPENDIX",
  "DATA_PROVENANCE",
  "FALSIFICATION_REVIEW",
  "BOARD_PULSE",
  "PDF_EXPORT",
] as const;

export interface DurableGmiReleaseState {
  editionId: string;
  found: boolean;
  lifecycleState: string;
  releaseReady: boolean;
  gates: ReleaseGateResult[];
  blockers: string[];
  hasAuthority: boolean;
  hasReceipt: boolean;
}

function pushBlocker(blockers: string[], blocker: string): void {
  if (!blockers.includes(blocker)) blockers.push(blocker);
}

function evidenceGate(
  gates: ReleaseGateResult[],
  blockers: string[],
  gate: string,
  passed: boolean,
  evidenceRef: string,
  passReason: string,
  failReason: string,
  blocking = true,
): void {
  gates.push(buildGateResult(gate, passed, evidenceRef, passed ? passReason : failReason, blocking));
  if (!passed && blocking) pushBlocker(blockers, failReason);
}

export async function resolveDurableReleaseGateVector(
  editionId: string,
  db: GmiDb = prisma,
): Promise<{ gates: ReleaseGateResult[]; blockers: string[]; passed: boolean }> {
  const gates: ReleaseGateResult[] = [];
  const blockers: string[] = [];
  const record = getMarketIntelligenceRecord(editionId);
  const state = await getDurableReleaseState(editionId, db);

  const temporalOk = record ? isPublicationTargetReached(record as any) : true;
  evidenceGate(
    gates,
    blockers,
    "TEMPORAL_NOT_BEFORE",
    temporalOk,
    `publicationTarget: ${record?.publicationTarget ?? "no static definition; runtime state governs"}`,
    "Publication target date reached or no static target is defined for this recurring edition",
    "Publication target date not reached",
  );

  const dataLocked = Boolean(state?.dataLockedAt);
  evidenceGate(
    gates,
    blockers,
    "DATA_LOCK",
    dataLocked,
    `dataLockedAt: ${state?.dataLockedAt?.toISOString() ?? "not set"}`,
    "Data lock complete",
    "Data lock not complete",
  );

  const authority = state?.candidateHash
    ? await getCurrentValidAuthority(editionId, state.candidateHash, db)
    : null;
  const authorityOk = Boolean(state?.candidateHash && authority);
  evidenceGate(
    gates,
    blockers,
    "OWNER_RELEASE_AUTHORITY",
    authorityOk,
    `candidateHash: ${state?.candidateHash ?? "none"}, authorityRow: ${authority ? "valid" : "absent"}`,
    "Owner authority granted with a non-revoked candidate-hash-bound authority row",
    "Owner release authority not granted",
  );

  const lifecycleState = state?.lifecycleState ?? "UNKNOWN";
  const receipt = await getDurableReceipt(editionId, db);
  const preReleaseReleasable = lifecycleState === "RELEASE_CANDIDATE" || lifecycleState === "RELEASE_AUTHORIZED";
  const postReleaseProven = (lifecycleState === "ACTIVE" || lifecycleState === "ACTIVE_UNTIL_SUPERSEDED") && Boolean(receipt);
  evidenceGate(
    gates,
    blockers,
    "LIFECYCLE_STATE",
    preReleaseReleasable || postReleaseProven,
    `state: ${lifecycleState}, receipt: ${receipt ? "present" : "absent"}`,
    postReleaseProven ? "Edition is active with durable release receipt" : "Edition is in a releasable lifecycle state",
    `Edition is in ${lifecycleState} state without a valid releasable state or release receipt`,
  );

  const reviewWindow = record ? getPriorReviewWindow(record as any) : null;
  const pendingCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];
  evidenceGate(
    gates,
    blockers,
    "CALL_REVIEW",
    pendingCalls.length === 0,
    `${pendingCalls.length} pending${reviewWindow ? ` for ${reviewWindow}` : ""}`,
    "All prior calls reviewed",
    "Prior-quarter calls not reviewed",
  );

  const coverage = calculateGmiSourceCoverageScore(editionId);
  evidenceGate(
    gates,
    blockers,
    "SOURCE_APPENDIX",
    coverage.releaseSafe,
    `coverage: ${coverage.coverageScore}%, blockers: ${coverage.blockerRows}`,
    "Source appendix release-safe",
    "Source appendix incomplete",
  );

  const provenance = getDataProvenanceEvidence(editionId);
  const provenancePassed = provenance.releaseCriticalSourceCoverageComplete
    && provenance.authoritativeSourceBindingsPresent
    && provenance.fixtureOrSeedCannotSatisfy
    && provenance.unresolvedProvenanceBlockers === 0
    && provenance.currentSourceSnapshotHash !== null;
  evidenceGate(
    gates,
    blockers,
    "DATA_PROVENANCE",
    provenancePassed,
    `coverageComplete: ${provenance.releaseCriticalSourceCoverageComplete}, bindingsPresent: ${provenance.authoritativeSourceBindingsPresent}, fixtureSafe: ${provenance.fixtureOrSeedCannotSatisfy}, blockers: ${provenance.unresolvedProvenanceBlockers}, snapshotHash: ${provenance.currentSourceSnapshotHash ?? "none"}`,
    "Data provenance established",
    "Data provenance not established",
  );

  const falsification = getFalsificationEvidence(editionId);
  const falsificationPassed = falsification.highConvictionThesesIdentified
    && falsification.falsificationConditionsPresent
    && falsification.reviewCompleted
    && falsification.reviewBoundToCurrentEdition
    && falsification.unresolvedBlockingFindings === 0;
  evidenceGate(
    gates,
    blockers,
    "FALSIFICATION_REVIEW",
    falsificationPassed,
    `thesesIdentified: ${falsification.highConvictionThesesIdentified}, conditionsPresent: ${falsification.falsificationConditionsPresent}, reviewCompleted: ${falsification.reviewCompleted}, boundToEdition: ${falsification.reviewBoundToCurrentEdition}, unresolvedBlockers: ${falsification.unresolvedBlockingFindings}`,
    "Falsification review complete",
    "Falsification review not complete",
  );

  const board = getBoardPulseEvidence(editionId);
  const boardPassed = board.consequenceFieldsComplete
    && board.boardRelevanceComplete
    && board.currentCandidateMatch
    && board.recordExists;
  evidenceGate(
    gates,
    blockers,
    "BOARD_PULSE",
    boardPassed,
    `consequenceFieldsComplete: ${board.consequenceFieldsComplete}, boardRelevanceComplete: ${board.boardRelevanceComplete}, candidateMatch: ${board.currentCandidateMatch}, recordExists: ${board.recordExists}`,
    "Board pulse complete",
    "Board pulse incomplete",
  );

  const pdf = getServerPdfExportEvidence(editionId);
  const pdfPassed = pdf.exists
    && pdf.hash !== null
    && pdf.generatedAt !== null
    && pdf.reportContentHash !== null
    && pdf.sourceSnapshotHash !== null
    && pdf.matchesCurrentCandidate
    && Boolean(state?.candidateHash && pdf.candidateHash === state.candidateHash)
    && Boolean(receipt?.pdfHash && receipt.pdfHash === pdf.hash);
  evidenceGate(
    gates,
    blockers,
    "PDF_EXPORT",
    pdfPassed,
    `exists: ${pdf.exists}, hash: ${pdf.hash ?? receipt?.pdfHash ?? "none"}, generatedAt: ${pdf.generatedAt ?? receipt?.publishedAt?.toISOString() ?? "none"}, contentHash: ${pdf.reportContentHash ?? receipt?.reportContentHash ?? "none"}, sourceHash: ${pdf.sourceSnapshotHash ?? receipt?.sourceSnapshotHash ?? "none"}, matchesCandidate: ${pdf.matchesCurrentCandidate && Boolean(state?.candidateHash && pdf.candidateHash === state.candidateHash) && Boolean(receipt?.pdfHash && receipt.pdfHash === pdf.hash)}`,
    "PDF export exists and matches the current candidate",
    "PDF export not available or does not match current candidate",
  );

  return { gates, blockers, passed: blockers.length === 0 };
}

export async function resolveDurableEvidenceGates(
  editionId: string,
  db: GmiDb = prisma,
): Promise<{ passed: boolean; blockers: string[] }> {
  const vector = await resolveDurableReleaseGateVector(editionId, db);
  const evidenceGateNames = new Set([
    "CALL_REVIEW",
    "SOURCE_APPENDIX",
    "DATA_PROVENANCE",
    "FALSIFICATION_REVIEW",
    "BOARD_PULSE",
    "PDF_EXPORT",
  ]);
  const blockers = vector.gates
    .filter((gate) => evidenceGateNames.has(gate.gate) && gate.status === "FAIL" && gate.blocking)
    .map((gate) => gate.reason);
  return { passed: blockers.length === 0, blockers };
}

export async function resolveDurableReleaseState(
  editionId: string,
  db: GmiDb = prisma,
): Promise<DurableGmiReleaseState> {
  const state = await getDurableReleaseState(editionId, db);
  const receipt = await getDurableReceipt(editionId, db);
  const vector = await resolveDurableReleaseGateVector(editionId, db);
  const authorityGate = vector.gates.find((gate) => gate.gate === "OWNER_RELEASE_AUTHORITY");

  if (!state) {
    const blockers = ["Durable release state missing", ...vector.blockers];
    return {
      editionId,
      found: false,
      lifecycleState: "UNKNOWN",
      releaseReady: false,
      gates: vector.gates,
      blockers: [...new Set(blockers)],
      hasAuthority: authorityGate?.status === "PASS",
      hasReceipt: receipt !== null,
    };
  }

  return {
    editionId,
    found: true,
    lifecycleState: state.lifecycleState,
    releaseReady: vector.passed,
    gates: vector.gates,
    blockers: vector.blockers,
    hasAuthority: authorityGate?.status === "PASS",
    hasReceipt: receipt !== null,
  };
}
