/* lib/intelligence/gmi-release-authority.ts — PHASE 1: Canonical GMI Release State */
/* Single source of truth for GMI edition publishability. All admin surfaces read from here. */

import { buildGmiControlPlane, type GmiControlPlaneVerdict } from "./gmi-control-plane";
import { getPublicGmiCallLedger, type PublicGmiCallLedgerEntry } from "./gmi-instrument";
import { getSourceRowsForReport, getReleaseBlockerRows, type GmiSourceAppendixRow } from "./gmi-source-appendix-registry";
import { buildGmiFalsificationRegister, type GmiFalsificationRuleRecord } from "./gmi-control-plane";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { getCallsPendingReview, getCallsForReport } from "./market-intelligence-call-ledger";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GmiReleaseStatus =
  | "DRAFT"
  | "BLOCKED"
  | "NEEDS_CALL_REVIEW"
  | "NEEDS_SOURCE_REVIEW"
  | "NEEDS_FALSIFICATION_REVIEW"
  | "NEEDS_BOARD_REVIEW"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED";

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
  | "METADATA";

export type GmiBlocker = {
  id: string;
  severity: BlockerSeverity;
  category: BlockerCategory;
  message: string;
  affectedEntityId: string | null;
  affectedEntityLabel: string | null;
  actionHref: string | null;
  actionLabel: string | null;
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
  status: GmiReleaseStatus;
  blockers: GmiBlocker[];
  warnings: GmiBlocker[];
  requiredActions: string[];
  metrics: GmiReleaseMetrics;
  generatedAt: string;
};

