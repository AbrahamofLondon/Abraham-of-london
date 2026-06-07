#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const declarations = {
  "strategy_room": "Strategy case state, intervention status, deliverables, and completion proof must persist in Strategy Room models.",
  "executive_reporting": "Report source state, evidence completeness, generated artifacts, and delivery audit must persist.",
  "decision_instruments": "Each instrument run must persist score/result, entitlement, artifact state, and next-route recommendation.",
  "retainer_oversight": "Monthly oversight record, intervention log, account health, drift, and client status must persist before broader activation."
};

d.products.forEach((p) => {
  if (!p.sourceOfTruthDeclaration && declarations[p.productCode]) {
    p.sourceOfTruthDeclaration = declarations[p.productCode];
    console.log(`Added sourceOfTruthDeclaration for ${p.productCode}`);
  }
});

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");

// Verify
const v = JSON.parse(readFileSync(filePath, "utf-8"));
const missing = v.products.filter((p) => !p.sourceOfTruthDeclaration);
if (missing.length > 0) {
  console.log(`Still missing: ${missing.map((p) => p.productCode).join(", ")}`);
} else {
  console.log("All products have sourceOfTruthDeclaration");
}
