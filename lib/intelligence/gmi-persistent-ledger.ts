import crypto from "node:crypto";

import { Prisma } from "@prisma/client";

import {
  buildCallReviewedEvent,
  type GmiReleaseActor,
  type GmiReleaseEvent,
} from "./gmi-release-events";
import {
  GMI_METHODOLOGY,
  type GmiRubricScore,
} from "./gmi-methodology";
import {
  getPublicGmiCallLedger as getStaticPublicGmiCallLedger,
  type PublicGmiCallLedgerEntry,
} from "./gmi-instrument";
import {
  MARKET_CALL_LEDGER,
  type MarketCallOutcomeStatus,
  type MarketCallRecord,
} from "./market-intelligence-call-ledger";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

type SqlClient = {
  $executeRaw: (query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<number>;
  $queryRaw: <T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: unknown[]) => Promise<T>;
};

type PrismaClientLike = SqlClient & {
  $transaction?: <T>(fn: (tx: SqlClient) => Promise<T>) => Promise<T>;
};

type GmiLedgerRow = {
  id: string;
  callId: string;
  editionId: string;
  editionSlug: string;
  callStatement: string;
  category: string;
  region: string | null;
  assetClass: string | null;
  theme: string | null;
  originalConfidenceBand: string;
  currentStatus: MarketCallOutcomeStatus | "PENDING_REVIEW";
  currentScore: number | null;
  evidenceSummary: string;
  evidenceSourceRows: unknown;
  justification: string;
  carryForwardJustification: string | null;
  lastReviewedAt: Date | null;
  nextReviewDue: Date | null;
  methodologyVersion: string;
  rubricVersion: string;
  immutableOriginalCallSnapshot: unknown;
  reviewedBy: string | null;
  sourceAppendixRefs: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export type GmiCallReviewInput = {
  reportId: string;
  callId: string;
  outcomeStatus: MarketCallOutcomeStatus;
  score: GmiRubricScore | null;
  evidenceSummary?: string;
  evidenceSourceRows?: string[];
  justification?: string;
  carryForwardJustification?: string;
  nextReviewDue?: string | Date | null;
  actor?: GmiReleaseActor;
  actorEmail?: string | null;
  requestId?: string;
};

export type GmiCallReviewResult =
  | { ok: true; entry: PublicGmiCallLedgerEntry }
  | { ok: false; warning: string; issues?: string[] };

function getPrisma(): PrismaClientLike {
  // Lazy import through require keeps this module safe for tests that mock only pure helpers.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/prisma.server").prisma as PrismaClientLike;
}

function id(): string {
  return crypto.randomUUID();
}

function editionSlug(reportId: string): string {
  return reportId.toLowerCase().replace(/^gmi-/, "").replace(/-2026$/, "-2026");
}

function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function parseArray(value: unknown): string[] {
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

function dateOrNull(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dueDateFromWindow(window: string): Date | null {
  if (/Q2 2026/i.test(window)) return new Date("2026-06-30T23:59:59.000Z");
  if (/Q3 2026/i.test(window)) return new Date("2026-09-30T23:59:59.000Z");
  if (/Q4 2026/i.test(window)) return new Date("2026-12-31T23:59:59.000Z");
  return null;
}

function rowToPublic(row: GmiLedgerRow): PublicGmiCallLedgerEntry {
  const score = row.currentScore;

  return {
    callId: row.callId,
    editionId: row.editionId,
    publicationDate: getMarketIntelligenceRecord(row.editionId)?.publishedAt ?? null,
    thesis: row.callStatement,
    category: row.category as MarketCallRecord["callType"],
    assetClass: row.assetClass ?? "Macro / operating consequence",
    region: row.region ?? "Global",
    theme: row.theme ?? row.category.toLowerCase().replace(/_/g, " "),
    confidenceBand: row.originalConfidenceBand as MarketCallRecord["originalConfidence"],
    scenarioLink: null,
    reviewWindow: row.nextReviewDue
      ? row.nextReviewDue.toISOString().slice(0, 10)
      : "Unscheduled",
    currentStatus: row.currentStatus,
    currentScore: score === null ? null : (score as GmiRubricScore),
    scoreLabel: score === null
      ? null
      : GMI_METHODOLOGY.rubricVersion && score === 5
        ? "Confirmed strongly"
        : score === 4
          ? "Directionally confirmed"
          : score === 3
            ? "Partially confirmed"
            : score === 2
              ? "Too early to assess"
              : score === 1
                ? "Weakly supported"
                : "Disconfirmed",
    evidenceSources: parseArray(row.evidenceSourceRows),
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    nextReviewDue: row.nextReviewDue?.toISOString() ?? null,
    versionHistory: [
      {
        version: row.rubricVersion,
        changedAt: row.updatedAt.toISOString(),
        note: row.justification || row.evidenceSummary || "Persistent GMI ledger state.",
      },
    ],
  };
}

async function selectLedgerRows(db: SqlClient): Promise<GmiLedgerRow[]> {
  return db.$queryRaw<GmiLedgerRow[]>`
    SELECT
      "id",
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
      "immutable_original_call_snapshot_json" AS "immutableOriginalCallSnapshot",
      "reviewed_by" AS "reviewedBy",
      "source_appendix_refs_json" AS "sourceAppendixRefs",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
    FROM "gmi_call_ledger_entries"
    ORDER BY "edition_id" ASC, "call_id" ASC
  `;
}

async function selectLedgerRowForUpdate(
  db: SqlClient,
  callId: string,
): Promise<GmiLedgerRow | null> {
  const rows = await db.$queryRaw<GmiLedgerRow[]>`
    SELECT
      "id",
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
      "immutable_original_call_snapshot_json" AS "immutableOriginalCallSnapshot",
      "reviewed_by" AS "reviewedBy",
      "source_appendix_refs_json" AS "sourceAppendixRefs",
      "created_at" AS "createdAt",
      "updated_at" AS "updatedAt"
    FROM "gmi_call_ledger_entries"
    WHERE "call_id" = ${callId}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function insertSeedCall(db: SqlClient, call: MarketCallRecord): Promise<void> {
  const record = getMarketIntelligenceRecord(call.reportId);
  await db.$executeRaw`
    INSERT INTO "gmi_call_ledger_entries" (
      "id",
      "call_id",
      "edition_id",
      "edition_slug",
      "call_statement",
      "category",
      "region",
      "asset_class",
      "theme",
      "original_confidence_band",
      "current_status",
      "current_score",
      "evidence_summary",
      "evidence_source_rows_json",
      "justification",
      "carry_forward_justification",
      "last_reviewed_at",
      "next_review_due",
      "methodology_version",
      "rubric_version",
      "immutable_original_call_snapshot_json",
      "source_appendix_refs_json"
    )
    VALUES (
      ${id()},
      ${call.id},
      ${call.reportId},
      ${editionSlug(call.reportId)},
      ${call.statement},
      ${call.callType},
      ${call.region ?? null},
      ${call.assetClass ?? null},
      ${call.theme ?? null},
      ${call.originalConfidence},
      ${call.outcomeStatus ?? "PENDING_REVIEW"},
      ${call.score ?? null},
      ${call.outcomeSummary ?? ""},
      CAST(${toJson(call.evidenceSources ?? [])} AS jsonb),
      ${call.learning ?? ""},
      ${call.score === 2 || call.outcomeStatus === "TOO_EARLY_TO_ASSESS" ? call.outcomeSummary ?? "" : null},
      ${call.lastReviewedAt ? new Date(call.lastReviewedAt) : null},
      ${call.nextReviewDue ? new Date(call.nextReviewDue) : dueDateFromWindow(call.expectedReviewWindow)},
      ${GMI_METHODOLOGY.methodologyVersion},
      ${GMI_METHODOLOGY.rubricVersion},
      CAST(${toJson({ ...call, publishedAt: record?.publishedAt ?? null })} AS jsonb),
      CAST(${toJson([])} AS jsonb)
    )
    ON CONFLICT ("call_id") DO NOTHING
  `;
}

export async function ensureGmiCallLedgerSeeded(
  db: SqlClient = getPrisma(),
): Promise<{ seeded: number }> {
  let seeded = 0;
  for (const call of MARKET_CALL_LEDGER) {
    await insertSeedCall(db, call);
    seeded += 1;
  }
  return { seeded };
}

export async function getPersistedPublicGmiCallLedger(): Promise<PublicGmiCallLedgerEntry[]> {
  try {
    const db = getPrisma();
    await ensureGmiCallLedgerSeeded(db);
    const rows = await selectLedgerRows(db);
    return rows.map(rowToPublic);
  } catch {
    return getStaticPublicGmiCallLedger();
  }
}

export function validateGmiCallReviewInput(input: GmiCallReviewInput): string[] {
  const issues: string[] = [];
  const score = input.score;
  const sources = input.evidenceSourceRows ?? [];

  if (!input.callId.trim()) issues.push("Call ID is required.");
  if (!input.reportId.trim()) issues.push("Report ID is required.");

  if (score !== null) {
    if (![0, 1, 2, 3, 4, 5].includes(score)) {
      issues.push("Score must be 0, 1, 2, 3, 4, or 5.");
    }

    if (score === 2) {
      if (!input.carryForwardJustification?.trim()) {
        issues.push("Score 2 requires carry-forward justification.");
      }
      if (!dateOrNull(input.nextReviewDue)) {
        issues.push("Score 2 requires nextReviewDue.");
      }
    } else if (sources.length === 0 || !input.evidenceSummary?.trim()) {
      issues.push("Scores 5, 4, 3, 1, and 0 require evidence summary and source rows.");
    }
  }

  if (
    ["CONFIRMED_STRONGLY", "DIRECTIONALLY_CONFIRMED", "PARTIALLY_CONFIRMED", "WEAKLY_SUPPORTED", "DISCONFIRMED"].includes(input.outcomeStatus) &&
    (sources.length === 0 || !input.evidenceSummary?.trim())
  ) {
    issues.push("Confirmed, weakly supported, and disconfirmed outcomes require source support.");
  }

  return issues;
}

function auditMetadata(input: GmiCallReviewInput, entryId: string) {
  return {
    eventVersion: 1,
    eventType: "GMI_CALL_REVIEWED",
    severity: "INFO",
    reportId: input.reportId,
    callId: input.callId,
    actor: input.actor ?? "ADMIN",
    requestId: input.requestId,
    occurredAt: new Date().toISOString(),
    summary: `Call ${input.callId} reviewed for ${input.reportId}.`,
    safeMetadata: {
      callId: input.callId,
      ledgerEntryId: entryId,
      outcomeStatus: input.outcomeStatus,
      score: input.score,
      sourceRowCount: input.evidenceSourceRows?.length ?? 0,
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
    },
  } satisfies Partial<GmiReleaseEvent>;
}

async function insertAuditEvent(
  db: SqlClient,
  input: GmiCallReviewInput,
  entryId: string,
): Promise<void> {
  const event = buildCallReviewedEvent({
    reportId: input.reportId,
    callId: input.callId,
    outcomeStatus: input.outcomeStatus,
    score: input.score,
    actor: input.actor ?? "ADMIN",
    requestId: input.requestId,
    safeMetadata: auditMetadata(input, entryId).safeMetadata,
  } as Parameters<typeof buildCallReviewedEvent>[0]);
  const metadata = {
    ...event,
    safeMetadata: {
      ...event.safeMetadata,
      ledgerEntryId: entryId,
      sourceRowCount: input.evidenceSourceRows?.length ?? 0,
      methodologyVersion: GMI_METHODOLOGY.methodologyVersion,
      rubricVersion: GMI_METHODOLOGY.rubricVersion,
    },
  };

  await db.$executeRaw`
    INSERT INTO "system_audit_logs" (
      "id",
      "action",
      "severity",
      "actor_type",
      "actorEmail",
      "resourceId",
      "resource_type",
      "resource_name",
      "status",
      "sub_category",
      "request_id",
      "metadata",
      "tags"
    )
    VALUES (
      ${id()},
      ${event.eventType},
      ${"info"}::"AuditSeverity",
      ${input.actor === "SYSTEM" ? "system" : "admin"},
      ${input.actorEmail ?? null},
      ${input.reportId},
      ${"admin"},
      ${"GMI release governance"},
      ${"success"},
      ${"gmi_release_event"},
      ${input.requestId ?? null},
      ${toJson(metadata)},
      ${toJson(["gmi", "market-intelligence", "release-governance"])}
    )
  `;
}

export async function reviewGmiCallAndPersist(
  input: GmiCallReviewInput,
): Promise<GmiCallReviewResult> {
  const issues = validateGmiCallReviewInput(input);
  if (issues.length > 0) return { ok: false, warning: issues[0] ?? "Invalid call review.", issues };

  const prisma = getPrisma();
  const run = async (tx: SqlClient): Promise<GmiCallReviewResult> => {
    await ensureGmiCallLedgerSeeded(tx);

    const existing = await selectLedgerRowForUpdate(tx, input.callId);
    if (!existing) {
      return {
        ok: false,
        warning: `Call ${input.callId} not found in persistent ledger.`,
      };
    }

    const now = new Date();
    const nextReviewDue = dateOrNull(input.nextReviewDue);
    const evidenceRows = input.evidenceSourceRows ?? [];
    const justification =
      input.justification?.trim() ||
      input.evidenceSummary?.trim() ||
      input.carryForwardJustification?.trim() ||
      "";

    await tx.$executeRaw`
      UPDATE "gmi_call_ledger_entries"
      SET
        "current_status" = ${input.outcomeStatus},
        "current_score" = ${input.score},
        "evidence_summary" = ${input.evidenceSummary?.trim() ?? ""},
        "evidence_source_rows_json" = CAST(${toJson(evidenceRows)} AS jsonb),
        "justification" = ${justification},
        "carry_forward_justification" = ${input.carryForwardJustification?.trim() || null},
        "last_reviewed_at" = ${now},
        "next_review_due" = ${nextReviewDue},
        "methodology_version" = ${GMI_METHODOLOGY.methodologyVersion},
        "rubric_version" = ${GMI_METHODOLOGY.rubricVersion},
        "reviewed_by" = ${input.actorEmail ?? input.actor ?? "ADMIN"},
        "updated_at" = ${now}
      WHERE "call_id" = ${input.callId}
    `;

    await tx.$executeRaw`
      INSERT INTO "gmi_call_ledger_status_history" (
        "id",
        "ledger_entry_id",
        "call_id",
        "previous_status",
        "new_status",
        "previous_score",
        "new_score",
        "evidence_summary",
        "evidence_source_rows_json",
        "justification",
        "actor",
        "request_id"
      )
      VALUES (
        ${id()},
        ${existing.id},
        ${input.callId},
        ${existing.currentStatus},
        ${input.outcomeStatus},
        ${existing.currentScore},
        ${input.score},
        ${input.evidenceSummary?.trim() ?? ""},
        CAST(${toJson(evidenceRows)} AS jsonb),
        ${justification},
        ${input.actorEmail ?? input.actor ?? "ADMIN"},
        ${input.requestId ?? null}
      )
    `;

    await insertAuditEvent(tx, input, existing.id);

    const updated = await selectLedgerRowForUpdate(tx, input.callId);
    if (!updated) return { ok: false, warning: "Ledger update failed after write." };
    return { ok: true, entry: rowToPublic(updated) };
  };

  try {
    if (prisma.$transaction) {
      return await prisma.$transaction(run);
    }
    return await run(prisma);
  } catch (error) {
    return {
      ok: false,
      warning: error instanceof Error ? error.message : "GMI call review failed.",
    };
  }
}