export type GmiReleaseSnapshot = {
  id: string;
  editionId: string;
  releaseStatus: GmiReleaseStatus;
  methodologyVersion: string;
  rubricVersion: string;
  callLedgerHash: string;
  sourceAppendixHash: string;
  falsificationHash: string;
  boardPulseHash: string;
  performanceMetricsJson: Record<string, unknown>;
  blockersJson: GmiBlocker[];
  warningsJson: GmiBlocker[];
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function id(prefix: string): string {
  const crypto = require("crypto");
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function hashJson(obj: unknown): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

function now(): string {
  return new Date().toISOString();
}

// ─── Release State Resolver ──────────────────────────────────────────────────

export function resolveGmiReleaseState(editionId: string): GmiReleaseState {
  const plane = buildGmiControlPlane(editionId);
  const pr = plane.publicationReadiness;
  const calls = getPublicGmiCallLedger().filter((c) => c.editionId === editionId || c.editionId === "GMI-Q1-2026");
  const q1Calls = calls.filter((c) => c.editionId === "GMI-Q1-2026");
  const sourceRows = getSourceRowsForReport(editionId);
  const releaseBlockingRows = sourceRows.filter((r) => r.releaseBlocker && (r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED"));
  const falsificationRules = buildGmiFalsificationRegister(editionId);
  const highConvictionCalls = q1Calls.filter((c) => c.confidenceBand === "HIGH");
  const missingFalsificationThresholds = Math.max(0, highConvictionCalls.length - falsificationRules.length);

  const blockers: GmiBlocker[] = [];
  const warnings: GmiBlocker[] = [];
  const requiredActions: string[] = [];

  // Call Review Gate
  const unscoredCalls = q1Calls.filter((c) => c.currentScore === null);
  const carriedForwardCalls = q1Calls.filter((c) => c.currentScore === 2);
  const callsWithoutEvidence = q1Calls.filter((c) =>
    c.currentScore !== null && c.currentScore !== 2 && c.evidenceSources.length === 0
  );

  if (unscoredCalls.length > 0) {
    blockers.push({
      id: `BLOCKER-CALL-UNSCORED-${editionId}`,
      severity: "critical",
      category: "CALL_REVIEW",
      message: `${unscoredCalls.length} call(s) have not been scored. Every call must be reviewed before publication.`,
      affectedEntityId: unscoredCalls[0]?.callId ?? null,
      affectedEntityLabel: `${unscoredCalls.length} unscored calls`,
      actionHref: "/admin/intelligence/gmi/batch-score",
      actionLabel: "Score pending calls",
      blocksPublication: true,
    });
    requiredActions.push(`Score ${unscoredCalls.length} pending call(s)`);
  }

  if (callsWithoutEvidence.length > 0) {
    blockers.push({
      id: `BLOCKER-CALL-NO-EVIDENCE-${editionId}`,
      severity: "high",
      category: "CALL_REVIEW",
      message: `${callsWithoutEvidence.length} scored call(s) have no evidence sources attached.`,
      affectedEntityId: null,
      affectedEntityLabel: `${callsWithoutEvidence.length} evidence-missing calls`,
      actionHref: "/admin/intelligence/gmi/batch-score",
      actionLabel: "Add evidence sources",
      blocksPublication: true,
    });
    requiredActions.push(`Add evidence sources to ${callsWithoutEvidence.length} call(s)`);
  }

  // Source Appendix Gate
  if (releaseBlockingRows.length > 0) {
    const methodNoteMissing = releaseBlockingRows.filter((r) => r.status === "METHOD_NOTE_REQUIRED");
    blockers.push({
      id: `BLOCKER-SOURCE-${editionId}`,
      severity: "critical",
      category: "SOURCE_APPENDIX",
      message: `${releaseBlockingRows.length} release-blocking source row(s) are still open.`,
      affectedEntityId: releaseBlockingRows[0]?.id ?? null,
      affectedEntityLabel: `${releaseBlockingRows.length} blocking source rows`,
      actionHref: "/admin/intelligence/gmi/source-workbench",
      actionLabel: "Resolve source blockers",
      blocksPublication: true,
    });
    requiredActions.push(`Resolve ${releaseBlockingRows.length} release-blocking source row(s)`);

    if (methodNoteMissing.length > 0) {
      warnings.push({
        id: `WARN-SOURCE-METHOD-NOTE-${editionId}`,
        severity: "medium",
        category: "SOURCE_APPENDIX",
        message: `${methodNoteMissing.length} modelled estimate(s) require method notes.`,
        affectedEntityId: null,
        affectedEntityLabel: `${methodNoteMissing.length} method notes required`,
        actionHref: "/admin/intelligence/gmi/source-workbench",
        actionLabel: "Add method notes",
        blocksPublication: false,
      });
    }
  }

  // Falsification Gate
  if (missingFalsificationThresholds > 0) {
    blockers.push({
      id: `BLOCKER-FALSIFICATION-${editionId}`,
      severity: "critical",
      category: "FALSIFICATION",
      message: `${missingFalsificationThresholds} high-conviction thesis(es) lack falsification thresholds.`,
      affectedEntityId: null,
      affectedEntityLabel: `${missingFalsificationThresholds} missing thresholds`,
      actionHref: "/admin/intelligence/gmi/falsification",
      actionLabel: "Add falsification rules",
      blocksPublication: true,
    });
    requiredActions.push(`Add falsification thresholds for ${missingFalsificationThresholds} high-conviction thesis(es)`);
  }

  const incompleteRules = falsificationRules.filter((r) => !r.thresholdValue.trim() || !r.observableIndicator.trim());
  if (incompleteRules.length > 0) {
    blockers.push({
      id: `BLOCKER-FALSIFICATION-INCOMPLETE-${editionId}`,
      severity: "high",
      category: "FALSIFICATION",
      message: `${incompleteRules.length} falsification rule(s) have incomplete threshold or observable indicator.`,
      affectedEntityId: incompleteRules[0]?.id ?? null,
      affectedEntityLabel: `${incompleteRules.length} incomplete rules`,
      actionHref: "/admin/intelligence/gmi/falsification",
      actionLabel: "Complete falsification rules",
      blocksPublication: true,
    });
  }

  // Board Pulse Gate
  const boardPulseComplete = plane.boardConsequenceIntegrity.operatorConsequenceIndexComplete;
  if (!boardPulseComplete) {
    blockers.push({
      id: `BLOCKER-BOARD-PULSE-${editionId}`,
      severity: "high",
      category: "BOARD_PULSE",
      message: "Board Pulse Operator Consequence Index is incomplete. All 6 dimensions must be scored.",
      affectedEntityId: null,
      affectedEntityLabel: "Board Pulse",
      actionHref: "/admin/intelligence/gmi/board-pulse",
      actionLabel: "Complete Board Pulse",
      blocksPublication: true,
    });
    requiredActions.push("Complete Board Pulse Operator Consequence Index");
  }

  // Board Pack PDF Gate
  const boardPackAvailable = plane.publicTrustSurface.boardPulseLive;
  if (!boardPackAvailable) {
    warnings.push({
      id: `WARN-BOARD-PACK-${editionId}`,
      severity: "medium",
      category: "PDF_EXPORT",
      message: "Board-pack PDF has not been generated or confirmed.",
      affectedEntityId: null,
      affectedEntityLabel: "Board-pack PDF",
      actionHref: "/admin/intelligence/gmi/board-pack",
      actionLabel: "Generate board-pack PDF",
      blocksPublication: false,
    });
  }

  // Commercial Routing Gate
  if (!plane.commercialRouting.boardroomBriefRouteAvailable) {
    warnings.push({
      id: `WARN-COMMERCIAL-BOARDROOM-${editionId}`,
      severity: "medium",
      category: "COMMERCIAL_ROUTING",
      message: "Boardroom Brief commercial route is not available.",
      affectedEntityId: null,
      affectedEntityLabel: "Boardroom Brief route",
      actionHref: "/boardroom-brief",
      actionLabel: "Verify Boardroom Brief route",
      blocksPublication: false,
    });
  }

  // Determine status
  const criticalBlockers = blockers.filter((b) => b.blocksPublication);
  let status: GmiReleaseStatus;

  if (String(pr.publicationStatus) === "PUBLISHED") {
    status = "PUBLISHED";
  } else if (criticalBlockers.length === 0) {
    status = "READY_FOR_PUBLICATION";
  } else if (blockers.some((b) => b.category === "CALL_REVIEW" && b.blocksPublication)) {
    status = "NEEDS_CALL_REVIEW";
  } else if (blockers.some((b) => b.category === "SOURCE_APPENDIX" && b.blocksPublication)) {
    status = "NEEDS_SOURCE_REVIEW";
  } else if (blockers.some((b) => b.category === "FALSIFICATION" && b.blocksPublication)) {
    status = "NEEDS_FALSIFICATION_REVIEW";
  } else if (blockers.some((b) => b.category === "BOARD_PULSE" && b.blocksPublication)) {
    status = "NEEDS_BOARD_REVIEW";
  } else {
    status = "BLOCKED";
  }

  return {
    editionId,
    editionSlug: editionId.toLowerCase().replace(/-/g, "-"),
    status,
    blockers,
    warnings,
    requiredActions: [...new Set(requiredActions)],
    metrics: {
      totalCalls: plane.callLedgerIntegrity.totalCalls,
      reviewedCalls: plane.callLedgerIntegrity.scoredCalls,
      unscoredCalls: plane.callLedgerIntegrity.unscoredCalls,
      carriedForwardCalls: plane.callLedgerIntegrity.callsCarriedForward,
      disconfirmedCalls: plane.callLedgerIntegrity.disconfirmedCalls,
      releaseBlockingSourcesOpen: releaseBlockingRows.length,
      sourceMethodNotesMissing: sourceRows.filter((r) => r.status === "METHOD_NOTE_REQUIRED").length,
      highConvictionTheses: highConvictionCalls.length,
      falsificationRulesMissing: missingFalsificationThresholds,
      boardPulseComplete,
      boardPackPdfAvailable: boardPackAvailable,
      operatorBriefPublic: plane.publicTrustSurface.operatorBriefLive,
      performancePageLive: plane.publicTrustSurface.performancePageLive,
      redTeamIntakeLive: plane.publicTrustSurface.redTeamPageLive,
      lastLedgerMutationAt: plane.performance.lastUpdatedTimestamp,
      lastReleaseCheckAt: now(),
    },
    generatedAt: now(),
  };
}

export function getGmiReleaseBlockers(editionId: string): GmiBlocker[] {
  return resolveGmiReleaseState(editionId).blockers;
}

export function assertGmiEditionPublishable(editionId: string): { ok: true } | { ok: false; blockers: GmiBlocker[] } {
  const state = resolveGmiReleaseState(editionId);
  const criticalBlockers = state.blockers.filter((b) => b.blocksPublication);
  if (criticalBlockers.length > 0) {
    return { ok: false, blockers: criticalBlockers };
  }
  return { ok: true };
}

export function buildGmiReleaseSnapshot(editionId: string, publishedBy?: string): GmiReleaseSnapshot {
  const state = resolveGmiReleaseState(editionId);
  const plane = buildGmiControlPlane(editionId);
  const calls = getPublicGmiCallLedger().filter((c) => c.editionId === editionId || c.editionId === "GMI-Q1-2026");
  const sourceRows = getSourceRowsForReport(editionId);
  const falsificationRules = buildGmiFalsificationRegister(editionId);

  return {
    id: id("gmirs"),
    editionId,
    releaseStatus: state.status,
    methodologyVersion: plane.performance.methodologyVersion,
    rubricVersion: plane.performance.rubricVersion,
    callLedgerHash: hashJson(calls.map((c) => ({
      id: c.callId,
      score: c.currentScore,
      status: c.currentStatus,
      evidenceSources: c.evidenceSources,
    }))),
    sourceAppendixHash: hashJson(sourceRows.map((r) => ({
      id: r.id,
      status: r.status,
      releaseBlocker: r.releaseBlocker,
    }))),
    falsificationHash: hashJson(falsificationRules.map((r) => ({
      id: r.id,
      status: r.currentStatus,
      thresholdValue: r.thresholdValue,
    }))),
    boardPulseHash: hashJson({
      operatorConsequenceIndex: plane.boardConsequenceIntegrity,
      boardDecisions: plane.boardConsequenceIntegrity.thirtyDayDecisions,
    }),
    performanceMetricsJson: {
      totalCalls: state.metrics.totalCalls,
      reviewedCalls: state.metrics.reviewedCalls,
      unscoredCalls: state.metrics.unscoredCalls,
      carriedForwardCalls: state.metrics.carriedForwardCalls,
      disconfirmedCalls: state.metrics.disconfirmedCalls,
      releaseBlockingSourcesOpen: state.metrics.releaseBlockingSourcesOpen,
      falsificationRulesMissing: state.metrics.falsificationRulesMissing,
    },
    blockersJson: state.blockers,
    warningsJson: state.warnings,
    publishedBy: publishedBy ?? null,
    publishedAt: state.status === "PUBLISHED" ? now() : null,
    createdAt: now(),
  };
}
