/**
 * Decision Instruments Legacy Leak Audit
 *
 * Fails if any legacy path is still reachable by paying customers.
 *
 * Run: npx tsx scripts/audit-decision-instruments-legacy-leaks.ts
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

function readFile(relPath: string): string {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

console.log("\n========================================");
console.log("  LEGACY LEAK AUDIT — Decision Instruments");
console.log("========================================\n");

const slugPage = readFile("pages/decision-instruments/[slug].tsx");

// 1. /api/diagnostics/evidence must NOT appear in instrument pages/components
console.log("─── Evidence POST leak ───\n");

const instrumentFiles = [
  "pages/decision-instruments/[slug].tsx",
  "components/instruments/DecisionExposureRunner.tsx",
  "components/instruments/MandateClarityRunner.tsx",
  "components/instruments/InterventionPathRunner.tsx",
  "components/instruments/InstrumentShell.tsx",
  "pages/decision-instruments/decision-exposure-instrument/run.tsx",
  "pages/decision-instruments/mandate-clarity-framework/run.tsx",
  "pages/decision-instruments/intervention-path-selector/run.tsx",
  "pages/decision-instruments/operator-decision-pack/run.tsx",
];

for (const f of instrumentFiles) {
  const content = readFile(f);
  const hasOldEvidence = content.includes("/api/diagnostics/evidence");
  const name = f.split("/").pop()!;
  check(`${name}: no /api/diagnostics/evidence`, !hasOldEvidence, hasOldEvidence ? "Old evidence POST found" : undefined);
}

// 2. No swallowed .catch(() => {}) in instrument completion flows
console.log("\n─── Swallowed catch check ───\n");

for (const f of instrumentFiles) {
  const content = readFile(f);
  // Only flag catch(() => {}) that follows a POST to results API (completion path)
  const hasSwallowed = /fetch\([^)]*results[^)]*\)[\s\S]{0,50}\.catch\(\(\)\s*=>\s*\{\s*\}\)/.test(content);
  const name = f.split("/").pop()!;
  check(`${name}: no swallowed catch on results POST`, !hasSwallowed, hasSwallowed ? "Swallowed .catch(() => {}) on results POST" : undefined);
}

// 3. InstrumentEnvironment must NOT be rendered for entitled customers
console.log("\n─── Legacy component isolation ───\n");

const rendersLegacyForEntitled = /hasAccess[\s\S]{0,100}InstrumentEnvironment/.test(slugPage);
check("InstrumentEnvironment not rendered for entitled customers", !rendersLegacyForEntitled);

const legacyRenamed = slugPage.includes("_LegacyInstrumentEnvironment");
check("Legacy component renamed with _ prefix", legacyRenamed);

// 4. Checkout success URLs point to /start
console.log("\n─── Checkout routing ───\n");

const catalog = readFile("lib/commercial/catalog.ts");
const products = ["decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector", "operator-decision-pack"];

for (const slug of products) {
  const successMatch = catalog.match(new RegExp(`successPath:\\s*"([^"]*${slug.replace(/-/g, ".")}[^"]*)"`));
  const successPath = successMatch?.[1] ?? "";
  check(`${slug}: checkout → /start`, successPath.endsWith("/start"), `successPath = "${successPath}"`);
}

// 5. Entitled primary CTA is interactive /run, not PDF
console.log("\n─── Entitled CTA check ───\n");

const hasRunCTA = slugPage.includes("/run") && slugPage.includes("Run interactive instrument");
check("Entitled primary CTA: 'Run interactive instrument' → /run", hasRunCTA);

const pdfIsSecondary = slugPage.includes("Download PDF worksheet");
check("PDF is secondary CTA text present", pdfIsSecondary);

// Ensure PDF CTA appears AFTER interactive CTA
if (hasRunCTA && pdfIsSecondary) {
  const runPos = slugPage.indexOf("Run interactive instrument");
  const pdfPos = slugPage.indexOf("Download PDF worksheet");
  check("Interactive CTA appears before PDF CTA", runPos < pdfPos);
}

// 6. Intervention Path public playbook exists
console.log("\n─── Playbook check ───\n");

check("Intervention Path public playbook exists", exists("content/playbooks/intervention-path-public.mdx"));

// Verify it has required sections
const playbook = readFile("content/playbooks/intervention-path-public.mdx");
check("Playbook: has 'Core Insight'", playbook.includes("Core Insight"));
check("Playbook: has 'When This Matters'", playbook.includes("When This Matters"));
check("Playbook: has 'What Remains Locked'", playbook.includes("What Remains Locked"));
check("Playbook: has CTA to paid selector", playbook.includes("/decision-instruments/intervention-path-selector"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) {
  console.log("LEGACY LEAKS DETECTED.\n");
  process.exit(1);
} else {
  console.log("NO LEGACY LEAKS. Customer journey is clean.\n");
}
