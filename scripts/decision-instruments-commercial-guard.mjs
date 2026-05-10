/**
 * Decision Instruments Commercial Guard
 *
 * Verifies the commercial chain is complete for all active paid instruments.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let violations = 0;

// Load catalog at runtime
const catalogPath = path.join(root, "lib/commercial/catalog.ts");
const catalogContent = fs.readFileSync(catalogPath, "utf8");

const INSTRUMENT_CODES = [
  "escalation_readiness_scorecard",
  "structural_failure_diagnostic_canvas",
  "execution_risk_index",
  "team_alignment_gap_map",
  "governance_drift_detector",
  "strategic_priority_stack_builder",
  "board_brief_builder",
  "decision_exposure_instrument",
  "mandate_clarity_framework",
  "intervention_path_selector",
];

// ── 1. All active paid instruments must have Stripe IDs ──
for (const code of INSTRUMENT_CODES) {
  const block = catalogContent.slice(catalogContent.indexOf(`${code}: {`));
  const endIdx = block.indexOf("\n  },");
  const entry = block.slice(0, endIdx > 0 ? endIdx : 500);

  if (entry.includes("active: true")) {
    if (entry.includes("stripeProductId: null") || entry.includes('stripeProductId: ""')) {
      console.error(`VIOLATION: ${code} is active but missing stripeProductId`);
      violations++;
    }
    if (entry.includes("stripePriceId: null") || entry.includes('stripePriceId: ""')) {
      console.error(`VIOLATION: ${code} is active but missing stripePriceId`);
      violations++;
    }
  }
}

// ── 2. Board Brief Builder must use canonical route ──
{
  const bbBlock = catalogContent.slice(catalogContent.indexOf("board_brief_builder: {"));
  if (bbBlock.includes("board-brief-template/run") && !bbBlock.includes("board-brief-builder/run")) {
    console.error("VIOLATION: Board Brief Builder successPath still points to old template route");
    violations++;
  }
}

// ── 3. Decision Alignment display name must not regress to Team Alignment ──
{
  const taBlock = catalogContent.slice(catalogContent.indexOf("team_alignment_gap_map: {"));
  const displayMatch = taBlock.match(/displayName:\s*"([^"]+)"/);
  if (displayMatch && displayMatch[1] === "Team Alignment Gap Map") {
    console.error("VIOLATION: Decision Alignment Gap Map has regressed to Team Alignment");
    violations++;
  }
}

// ── 4. Execution Risk price must be £49 (4900) ──
{
  const erStart = catalogContent.indexOf("execution_risk_index: {");
  const erEnd = catalogContent.indexOf("\n  },", erStart);
  const erBlock = catalogContent.slice(erStart, erEnd > erStart ? erEnd : erStart + 500);
  if (erBlock.includes("amount: 2900")) {
    console.error("VIOLATION: Execution Risk Index is still priced at £29 instead of £49");
    violations++;
  }
}

// ── 5. Strategic Priority Stack price must be £79 (7900) ──
{
  const spStart = catalogContent.indexOf("strategic_priority_stack_builder: {");
  const spEnd = catalogContent.indexOf("\n  },", spStart);
  const spBlock = catalogContent.slice(spStart, spEnd > spStart ? spEnd : spStart + 500);
  if (spBlock.includes("amount: 4900")) {
    console.error("VIOLATION: Strategic Priority Stack Builder is still priced at £49 instead of £79");
    violations++;
  }
}

// ── 6. All successPaths must exist as files ──
const SUCCESS_PATHS = [
  "pages/decision-instruments/escalation-readiness-scorecard/run.tsx",
  "pages/decision-instruments/structural-failure-diagnostic-canvas/run.tsx",
  "pages/decision-instruments/execution-risk-index/run.tsx",
  "pages/decision-instruments/team-alignment-gap-map/run.tsx",
  "pages/decision-instruments/governance-drift-detector/run.tsx",
  "pages/decision-instruments/strategic-priority-stack-builder/run.tsx",
  "pages/decision-instruments/board-brief-builder/run.tsx",
  "pages/decision-instruments/decision-exposure-instrument/run.tsx",
  "pages/decision-instruments/mandate-clarity-framework/run.tsx",
  "pages/decision-instruments/intervention-path-selector/run.tsx",
];

for (const p of SUCCESS_PATHS) {
  if (!fs.existsSync(path.join(root, p))) {
    console.error(`VIOLATION: successPath file missing: ${p}`);
    violations++;
  }
}

// ── 7. No pack checkout active without entitlement bundle logic ──
const PACK_CODES = ["operator_essentials_pack", "command_pack", "governance_suite", "executive_intelligence_pack"];
for (const code of PACK_CODES) {
  const idx = catalogContent.indexOf(`${code}: {`);
  if (idx >= 0) {
    const packBlock = catalogContent.slice(idx, idx + 500);
    if (packBlock.includes("active: true") && packBlock.match(/stripePriceId:\s*"price_/)) {
      console.error(`VIOLATION: Pack ${code} has active checkout but bundle entitlement logic not verified`);
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\nDECISION_INSTRUMENTS_COMMERCIAL_GUARD: FAIL (${violations} violation${violations !== 1 ? "s" : ""})`);
  process.exit(1);
} else {
  console.log("DECISION_INSTRUMENTS_COMMERCIAL_GUARD: PASS");
}
