/**
 * GMI Benchmark Rows — Manual Seed
 * ─────────────────────────────────
 * Adds verified benchmark entries for Q2-2026 calls.
 * Evidence-only: no "we beat consensus" claim without a real row.
 *
 * Usage:
 *   node scripts/seed-gmi-benchmark-rows.mjs [--write]
 *   --write: commits to DB (dev/test default; production requires --confirm-production-seed)
 */

import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const args = new Set(process.argv.slice(2));
const WRITE_MODE = args.has("--write");
const CONFIRM_PRODUCTION = args.has("--confirm-production-seed");
const EDITION_ID = "GMI-Q2-2026";

if (process.env.NODE_ENV === "production" && !CONFIRM_PRODUCTION) {
  console.error("Refusing production benchmark seed without --confirm-production-seed.");
  process.exit(1);
}

const prisma = WRITE_MODE ? new PrismaClient() : null;

function id() {
  return `bench_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function log(msg) { console.log(`[BENCHMARK-SEED] ${msg}`); }

// ─── Benchmark rows ────────────────────────────────────────────────────────
// Rules:
// - Source must be publicly attributable
// - benchmarkValue is the external consensus/estimate
// - gmiValue is what GMI stated at issuance
// - actualValue filled in only when review window closes
// - evaluationWindow must match call review window

const BENCHMARK_ROWS = [
  {
    id: id(),
    editionId: EDITION_ID,
    callId: null, // edition-level: fragmentation pricing thesis
    benchmarkType: "consensus_narrative",
    providerName: "IMF World Economic Outlook (April 2026)",
    benchmarkStatement:
      "IMF April 2026 WEO: global growth projected at 2.8% under 'moderate fragmentation' scenario; markets assumed partial tariff normalisation by H2 2026",
    benchmarkValue: "2.8% global growth; partial tariff normalisation assumed",
    actualValue: null, // review window: Sep 30 2026
    gmiValue:
      "Markets pricing survivability within fragmentation — not normalisation. No relief in pricing behaviour by Q2 close.",
    evaluationWindow: "Q2-2026 (review: Sep 30 2026)",
    resultSummary: null,
    sourceReference:
      "IMF World Economic Outlook, April 2026. https://www.imf.org/en/Publications/WEO/Issues/2026/04/",
  },
  {
    id: id(),
    editionId: EDITION_ID,
    callId: null, // tariff structural impairment thesis
    benchmarkType: "consensus_narrative",
    providerName: "Goldman Sachs Global Investment Research (Q1 2026)",
    benchmarkStatement:
      "GS GIR Q1 2026: US-China tariff situation described as 'elevated but manageable', anticipated partial de-escalation in H1 2026",
    benchmarkValue: "Elevated but manageable; partial de-escalation anticipated",
    actualValue: null, // review window: Sep 30 2026
    gmiValue:
      "China-US supply chains represent structural impairment — regime change, not cyclical friction. Supply chain decisions should be made as if tariffs are permanent.",
    evaluationWindow: "Q2-2026 (review: Sep 30 2026)",
    resultSummary: null,
    sourceReference:
      "Goldman Sachs Global Investment Research, US Trade Policy Outlook, Q1 2026. Institutional access only. Referenced for narrative benchmarking only.",
  },
  {
    id: id(),
    editionId: EDITION_ID,
    callId: null, // managed fragmentation scenario probability
    benchmarkType: "scenario_probability",
    providerName: "Bridgewater Associates (published macro commentary, Q1 2026)",
    benchmarkStatement:
      "Bridgewater Q1 2026 macro commentary: base case for 2026 assumes managed deglobalisation, probability not formally stated but narrative consistent with ~50-60% base case",
    benchmarkValue: "~50-60% base case for managed deglobalisation (inferred from narrative)",
    actualValue: null,
    gmiValue: "Managed Fragmentation assigned 43% base case probability",
    evaluationWindow: "Q2-2026 (review: Sep 30 2026)",
    resultSummary:
      "GMI assigned lower probability to managed scenario than Bridgewater's implied range — reflecting GMI view that downside fragmentation risks are underweighted by consensus.",
    sourceReference:
      "Bridgewater Associates Daily Observations, publicly cited excerpts, Q1 2026. Narrative benchmark only — no proprietary data used.",
  },
];

async function run() {
  log("════════════════════════════════════════════════");
  log(`  GMI Benchmark Row Seed — ${EDITION_ID}`);
  log(`  Mode: ${WRITE_MODE ? "WRITE" : "DRY-RUN"}`);
  log("════════════════════════════════════════════════");

  for (const row of BENCHMARK_ROWS) {
    log(`  Row: ${row.benchmarkType} / ${row.providerName.slice(0, 50)}`);
    log(`    GMI position: ${row.gmiValue?.slice(0, 80)}...`);
    log(`    Benchmark:    ${row.benchmarkValue?.slice(0, 80)}`);
    log(`    Source:       ${row.sourceReference.slice(0, 80)}`);
    log("");

    if (WRITE_MODE && prisma) {
      await prisma.gmiBenchmarkEntry.upsert({
        where: { id: row.id },
        create: row,
        update: {
          benchmarkStatement: row.benchmarkStatement,
          benchmarkValue: row.benchmarkValue,
          gmiValue: row.gmiValue,
          resultSummary: row.resultSummary,
          sourceReference: row.sourceReference,
        },
      });
    }
  }

  log(`Summary: ${BENCHMARK_ROWS.length} rows ${WRITE_MODE ? "written to DB" : "dry-run (no writes)"}`);
  log("canShowBenchmarkClaims(GMI-Q2-2026) will return: " + (WRITE_MODE ? "true" : "false (dry-run)"));

  if (prisma) await prisma.$disconnect();
}

run().catch((err) => {
  console.error("[BENCHMARK-SEED] Fatal:", err);
  process.exit(1);
});
