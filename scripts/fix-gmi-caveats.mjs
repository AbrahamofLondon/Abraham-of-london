#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

// Fix GMI: remove legacy static import caveat (static arrays are intentional seed data)
const gmi = d.products.find((p) => p.productCode === "gmi_quarterly");
if (gmi) {
  gmi.knownBlockers = [
    "Catalog still names Q1 as a product while runtime Q2 is DB-backed and published — catalog update needed."
  ];
  console.log("Fixed GMI knownBlockers — removed legacy static import caveat");
}

// Fix Boardroom Brief: ensure blocker is correctly registered
const bb = d.products.find((p) => p.productCode === "boardroom_brief");
if (bb) {
  bb.knownBlockers = [
    "Real paid Boardroom Brief delivery smoke has not passed because no paid BoardroomBriefOrder rows exist.",
    "Public preview is generated in-page before checkout and must remain separate from paid delivery output."
  ];
  console.log("Fixed Boardroom Brief knownBlockers");
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
