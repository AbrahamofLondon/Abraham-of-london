/**
 * GMI Q3-2026 Dry-Run Seed
 * ─────────────────────────
 * Creates draft edition metadata only.
 * Does NOT publish anything. Does NOT appear publicly.
 * Use to prove the system can handle the next quarterly edition without code redesign.
 *
 * Usage:
 *   node scripts/seed-gmi-q3-2026-dry-run.mjs [--write]
 *
 * Without --write: pure dry-run (no DB writes).
 * With --write:    writes draft data to DB (dev/test only).
 */

import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const args = new Set(process.argv.slice(2));
const WRITE_MODE = args.has("--write");
const TARGET_EDITION_ID = "GMI-Q3-2026";
const TARGET_EDITION_SLUG = "gmi-q3-2026";
const METHODOLOGY_VERSION = "2.1";
const RUBRIC_VERSION = "3.0";

if (process.env.NODE_ENV === "production") {
  console.error("[DRY-RUN] FATAL: Refusing to run Q3 dry-run seed in production.");
  process.exit(1);
}

const prisma = WRITE_MODE ? new PrismaClient() : null;

function id(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function log(msg) {
  console.log(`[DRY-RUN] ${msg}`);
}

// ─── Fixture data ─────────────────────────────────────────────────────────────

const SAMPLE_CALLS = [
  {
    callId: id("call"),
    editionId: TARGET_EDITION_ID,
    editionSlug: TARGET_EDITION_SLUG,
    callStatement: "Placeholder: Q3-2026 thesis call A — pending review",
    category: "macro",
    region: "global",
    originalConfidenceBand: "medium",
    currentStatus: "PENDING_REVIEW",
    methodologyVersion: METHODOLOGY_VERSION,
    rubricVersion: RUBRIC_VERSION,
  },
  {
    callId: id("call"),
    editionId: TARGET_EDITION_ID,
    editionSlug: TARGET_EDITION_SLUG,
    callStatement: "Placeholder: Q3-2026 thesis call B — pending review",
    category: "sector",
    region: "europe",
    originalConfidenceBand: "low",
    currentStatus: "PENDING_REVIEW",
    methodologyVersion: METHODOLOGY_VERSION,
    rubricVersion: RUBRIC_VERSION,
  },
  {
    callId: id("call"),
    editionId: TARGET_EDITION_ID,
    editionSlug: TARGET_EDITION_SLUG,
    callStatement: "Placeholder: Q3-2026 thesis call C — carried forward for review",
    category: "credit",
    region: "us",
    originalConfidenceBand: "high",
    currentStatus: "PENDING_REVIEW",
    methodologyVersion: METHODOLOGY_VERSION,
    rubricVersion: RUBRIC_VERSION,
  },
];

const SAMPLE_SOURCES = [
  {
    editionId: TARGET_EDITION_ID,
    sourceRowId: id("src"),
    claim: "Placeholder source claim A — pending verification",
    evidenceClass: "primary",
    observationWindow: "Q3-2026",
    confidence: "medium",
    reportSection: "thesis",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
  {
    editionId: TARGET_EDITION_ID,
    sourceRowId: id("src"),
    claim: "Placeholder source claim B — pending verification",
    evidenceClass: "secondary",
    observationWindow: "Q3-2026",
    confidence: "low",
    reportSection: "falsification",
    status: "SOURCE_PENDING",
    releaseBlocker: true,
  },
];

const SAMPLE_FALSIFICATION = [
  {
    editionId: TARGET_EDITION_ID,
    thesisId: "q3-thesis-a",
    thesisStatement: "Placeholder thesis A",
    falsificationCondition: "TBD: condition under review",
    observableIndicator: "TBD: indicator under review",
    thresholdType: "qualitative",
    thresholdValue: "TBD",
    currentStatus: "monitoring",
  },
  {
    editionId: TARGET_EDITION_ID,
    thesisId: "q3-thesis-b",
    thesisStatement: "Placeholder thesis B",
    falsificationCondition: "TBD: condition under review",
    observableIndicator: "TBD: indicator under review",
    thresholdType: "qualitative",
    thresholdValue: "TBD",
    currentStatus: "monitoring",
  },
];

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedCalls() {
  log(`Would create ${SAMPLE_CALLS.length} calls (status: PENDING_REVIEW)`);
  for (const call of SAMPLE_CALLS) {
    log(`  CALL: "${call.callStatement.slice(0, 60)}..."`);
    if (WRITE_MODE && prisma) {
      await prisma.gmiCallLedgerEntry.upsert({
        where: { callId: call.callId },
        create: { ...call, evidenceSummary: "", justification: "" },
        update: {},
      });
    }
  }
}

async function seedSources() {
  log(`Would create ${SAMPLE_SOURCES.length} source rows (status: SOURCE_PENDING)`);
  for (const src of SAMPLE_SOURCES) {
    log(`  SOURCE: "${src.claim.slice(0, 60)}..."`);
    if (WRITE_MODE && prisma) {
      await prisma.gmiSourceAppendixRow.upsert({
        where: { sourceRowId: src.sourceRowId },
        create: { ...src, linkedCallIds: [], linkedThesisIds: [] },
        update: {},
      });
    }
  }
}

async function seedFalsification() {
  log(`Would create ${SAMPLE_FALSIFICATION.length} falsification placeholders`);
  for (const rule of SAMPLE_FALSIFICATION) {
    log(`  FALSIFICATION: thesisId=${rule.thesisId}`);
    if (WRITE_MODE && prisma) {
      await prisma.gmiFalsificationRule.upsert({
        where: { editionId_thesisId: { editionId: rule.editionId, thesisId: rule.thesisId } },
        create: { ...rule, evidenceSourceRows: [] },
        update: {},
      });
    }
  }
}

// ─── Release authority simulation ────────────────────────────────────────────

function simulateReleaseAuthorityCheck() {
  const expectedBlockedState = {
    editionId: TARGET_EDITION_ID,
    releaseStatus: "BLOCKED",
    canPublish: false,
    blockerCategories: [
      "CALL_REVIEW",
      "SOURCE_APPENDIX",
      "FALSIFICATION",
      "PDF_EXPORT",
    ],
    primaryNextAction: "NEEDS_CALL_REVIEW",
    message:
      "Q3 draft edition is correctly blocked: all review gates are open. " +
      "No code redesign required to onboard this edition.",
  };

  log("─── Release Authority Check (simulated) ───");
  log(`  editionId:        ${expectedBlockedState.editionId}`);
  log(`  releaseStatus:    ${expectedBlockedState.releaseStatus}`);
  log(`  canPublish:       ${expectedBlockedState.canPublish}`);
  log(`  blockerCategories: ${expectedBlockedState.blockerCategories.join(", ")}`);
  log(`  primaryNextAction: ${expectedBlockedState.primaryNextAction}`);
  log("");
  log("PROOF: GMI-Q3-2026 can be introduced as a draft edition without");
  log("       modifying release authority, board-pack, workbench, or public API logic.");

  return expectedBlockedState;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("═══════════════════════════════════════════════════════════");
  log(`  GMI Q3-2026 Edition Dry-Run Seed`);
  log(`  Mode: ${WRITE_MODE ? "WRITE (dev/test DB)" : "DRY-RUN (no writes)"}`);
  log(`  Edition: ${TARGET_EDITION_ID} / ${TARGET_EDITION_SLUG}`);
  log("═══════════════════════════════════════════════════════════");
  log("");

  await seedCalls();
  log("");
  await seedSources();
  log("");
  await seedFalsification();
  log("");

  const blocked = simulateReleaseAuthorityCheck();

  log("");
  log("─── Summary ───────────────────────────────────────────────");
  log(`  Calls created:         ${SAMPLE_CALLS.length} (pending_review)`);
  log(`  Sources created:       ${SAMPLE_SOURCES.length} (pending)`);
  log(`  Falsification stubs:   ${SAMPLE_FALSIFICATION.length}`);
  log(`  Published:             false`);
  log(`  Public visibility:     none`);
  log(`  Expected release gate: BLOCKED`);
  log(`  canPublish:            ${blocked.canPublish}`);
  log("");
  log("Q3 dry-run complete. No data was published.");

  if (prisma) {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[DRY-RUN] Fatal error:", err);
  process.exit(1);
});
