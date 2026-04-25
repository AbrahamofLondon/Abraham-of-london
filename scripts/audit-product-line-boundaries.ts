/**
 * Product-Line Boundary Audit
 *
 * Enforces that Purpose Alignment and Operational Decision Intelligence
 * remain distinct product lines with typed, optional evidence bridges.
 *
 * Run: npx tsx scripts/audit-product-line-boundaries.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`${PASS}  ${name}`);
    passed++;
  } else {
    console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function readFile(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

function filesInDir(dir: string): string[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { recursive: true })
    .map(String)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".tsx"));
}

function fileContains(relPath: string, needle: string): boolean {
  return readFile(relPath).includes(needle);
}

console.log("\n========================================");
console.log("  PRODUCT-LINE BOUNDARY AUDIT");
console.log("========================================\n");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Purpose Alignment does NOT import SpineRenderer
// ─────────────────────────────────────────────────────────────────────────────

const purposeFiles = [
  ...filesInDir("components/alignment").map((f) => `components/alignment/${f}`),
  "pages/diagnostics/purpose-alignment.tsx",
  "lib/alignment/PurposeAlignmentAssessment.tsx",
];

const spineRendererImports = purposeFiles.filter((f) => fileContains(f, "SpineRenderer"));
check(
  "1. PurposeAlignmentAssessment does NOT import SpineRenderer",
  spineRendererImports.length === 0,
  spineRendererImports.length > 0 ? `Found in: ${spineRendererImports.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Purpose Alignment does NOT require Fast Diagnostic
// ─────────────────────────────────────────────────────────────────────────────

const purposeRequiresFast = purposeFiles.filter(
  (f) => fileContains(f, "useSpineGuard") || fileContains(f, "redirect.*fast") || fileContains(f, "loadSpineFromSession"),
);
check(
  "2. PurposeAlignmentAssessment does NOT require Fast Diagnostic",
  purposeRequiresFast.length === 0,
  purposeRequiresFast.length > 0 ? `Found spine dependency in: ${purposeRequiresFast.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Fast Diagnostic does NOT import Purpose UI components
// ─────────────────────────────────────────────────────────────────────────────

const fastContent = readFile("pages/diagnostics/fast.tsx");
const purposeImportsInFast = [
  "PurposeAlignmentAssessment",
  "PatternBreakerContract",
  "PastContractInterrupt",
  "PatternObservatory",
  "DemographicContextCapture",
].filter((name) => fastContent.includes(name));
check(
  "3. Fast Diagnostic does NOT import Purpose UI components",
  purposeImportsInFast.length === 0,
  purposeImportsInFast.length > 0 ? `Found: ${purposeImportsInFast.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 4. Corporate diagnostics do NOT depend on Purpose Alignment
// ─────────────────────────────────────────────────────────────────────────────

const corporatePages = [
  "pages/diagnostics/constitutional-diagnostic.tsx",
  "pages/diagnostics/team-assessment.tsx",
  "pages/diagnostics/enterprise-assessment.tsx",
  "pages/diagnostics/executive-reporting/run.tsx",
];
const corporatePurposeDeps = corporatePages.filter(
  (f) =>
    fileContains(f, "PurposeAlignmentAssessment") ||
    fileContains(f, "PatternBreakerContract") ||
    fileContains(f, "lib/alignment/scoring") ||
    fileContains(f, "lib/alignment/checklist"),
);
check(
  "4. Corporate diagnostics do NOT depend on Purpose Alignment",
  corporatePurposeDeps.length === 0,
  corporatePurposeDeps.length > 0 ? `Found in: ${corporatePurposeDeps.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 5. Bridge files live only under lib/product-lines/
// ─────────────────────────────────────────────────────────────────────────────

check(
  "5a. product-line-contract.ts exists in lib/product-lines/",
  fileExists("lib/product-lines/product-line-contract.ts"),
);
check(
  "5b. purpose-to-decision-bridge.ts exists in lib/product-lines/",
  fileExists("lib/product-lines/purpose-to-decision-bridge.ts"),
);

// Ensure no bridge logic leaks into alignment or decision directories
const alignmentBridge = filesInDir("lib/alignment").filter((f) => f.includes("bridge") && f.includes("decision"));
const decisionBridge = filesInDir("lib/decision").filter((f) => f.includes("bridge") && f.includes("purpose"));
check(
  "5c. No bridge logic in lib/alignment/",
  alignmentBridge.length === 0,
  alignmentBridge.length > 0 ? `Found: ${alignmentBridge.join(", ")}` : undefined,
);
check(
  "5d. No bridge logic in lib/decision/",
  decisionBridge.length === 0,
  decisionBridge.length > 0 ? `Found: ${decisionBridge.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 6. Purpose copy contains required identity phrases
// ─────────────────────────────────────────────────────────────────────────────

// Check both possible locations for the component
const purposeComponentPaths = [
  "components/alignment/PurposeAlignmentAssessment.tsx",
  "lib/alignment/PurposeAlignmentAssessment.tsx",
];
let purposeComponent = "";
for (const p of purposeComponentPaths) {
  const content = readFile(p);
  if (content.length > 0) { purposeComponent = content; break; }
}

check(
  '6a. Purpose copy: "not a personality test"',
  purposeComponent.includes("not a personality test") || purposeComponent.includes("Not a personality test"),
);
check(
  '6b. Purpose copy: "Pattern-Breaker Contract" or "PatternBreakerContract"',
  purposeComponent.includes("Pattern-Breaker Contract") || purposeComponent.includes("PatternBreakerContract"),
);
check(
  '6c. Purpose copy: "binding commitment" or "binding action"',
  purposeComponent.includes("binding commitment") || purposeComponent.includes("binding action") || purposeComponent.includes("binding"),
);

// ─────────────────────────────────────────────────────────────────────────────
// 7. Purpose result contains boundary statement
// ─────────────────────────────────────────────────────────────────────────────

const hasBoundary =
  purposeComponent.includes("personal behavioural evidence") ||
  purposeComponent.includes("personal self-reported signal") ||
  purposeComponent.includes("not full psychological profile") ||
  purposeComponent.includes("not organisational structural diagnosis");
check(
  "7. Purpose result contains boundary language",
  hasBoundary,
  !hasBoundary ? "Missing: 'personal behavioural evidence' or equivalent boundary statement" : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 8. Corporate surfaces do not present Purpose as organisational proof
// ─────────────────────────────────────────────────────────────────────────────

const corporateContent = corporatePages.map((p) => readFile(p)).join("\n");
const purposeAsProof = [
  "Purpose Alignment proves",
  "Purpose Alignment confirms",
  "based on Purpose Alignment",
  "Purpose Alignment diagnosis",
].filter((phrase) => corporateContent.toLowerCase().includes(phrase.toLowerCase()));
check(
  "8. Corporate surfaces do not present Purpose as organisational proof",
  purposeAsProof.length === 0,
  purposeAsProof.length > 0 ? `Found: ${purposeAsProof.join(", ")}` : undefined,
);

// ─────────────────────────────────────────────────────────────────────────────
// 9. No product line blocks access to the other
// ─────────────────────────────────────────────────────────────────────────────

// Purpose should not redirect to Fast as a gate
const purposePageContent = readFile("pages/diagnostics/purpose-alignment.tsx");
const purposeBlocksCorporate = purposePageContent.includes("redirect") && purposePageContent.includes("/diagnostics/fast");
check(
  "9a. Purpose does not gate behind Fast Diagnostic",
  !purposeBlocksCorporate,
);

// Fast should not redirect to Purpose as a gate
const fastBlocksPurpose = fastContent.includes("redirect") && fastContent.includes("purpose-alignment");
check(
  "9b. Fast Diagnostic does not gate behind Purpose Alignment",
  !fastBlocksPurpose,
);

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n========================================");
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) {
  console.log("Product-line boundaries are VIOLATED. Fix before shipping.\n");
  process.exit(1);
} else {
  console.log("Product-line boundaries are INTACT. Both product lines are protected.\n");
}
