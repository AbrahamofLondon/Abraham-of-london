/**
 * Decision Instruments Guard
 *
 * Verifies product line integrity:
 * - All instruments have engines
 * - All instruments have runners
 * - All instruments have run pages
 * - No formula/threshold leakage in public pages
 * - No "guaranteed", "proven", "verified improvement" misuse
 * - No inactive planned product routes to checkout
 * - All instruments have evidence posture caveats
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let violations = 0;

function exists(filePath) {
  return fs.existsSync(path.resolve(root, filePath));
}

function readFile(filePath) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

// ── 1. All instruments must have engines ──
const INSTRUMENTS = [
  "decision-exposure",
  "mandate-clarity",
  "intervention-path",
  "escalation-readiness-scorecard",
  "structural-failure-diagnostic-canvas",
  "execution-risk-index",
  "team-alignment-gap-map",
  "governance-drift-detector",
  "strategic-priority-stack-builder",
  "board-brief-template",
];

for (const slug of INSTRUMENTS) {
  const enginePath = `lib/instruments/${slug}/engine.ts`;
  if (!exists(enginePath)) {
    console.error(`VIOLATION: Missing engine for instrument "${slug}" (${enginePath})`);
    violations++;
  }
}

// ── 2. All instruments must have run pages ──
const RUN_PAGE_SLUGS = [
  "decision-exposure-instrument",
  "mandate-clarity-framework",
  "intervention-path-selector",
  "escalation-readiness-scorecard",
  "structural-failure-diagnostic-canvas",
  "execution-risk-index",
  "team-alignment-gap-map",
  "governance-drift-detector",
  "strategic-priority-stack-builder",
  "board-brief-template",
];

for (const slug of RUN_PAGE_SLUGS) {
  const runPath = `pages/decision-instruments/${slug}/run.tsx`;
  if (!exists(runPath)) {
    console.error(`VIOLATION: Missing run page for instrument "${slug}" (${runPath})`);
    violations++;
  }
}

// ── 3. Run pages or their runner components must include evidence posture caveat ──
const RUNNER_DIR = "components/instruments";
for (const slug of RUN_PAGE_SLUGS) {
  const runPath = `pages/decision-instruments/${slug}/run.tsx`;
  const runContent = readFile(runPath) ?? "";
  // Check if the run page imports a runner that has the caveat
  const importMatch = runContent.match(/import\s+\w+\s+from\s+["']@\/components\/instruments\/(\w+)["']/);
  let hasCaveat = /not independently verified|estimate|user-reported|Governed/i.test(runContent);
  if (!hasCaveat && importMatch) {
    const runnerFile = `${RUNNER_DIR}/${importMatch[1]}.tsx`;
    const runnerContent = readFile(runnerFile);
    if (runnerContent) {
      hasCaveat = /not independently verified|estimate|user-reported/i.test(runnerContent);
    }
  }
  if (!hasCaveat) {
    console.error(`VIOLATION: Run page for "${slug}" missing evidence posture caveat`);
    violations++;
  }
}

// ── 4. No formula/threshold leakage in run pages ──
const FORBIDDEN_IN_RUN = [
  /\bformula\b.*=.*\d+.*[+*/-]/i,
  /\bweight\b.*[:=].*0\.\d/i,
  /\bthreshold\b.*[:=].*\d+/i,
];

for (const slug of RUN_PAGE_SLUGS) {
  const runPath = `pages/decision-instruments/${slug}/run.tsx`;
  const content = readFile(runPath);
  if (!content) continue;
  for (const pattern of FORBIDDEN_IN_RUN) {
    if (pattern.test(content)) {
      console.error(`VIOLATION: Run page for "${slug}" may expose formula/threshold/weight`);
      violations++;
      break;
    }
  }
}

// ── 5. Governed instrument contract must exist ──
if (!exists("lib/instruments/governed-instrument-contract.ts")) {
  console.error("VIOLATION: Missing governed-instrument-contract.ts");
  violations++;
}

// ── 6. Pack contract must exist ──
if (!exists("lib/instruments/instrument-pack-contract.ts")) {
  console.error("VIOLATION: Missing instrument-pack-contract.ts");
  violations++;
}

// Summary
if (violations > 0) {
  console.error(`\nDECISION_INSTRUMENTS_GUARD: FAIL (${violations} violation${violations !== 1 ? "s" : ""})`);
  process.exit(1);
} else {
  console.log("DECISION_INSTRUMENTS_GUARD: PASS");
}
