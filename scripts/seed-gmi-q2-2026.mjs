import "dotenv/config";

import crypto from "node:crypto";

import { PrismaClient } from "@prisma/client";

import {
  GMI_Q2_2026_SEED_CALLS,
  GMI_Q2_2026_SOURCE_APPENDIX_ROWS,
  GMI_Q2_DECISIONS_30_DAYS,
  GMI_Q2_DECISIONS_90_DAYS,
  GMI_Q2_DECISIONS_DEFER,
  GMI_Q2_FALSIFICATION_RULES,
  GMI_Q2_OPERATOR_CONSEQUENCE_INDEX,
} from "../lib/intelligence/seeds/gmi-q2-2026-seed.ts";
import { GMI_METHODOLOGY } from "../lib/intelligence/gmi-methodology.ts";

const prisma = new PrismaClient();
const args = new Set(process.argv.slice(2));
const force = args.has("--force");
const confirmProductionSeed = args.has("--confirm-production-seed");
const seededAt = new Date();
const importedFrom = "q2-2026-seed";
const targetEditionId = "GMI-Q2-2026";

if (process.env.NODE_ENV === "production" && !confirmProductionSeed) {
  console.error("Refusing production GMI seed without --confirm-production-seed.");
  process.exit(1);
}

const counts = {
  calls: { created: 0, updated: 0, skipped: 0 },
  sources: { created: 0, updated: 0, skipped: 0 },
  falsification: { created: 0, updated: 0, skipped: 0 },
  governance: { created: 0, updated: 0, skipped: 0 },
};

