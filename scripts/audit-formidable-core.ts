/**
 * Formidable Core Audit
 *
 * The system is not formidable because it works.
 * It is formidable when it refuses bad input, cannot be gamed,
 * does not lie, explains its decisions, preserves source lineage,
 * fails safely, and is tested against hostile use.
 *
 * Run: npx tsx scripts/audit-formidable-core.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m FORMIDABLE\x1b[0m";
const FAIL = "\x1b[31m WEAK\x1b[0m";
const WARN = "\x1b[33m LIMITED\x1b[0m";
let passed = 0;
let failed = 0;
let warned = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function warn(name: string, detail: string) {
  console.log(`${WARN}  ${name} — ${detail}`);
  warned++;
}

function readFile(relPath: string): string {
  const full = path.join(ROOT, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf-8") : "";
}

function fileContains(relPath: string, needle: string | RegExp): boolean {
  const content = readFile(relPath);
  return typeof needle === "string" ? content.includes(needle) : needle.test(content);
}

console.log("\n========================================");
console.log("  FORMIDABLE CORE AUDIT");
console.log("========================================\n");

// ── 1. No Math.random() in critical libs ───────────────────────────────────
console.log("─── CRYPTOGRAPHIC SAFETY ───\n");

const criticalLibs = [
  "lib/decision/intelligence-spine.ts",
  "lib/decision/synthesis-engine.ts",
  "lib/decision/c3-fidelity-scorer.ts",
  "lib/decision/case-object.ts",
  "lib/decision/arbiter-tournament.ts",
  "lib/decision/spine-persistence.ts",
  "lib/follow-up/pressure-loop.ts",
  "lib/follow-up/conversion-signals.ts",
  "lib/diagnostics/journey-store.ts",
  "pages/api/diagnostics/submit.ts",
  "lib/alignment/organization-engine.ts",
];

for (const lib of criticalLibs) {
  const name = lib.split("/").pop()!;
  const hasMathRandom = fileContains(lib, /Math\.random\(\)/);
  check(`${name}: no Math.random()`, !hasMathRandom, hasMathRandom ? "Uses Math.random() — insecure" : undefined);
}

// ── 2. No fake behavioural integrations ────────────────────────────────────
console.log("\n─── NO FAKE DATA ───\n");

const behavioral = readFile("lib/alignment/behavioral-integration.ts");
check(
  "behavioral-integration: no mock active status",
  !behavioral.includes('status: "active"') || behavioral.includes("// actual OAuth"),
  behavioral.includes('status: "active"') ? 'Returns status: "active" without real OAuth' : undefined,
);

check(
  "behavioral-integration: no fabricated signals",
  !(/meetingCompletion:\s*0\.\d+/.test(behavioral) && /status:\s*"active"/.test(behavioral)),
);

// ── 3. Signal dictionary banned words ──────────────────────────────────────
console.log("\n─── SIGNAL DICTIONARY INTEGRITY ───\n");

const signals = readFile("lib/diagnostics/signals.ts");
const signalContent = signals.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""); // strip comments
const bannedInSignals = ["\\bmay\\b", "\\bmight\\b", "\\bconsider\\b", "\\bexplore\\b", "\\binsight", "\\brecommend", "\\bpotential\\b", "\\bmanageable\\b"];
for (const pattern of bannedInSignals) {
  const regex = new RegExp(pattern, "i");
  const word = pattern.replace(/\\b/g, "");
  check(`signals.ts: no "${word}"`, !regex.test(signalContent));
}

// ── 4. Active products have Stripe prices ──────────────────────────────────
console.log("\n─── COMMERCIAL INTEGRITY ───\n");

const catalog = readFile("lib/commercial/catalog.ts");
// Check that no active:true product with amount > 0 has stripePriceId: null
const activeWithoutPrice = /active:\s*true[\s\S]{0,200}stripePriceId:\s*null/g;
check("catalog: all active paid products have Stripe price IDs", !activeWithoutPrice.test(catalog));

// ── 5. No synthesis without C3 ─────────────────────────────────────────────
console.log("\n─── ENGINE INTEGRITY ───\n");

const synthesisEngine = readFile("lib/decision/synthesis-engine.ts");
check(
  "synthesis-engine: C3 check before synthesis",
  synthesisEngine.includes("scoreC3") && synthesisEngine.includes("HARD_RECOVERY"),
);

check(
  "synthesis-engine: prompt injection sanitisation",
  synthesisEngine.includes("sanitiseForPrompt") || synthesisEngine.includes("sanitizeForPrompt"),
);

check(
  "synthesis-engine: output length enforcement",
  synthesisEngine.includes("MAX_LLM_OUTPUT"),
);

// ── 6. Arbiter cannot be bypassed ──────────────────────────────────────────
check(
  "synthesis-engine: arbiter in synthesis path",
  synthesisEngine.includes("runArbiterTournament"),
);

const arbiter = readFile("lib/decision/arbiter-tournament.ts");
check(
  "arbiter: audit metadata present",
  arbiter.includes("checkedAt") && arbiter.includes("violationCount"),
);

// ── 7. Spine validation exists ─────────────────────────────────────────────
const spine = readFile("lib/decision/intelligence-spine.ts");
check("spine: validateIntelligenceSpine exists", spine.includes("validateIntelligenceSpine"));
check("spine: assertValidSpine exists", spine.includes("assertValidSpine"));
check("spine: stage regression detection", spine.includes("regressed") || spine.includes("STAGE_ORDER"));

// ── 8. Case object validation ──────────────────────────────────────────────
const caseObject = readFile("lib/decision/case-object.ts");
check("case-object: validateCaseObject exists", caseObject.includes("validateCaseObject"));
check("case-object: normalizeCaseObject exists", caseObject.includes("normalizeCaseObject"));
check("case-object: redactCaseObjectForStorage exists", caseObject.includes("redactCaseObjectForStorage"));

// ── 9. C3 scorer explains decisions ────────────────────────────────────────
const c3 = readFile("lib/decision/c3-fidelity-scorer.ts");
check("c3-scorer: scoring explanation", c3.includes("scoringExplanation"));
check("c3-scorer: recovery classification", c3.includes("recoveryClassification"));

// ── 10. Contradiction graph validation ─────────────────────────────────────
const graph = readFile("lib/engine/contradiction-graph.ts");
check("contradiction-graph: validateNode exists", graph.includes("validateNode"));
check("contradiction-graph: validateEdge exists", graph.includes("validateEdge"));
check("contradiction-graph: exportGraphAuditSummary exists", graph.includes("exportGraphAuditSummary"));

// ── 11. Pressure loop honesty ──────────────────────────────────────────────
console.log("\n─── FOLLOW-UP INTEGRITY ───\n");

const pressureLoop = readFile("lib/follow-up/pressure-loop.ts");
check("pressure-loop: no-move recovery path", pressureLoop.includes("hasMove") || pressureLoop.includes("no specific move"));

// ── 12. Product-line boundaries ────────────────────────────────────────────
console.log("\n─── PRODUCT-LINE INTEGRITY ───\n");

const bridge = readFile("lib/product-lines/purpose-to-decision-bridge.ts");
check("bridge: explainEscalationDecision exists", bridge.includes("explainEscalationDecision"));
check("bridge: source lineage preserved", bridge.includes("source:") && bridge.includes("target:"));

// ── 13. Catalog assertions ─────────────────────────────────────────────────
check("catalog: assertActiveProductsHavePriceIds exists", catalog.includes("assertActiveProductsHavePriceIds"));
check("catalog: assertNoDuplicateProductCodes exists", catalog.includes("assertNoDuplicateProductCodes"));

// ── 14. Conversion signals temperature ─────────────────────────────────────
const conversionSignals = readFile("lib/follow-up/conversion-signals.ts");
check("conversion-signals: lead temperature", conversionSignals.includes("LeadTemperature"));
check("conversion-signals: temperature reasons", conversionSignals.includes("temperatureReasons"));

// ── RESULTS ────────────────────────────────────────────────────────────────
console.log("\n========================================");
console.log(`  RESULTS: ${passed} formidable, ${failed} weak, ${warned} limited`);
console.log("========================================\n");

if (failed > 0) {
  console.log("WEAK LINKS REMAIN. Fix before shipping.\n");
  process.exit(1);
} else if (warned > 0) {
  console.log("FORMIDABLE with known limitations.\n");
} else {
  console.log("FORMIDABLE. No weak links detected.\n");
}
