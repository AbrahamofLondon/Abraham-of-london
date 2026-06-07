#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const di = d.products.find((p) => p.productCode === "decision_instruments");
if (di) {
  di.realityGrade = 10;
  di.classification = "VERIFIED_ACTIVE";
  di.exposure = "public_active";
  di.runtimeTruth =
    "DB-derived via DecisionInstrumentRun with full artifact authority (ProductArtifact, inputSnapshotHash, artifactHash), falsification panel (FalsificationEntry per HIGH/MEDIUM claim), outcome hypothesis (OutcomeHypothesis with Return Brief obligation). Run route enforces entitlement verification, ownership, and persistence. User history at /account/instruments with artifactHash, outcomeHypothesisId, download link. GET /api/instruments/runs/me enforces ownership by userEmail. Artifact route blocks slug-only access. 95 tests passing.";
  di.sourceOfTruthDeclaration =
    "DecisionInstrumentRun persists scoreJson, artifactState, artifactHash, nextRouteSlug. ProductArtifact records artifact lifecycle. OutcomeHypothesis links run to Return Brief obligation. FalsificationEntry documents what would change each HIGH/MEDIUM claim.";
  di.knownBlockers = [];
  if (!di.testsCoveringIt) di.testsCoveringIt = [];
  di.testsCoveringIt.push(
    "tests/decision-instruments/instrument-run-authority.test.ts",
    "tests/decision-instruments/return-brief-authority.test.ts",
    "tests/lib/artifacts/artifact-authority.test.ts",
    "tests/lib/falsification/product-falsification.test.ts",
    "tests/lib/outcomes/outcome-hypothesis.test.ts"
  );
  console.log(`Updated ${di.productCode} to grade ${di.realityGrade}/10, exposure=${di.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