function slugFor(editionId) {
  return editionId.toLowerCase().replace(/^gmi-/, "").replace(/_/g, "-");
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function statusFor(call) {
  return call.outcomeStatus ?? "PENDING_REVIEW";
}

function carryForwardFor(call) {
  if (call.carryForwardJustification) return call.carryForwardJustification;
  if (call.score === 2) {
    return call.outcomeSummary ?? "This call is carried forward because the review window has not produced enough evidence for confirmation or disconfirmation.";
  }
  return null;
}

async function seedCalls() {
  for (const call of GMI_Q2_2026_SEED_CALLS) {
    const existing = await prisma.$queryRaw`
      SELECT "id", "current_score" AS "currentScore"
      FROM "gmi_call_ledger_entries"
      WHERE "call_id" = ${call.id}
      LIMIT 1
    `;

    const snapshot = {
      importedFrom,
      seededAt: seededAt.toISOString(),
      sourceRecord: call,
    };

    if (existing[0]) {
      if (existing[0].currentScore !== null && !force) {
        counts.calls.skipped++;
        continue;
      }
      await prisma.$executeRaw`
        UPDATE "gmi_call_ledger_entries"
        SET
          "edition_id" = ${call.reportId},
          "edition_slug" = ${slugFor(call.reportId)},
          "call_statement" = ${call.statement},
          "category" = ${call.callType},
          "region" = ${call.region ?? null},
          "asset_class" = ${call.assetClass ?? null},
          "theme" = ${call.theme ?? null},
          "original_confidence_band" = ${call.originalConfidence},
          "current_status" = ${statusFor(call)},
          "current_score" = ${call.score ?? null},
          "evidence_summary" = ${call.outcomeSummary ?? ""},
          "evidence_source_rows_json" = ${JSON.stringify(call.evidenceSources ?? [])}::jsonb,
          "justification" = ${call.learning ?? call.outcomeSummary ?? ""},
          "carry_forward_justification" = ${carryForwardFor(call)},
          "last_reviewed_at" = ${call.lastReviewedAt ? new Date(call.lastReviewedAt) : null},
          "next_review_due" = ${call.nextReviewDue ? new Date(call.nextReviewDue) : null},
          "methodology_version" = ${GMI_METHODOLOGY.methodologyVersion},
          "rubric_version" = ${GMI_METHODOLOGY.rubricVersion},
          "immutable_original_call_snapshot_json" = ${JSON.stringify(snapshot)}::jsonb,
          "source_appendix_refs_json" = ${JSON.stringify(call.evidenceSources ?? [])}::jsonb,
          "updated_at" = NOW()
        WHERE "call_id" = ${call.id}
      `;
      counts.calls.updated++;
      continue;
    }

    await prisma.$executeRaw`
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
        "reviewed_by",
        "source_appendix_refs_json"
      )
      VALUES (
        ${id("gmicall")},
        ${call.id},
        ${call.reportId},
        ${slugFor(call.reportId)},
        ${call.statement},
        ${call.callType},
        ${call.region ?? null},
        ${call.assetClass ?? null},
        ${call.theme ?? null},
        ${call.originalConfidence},
        ${statusFor(call)},
        ${call.score ?? null},
        ${call.outcomeSummary ?? ""},
        ${JSON.stringify(call.evidenceSources ?? [])}::jsonb,
        ${call.learning ?? call.outcomeSummary ?? ""},
        ${carryForwardFor(call)},
        ${call.lastReviewedAt ? new Date(call.lastReviewedAt) : null},
        ${call.nextReviewDue ? new Date(call.nextReviewDue) : null},
        ${GMI_METHODOLOGY.methodologyVersion},
        ${GMI_METHODOLOGY.rubricVersion},
        ${JSON.stringify(snapshot)}::jsonb,
        ${importedFrom},
        ${JSON.stringify(call.evidenceSources ?? [])}::jsonb
      )
    `;
    counts.calls.created++;
  }
}

async function seedSources() {
  for (const row of GMI_Q2_2026_SOURCE_APPENDIX_ROWS) {
    const existing = await prisma.$queryRaw`
      SELECT "id", "status"
      FROM "gmi_source_appendix_rows"
      WHERE "source_row_id" = ${row.id}
      LIMIT 1
    `;
    const resolved = existing[0] && !["SOURCE_PENDING", "METHOD_NOTE_REQUIRED"].includes(existing[0].status);

    if (existing[0]) {
      if (resolved && !force) {
        counts.sources.skipped++;
        continue;
      }
      await prisma.$executeRaw`
        UPDATE "gmi_source_appendix_rows"
        SET
          "edition_id" = ${row.reportId},
          "claim" = ${row.claim},
          "evidence_class" = ${row.evidenceClass},
          "confidence_basis" = ${row.confidenceBasis ?? null},
          "source_title" = ${row.sourceOrBasis},
          "observation_window" = ${row.observationWindow},
          "confidence" = ${row.confidence},
          "report_section" = ${row.reportSection},
          "status" = ${row.status},
          "release_blocker" = ${row.releaseBlocker},
          "method_note" = ${row.methodNote ?? null},
          "admin_justification" = ${row.adminJustification ?? null},
          "source_visibility" = 'public',
          "imported_from" = ${importedFrom},
          "updated_at" = NOW()
        WHERE "source_row_id" = ${row.id}
      `;
      counts.sources.updated++;
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "gmi_source_appendix_rows" (
        "id",
        "edition_id",
        "source_row_id",
        "claim",
        "evidence_class",
        "confidence_basis",
        "source_title",
        "observation_window",
        "confidence",
        "report_section",
        "status",
        "release_blocker",
        "method_note",
        "admin_justification",
        "source_visibility",
        "linked_call_ids_json",
        "linked_thesis_ids_json",
        "imported_from"
      )
      VALUES (
        ${id("gmisrc")},
        ${row.reportId},
        ${row.id},
        ${row.claim},
        ${row.evidenceClass},
        ${row.confidenceBasis ?? null},
        ${row.sourceOrBasis},
        ${row.observationWindow},
        ${row.confidence},
        ${row.reportSection},
        ${row.status},
        ${row.releaseBlocker},
        ${row.methodNote ?? null},
        ${row.adminJustification ?? null},
        'public',
        '[]'::jsonb,
        '[]'::jsonb,
        ${importedFrom}
      )
    `;
    counts.sources.created++;
  }
}

async function seedFalsificationRules() {
  for (const rule of GMI_Q2_FALSIFICATION_RULES) {
    const existing = await prisma.$queryRaw`
      SELECT "id", "last_reviewed_at" AS "lastReviewedAt"
      FROM "gmi_falsification_rules"
      WHERE "edition_id" = ${rule.editionId} AND "thesis_id" = ${rule.thesisId}
      LIMIT 1
    `;

    if (existing[0]) {
      if (existing[0].lastReviewedAt && !force) {
        counts.falsification.skipped++;
        continue;
      }
      await prisma.$executeRaw`
        UPDATE "gmi_falsification_rules"
        SET
          "thesis_statement" = ${rule.thesisStatement},
          "falsification_condition" = ${rule.falsificationCondition},
          "observable_indicator" = ${rule.observableIndicator},
          "threshold_type" = ${rule.thresholdType},
          "threshold_value" = ${rule.thresholdValue},
          "current_status" = ${rule.currentStatus},
          "evidence_source_rows_json" = ${JSON.stringify(rule.evidenceSourceRows)}::jsonb,
          "next_review_due" = ${rule.nextReviewDue ? new Date(rule.nextReviewDue) : null},
          "last_reviewed_at" = ${rule.lastReviewedAt ? new Date(rule.lastReviewedAt) : null},
          "public_explanation" = ${rule.publicExplanation ?? null},
          "updated_at" = NOW()
        WHERE "edition_id" = ${rule.editionId} AND "thesis_id" = ${rule.thesisId}
      `;
      counts.falsification.updated++;
      continue;
    }

    await prisma.$executeRaw`
      INSERT INTO "gmi_falsification_rules" (
        "id",
        "edition_id",
        "thesis_id",
        "thesis_statement",
        "falsification_condition",
        "observable_indicator",
        "threshold_type",
        "threshold_value",
        "current_status",
        "evidence_source_rows_json",
        "next_review_due",
        "last_reviewed_at",
        "public_explanation"
      )
      VALUES (
        ${id("gmifalse")},
        ${rule.editionId},
        ${rule.thesisId},
        ${rule.thesisStatement},
        ${rule.falsificationCondition},
        ${rule.observableIndicator},
        ${rule.thresholdType},
        ${rule.thresholdValue},
        ${rule.currentStatus},
        ${JSON.stringify(rule.evidenceSourceRows)}::jsonb,
        ${rule.nextReviewDue ? new Date(rule.nextReviewDue) : null},
        ${rule.lastReviewedAt ? new Date(rule.lastReviewedAt) : null},
        ${rule.publicExplanation ?? null}
      )
    `;
    counts.falsification.created++;
  }
}

async function seedGovernanceState() {
  const existing = await prisma.$queryRaw`
    SELECT "id"
    FROM "gmi_edition_governance_state"
    WHERE "edition_id" = ${targetEditionId}
    LIMIT 1
  `;

  const payload = {
    operatorConsequenceIndex: GMI_Q2_OPERATOR_CONSEQUENCE_INDEX,
    decisionsToMakeIn30Days: GMI_Q2_DECISIONS_30_DAYS,
    decisionsToPrepareIn90Days: GMI_Q2_DECISIONS_90_DAYS,
    decisionsToDefer: GMI_Q2_DECISIONS_DEFER,
  };

  if (existing[0]) {
    await prisma.$executeRaw`
      UPDATE "gmi_edition_governance_state"
      SET
        "operator_consequence_index_json" = ${JSON.stringify(payload.operatorConsequenceIndex)}::jsonb,
        "decisions_to_make_in_30_days_json" = ${JSON.stringify(payload.decisionsToMakeIn30Days)}::jsonb,
        "decisions_to_prepare_in_90_days_json" = ${JSON.stringify(payload.decisionsToPrepareIn90Days)}::jsonb,
        "decisions_to_defer_json" = ${JSON.stringify(payload.decisionsToDefer)}::jsonb,
        "updated_at" = NOW()
      WHERE "edition_id" = ${targetEditionId}
    `;
    counts.governance.updated++;
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "gmi_edition_governance_state" (
      "id",
      "edition_id",
      "publication_status",
      "operator_consequence_index_json",
      "decisions_to_make_in_30_days_json",
      "decisions_to_prepare_in_90_days_json",
      "decisions_to_defer_json",
      "full_edition_gated",
      "architect_edition_gated"
    )
    VALUES (
      ${id("gmigov")},
      ${targetEditionId},
      'draft',
      ${JSON.stringify(payload.operatorConsequenceIndex)}::jsonb,
      ${JSON.stringify(payload.decisionsToMakeIn30Days)}::jsonb,
      ${JSON.stringify(payload.decisionsToPrepareIn90Days)}::jsonb,
      ${JSON.stringify(payload.decisionsToDefer)}::jsonb,
      true,
      true
    )
  `;
  counts.governance.created++;
}

try {
  await seedCalls();
  await seedSources();
  await seedFalsificationRules();
  await seedGovernanceState();

  console.log(JSON.stringify({
    importedFrom,
    seededAt: seededAt.toISOString(),
    force,
    counts,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
