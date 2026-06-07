import crypto from "node:crypto";

import { prisma } from "@/lib/prisma";

import { GMI_METHODOLOGY, getGmiRubricLabel, type GmiRubricScore } from "./gmi-methodology";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { getLatestPublishedGmiEdition } from "./gmi-edition-resolver";

export type GmiProvenanceSourceType = "DB" | "CONTENT" | "SEED_STATIC" | "FALLBACK_STATIC" | "EMPTY";

export type GmiDataProvenance = {
  sourceType: GmiProvenanceSourceType;
  sourceName: string;
  lastUpdatedAt: string | null;
  recordCount: number;
  isProductionSafe: boolean;
  warnings: string[];
};

export type GmiDataResult<T> = {
  data: T;
  provenance: GmiDataProvenance;
};

export type GmiDataBundle = {
  edition: Awaited<ReturnType<typeof getGmiEditionState>>;
  calls: Awaited<ReturnType<typeof getGmiCallLedger>>;
  sources: Awaited<ReturnType<typeof getGmiSourceAppendix>>;
  falsificationRules: Awaited<ReturnType<typeof getGmiFalsificationRules>>;
  snapshots: Awaited<ReturnType<typeof getGmiReleaseSnapshots>>;
  boardPulse: Awaited<ReturnType<typeof getGmiBoardPulseData>>;
  performance: Awaited<ReturnType<typeof getGmiPerformanceMetrics>>;
  provenance: Awaited<ReturnType<typeof getGmiProvenanceState>>;
};

export type GmiCallLedgerData = {
  callId: string;
  editionId: string;
  editionSlug: string;
  callStatement: string;
  category: string;
  region: string | null;
  assetClass: string | null;
  theme: string | null;
  confidenceBand: string;
  currentStatus: string;
  currentScore: GmiRubricScore | null;
  scoreLabel: string | null;
  evidenceSummary: string;
  evidenceSourceRows: string[];
  justification: string;
  carryForwardJustification: string | null;
  lastReviewedAt: string | null;
  nextReviewDue: string | null;
  methodologyVersion: string;
  rubricVersion: string;
  reviewedBy: string | null;
  sourceAppendixRefs: string[];
  createdAt: string;
  updatedAt: string;
};

