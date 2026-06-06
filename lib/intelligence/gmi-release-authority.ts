/* lib/intelligence/gmi-release-authority.ts — PHASE 1+2: Canonical GMI Release State + Snapshot Persistence */
/* Single source of truth for GMI edition publishability. All admin surfaces read from here. */
/* Strategic rule: releaseStatus=BLOCKED while any publication-blocking issue remains. */

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
  | "POST_MORTEM";

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
  createdBy: string | null;
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

const CATEGORY_PRIORITY: BlockerCategory[] = [
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

// ─── Release State Resolver ──────────────────────────────────────────────────

export function resolveGmiReleaseState(editionId: string): GmiReleaseState {
  const plane = buildGmiControlPlane(editionId);
  const pr = plane.publicationReadiness;
  const lifecycle = getMarketIntelligenceRecord(editionId);
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

  // ── Call Review Gate ─────────────────────────────────────────────────────
  const unscoredCalls = q1Calls.filter((c) => c.currentScore === null);
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
    requiredActions.push(`Score ${unscoredCalls.length} pending call(s) at /admin/intelligence/gmi/batch-score`);
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

  // ── Source Appendix Gate ─────────────────────────────────────────────────
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
    requiredActions.push(`Resolve ${releaseBlockingRows.length} release-blocking source row(s) at /admin/intelligence/gmi/source-workbench`);

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

  // ── Falsification Gate ───────────────────────────────────────────────────
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
    requiredActions.push(`Add falsification thresholds for ${missingFalsificationThresholds} high-conviction thesis(es) at /admin/intelligence/gmi/falsification`);
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

  // ── Board Pulse Gate ─────────────────────────────────────────────────────
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

  // ── Board Pack PDF Gate ──────────────────────────────────────────────────
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

  // ── Post-Mortem Gate ─────────────────────────────────────────────────────
  // Future editions cannot publish unless previous edition has post-mortem
  if (editionId === "GMI-Q3-2026") {
    const q2Published = String(lifecycle?.lifecycleState ?? "") === "PUBLISHED";
    if (!q2Published) {
      blockers.push({
        id: `BLOCKER-POST-MORTEM-${editionId}`,
        severity: "critical",
        category: "POST_MORTEM",
        message: "Previous edition (Q2) has not been published. Q3 cannot publish until Q2 post-mortem exists.",
        affectedEntityId: null,
        affectedEntityLabel: "Q2 post-mortem required",
        actionHref: "/intelligence/gmi/post-mortem",
        actionLabel: "Complete Q2 post-mortem",
        blocksPublication: true,
      });
    }
  }

  // ── Determine Status ─────────────────────────────────────────────────────
  const criticalBlockers = blockers.filter((b) => b.blocksPublication);
  const blockerCategories = [...new Set(blockers.map((b) => b.category))] as BlockerCategory[];

  // Strategic rule: releaseStatus=BLOCKED while any publication-blocking issue remains
  const isPublished = String(lifecycle?.lifecycleState ?? pr.publicationStatus) === "PUBLISHED";
  let releaseStatus: GmiReleaseStatus;
  if (isPublished) {
    releaseStatus = "PUBLISHED";
  } else if (criticalBlockers.length > 0) {
    releaseStatus = "BLOCKED";
  } else {
    releaseStatus = "READY_FOR_PUBLICATION";
  }

  // Determine primaryNextAction — what the editor should do first
  let primaryNextAction: GmiPrimaryNextAction = null;
  if (releaseStatus === "READY_FOR_PUBLICATION") {
    primaryNextAction = "READY_FOR_PUBLICATION";
  } else if (criticalBlockers.length > 0) {
    // Find the highest-priority blocking category
    for (const cat of CATEGORY_PRIORITY) {
      if (blockers.some((b) => b.category === cat && b.blocksPublication)) {
        primaryNextAction = CATEGORY_TO_NEXT_ACTION[cat];
        break;
      }
    }
  }

  // Determine next blocking category
  let nextBlockingCategory: BlockerCategory | null = null;
  for (const cat of CATEGORY_PRIORITY) {
    if (blockers.some((b) => b.category === cat && b.blocksPublication)) {
      nextBlockingCategory = cat;
      break;
    }
  }

  return {
    editionId,
    editionSlug: editionId.toLowerCase().replace(/_/g, "-"),
    releaseStatus,
    primaryNextAction,
    canPublish: releaseStatus === "READY_FOR_PUBLICATION",
    blockers,
    warnings,
    blockerCategories,
    criticalBlockerCount: criticalBlockers.length,
    highBlockerCount: blockers.filter((b) => b.severity === "high" && b.blocksPublication).length,
    nextBlockingCategory,
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
  if (!state.canPublish) {
    return { ok: false, blockers: state.blockers.filter((b) => b.blocksPublication) };
  }
  return { ok: true };
}

// ─── Release Snapshot ────────────────────────────────────────────────────────

export function buildGmiReleaseSnapshot(
  editionId: string,
  options?: { createdBy?: string; publishedBy?: string; persist?: boolean },
): GmiReleaseSnapshot {
  const state = resolveGmiReleaseState(editionId);
  const plane = buildGmiControlPlane(editionId);
  const calls = getPublicGmiCallLedger().filter((c) => c.editionId === editionId || c.editionId === "GMI-Q1-2026");
  const sourceRows = getSourceRowsForReport(editionId);
  const falsificationRules = buildGmiFalsificationRegister(editionId);

  const snapshot: GmiReleaseSnapshot = {
    id: id("gmirs"),
    editionId,
    editionSlug: state.editionSlug,
    releaseStatus: state.releaseStatus,
    primaryNextAction: state.primaryNextAction,
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
    blockerCategoriesJson: state.blockerCategories,
    createdBy: options?.createdBy ?? null,
    publishedBy: options?.publishedBy ?? null,
    publishedAt: state.releaseStatus === "PUBLISHED" ? now() : null,
    createdAt: now(),
  };

  // Persist to database if requested
  if (options?.persist) {
    persistSnapshot(snapshot).catch(() => {});
  }

  return snapshot;
}

async function persistSnapshot(snapshot: GmiReleaseSnapshot): Promise<void> {
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$executeRaw`
      INSERT INTO gmi_release_snapshots (
        id, edition_id, edition_slug, release_status, primary_next_action,
        methodology_version, rubric_version,
        call_ledger_hash, source_appendix_hash, falsification_hash, board_pulse_hash,
        performance_metrics_json, blockers_json, warnings_json, blocker_categories_json,
        created_by, published_by, published_at, created_at
      ) VALUES (
        ${snapshot.id}, ${snapshot.editionId}, ${snapshot.editionSlug}, ${snapshot.releaseStatus},
        ${snapshot.primaryNextAction},
        ${snapshot.methodologyVersion}, ${snapshot.rubricVersion},
        ${snapshot.callLedgerHash}, ${snapshot.sourceAppendixHash},
        ${snapshot.falsificationHash}, ${snapshot.boardPulseHash},
        ${JSON.stringify(snapshot.performanceMetricsJson)}::jsonb,
        ${JSON.stringify(snapshot.blockersJson)}::jsonb,
        ${JSON.stringify(snapshot.warningsJson)}::jsonb,
        ${JSON.stringify(snapshot.blockerCategoriesJson)}::jsonb,
        ${snapshot.createdBy}, ${snapshot.publishedBy}, ${snapshot.publishedAt}::timestamptz, NOW()
      )
    `;
  } catch (error) {
    console.error("[GMI_SNAPSHOT_PERSIST]", error);
  }
}

export async function getLatestSnapshot(editionId: string): Promise<GmiReleaseSnapshot | null> {
  try {
    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      edition_id: string;
      edition_slug: string;
      release_status: string;
      primary_next_action: string | null;
      methodology_version: string;
      rubric_version: string;
      call_ledger_hash: string;
      source_appendix_hash: string;
      falsification_hash: string;
      board_pulse_hash: string;
      performance_metrics_json: any;
      blockers_json: any;
      warnings_json: any;
      blocker_categories_json: any;
      created_by: string | null;
      published_by: string | null;
      published_at: Date | null;
      created_at: Date;
    }>>`
      SELECT * FROM gmi_release_snapshots
      WHERE edition_id = ${editionId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      editionId: r.edition_id,
      editionSlug: r.edition_slug,
      releaseStatus: r.release_status as GmiReleaseStatus,
      primaryNextAction: r.primary_next_action as GmiPrimaryNextAction,
      methodologyVersion: r.methodology_version,
      rubricVersion: r.rubric_version,
      callLedgerHash: r.call_ledger_hash,
      sourceAppendixHash: r.source_appendix_hash,
      falsificationHash: r.falsification_hash,
      boardPulseHash: r.board_pulse_hash,
      performanceMetricsJson: r.performance_metrics_json,
      blockersJson: r.blockers_json as GmiBlocker[],
      warningsJson: r.warnings_json as GmiBlocker[],
      blockerCategoriesJson: r.blocker_categories_json as BlockerCategory[],
      createdBy: r.created_by,
      publishedBy: r.published_by,
      publishedAt: r.published_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
    };
  } catch {
    return null;
  }
}