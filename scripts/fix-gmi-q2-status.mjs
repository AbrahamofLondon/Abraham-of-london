#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/commercial/catalog.ts");

let c = readFileSync(filePath, "utf-8");

// Find gmi_q2_2026 and change commercialStatus from "paid" to "manual_billing"
const search = `    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    hiddenFromPricing: false,
    shortDescription: "Q2 2026 market intelligence`;

const replace = `    active: true,
    commercialStatus: "manual_billing",
    requiresCheckout: true,
    hiddenFromPricing: false,
    shortDescription: "Q2 2026 market intelligence`;

if (c.includes(search)) {
  c = c.replace(search, replace);
  writeFileSync(filePath, c);
  console.log("Updated gmi_q2_2026 commercialStatus to manual_billing");
} else {
  console.log("Search string not found");
  // Try to find the exact text
  const idx = c.indexOf('gmi_q2_2026');
  if (idx >= 0) {
    console.log("Found at", idx, ":", c.substring(idx, idx + 400));
  }
}
