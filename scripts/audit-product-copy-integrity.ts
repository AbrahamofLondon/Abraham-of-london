/**
 * Product Copy Integrity Audit
 *
 * Enforces that all product surfaces use precise, truthful language.
 * No underselling. No overclaiming. No category confusion.
 *
 * Run: npx tsx scripts/audit-product-copy-integrity.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
const WARN = "\x1b[33m WARN\x1b[0m";
let passed = 0;
let failed = 0;
let warned = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`${PASS}  ${name}`);
    passed++;
  } else {
    console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function warn(name: string, detail: string) {
  console.log(`${WARN}  ${name} — ${detail}`);
  warned++;
}

function readFile(relPath: string): string {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
}

function findInFile(relPath: string, pattern: RegExp): string[] {
  const content = readFile(relPath);
  const matches: string[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i]!)) {
      matches.push(`${relPath}:${i + 1}: ${lines[i]!.trim().slice(0, 100)}`);
    }
  }
  return matches;
}

console.log("\n========================================");
console.log("  PRODUCT COPY INTEGRITY AUDIT");
console.log("========================================\n");

// ─────────────────────────────────────────────────────────────────────────────
// PURPOSE ALIGNMENT IDENTITY
// ─────────────────────────────────────────────────────────────────────────────

console.log("─── PURPOSE ALIGNMENT IDENTITY ───\n");

const purposePaths = [
  "components/alignment/PurposeAlignmentAssessment.tsx",
  "pages/diagnostics/purpose-alignment.tsx",
];
const purposeContent = purposePaths.map((p) => readFile(p)).join("\n");

check('1. Purpose: "not a personality test"', /not a personality test/i.test(purposeContent));
check('2. Purpose: "Pattern-Breaker Contract"', /Pattern.?Breaker Contract|PatternBreakerContract/i.test(purposeContent));
check('3. Purpose: "personal behavioural evidence"', /personal behavioural evidence/i.test(purposeContent));
check('4. Purpose: "binding" language', /binding commitment|binding action|binding/i.test(purposeContent));

// ─────────────────────────────────────────────────────────────────────────────
// CORPORATE PRODUCT IDENTITY
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n─── CORPORATE PRODUCT IDENTITY ───\n");

const corporatePages = [
  "pages/diagnostics/fast.tsx",
  "pages/diagnostics/constitutional-diagnostic.tsx",
  "pages/diagnostics/team-assessment.tsx",
  "pages/diagnostics/enterprise-assessment.tsx",
  "pages/diagnostics/executive-reporting.tsx",
  "pages/diagnostics/executive-reporting/run.tsx",
];

for (const page of corporatePages) {
  const content = readFile(page);
  const name = page.split("/").pop()!.replace(".tsx", "");
  check(`5. ${name}: no "personality test"`, !/personality test/i.test(content));
  check(`6. ${name}: no Purpose as required`, !/require.*Purpose Alignment|must.*complete.*Purpose/i.test(content));
}

// ─────────────────────────────────────────────────────────────────────────────
// WEAK PHRASES ON CTA SURFACES
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n─── WEAK PHRASES ON PRODUCT CTAs ───\n");

const allProductPages = [...purposePaths, ...corporatePages, "pages/outcome/check.tsx"];
const weakPatterns = [
  { word: "insight", pattern: /\binsight(s)?\b/gi },
  { word: "recommendation", pattern: /\brecommendation(s)?\b/gi },
  { word: "helpful", pattern: /\bhelpful\b/gi },
  { word: "may help", pattern: /\bmay help\b/gi },
  { word: "can support", pattern: /\bcan support\b/gi },
  { word: "explore", pattern: /\bexplore\b/gi },
];

// Only check in JSX text and string literals (not variable names or comments)
for (const { word, pattern } of weakPatterns) {
  const hits: string[] = [];
  for (const page of allProductPages) {
    const content = readFile(page);
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      // Skip imports, comments, variable names, and internal code
      if (line.trimStart().startsWith("import ")) continue;
      if (line.trimStart().startsWith("//")) continue;
      if (line.trimStart().startsWith("*")) continue;
      if (/const |let |function |type |export /.test(line) && !/".*\b/.test(line)) continue;
      // Check for the word in JSX text or string literals
      if (pattern.test(line)) {
        // Exclude internal variable/function names
        const isCode = /\w+\.\w*insight|Insight|recommendation[A-Z]|governedRecommendation/.test(line);
        if (!isCode) {
          hits.push(`${page}:${i + 1}`);
        }
      }
      pattern.lastIndex = 0;
    }
  }
  if (hits.length === 0) {
    check(`7. No "${word}" on product surfaces`, true);
  } else {
    // Check if hits are in actual copy vs code
    const copyHits = hits.filter((h) => {
      const [file, lineNum] = h.split(":");
      const content = readFile(file!);
      const line = content.split("\n")[parseInt(lineNum!) - 1] || "";
      return /"[^"]*\b/i.test(line) || />[^<]*\b/i.test(line) || /`[^`]*\b/i.test(line);
    });
    if (copyHits.length === 0) {
      check(`7. No "${word}" on product surfaces`, true);
    } else {
      warn(`"${word}" found in product copy`, copyHits.slice(0, 3).join(", "));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERCLAIM GUARDS
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n─── OVERCLAIM GUARDS ───\n");

// 8. No "guaranteed outcome"
const guaranteeHits = allProductPages.flatMap((p) => findInFile(p, /guaranteed?\s*(outcome|result|success)/i));
check('8. No "guaranteed outcome" language', guaranteeHits.length === 0, guaranteeHits[0]);

// 9. Peer intelligence includes sufficiency boundary
const purposeComp = readFile("components/alignment/PurposeAlignmentAssessment.tsx");
const hasPeerBoundary =
  purposeComp.includes("enough") ||
  purposeComp.includes("sufficient") ||
  purposeComp.includes("more data") ||
  purposeComp.includes("more contracts");
check("9. Peer intelligence has sufficiency boundary", hasPeerBoundary);

// 10. Behavioural verification includes connection boundary
const hasBehavioralBoundary =
  purposeComp.includes("requires connection") ||
  purposeComp.includes("Connect") ||
  purposeComp.includes("connect") ||
  purposeComp.includes("connection");
check("10. Behavioural verification has connection boundary", hasBehavioralBoundary);

// 11. Financial exposure includes anchor boundary
const erPage = readFile("pages/diagnostics/executive-reporting.tsx");
const erRun = readFile("pages/diagnostics/executive-reporting/run.tsx");
const erContent = erPage + erRun;
const hasAnchorBoundary =
  erContent.includes("supplied") ||
  erContent.includes("anchor") ||
  erContent.includes("stated") ||
  erContent.includes("from your") ||
  erContent.includes("direction");
check("11. Financial exposure has anchor/direction boundary", hasAnchorBoundary);

// 12. No paid Purpose upgrade presented as live
const premiumLive = purposeComp.includes("isPremium") && purposeComp.includes("setIsPremium(true)");
check("12. No premature premium activation", !premiumLive, premiumLive ? "setIsPremium(true) found — verify it requires real payment flow" : undefined);

// ─────────────────────────────────────────────────────────────────────────────
// RESULTS
// ─────────────────────────────────────────────────────────────────────────────

console.log("\n========================================");
console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${warned} warnings`);
console.log("========================================\n");

if (failed > 0) {
  console.log("Copy integrity VIOLATED. Fix before shipping.\n");
  process.exit(1);
} else if (warned > 0) {
  console.log("Copy integrity PASSES with warnings. Review before shipping.\n");
} else {
  console.log("Copy integrity INTACT. All surfaces truthful and distinct.\n");
}
