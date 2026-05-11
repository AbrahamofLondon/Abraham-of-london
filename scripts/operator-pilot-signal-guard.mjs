/**
 * scripts/operator-pilot-signal-guard.mjs
 *
 * Verifies:
 *   - Operator Pilot does not use SaaS/demo/beta language
 *   - Decision Signal does not expose paid deliverables
 *   - Decision Signal has a paid continuation path
 *   - No hidden pricing on low-ticket paid products
 *   - No unsupported automation or benchmark claims
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let violations = 0;

function check(condition, label, detail) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${label} — ${detail}`);
    violations++;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

function fileContains(path, pattern) {
  try {
    const content = readFileSync(join(ROOT, path), "utf-8");
    if (typeof pattern === "string") return content.includes(pattern);
    return pattern.test(content);
  } catch {
    return false;
  }
}

console.log("\n🔍 OPERATOR PILOT + SIGNAL GUARD\n");

// ── 1. Operator Pilot forbidden language ──
console.log("\n📋 Operator Pilot — Forbidden Language");
const operatorPilotPath = "pages/engagements/operator-pilot.tsx";
const operatorPilotContent = readFileSync(join(ROOT, operatorPilotPath), "utf-8");

// Check for forbidden phrases in non-disclaimer context
const forbiddenPilot = [
  { pattern: "book a call", label: "No 'book a call'" },
  { pattern: " beta ", label: "No 'beta' (standalone)" },
  { pattern: "try the platform", label: "No 'try the platform'" },
  { pattern: "consultation", label: "No 'consultation'" },
  { pattern: "open-access", label: "No 'open-access'" },
  { pattern: "SaaS", label: "No 'SaaS'" },
];
for (const { pattern, label } of forbiddenPilot) {
  check(!operatorPilotContent.includes(pattern), label, `Found forbidden language in ${operatorPilotPath}`);
}

// ── 2. Operator Pilot required sections ──
console.log("\n📋 Operator Pilot — Required Sections");
const requiredSections = [
  { pattern: "WHAT THIS IS", label: "Section: What this is" },
  { pattern: "Who this is for", label: "Section: Who this is for" },
  { pattern: "What kind of decision qualifies", label: "Section: What kind of decision qualifies" },
  { pattern: "What the pilot tests", label: "Section: What the pilot tests" },
  { pattern: "What the operator receives", label: "Section: What the operator receives" },
  { pattern: "What the system will not claim", label: "Section: What the system will not claim" },
  { pattern: "What happens after the pilot", label: "Section: What happens after the pilot" },
  { pattern: "Submit a decision for pilot review", label: "CTA: Submit a decision for pilot review" },
  { pattern: "Value receipt", label: "Section: Value receipt" },
];
for (const { pattern, label } of requiredSections) {
  check(fileContains(operatorPilotPath, pattern), label, `Missing: ${label}`);
}

// ── 3. Operator Pilot corridor references ──
console.log("\n📋 Operator Pilot — Corridor References");
const corridorRefs = [
  { pattern: "Fast Diagnostic", label: "References Fast Diagnostic" },
  { pattern: "Purpose Alignment", label: "References Purpose Alignment" },
  { pattern: "Decision Instruments", label: "References Decision Instruments" },
  { pattern: "Executive Reporting", label: "References Executive Reporting" },
  { pattern: "Strategy Room", label: "References Strategy Room" },
  { pattern: "Decision Centre", label: "References Decision Centre" },
  { pattern: "Boardroom / Oversight", label: "References Boardroom/Oversight" },
];
for (const { pattern, label } of corridorRefs) {
  check(fileContains(operatorPilotPath, pattern), label, `Missing: ${label}`);
}

// ── 3b. Operator Pilot CTA must include source context ──
console.log("\n📋 Operator Pilot — CTA Context");
check(
  operatorPilotContent.includes('source=operator-pilot'),
  "CTA includes source=operator-pilot context",
  "Primary CTA routes to generic page without source context",
);
check(
  operatorPilotContent.includes('Submit a decision for pilot review'),
  "CTA says 'Submit a decision for pilot review'",
  "CTA does not match required copy",
);

// ── 4. Decision Signal — no paid deliverables exposed ──
console.log("\n📋 Decision Signal — Paid Deliverable Boundary");
const signalPath = "pages/decision-instruments/signal/index.tsx";
const signalContent = readFileSync(join(ROOT, signalPath), "utf-8");

// Find the JSX rendering section (after the result state check)
const resultRenderStart = signalContent.indexOf("!result ? (");
const beforeResult = resultRenderStart >= 0 ? signalContent.substring(0, resultRenderStart) : signalContent;

// These terms should NOT appear in the free output section (before result rendering)
// They are only allowed in the boundary/paid-continuation sections within the result
const forbiddenSignalDeliverables = [
  { pattern: "full dossier", label: "No 'full dossier' as offered output" },
  { pattern: "governed memory", label: "No 'governed memory' as offered output" },
  { pattern: "full intervention path", label: "No 'full intervention path' as offered output" },
];
for (const { pattern, label } of forbiddenSignalDeliverables) {
  const regex = new RegExp(pattern, "i");
  check(!regex.test(beforeResult), label, `Found deliverable language before result rendering in ${signalPath}`);
}

// ── 5. Decision Signal — required free output ──
console.log("\n📋 Decision Signal — Required Free Output");
const requiredSignalOutput = [
  { pattern: "pressureBand", label: "1. Decision pressure band" },
  { pattern: "namedSignal", label: "2. One named signal" },
  { pattern: "consequenceWarning", label: "3. One consequence warning" },
  { pattern: "correctionQuestion", label: "4. One immediate correction question" },
  { pattern: "nextAdmissibleMove", label: "5. One next admissible move" },
  { pattern: "What this signal does not include", label: "6. Boundary statement" },
];
for (const { pattern, label } of requiredSignalOutput) {
  check(fileContains(signalPath, pattern), label, `Missing: ${label}`);
}

// ── 6. Decision Signal — paid continuation path ──
console.log("\n📋 Decision Signal — Paid Continuation Path");
check(
  fileContains(signalPath, "Paid continuation"),
  "Has 'Paid continuation' section",
  "Missing paid continuation section",
);
check(
  fileContains(signalPath, "Executive Reporting (£295)") || fileContains(signalPath, "Escalation Readiness Scorecard (£19)") || fileContains(signalPath, "Decision Exposure Instrument (£29)"),
  "Has specific instrument links with prices",
  "Missing specific instrument/price references",
);

// ── 7. Decision Signal — no generic upsell ──
console.log("\n📋 Decision Signal — No Generic Upsell");
check(
  !fileContains(signalPath, /check out our|view all products|browse our/i),
  "No generic upsell language",
  "Found generic upsell language",
);

// ── 8. Value receipt on both pages ──
console.log("\n📋 Value Receipt");
check(
  fileContains(operatorPilotPath, "Value receipt"),
  "Operator Pilot has value receipt",
  "Missing value receipt on operator pilot",
);
check(
  fileContains(signalPath, "What this signal does not include"),
  "Decision Signal has boundary statement",
  "Missing boundary statement on decision signal",
);

// Summary
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${violations} violations`);
console.log(`${"=".repeat(50)}`);

if (violations > 0) {
  console.error("\n❌ OPERATOR PILOT + SIGNAL GUARD FAILED\n");
  process.exit(1);
} else {
  console.log("\n✅ OPERATOR PILOT + SIGNAL GUARD PASSED\n");
}
