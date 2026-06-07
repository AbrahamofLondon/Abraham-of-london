#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

// Print exact product table
console.log("=== PRODUCT SCORE TABLE (estate audit JSON) ===\n");
console.log("Code".padEnd(30), "Name".padEnd(30), "Grade", "Exposure".padEnd(18), "Blockers");
console.log("-".repeat(115));
d.products.forEach((p) => {
  const blocker = p.knownBlockers && p.knownBlockers.length > 0 ? p.knownBlockers.length + " blocker(s)" : "(none)";
  console.log(
    p.productCode.padEnd(30),
    (p.productName || "").substring(0, 28).padEnd(30),
    (p.realityGrade + "/10").padEnd(6),
    (p.exposure || "").padEnd(18),
    blocker
  );
});

const grades = d.products.map((p) => p.realityGrade || 0);
const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
const at10 = d.products.filter((p) => p.realityGrade >= 10).length;
const at9 = d.products.filter((p) => p.realityGrade === 9).length;
const at8 = d.products.filter((p) => p.realityGrade === 8).length;
const below8 = d.products.filter((p) => p.realityGrade < 8).length;

console.log(`\nTotal products: ${d.products.length}`);
console.log(`At 10/10: ${at10}`);
console.log(`At 9/10: ${at9}`);
console.log(`At 8/10: ${at8}`);
console.log(`Below 8: ${below8}`);
console.log(`Computed average: ${avg.toFixed(1)}/10`);
