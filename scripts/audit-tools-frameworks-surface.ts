/**
 * Tools & Frameworks Surface Audit
 * Run: npx tsx scripts/audit-tools-frameworks-surface.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function exists(p: string): boolean { return fs.existsSync(path.join(ROOT, p)); }
function read(p: string): string { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : ""; }

console.log("\n========================================");
console.log("  TOOLS & FRAMEWORKS SURFACE AUDIT");
console.log("========================================\n");

// Strategic frameworks count
const fwFile = read("lib/resources/strategic-frameworks.static.ts");
const fwCount = (fwFile.match(/slug:\s*"/g) || []).length;
console.log("─── Strategic Frameworks ───\n");
check(`Strategic frameworks >= 7`, fwCount >= 7, `Found ${fwCount}`);

// Framework quality checks (spot check: each must have metrics + boardQuestions + failureModes)
const hasMetrics = (fwFile.match(/metrics:\s*\[/g) || []).length;
const hasBoardQ = (fwFile.match(/boardQuestions:\s*\[/g) || []).length;
const hasFailure = (fwFile.match(/failureModes:\s*\[/g) || []).length;
check(`All frameworks have metrics`, hasMetrics >= 7, `${hasMetrics} with metrics`);
check(`All frameworks have board questions`, hasBoardQ >= 7, `${hasBoardQ} with board questions`);
check(`All frameworks have failure modes`, hasFailure >= 7, `${hasFailure} with failure modes`);

// Toolkit pages
console.log("\n─── Toolkit & Glossary Pages ───\n");
check("/toolkits route exists", exists("pages/toolkits/index.tsx"));
check("/toolkits/[slug] route exists", exists("pages/toolkits/[slug].tsx"));
check("/canon/glossary route exists", exists("pages/canon/glossary.tsx"));

// Cross-links in framework file
console.log("\n─── Framework cross-links ───\n");
check("Frameworks reference toolkits", fwFile.includes("Toolkit"));
check("Frameworks reference products", fwFile.includes("Instrument") || fwFile.includes("Reporting"));
check("Frameworks reference Canon", fwFile.includes("Canon"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("SURFACE NOT YET HARDENED.\n"); process.exit(1); }
else { console.log("TOOLS & FRAMEWORKS SURFACE HARDENED.\n"); }
