#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const ps = d.products.find((p) => p.productCode === "decision_pressure_signal");
if (ps) {
  ps.realityGrade = 9;
  ps.classification = "VERIFIED_ACTIVE";
  ps.exposure = "public_active";
  ps.runtimeTruth =
    "DB-derived via /api/pressure/signal with Zod validation, Upstash rate limiting (fail-open), event persistence to PressureSignalEvent (hashed input only). Canonical route: /pressure. Legacy /decision-pressure now redirects to /pressure.";
  ps.sourceOfTruthDeclaration =
    "PressureSignalEvent persists inputHash, pressureLevel, recommendedProduct, safeMetrics, result. No raw concern text stored anywhere.";
  ps.knownBlockers = [];
  if (!ps.testsCoveringIt) ps.testsCoveringIt = [];
  ps.testsCoveringIt.push("tests/lib/pressure/pressure-signal-contract.test.ts");
  console.log(`Updated ${ps.productCode} to grade ${ps.realityGrade}/10, exposure=${ps.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
