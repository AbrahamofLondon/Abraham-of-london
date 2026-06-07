/* Canonical GMI Release Authority.
 * Runtime readiness is DB-derived. Static seed files may populate tables, but
 * this resolver never silently substitutes seed fixtures for operational state.
 */

import crypto from "node:crypto";

import { validateGmiBoardPackArtifact } from "./gmi-board-pack-artifact-service.server";
import {
  canonicalHash,
  getGmiBoardPulseData,
  getGmiCallLedger,
  getGmiEditionState,
  getGmiFalsificationRules,
  getGmiPerformanceMetrics,
  getGmiProvenanceState,
  getGmiReleaseSnapshots,
  getGmiSourceAppendix,
} from "./gmi-data-service.server";

export type GmiReleaseStatus =
  | "DRAFT"
  | "BLOCKED"
  | "NEEDS_CALL_REVIEW"
  | "NEEDS_SOURCE_REVIEW"
  | "NEEDS_FALSIFICATION_REVIEW"
  | "NEEDS_BOARD_REVIEW"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED";

export type GmiPrimaryNextAction =
  | "NEEDS_CALL_REVIEW"
  | "NEEDS_SOURCE_REVIEW"
  | "NEEDS_FALSIFICATION_REVIEW"
  | "NEEDS_BOARD_REVIEW"
  | "NEEDS_PUBLIC_TRUST_REVIEW"
  | "READY_FOR_PUBLICATION"
  | null;

export type BlockerSeverity = "critical" | "high" | "medium" | "low";
export type BlockerCategory =
  | "CALL_REVIEW"
  | "SOURCE_APPENDIX"
  | "FALSIFICATION"
  | "BOARD_PULSE"
  | "PERFORMANCE"
  | "RED_TEAM"
  | "PDF_EXPORT"
  | "COMMERCIAL_ROUTING"
  | "METADATA"
  | "POST_MORTEM"
  | "DATA_PROVENANCE";

export type GmiBlocker = {
  id: string;
  severity: BlockerSeverity;
  category: BlockerCategory;
  message: string;
  affectedEntityId: string | null;
  affectedEntityLabel: string | null;
  actionHref: string | null;
  actionLabel: string | null;
  whyItMatters?: string;
  blocksPublication: boolean;
};

export type GmiReleaseMetrics = {
  totalCalls: number;
  reviewedCalls: number;
  unscoredCalls: number;
  carriedForwardCalls: number;
  disconfirmedCalls: number;
  releaseBlockingSourcesOpen: number;
  sourceMethodNotesMissing: number;
  highConvictionTheses: number;
  falsificationRulesMissing: number;
  boardPulseComplete: boolean;
  boardPackPdfAvailable: boolean;
  operatorBriefPublic: boolean;
  performancePageLive: boolean;
  redTeamIntakeLive: boolean;
  lastLedgerMutationAt: string | null;
  lastReleaseCheckAt: string;
};

export type GmiReleaseState = {
  editionId: string;
  editionSlug: string;
  releaseStatus: GmiReleaseStatus;
  primaryNextAction: GmiPrimaryNextAction;
  canPublish: boolean;
  blockers: GmiBlocker[];
  warnings: GmiBlocker[];
  blockerCategories: BlockerCategory[];
  criticalBlockerCount: number;
  highBlockerCount: number;
  nextBlockingCategory: BlockerCategory | null;
  requiredActions: string[];
  metrics: GmiReleaseMetrics;
  provenance: Awaited<ReturnType<typeof getGmiProvenanceState>>["data"];
  generatedAt: string;
};

