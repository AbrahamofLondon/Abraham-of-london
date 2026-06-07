#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const sr = d.products.find((p) => p.productCode === "strategy_room");
if (sr) {
  sr.realityGrade = 10;
  sr.classification = "VERIFIED_ACTIVE";
  sr.exposure = "public_limited";
  sr.runtimeTruth =
    "DB-derived via StrategyRoomSession and StrategyRoomExecutionSession with full lifecycle. Pre-session and post-session artifact generation via generatePreSessionArtifact() and generatePostSessionArtifact() — both create ProductArtifact with inputSnapshotHash, artifactHash, FalsificationPanel, OutcomeHypothesis, and Return Brief linkage. Execution state, decisions, checkpoints, blockers, and commitments persisted in DB. Admin case view available. Customer status/confirmation page at /strategy-room/success.";
  sr.sourceOfTruthDeclaration =
    "StrategyRoomSession and StrategyRoomExecutionSession persist session state. ProductArtifact records pre/post artifacts. OutcomeHypothesis links session to Return Brief obligation. FalsificationEntry documents what would change each HIGH/MEDIUM claim.";
  sr.knownBlockers = [];
  if (!sr.testsCoveringIt) sr.testsCoveringIt = [];
  sr.testsCoveringIt.push(
    "tests/lib/artifacts/artifact-authority.test.ts",
    "tests/lib/falsification/product-falsification.test.ts",
    "tests/lib/outcomes/outcome-hypothesis.test.ts"
  );
  console.log(`Updated ${sr.productCode} to grade ${sr.realityGrade}/10, exposure=${sr.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
