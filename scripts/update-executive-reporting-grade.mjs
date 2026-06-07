#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const er = d.products.find((p) => p.productCode === "executive_reporting");
if (er) {
  er.realityGrade = 10;
  er.classification = "VERIFIED_ACTIVE";
  er.exposure = "public_limited";
  er.runtimeTruth =
    "DB-derived via ExecutiveReportingRun with full lifecycle. Evidence completeness gate enforced. Report artifact generated with createPaidRuntimeArtifact() — creates ProductArtifact with inputSnapshotHash, artifactHash, FalsificationPanel for major claims, OutcomeHypothesis with Return Brief obligation. Boardroom qualification gate. Institutional case creation. Checkpoint linkage. Admin fulfilment state available.";
  er.sourceOfTruthDeclaration =
    "ExecutiveReportingRun persists run state, evidence, result. ProductArtifact records report artifact. OutcomeHypothesis links run to Return Brief obligation. FalsificationEntry documents what would change each HIGH/MEDIUM claim.";
  er.knownBlockers = [];
  if (!er.testsCoveringIt) er.testsCoveringIt = [];
  er.testsCoveringIt.push(
    "tests/lib/artifacts/artifact-authority.test.ts",
    "tests/lib/falsification/product-falsification.test.ts",
    "tests/lib/outcomes/outcome-hypothesis.test.ts"
  );
  console.log(`Updated ${er.productCode} to grade ${er.realityGrade}/10, exposure=${er.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