export type GmiSourceAppendixData = {
  id: string;
  editionId: string;
  sourceRowId: string;
  claim: string;
  evidenceClass: string;
  confidenceBasis: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  publisher: string | null;
  publicationDate: string | null;
  accessDate: string | null;
  observationWindow: string;
  confidence: string;
  reportSection: string;
  status: string;
  releaseBlocker: boolean;
  methodNote: string | null;
  adminJustification: string | null;
  sourceVisibility: string;
  linkedCallIds: string[];
  linkedThesisIds: string[];
  importedFrom: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmiFalsificationRuleData = {
  id: string;
  editionId: string;
  thesisId: string;
  thesisStatement: string;
  falsificationCondition: string;
  observableIndicator: string;
  thresholdType: string;
  thresholdValue: string;
  currentStatus: string;
  evidenceSourceRows: string[];
  nextReviewDue: string | null;
  lastReviewedAt: string | null;
  publicExplanation: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GmiReleaseSnapshotData = {
  id: string;
  editionId: string;
  editionSlug: string;
  releaseStatus: string;
  primaryNextAction: string | null;
  methodologyVersion: string;
  rubricVersion: string;
  callLedgerHash: string;
  sourceAppendixHash: string;
  falsificationHash: string;
  boardPulseHash: string;
  performanceMetricsJson: Record<string, unknown>;
  blockersJson: unknown[];
  warningsJson: unknown[];
  blockerCategoriesJson: string[];
  stateJson?: Record<string, unknown> | null;
  createdBy: string | null;
  publishedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type GmiBoardPulseData = {
  editionId: string;
  publicationStatus: string;
  operatorConsequenceIndex: unknown[];
  decisionsToMakeIn30Days: unknown[];
  decisionsToPrepareIn90Days: unknown[];
  decisionsToDefer: unknown[];
  boardPulsePublishedAt: string | null;
  operatorBriefPublishedAt: string | null;
  boardPackGeneratedAt: string | null;
  fullEditionGated: boolean;
  architectEditionGated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GmiPerformanceMetricsData = {
  totalCallsIssued: number;
  totalCallsReviewed: number;
  averageScore: number | null;
  scoreDistribution: Record<GmiRubricScore, number>;
  reviewedCallPercentage: number;
  confirmedCount: number;
  partialCount: number;
  pendingCarryForwardCount: number;
  weakDisconfirmedCount: number;
  disconfirmedCalls: GmiCallLedgerData[];
  carriedForwardCalls: GmiCallLedgerData[];
  callsDueForReview: GmiCallLedgerData[];
  methodologyVersion: string;
  rubricVersion: string;
  lastLedgerUpdateTimestamp: string | null;
};

export async function getLatestPublishedEditionId(): Promise<string | null> {
  const edition = await getLatestPublishedGmiEdition();
  return edition?.editionId ?? null;
}

function production(): boolean {
  return process.env.NODE_ENV === "production";
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function dateIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function missingTableWarning(error: unknown, tableName: string): string | null {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("42P01") || message.includes(`relation "${tableName}" does not exist`)
    ? `Persisted table ${tableName} is unavailable.`
    : null;
}

function provenance(input: {
  sourceType: GmiProvenanceSourceType;
  sourceName: string;
  lastUpdatedAt?: string | null;
  recordCount: number;
  warnings?: string[];
}): GmiDataProvenance {
  const unsafe = input.sourceType === "EMPTY" ||
    input.sourceType === "FALLBACK_STATIC" ||
    (production() && input.sourceType !== "DB" && input.sourceType !== "CONTENT");
  return {
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    lastUpdatedAt: input.lastUpdatedAt ?? null,
    recordCount: input.recordCount,
    isProductionSafe: !unsafe,
    warnings: input.warnings ?? [],
  };
}

function latest<T>(rows: T[], pick: (row: T) => string | null): string | null {
  const times = rows
    .map(pick)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a);
  return times[0] === undefined ? null : new Date(times[0]).toISOString();
}

export async function getGmiEditionState(editionId: string) {
  const record = getMarketIntelligenceRecord(editionId);
  return {
    data: {
      editionId,
      editionSlug: editionId.toLowerCase().replace(/^gmi-/, "").replace(/_/g, "-"),
      title: record?.title ?? editionId,
      lifecycleState: record?.lifecycleState ?? "DRAFT",
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
      updatedAt: record?.updatedAt ?? record?.publishedAt ?? GMI_METHODOLOGY.effectiveFrom,
    },
    provenance: provenance({
      sourceType: "CONTENT",
      sourceName: "market-intelligence-lifecycle",
      lastUpdatedAt: record?.updatedAt ?? record?.publishedAt ?? GMI_METHODOLOGY.effectiveFrom,
      recordCount: record ? 1 : 0,
      warnings: record ? [] : [`No versioned edition content found for ${editionId}.`],
    }),
  };
}

export async function getGmiCallLedger(editionId: string): Promise<GmiDataResult<GmiCallLedgerData[]>> {
  type Row = {
    callId: string;
    editionId: string;
    editionSlug: string;
    callStatement: string;
    category: string;
    region: string | null;
    assetClass: string | null;
    theme: string | null;
    originalConfidenceBand: string;
    currentStatus: string;
    currentScore: number | null;
    evidenceSummary: string;
    evidenceSourceRows: unknown;
    justification: string;
    carryForwardJustification: string | null;
    lastReviewedAt: Date | null;
    nextReviewDue: Date | null;
    methodologyVersion: string;
    rubricVersion: string;
    reviewedBy: string | null;
    sourceAppendixRefs: unknown;
    createdAt: Date;
    updatedAt: Date;
  };
  let rows: Row[] = [];
  let tableWarning: string | null = null;
  try {
    rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "call_id" AS "callId",
        "edition_id" AS "editionId",
        "edition_slug" AS "editionSlug",
        "call_statement" AS "callStatement",
        "category",
        "region",
        "asset_class" AS "assetClass",
        "theme",
        "original_confidence_band" AS "originalConfidenceBand",
        "current_status" AS "currentStatus",
        "current_score" AS "currentScore",
        "evidence_summary" AS "evidenceSummary",
        "evidence_source_rows_json" AS "evidenceSourceRows",
        "justification",
        "carry_forward_justification" AS "carryForwardJustification",
        "last_reviewed_at" AS "lastReviewedAt",
        "next_review_due" AS "nextReviewDue",
        "methodology_version" AS "methodologyVersion",
        "rubric_version" AS "rubricVersion",
        "reviewed_by" AS "reviewedBy",
        "source_appendix_refs_json" AS "sourceAppendixRefs",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
      FROM "gmi_call_ledger_entries"
      WHERE "edition_id" IN (${editionId}, 'GMI-Q1-2026')
      ORDER BY "edition_id" ASC, "call_id" ASC
    `;
  } catch (error) {
    tableWarning = missingTableWarning(error, "gmi_call_ledger_entries");
    if (!tableWarning) throw error;
  }

  const data = rows.map((row) => {
    const score = row.currentScore === null ? null : row.currentScore as GmiRubricScore;
    return {
      callId: row.callId,
      editionId: row.editionId,
      editionSlug: row.editionSlug,
      callStatement: row.callStatement,
      category: row.category,
      region: row.region,
      assetClass: row.assetClass,
      theme: row.theme,
      confidenceBand: row.originalConfidenceBand,
      currentStatus: row.currentStatus,
      currentScore: score,
      scoreLabel: score === null ? null : getGmiRubricLabel(score),
      evidenceSummary: row.evidenceSummary,
      evidenceSourceRows: parseStringArray(row.evidenceSourceRows),
      justification: row.justification,
      carryForwardJustification: row.carryForwardJustification,
      lastReviewedAt: dateIso(row.lastReviewedAt),
      nextReviewDue: dateIso(row.nextReviewDue),
      methodologyVersion: row.methodologyVersion,
      rubricVersion: row.rubricVersion,
      reviewedBy: row.reviewedBy,
      sourceAppendixRefs: parseStringArray(row.sourceAppendixRefs),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return {
    data,
    provenance: provenance({
      sourceType: data.length > 0 ? "DB" : "EMPTY",
      sourceName: "gmi_call_ledger_entries",
      lastUpdatedAt: latest(data, (row) => row.updatedAt),
      recordCount: data.length,
      warnings: data.length > 0 ? [] : [tableWarning ?? `No persisted GMI call ledger rows found for ${editionId}.`],
    }),
  };
}

export async function getGmiSourceAppendix(editionId: string): Promise<GmiDataResult<GmiSourceAppendixData[]>> {
  type Row = {
    id: string;
    editionId: string;
    sourceRowId: string;
    claim: string;
    evidenceClass: string;
    confidenceBasis: string | null;
    sourceTitle: string | null;
    sourceUrl: string | null;
    publisher: string | null;
    publicationDate: string | null;
    accessDate: string | null;
    observationWindow: string;
    confidence: string;
    reportSection: string;
    status: string;
    releaseBlocker: boolean;
    methodNote: string | null;
    adminJustification: string | null;
    sourceVisibility: string;
    linkedCallIds: unknown;
    linkedThesisIds: unknown;
    importedFrom: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  let rows: Row[] = [];
  let tableWarning: string | null = null;
  try {
    rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "id",
        "edition_id" AS "editionId",
        "source_row_id" AS "sourceRowId",
        "claim",
        "evidence_class" AS "evidenceClass",
        "confidence_basis" AS "confidenceBasis",
        "source_title" AS "sourceTitle",
        "source_url" AS "sourceUrl",
        "publisher",
        "publication_date" AS "publicationDate",
        "access_date" AS "accessDate",
        "observation_window" AS "observationWindow",
        "confidence",
        "report_section" AS "reportSection",
        "status",
        "release_blocker" AS "releaseBlocker",
        "method_note" AS "methodNote",
        "admin_justification" AS "adminJustification",
        "source_visibility" AS "sourceVisibility",
        "linked_call_ids_json" AS "linkedCallIds",
        "linked_thesis_ids_json" AS "linkedThesisIds",
        "imported_from" AS "importedFrom",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
      FROM "gmi_source_appendix_rows"
      WHERE "edition_id" = ${editionId}
      ORDER BY "source_row_id" ASC
    `;
  } catch (error) {
    tableWarning = missingTableWarning(error, "gmi_source_appendix_rows");
    if (!tableWarning) throw error;
  }

  const data = rows.map((row) => ({
    ...row,
    linkedCallIds: parseStringArray(row.linkedCallIds),
    linkedThesisIds: parseStringArray(row.linkedThesisIds),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    data,
    provenance: provenance({
      sourceType: data.length > 0 ? "DB" : "EMPTY",
      sourceName: "gmi_source_appendix_rows",
      lastUpdatedAt: latest(data, (row) => row.updatedAt),
      recordCount: data.length,
      warnings: data.length > 0 ? [] : [tableWarning ?? `No persisted GMI source appendix rows found for ${editionId}.`],
    }),
  };
}

export async function getGmiFalsificationRules(editionId: string): Promise<GmiDataResult<GmiFalsificationRuleData[]>> {
  type Row = {
    id: string;
    editionId: string;
    thesisId: string;
    thesisStatement: string;
    falsificationCondition: string;
    observableIndicator: string;
    thresholdType: string;
    thresholdValue: string;
    currentStatus: string;
    evidenceSourceRows: unknown;
    nextReviewDue: Date | null;
    lastReviewedAt: Date | null;
    publicExplanation: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  let rows: Row[] = [];
  let tableWarning: string | null = null;
  try {
    rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "id",
        "edition_id" AS "editionId",
        "thesis_id" AS "thesisId",
        "thesis_statement" AS "thesisStatement",
        "falsification_condition" AS "falsificationCondition",
        "observable_indicator" AS "observableIndicator",
        "threshold_type" AS "thresholdType",
        "threshold_value" AS "thresholdValue",
        "current_status" AS "currentStatus",
        "evidence_source_rows_json" AS "evidenceSourceRows",
        "next_review_due" AS "nextReviewDue",
        "last_reviewed_at" AS "lastReviewedAt",
        "public_explanation" AS "publicExplanation",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
      FROM "gmi_falsification_rules"
      WHERE "edition_id" = ${editionId}
      ORDER BY "thesis_id" ASC
    `;
  } catch (error) {
    tableWarning = missingTableWarning(error, "gmi_falsification_rules");
    if (!tableWarning) throw error;
  }

  const data = rows.map((row) => ({
    ...row,
    evidenceSourceRows: parseStringArray(row.evidenceSourceRows),
    nextReviewDue: dateIso(row.nextReviewDue),
    lastReviewedAt: dateIso(row.lastReviewedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return {
    data,
    provenance: provenance({
      sourceType: data.length > 0 ? "DB" : "EMPTY",
      sourceName: "gmi_falsification_rules",
      lastUpdatedAt: latest(data, (row) => row.updatedAt),
      recordCount: data.length,
      warnings: data.length > 0 ? [] : [tableWarning ?? `No persisted GMI falsification rules found for ${editionId}.`],
    }),
  };
}

export async function getGmiReleaseSnapshots(editionId: string): Promise<GmiDataResult<GmiReleaseSnapshotData[]>> {
  type Row = {
    id: string;
    editionId: string;
    editionSlug: string;
    releaseStatus: string;
    primaryNextAction: string | null;
    methodologyVersion: string;
    rubricVersion: string;
    callLedgerHash: string;
    sourceAppendixHash: string;
    falsificationHash: string;
    boardPulseHash: string;
    performanceMetricsJson: Record<string, unknown>;
    blockersJson: unknown[];
    warningsJson: unknown[];
    blockerCategoriesJson: string[];
    stateJson: Record<string, unknown> | null;
    createdBy: string | null;
    publishedBy: string | null;
    publishedAt: Date | null;
    createdAt: Date;
  };
  let rows: Row[] = [];
  let tableWarning: string | null = null;
  try {
    rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "id",
        "edition_id" AS "editionId",
        "edition_slug" AS "editionSlug",
        "release_status" AS "releaseStatus",
        "primary_next_action" AS "primaryNextAction",
        "methodology_version" AS "methodologyVersion",
        "rubric_version" AS "rubricVersion",
        "call_ledger_hash" AS "callLedgerHash",
        "source_appendix_hash" AS "sourceAppendixHash",
        "falsification_hash" AS "falsificationHash",
        "board_pulse_hash" AS "boardPulseHash",
        "performance_metrics_json" AS "performanceMetricsJson",
        "blockers_json" AS "blockersJson",
        "warnings_json" AS "warningsJson",
        "blocker_categories_json" AS "blockerCategoriesJson",
        "state_json" AS "stateJson",
        "created_by" AS "createdBy",
        "published_by" AS "publishedBy",
        "published_at" AS "publishedAt",
        "created_at" AS "createdAt"
      FROM "gmi_release_snapshots"
      WHERE "edition_id" = ${editionId}
      ORDER BY "created_at" DESC
    `;
  } catch (error) {
    tableWarning = missingTableWarning(error, "gmi_release_snapshots");
    if (!tableWarning) throw error;
  }

  const data = rows.map((row) => ({
    ...row,
    publishedAt: dateIso(row.publishedAt),
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    data,
    provenance: provenance({
      sourceType: tableWarning ? "EMPTY" : "DB",
      sourceName: "gmi_release_snapshots",
      lastUpdatedAt: latest(data, (row) => row.createdAt),
      recordCount: data.length,
      warnings: data.length > 0 ? [] : [tableWarning ?? `No release snapshots have been persisted for ${editionId} yet.`],
    }),
  };
}

export async function getGmiBoardPulseData(editionId: string): Promise<GmiDataResult<GmiBoardPulseData | null>> {
  type Row = {
    editionId: string;
    publicationStatus: string;
    operatorConsequenceIndex: unknown;
    decisionsToMakeIn30Days: unknown;
    decisionsToPrepareIn90Days: unknown;
    decisionsToDefer: unknown;
    boardPulsePublishedAt: Date | null;
    operatorBriefPublishedAt: Date | null;
    boardPackGeneratedAt: Date | null;
    fullEditionGated: boolean;
    architectEditionGated: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  let rows: Row[] = [];
  let tableWarning: string | null = null;
  try {
    rows = await prisma.$queryRaw<Row[]>`
      SELECT
        "edition_id" AS "editionId",
        "publication_status" AS "publicationStatus",
        "operator_consequence_index_json" AS "operatorConsequenceIndex",
        "decisions_to_make_in_30_days_json" AS "decisionsToMakeIn30Days",
        "decisions_to_prepare_in_90_days_json" AS "decisionsToPrepareIn90Days",
        "decisions_to_defer_json" AS "decisionsToDefer",
        "board_pulse_published_at" AS "boardPulsePublishedAt",
        "operator_brief_published_at" AS "operatorBriefPublishedAt",
        "board_pack_generated_at" AS "boardPackGeneratedAt",
        "full_edition_gated" AS "fullEditionGated",
        "architect_edition_gated" AS "architectEditionGated",
        "created_at" AS "createdAt",
        "updated_at" AS "updatedAt"
      FROM "gmi_edition_governance_state"
      WHERE "edition_id" = ${editionId}
      LIMIT 1
    `;
  } catch (error) {
    tableWarning = missingTableWarning(error, "gmi_edition_governance_state");
    if (!tableWarning) throw error;
  }
  const row = rows[0];
  const data = row ? {
    editionId: row.editionId,
    publicationStatus: row.publicationStatus,
    operatorConsequenceIndex: Array.isArray(row.operatorConsequenceIndex) ? row.operatorConsequenceIndex : [],
    decisionsToMakeIn30Days: Array.isArray(row.decisionsToMakeIn30Days) ? row.decisionsToMakeIn30Days : [],
    decisionsToPrepareIn90Days: Array.isArray(row.decisionsToPrepareIn90Days) ? row.decisionsToPrepareIn90Days : [],
    decisionsToDefer: Array.isArray(row.decisionsToDefer) ? row.decisionsToDefer : [],
    boardPulsePublishedAt: dateIso(row.boardPulsePublishedAt),
    operatorBriefPublishedAt: dateIso(row.operatorBriefPublishedAt),
    boardPackGeneratedAt: dateIso(row.boardPackGeneratedAt),
    fullEditionGated: row.fullEditionGated,
    architectEditionGated: row.architectEditionGated,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } : null;

  return {
    data,
    provenance: provenance({
      sourceType: data ? "DB" : "EMPTY",
      sourceName: "gmi_edition_governance_state",
      lastUpdatedAt: data?.updatedAt ?? null,
      recordCount: data ? 1 : 0,
      warnings: data ? [] : [tableWarning ?? `No persisted GMI board pulse/governance state found for ${editionId}.`],
    }),
  };
}

export async function getGmiPerformanceMetrics(editionId: string): Promise<GmiDataResult<GmiPerformanceMetricsData>> {
  const ledger = await getGmiCallLedger(editionId);
  const calls = ledger.data;
  const scored = calls.filter((call) => call.currentScore !== null);
  const distribution = {
    5: calls.filter((call) => call.currentScore === 5).length,
    4: calls.filter((call) => call.currentScore === 4).length,
    3: calls.filter((call) => call.currentScore === 3).length,
    2: calls.filter((call) => call.currentScore === 2).length,
    1: calls.filter((call) => call.currentScore === 1).length,
    0: calls.filter((call) => call.currentScore === 0).length,
  };
  const data: GmiPerformanceMetricsData = {
    totalCallsIssued: calls.length,
    totalCallsReviewed: scored.length,
    averageScore: scored.length === 0
      ? null
      : Math.round((scored.reduce((sum, call) => sum + (call.currentScore ?? 0), 0) / scored.length) * 10) / 10,
    scoreDistribution: distribution,
    reviewedCallPercentage: calls.length === 0 ? 0 : Math.round((scored.length / calls.length) * 100),
    confirmedCount: distribution[4] + distribution[5],
    partialCount: distribution[3],
    pendingCarryForwardCount: distribution[2],
    weakDisconfirmedCount: distribution[0] + distribution[1],
    disconfirmedCalls: calls.filter((call) => call.currentScore === 0 || call.currentStatus === "DISCONFIRMED"),
    carriedForwardCalls: calls.filter((call) => call.currentScore === 2 || call.currentStatus === "TOO_EARLY_TO_ASSESS"),
    callsDueForReview: calls.filter((call) => call.currentScore === null || call.currentStatus === "PENDING_REVIEW"),
    methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
    rubricVersion: GMI_METHODOLOGY.rubricVersion,
    lastLedgerUpdateTimestamp: ledger.provenance.lastUpdatedAt,
  };
  return {
    data,
    provenance: {
      ...ledger.provenance,
      sourceName: "gmi_call_ledger_entries:derived-performance",
    },
  };
}

export async function getGmiProvenanceState(editionId: string) {
  const [edition, calls, sources, falsificationRules, snapshots, boardPulse, performance] = await Promise.all([
    getGmiEditionState(editionId),
    getGmiCallLedger(editionId),
    getGmiSourceAppendix(editionId),
    getGmiFalsificationRules(editionId),
    getGmiReleaseSnapshots(editionId),
    getGmiBoardPulseData(editionId),
    getGmiPerformanceMetrics(editionId),
  ]);
  const required = { calls, sources, falsificationRules, boardPulse, performance };
  const warnings = Object.entries(required).flatMap(([name, result]) =>
    result.provenance.isProductionSafe && result.provenance.sourceType === "DB"
      ? []
      : [`${name} is not production-safe DB provenance: ${result.provenance.sourceType}`],
  );
  return {
    data: {
      edition: edition.provenance,
      calls: calls.provenance,
      sources: sources.provenance,
      falsificationRules: falsificationRules.provenance,
      snapshots: snapshots.provenance,
      boardPulse: boardPulse.provenance,
      performance: performance.provenance,
      isDataDerived: warnings.length === 0,
    },
    provenance: provenance({
      sourceType: warnings.length === 0 ? "DB" : "EMPTY",
      sourceName: "gmi-data-service:provenance-state",
      lastUpdatedAt: latest([
        calls.provenance,
        sources.provenance,
        falsificationRules.provenance,
        boardPulse.provenance,
        performance.provenance,
      ], (row) => row.lastUpdatedAt),
      recordCount: Object.keys(required).length,
      warnings,
    }),
  };
}

export async function assertGmiDataDerived(editionId: string): Promise<{ ok: true } | { ok: false; warnings: string[] }> {
  const state = await getGmiProvenanceState(editionId);
  if (state.data.isDataDerived) return { ok: true };
  return { ok: false, warnings: state.provenance.warnings };
}

export function canonicalHash(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function toPublicCallLedgerEntry(call: GmiCallLedgerData) {
  return {
    callId: call.callId,
    editionId: call.editionId,
    publicationDate: getMarketIntelligenceRecord(call.editionId)?.publishedAt ?? null,
    thesis: call.callStatement,
    category: call.category,
    assetClass: call.assetClass ?? "Macro / operating consequence",
    region: call.region ?? "Global",
    theme: call.theme ?? call.category.toLowerCase().replace(/_/g, " "),
    confidenceBand: call.confidenceBand,
    scenarioLink: null,
    reviewWindow: call.nextReviewDue ?? "Unscheduled",
    currentStatus: call.currentStatus,
    currentScore: call.currentScore,
    scoreLabel: call.scoreLabel,
    evidenceSources: call.evidenceSourceRows,
    lastReviewedAt: call.lastReviewedAt,
    nextReviewDue: call.nextReviewDue,
    versionHistory: [
      {
        version: call.rubricVersion,
        changedAt: call.updatedAt,
        note: call.justification || call.evidenceSummary || "Persisted GMI ledger state.",
      },
    ],
  };
}
