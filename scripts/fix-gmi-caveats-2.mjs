#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const gmi = d.products.find((p) => p.productCode === "gmi_quarterly");
if (gmi) {
  // Remove the catalog naming blocker since Q2 is now in catalog and Q1 is hidden
  gmi.knownBlockers = [];
  gmi.runtimeTruth =
    "DB/snapshot-derived runtime with full release authority, quality gate, board-pack artifact registry (contentHash, generatedFromStateHash), falsification register, source appendix, benchmark service, call ledger, performance metrics, and publication service. ProductArtifact authority wired via registerGmiEditionArtifact() and registerGmiBoardPackArtifact(). Edition-parametric: Q2 reads from published snapshot, Q3 remains draft/blocked. Admin control plane with publication readiness gate. Catalog: Q2 is current published edition, Q1 is hidden as superseded.";
  console.log("Fixed GMI: removed catalog naming blocker, updated runtimeTruth");
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
