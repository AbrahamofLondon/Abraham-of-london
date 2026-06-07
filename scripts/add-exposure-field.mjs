#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const exposureMap = {
  "decision_pressure_signal": "controlled_access",
  "boardroom_brief": "public_limited",
  "strategy_room": "public_limited",
  "executive_reporting": "public_limited",
  "decision_instruments": "public_limited",
  "professional": "public_limited",
  "retainer_oversight": "admin_only",
  "inner_circle": "dormant",
  "gmi_quarterly": "public_limited",
  "briefs_vault_editorial": "public_limited"
};

d.products.forEach((p) => {
  if (exposureMap[p.productCode]) {
    p.exposure = exposureMap[p.productCode];
    console.log(`Set ${p.productCode} exposure = ${p.exposure}`);
  }
});

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");

// Verify
const v = JSON.parse(readFileSync(filePath, "utf-8"));
const missing = v.products.filter((p) => !p.exposure);
if (missing.length > 0) {
  console.log(`Still missing exposure: ${missing.map((p) => p.productCode).join(", ")}`);
} else {
  console.log("All products have exposure field");
}
