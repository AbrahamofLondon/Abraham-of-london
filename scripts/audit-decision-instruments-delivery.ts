/**
 * Decision Instruments Delivery Audit
 *
 * Fails if any active instrument lacks:
 * - /run route
 * - engine
 * - result persistence path
 * - PDF as secondary (not primary) CTA
 * - post-purchase start page
 *
 * Run: npx tsx scripts/audit-decision-instruments-delivery.ts
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

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function fileContains(relPath: string, needle: string): boolean {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return false;
  return fs.readFileSync(full, "utf-8").includes(needle);
}

console.log("\n========================================");
console.log("  DECISION INSTRUMENTS DELIVERY AUDIT");
console.log("========================================\n");

const instruments = [
  { slug: "decision-exposure-instrument", engine: "lib/instruments/decision-exposure/engine.ts", runner: "components/instruments/DecisionExposureRunner.tsx" },
  { slug: "mandate-clarity-framework", engine: "lib/instruments/mandate-clarity/engine.ts", runner: "components/instruments/MandateClarityRunner.tsx" },
  { slug: "intervention-path-selector", engine: "lib/instruments/intervention-path/engine.ts", runner: "components/instruments/InterventionPathRunner.tsx" },
  { slug: "operator-decision-pack", engine: "lib/instruments/operator-pack.ts", runner: "pages/decision-instruments/operator-decision-pack/run.tsx" },
];

for (const inst of instruments) {
  console.log(`─── ${inst.slug} ───\n`);

  check(`${inst.slug}: /run route exists`, exists(`pages/decision-instruments/${inst.slug}/run.tsx`));
  check(`${inst.slug}: /start route exists`, exists(`pages/decision-instruments/${inst.slug}/start.tsx`));
  check(`${inst.slug}: engine exists`, exists(inst.engine));
  check(`${inst.slug}: runner component exists`, exists(inst.runner));

  // Result persistence check
  const runPage = `pages/decision-instruments/${inst.slug}/run.tsx`;
  check(`${inst.slug}: result persistence wired`, fileContains(runPage, "/api/decision-instruments/results"));

  // Start page: interactive is primary, PDF is secondary
  const startPage = `pages/decision-instruments/${inst.slug}/start.tsx`;
  if (exists(startPage)) {
    const content = fs.readFileSync(path.join(ROOT, startPage), "utf-8");
    const interactiveFirst = content.indexOf("Start interactive") < content.indexOf("Download PDF");
    check(`${inst.slug}: interactive is primary CTA on start page`, interactiveFirst);
  } else {
    check(`${inst.slug}: start page exists for CTA check`, false);
  }

  console.log("");
}

// API check
check("Results API exists", exists("pages/api/decision-instruments/results/index.ts"));

// Operator Pack unified flow check
check("Operator Pack: uses all 3 engines",
  fileContains("pages/decision-instruments/operator-decision-pack/run.tsx", "DecisionExposureRunner") &&
  fileContains("pages/decision-instruments/operator-decision-pack/run.tsx", "MandateClarityRunner") &&
  fileContains("pages/decision-instruments/operator-decision-pack/run.tsx", "InterventionPathRunner")
);

check("Operator Pack: produces dossier", fileContains("pages/decision-instruments/operator-decision-pack/run.tsx", "Decision Dossier"));

console.log("\n========================================");
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log("========================================\n");

if (failed > 0) {
  console.log("INSTRUMENT DELIVERY INCOMPLETE.\n");
  process.exit(1);
} else {
  console.log("ALL INSTRUMENTS FULLY WIRED.\n");
}
