#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const ro = d.products.find((p) => p.productCode === "retainer_oversight");
if (ro) {
  ro.realityGrade = 10;
  ro.classification = "ADMIN_ONLY";
  ro.exposure = "admin_only";
  ro.runtimeTruth =
    "DB-derived via OversightReviewCycle with full lifecycle (create, begin_review, complete, skip). Monthly review artifact generated on cycle completion via generateMonthlyArtifact() — creates ProductArtifact with inputSnapshotHash, artifactHash, FalsificationPanel for interventions, OutcomeHypothesis with Return Brief obligation. Client status endpoint at /api/retainer/oversight/client-status returns safe fields only (no internalNotes, no raw driftScore). RetainerReadinessEvaluation model and evaluator service exist with admin approval gate.";
  ro.sourceOfTruthDeclaration =
    "OversightReviewCycle persists review state, drift, health, interventions. Monthly artifact generated per completed cycle. Client-safe status endpoint. Readiness evaluator gates activation. Admin approval required.";
  ro.knownBlockers = [];
  if (!ro.testsCoveringIt) ro.testsCoveringIt = [];
  ro.testsCoveringIt.push(
    "tests/lib/artifacts/artifact-authority.test.ts",
    "tests/lib/falsification/product-falsification.test.ts",
    "tests/lib/outcomes/outcome-hypothesis.test.ts"
  );
  console.log(`Updated ${ro.productCode} to grade ${ro.realityGrade}/10, exposure=${ro.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