export type GmiReleaseSnapshot = {
  id: string;
  editionId: string;
  editionSlug: string;
  releaseStatus: GmiReleaseStatus;
  primaryNextAction: GmiPrimaryNextAction;
  methodologyVersion: string;
  rubricVersion: string;
  callLedgerHash: string;
  sourceAppendixHash: string;
  falsificationHash: string;
  boardPulseHash: string;
  performanceMetricsJson: Record<string, unknown>;
  blockersJson: GmiBlocker[];
  warningsJson: GmiBlocker[];
  blockerCategoriesJson: BlockerCategory[];
  stateJson?: Record<string, unknown> | null;
  createdBy: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

const CATEGORY_PRIORITY: BlockerCategory[] = [
  "DATA_PROVENANCE",
  "CALL_REVIEW",
  "SOURCE_APPENDIX",
  "FALSIFICATION",
  "BOARD_PULSE",
  "PERFORMANCE",
  "RED_TEAM",
  "PDF_EXPORT",
  "COMMERCIAL_ROUTING",
  "METADATA",
  "POST_MORTEM",
];

const CATEGORY_TO_NEXT_ACTION: Record<BlockerCategory, GmiPrimaryNextAction> = {
  DATA_PROVENANCE: "NEEDS_PUBLIC_TRUST_REVIEW",
  CALL_REVIEW: "NEEDS_CALL_REVIEW",
  SOURCE_APPENDIX: "NEEDS_SOURCE_REVIEW",
  FALSIFICATION: "NEEDS_FALSIFICATION_REVIEW",
  BOARD_PULSE: "NEEDS_BOARD_REVIEW",
  PERFORMANCE: "NEEDS_PUBLIC_TRUST_REVIEW",
  RED_TEAM: "NEEDS_PUBLIC_TRUST_REVIEW",
  PDF_EXPORT: "NEEDS_BOARD_REVIEW",
  COMMERCIAL_ROUTING: "NEEDS_PUBLIC_TRUST_REVIEW",
  METADATA: "NEEDS_PUBLIC_TRUST_REVIEW",
  POST_MORTEM: "NEEDS_PUBLIC_TRUST_REVIEW",
};

function now(): string {
  return new Date().toISOString();
}

function snapshotId(): string {
  return `gmirs_${crypto.randomUUID().replace(/-/g, "")}`;
}

function blocker(input: GmiBlocker): GmiBlocker {
  return input;
}

function releaseStatusFor(primary: GmiPrimaryNextAction, hasBlockers: boolean, published: boolean): GmiReleaseStatus {
  if (published) return "PUBLISHED";
  if (!hasBlockers) return "READY_FOR_PUBLICATION";
  switch (primary) {
    case "NEEDS_CALL_REVIEW": return "NEEDS_CALL_REVIEW";
    case "NEEDS_SOURCE_REVIEW": return "NEEDS_SOURCE_REVIEW";
    case "NEEDS_FALSIFICATION_REVIEW": return "NEEDS_FALSIFICATION_REVIEW";
    case "NEEDS_BOARD_REVIEW": return "NEEDS_BOARD_REVIEW";
    default: return "BLOCKED";
  }
}

export async function resolveGmiReleaseState(editionId: string): Promise<GmiReleaseState> {
  const [
    edition,
    calls,
    sources,
    falsificationRules,
    snapshots,
    boardPulse,
    performance,
    provenanceState,
    boardPackArtifact,
  ] = await Promise.all([
    getGmiEditionState(editionId),
    getGmiCallLedger(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiReleaseSnapshots(editionId),
    getGmiBoardPulseData(editionId),
    getGmiPerformanceMetrics(editionId),
    getGmiProvenanceState(editionId),
    validateGmiBoardPackArtifact(editionId),
  ]);

  const blockers: GmiBlocker[] = [];
  const warnings: GmiBlocker[] = [];
  const requiredActions: string[] = [];

  for (const [name, item] of Object.entries(provenanceState.data)) {
    if (name === "isDataDerived") continue;
    const prov = item as { sourceType: string; isProductionSafe: boolean; recordCount: number; warnings: string[]; sourceName: string };
    const sourceRequired = ["calls", "sources", "falsificationRules", "boardPulse", "performance"].includes(name);
    if (sourceRequired && (prov.sourceType !== "DB" || !prov.isProductionSafe || prov.recordCount === 0)) {
      blockers.push(blocker({
        id: `DATA-PROVENANCE-${editionId}-${name}`,
        severity: "critical",
        category: "DATA_PROVENANCE",
        message: `${name} is not backed by production-safe persisted DB state (${prov.sourceType}).`,
        affectedEntityId: name,
        affectedEntityLabel: prov.sourceName,
        actionHref: "/admin/intelligence/gmi/publication-readiness",
        actionLabel: "Inspect provenance",
        whyItMatters: "GMI cannot publish if operational state is served from static fixtures, fallback data, or empty DB tables.",
        blocksPublication: true,
      }));
    }
    for (const warning of prov.warnings ?? []) {
      warnings.push(blocker({
        id: `DATA-WARNING-${editionId}-${name}-${canonicalHash(warning).slice(0, 8)}`,
        severity: "low",
        category: "DATA_PROVENANCE",
        message: warning,
        affectedEntityId: name,
        affectedEntityLabel: prov.sourceName,
        actionHref: "/admin/intelligence/gmi/publication-readiness",
        actionLabel: "Review provenance",
        blocksPublication: false,
      }));
    }
  }

  const q1Calls = calls.data.filter((call) => call.editionId === "GMI-Q1-2026");
  const unscoredCalls = q1Calls.filter((call) => call.currentScore === null);
  const callsWithoutEvidence = q1Calls.filter((call) =>
    call.currentScore !== null &&
    call.currentScore !== 2 &&
    call.evidenceSourceRows.length === 0
  );
  const scoreTwoMissingCarryForward = q1Calls.filter((call) =>
    call.currentScore === 2 && (!call.carryForwardJustification || !call.nextReviewDue)
  );

  if (unscoredCalls.length > 0) {
    blockers.push(blocker({
      id: `CALL-UNSCORED-${editionId}`,
      severity: "critical",
      category: "CALL_REVIEW",
      message: `${unscoredCalls.length} call(s) have not been scored.`,
      affectedEntityId: unscoredCalls[0]?.callId ?? null,
      affectedEntityLabel: `${unscoredCalls.length} unscored calls`,
      actionHref: "/admin/intelligence/gmi/batch-score",
      actionLabel: "Score pending calls",
      whyItMatters: "The public performance centre and publication decision must include every registered call.",
      blocksPublication: true,
    }));
    requiredActions.push(`Score ${unscoredCalls.length} pending call(s).`);
  }

  if (callsWithoutEvidence.length > 0) {
    blockers.push(blocker({
      id: `CALL-NO-EVIDENCE-${editionId}`,
      severity: "high",
      category: "CALL_REVIEW",
      message: `${callsWithoutEvidence.length} scored call(s) have no evidence source rows.`,
      affectedEntityId: callsWithoutEvidence[0]?.callId ?? null,
      affectedEntityLabel: `${callsWithoutEvidence.length} evidence-missing calls`,
      actionHref: "/admin/intelligence/gmi/batch-score",
      actionLabel: "Attach evidence",
      blocksPublication: true,
    }));
  }

  if (scoreTwoMissingCarryForward.length > 0) {
    blockers.push(blocker({
      id: `CALL-SCORE2-MISSING-CARRY-${editionId}`,
      severity: "high",
      category: "CALL_REVIEW",
      message: `${scoreTwoMissingCarryForward.length} score-2 call(s) lack carry-forward justification or next review date.`,
      affectedEntityId: scoreTwoMissingCarryForward[0]?.callId ?? null,
      affectedEntityLabel: `${scoreTwoMissingCarryForward.length} incomplete carried-forward calls`,
      actionHref: "/admin/intelligence/gmi/batch-score",
      actionLabel: "Complete carry-forward fields",
      blocksPublication: true,
    }));
  }

  const releaseBlockingSources = sources.data.filter((row) =>
    row.releaseBlocker && (row.status === "SOURCE_PENDING" || row.status === "METHOD_NOTE_REQUIRED")
  );
  const sourceMethodNotesMissing = sources.data.filter((row) =>
    (row.evidenceClass === "MODELLED_ESTIMATE" || row.evidenceClass === "SCENARIO_ASSUMPTION") &&
    !row.methodNote?.trim()
  );

  if (releaseBlockingSources.length > 0) {
    blockers.push(blocker({
      id: `SOURCE-BLOCKERS-${editionId}`,
      severity: "critical",
      category: "SOURCE_APPENDIX",
      message: `${releaseBlockingSources.length} release-blocking source row(s) remain open.`,
      affectedEntityId: releaseBlockingSources[0]?.sourceRowId ?? null,
      affectedEntityLabel: `${releaseBlockingSources.length} blocking sources`,
      actionHref: "/admin/intelligence/gmi/source-workbench",
      actionLabel: "Resolve source blockers",
      whyItMatters: "Unsupported hard claims cannot publish behind a public trust surface.",
      blocksPublication: true,
    }));
    requiredActions.push(`Resolve ${releaseBlockingSources.length} source blocker(s).`);
  }

  if (sourceMethodNotesMissing.length > 0) {
    blockers.push(blocker({
      id: `SOURCE-METHOD-NOTES-${editionId}`,
      severity: "high",
      category: "SOURCE_APPENDIX",
      message: `${sourceMethodNotesMissing.length} modelled/scenario source row(s) lack method notes.`,
      affectedEntityId: sourceMethodNotesMissing[0]?.sourceRowId ?? null,
      affectedEntityLabel: `${sourceMethodNotesMissing.length} method notes missing`,
      actionHref: "/admin/intelligence/gmi/source-workbench",
      actionLabel: "Add method notes",
      blocksPublication: true,
    }));
  }

  const highConvictionCalls = q1Calls.filter((call) => call.confidenceBand === "HIGH");
  const highConvictionTheses = highConvictionCalls.length;
  const completeFalsificationRules = falsificationRules.data.filter((rule) =>
    rule.currentStatus !== "retired" &&
    rule.thresholdValue.trim() && rule.observableIndicator.trim()
  );
  const falsificationRulesMissing = Math.max(0, highConvictionTheses - completeFalsificationRules.length);
  if (falsificationRulesMissing > 0) {
    blockers.push(blocker({
      id: `FALSIFICATION-GAP-${editionId}`,
      severity: "critical",
      category: "FALSIFICATION",
      message: `${falsificationRulesMissing} high-conviction thesis(es) lack complete falsification thresholds.`,
      affectedEntityId: null,
      affectedEntityLabel: `${falsificationRulesMissing} missing thresholds`,
      actionHref: "/admin/intelligence/gmi-falsification",
      actionLabel: "Resolve falsification gaps",
      whyItMatters: "High conviction without falsification is assertion, not accountable intelligence.",
      blocksPublication: true,
    }));
    requiredActions.push(`Add ${falsificationRulesMissing} falsification threshold(s).`);
  }

  const boardPulseComplete = Boolean(
    boardPulse.data &&
    boardPulse.data.operatorConsequenceIndex.length === 6 &&
    boardPulse.data.decisionsToMakeIn30Days.length >= 5 &&
    boardPulse.data.decisionsToPrepareIn90Days.length > 0 &&
    boardPulse.data.decisionsToDefer.length > 0
  );
  if (!boardPulseComplete) {
    blockers.push(blocker({
      id: `BOARD-PULSE-INCOMPLETE-${editionId}`,
      severity: "high",
      category: "BOARD_PULSE",
      message: "Persisted Board Pulse / consequence state is incomplete.",
      affectedEntityId: editionId,
      affectedEntityLabel: "GMI board consequence state",
      actionHref: "/admin/intelligence/gmi/publication-readiness",
      actionLabel: "Inspect board gate",
      blocksPublication: true,
    }));
  }

  const boardPackPdfAvailable = boardPackArtifact.ok;
  if (!boardPackPdfAvailable) {
    blockers.push(blocker({
      id: `PDF-BOARD-PACK-${editionId}`,
      severity: "medium",
      category: "PDF_EXPORT",
      message: `Board-pack PDF artifact is not valid for current DB state (${boardPackArtifact.reason ?? "UNKNOWN"}).`,
      affectedEntityId: editionId,
      affectedEntityLabel: boardPackArtifact.artifact?.id ?? "Board-pack PDF",
      actionHref: "/admin/intelligence/gmi/publication-readiness",
      actionLabel: "Generate board pack",
      whyItMatters: "The board-pack PDF must be generated from the same DB-derived state that Release Authority is evaluating.",
      blocksPublication: true,
    }));
  }

  const blocking = blockers.filter((item) => item.blocksPublication);
  const blockerCategories = [...new Set(blockers.map((item) => item.category))] as BlockerCategory[];
  let nextBlockingCategory: BlockerCategory | null = null;
  for (const category of CATEGORY_PRIORITY) {
    if (blocking.some((item) => item.category === category)) {
      nextBlockingCategory = category;
      break;
    }
  }
  const primaryNextAction = nextBlockingCategory
    ? CATEGORY_TO_NEXT_ACTION[nextBlockingCategory]
    : "READY_FOR_PUBLICATION";
  const published = boardPulse.data?.publicationStatus === "published" ||
    snapshots.data.some((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt);
  const releaseStatus = releaseStatusFor(primaryNextAction, blocking.length > 0, published);
  const generatedAt = now();

  return {
    editionId,
    editionSlug: edition.data.editionSlug,
    releaseStatus,
    primaryNextAction,
    canPublish: releaseStatus === "READY_FOR_PUBLICATION" && blocking.length === 0,
    blockers,
    warnings,
    blockerCategories,
    criticalBlockerCount: blocking.filter((item) => item.severity === "critical").length,
    highBlockerCount: blocking.filter((item) => item.severity === "high").length,
    nextBlockingCategory,
    requiredActions: [...new Set(requiredActions)],
    metrics: {
      totalCalls: performance.data.totalCallsIssued,
      reviewedCalls: performance.data.totalCallsReviewed,
      unscoredCalls: unscoredCalls.length,
      carriedForwardCalls: performance.data.carriedForwardCalls.length,
      disconfirmedCalls: performance.data.disconfirmedCalls.length,
      releaseBlockingSourcesOpen: releaseBlockingSources.length,
      sourceMethodNotesMissing: sourceMethodNotesMissing.length,
      highConvictionTheses,
      falsificationRulesMissing,
      boardPulseComplete,
      boardPackPdfAvailable,
      operatorBriefPublic: Boolean(boardPulse.data?.operatorBriefPublishedAt),
      performancePageLive: performance.provenance.sourceType === "DB",
      redTeamIntakeLive: true,
      lastLedgerMutationAt: performance.data.lastLedgerUpdateTimestamp,
      lastReleaseCheckAt: generatedAt,
    },
    provenance: provenanceState.data,
    generatedAt,
  };
}

export async function getGmiReleaseBlockers(editionId: string): Promise<GmiBlocker[]> {
  return (await resolveGmiReleaseState(editionId)).blockers;
}

export async function assertGmiEditionPublishable(editionId: string): Promise<{ ok: true } | { ok: false; blockers: GmiBlocker[] }> {
  const state = await resolveGmiReleaseState(editionId);
  if (!state.canPublish) {
    return { ok: false, blockers: state.blockers.filter((item) => item.blocksPublication) };
  }
  return { ok: true };
}

export async function buildGmiReleaseSnapshot(
  editionId: string,
  options?: { createdBy?: string | null; publishedBy?: string | null },
): Promise<GmiReleaseSnapshot> {
  const [state, calls, sources, falsificationRules, boardPulse, performance] = await Promise.all([
    resolveGmiReleaseState(editionId),
    getGmiCallLedger(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiBoardPulseData(editionId),
    getGmiPerformanceMetrics(editionId),
  ]);
  const releaseStatus = options?.publishedBy ? "PUBLISHED" : state.releaseStatus;
  const publishedAt = options?.publishedBy ? now() : null;

  return {
    id: snapshotId(),
    editionId,
    editionSlug: state.editionSlug,
    releaseStatus,
    primaryNextAction: state.primaryNextAction,
    methodologyVersion: performance.data.methodologyVersion,
    rubricVersion: performance.data.rubricVersion,
    callLedgerHash: canonicalHash(calls.data.map((call) => ({
      callId: call.callId,
      score: call.currentScore,
      status: call.currentStatus,
      evidenceSourceRows: call.evidenceSourceRows,
      nextReviewDue: call.nextReviewDue,
    }))),
    sourceAppendixHash: canonicalHash(sources.data.map((source) => ({
      sourceRowId: source.sourceRowId,
      status: source.status,
      releaseBlocker: source.releaseBlocker,
      confidenceBasis: source.confidenceBasis,
      methodNote: source.methodNote,
    }))),
    falsificationHash: canonicalHash(falsificationRules.data.map((rule) => ({
      id: rule.id,
      thesisId: rule.thesisId,
      status: rule.currentStatus,
      thresholdValue: rule.thresholdValue,
      observableIndicator: rule.observableIndicator,
    }))),
    boardPulseHash: canonicalHash(boardPulse.data),
    performanceMetricsJson: {
      ...performance.data,
      disconfirmedCalls: performance.data.disconfirmedCalls.map((call) => call.callId),
      carriedForwardCalls: performance.data.carriedForwardCalls.map((call) => call.callId),
      callsDueForReview: performance.data.callsDueForReview.map((call) => call.callId),
    },
    blockersJson: state.blockers,
    warningsJson: state.warnings,
    blockerCategoriesJson: state.blockerCategories,
    stateJson: {
      calls: calls.data,
      sources: sources.data,
      falsificationRules: falsificationRules.data,
      boardPulse: boardPulse.data,
      performance: performance.data,
      provenance: state.provenance,
    },
    createdBy: options?.createdBy ?? null,
    publishedBy: options?.publishedBy ?? null,
    publishedAt,
    createdAt: now(),
  };
}

export async function persistGmiReleaseSnapshot(snapshot: GmiReleaseSnapshot): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$executeRaw`
    INSERT INTO "gmi_release_snapshots" (
      "id",
      "edition_id",
      "edition_slug",
      "release_status",
      "primary_next_action",
      "methodology_version",
      "rubric_version",
      "call_ledger_hash",
      "source_appendix_hash",
      "falsification_hash",
      "board_pulse_hash",
      "performance_metrics_json",
      "blockers_json",
      "warnings_json",
      "blocker_categories_json",
      "state_json",
      "created_by",
      "published_by",
      "published_at",
      "created_at"
    )
    VALUES (
      ${snapshot.id},
      ${snapshot.editionId},
      ${snapshot.editionSlug},
      ${snapshot.releaseStatus},
      ${snapshot.primaryNextAction},
      ${snapshot.methodologyVersion},
      ${snapshot.rubricVersion},
      ${snapshot.callLedgerHash},
      ${snapshot.sourceAppendixHash},
      ${snapshot.falsificationHash},
      ${snapshot.boardPulseHash},
      CAST(${JSON.stringify(snapshot.performanceMetricsJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.blockersJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.warningsJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.blockerCategoriesJson)} AS jsonb),
      CAST(${JSON.stringify(snapshot.stateJson ?? null)} AS jsonb),
      ${snapshot.createdBy},
      ${snapshot.publishedBy},
      ${snapshot.publishedAt ? new Date(snapshot.publishedAt) : null},
      ${new Date(snapshot.createdAt)}
    )
  `;
}

export async function createAndPersistGmiReleaseSnapshot(
  editionId: string,
  options?: { createdBy?: string | null; publishedBy?: string | null },
): Promise<GmiReleaseSnapshot> {
  const snapshot = await buildGmiReleaseSnapshot(editionId, options);
  await persistGmiReleaseSnapshot(snapshot);
  return snapshot;
}

export async function getLatestSnapshot(editionId: string): Promise<GmiReleaseSnapshot | null> {
  const snapshots = await getGmiReleaseSnapshots(editionId);
  const row = snapshots.data[0];
  if (!row) return null;
  return {
    id: row.id,
    editionId: row.editionId,
    editionSlug: row.editionSlug,
    releaseStatus: row.releaseStatus as GmiReleaseStatus,
    primaryNextAction: row.primaryNextAction as GmiPrimaryNextAction,
    methodologyVersion: row.methodologyVersion,
    rubricVersion: row.rubricVersion,
    callLedgerHash: row.callLedgerHash,
    sourceAppendixHash: row.sourceAppendixHash,
    falsificationHash: row.falsificationHash,
    boardPulseHash: row.boardPulseHash,
    performanceMetricsJson: row.performanceMetricsJson,
    blockersJson: row.blockersJson as GmiBlocker[],
    warningsJson: row.warningsJson as GmiBlocker[],
    blockerCategoriesJson: row.blockerCategoriesJson as BlockerCategory[],
    stateJson: row.stateJson ?? null,
    createdBy: row.createdBy,
    publishedBy: row.publishedBy,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
  };
}
