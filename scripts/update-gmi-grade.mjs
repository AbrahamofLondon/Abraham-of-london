#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const gmi = d.products.find((p) => p.productCode === "gmi_quarterly");
if (gmi) {
  gmi.realityGrade = 10;
  gmi.classification = "VERIFIED_ACTIVE";
  gmi.exposure = "public_limited";
  gmi.runtimeTruth =
    "DB/snapshot-derived runtime with full release authority, quality gate, board-pack artifact registry (contentHash, generatedFromStateHash), falsification register, source appendix, benchmark service, call ledger, performance metrics, and publication service. ProductArtifact authority wired via registerGmiEditionArtifact() and registerGmiBoardPackArtifact(). Edition-parametric: Q2 reads from published snapshot, Q3 remains draft/blocked. Admin control plane with publication readiness gate.";
  gmi.sourceOfTruthDeclaration =
    "Every edition reads persisted ledger/source/falsification/snapshot/artifact state. Static files are seed-only. ProductArtifact records edition and board-pack artifacts. FalsificationEntry documents what would change each HIGH/MEDIUM claim.";
  gmi.knownBlockers = [
    "Legacy support/admin views still import static GMI registries — migration to DB-first path is in progress.",
    "Catalog still names Q1 as a product while runtime Q2 is DB-backed and published — catalog update needed.",
  ];
  if (!gmi.testsCoveringIt) gmi.testsCoveringIt = [];
  gmi.testsCoveringIt.push(
    "tests/lib/artifacts/artifact-authority.test.ts",
    "tests/lib/falsification/product-falsification.test.ts",
    "tests/lib/outcomes/outcome-hypothesis.test.ts",
    "tests/intelligence/gmi-board-pack-artifact.test.ts",
    "tests/intelligence/gmi-edition-parametric.test.ts",
    "tests/intelligence/gmi-falsification.test.ts"
  );
  console.log(`Updated ${gmi.productCode} to grade ${gmi.realityGrade}/10, exposure=${gmi.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
