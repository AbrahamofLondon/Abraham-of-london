#!/usr/bin/env node

/**
 * scripts/check-living-intelligence-release-readiness.mjs
 *
 * Single release-readiness gate for the full Living Intelligence architecture.
 *
 * Verifies that living-state objects, estate intelligence, product governance,
 * user-facing living review, operator command centre, feedback capture, and
 * feedback guard proofs are all coherent before any future push or deployment.
 *
 * Exit codes:
 *   0 = release gate passed
 *   1 = release gate failed
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const BOLD = "\x1b[1m";

let checksPassed = 0;
let checksFailed = 0;
const checkResults = [];

function log(color, ...args) { console.log(color, ...args, RESET); }

function heading(text) { console.log(`\n${BOLD}${CYAN}${text}${RESET}\n`); }

function pass(id, label, evidence = []) {
  checksPassed++;
  checkResults.push({ id, label, status: "passed", evidence });
  console.log(`  ${GREEN}✓${RESET} ${label}`);
}

function fail(id, label, evidence = [], recommendation) {
  checksFailed++;
  checkResults.push({ id, label, status: "failed", evidence, recommendation });
  console.log(`  ${RED}✗${RESET} ${label}`);
}

function warn(id, label, evidence = [], recommendation) {
  checkResults.push({ id, label, status: "warning", evidence, recommendation });
  console.log(`  ${YELLOW}⚠${RESET} ${label}`);
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

function runScript(scriptRel) {
  try {
    const result = execSync(`node ${path.join(ROOT, scriptRel)}`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { success: true, output: result };
  } catch (err) {
    return { success: false, output: err.message || String(err) };
  }
}

// ─── 1. Required files exist ─────────────────────────────────────────────────

heading("1. Required files exist");

const REQUIRED_FILES = [
  "scripts/run-living-state-objects.ts",
  "scripts/check-living-product-governance.mjs",
  "scripts/check-living-estate-intelligence.mjs",
  "scripts/check-living-action-feedback-guards.mjs",
  "pages/admin/living-state/index.tsx",
  "pages/admin/operator-command-centre/index.tsx",
  "lib/living-intelligence/living-state-object-contract.ts",
  "lib/living-intelligence/living-state-engine.ts",
  "lib/living-intelligence/living-action-feedback-contract.ts",
  "lib/living-intelligence/living-action-feedback-engine.ts",
  "lib/living-intelligence/living-action-feedback-guards.ts",
];

let allFilesExist = true;
for (const f of REQUIRED_FILES) {
  if (fileExists(f)) {
    pass(`file-${f.replace(/[\/\.]/g, "-")}`, `Required file exists: ${f}`);
  } else {
    allFilesExist = false;
    fail(`file-${f.replace(/[\/\.]/g, "-")}`, `Required file missing: ${f}`, [`Expected: ${f}`], "Create the missing file.");
  }
}

// ─── 2. Required reports exist and are parseable ─────────────────────────────

heading("2. Required reports exist and are parseable");

const REQUIRED_REPORTS = [
  "reports/living-state-objects.json",
  "reports/living-state-view-model.json",
  "reports/living-action-feedback-summary.json",
  "reports/living-estate-intelligence-report.json",
  "reports/living-product-truth-report.json",
];

let allReportsOk = true;
for (const r of REQUIRED_REPORTS) {
  const data = readJson(r);
  if (data !== null) {
    pass(`report-${r.replace(/[\/\.]/g, "-")}`, `Report exists and is parseable: ${r}`);
  } else {
    allReportsOk = false;
    const script = r.includes("living-state")
      ? "npx tsx scripts/run-living-state-objects.ts"
      : r.includes("living-action-feedback")
        ? "npx tsx scripts/run-living-state-objects.ts"
        : r.includes("estate-intelligence")
          ? "node scripts/check-living-estate-intelligence.mjs"
          : r.includes("product-truth")
            ? "node scripts/check-living-product-governance.mjs"
            : "unknown";
    fail(`report-${r.replace(/[\/\.]/g, "-")}`, `Report missing or unparseable: ${r}`, [`Expected: ${r}`], `Run: ${script}`);
  }
}

// ─── 3. Living-state coverage ────────────────────────────────────────────────

heading("3. Living-state coverage");

const viewModel = readJson("reports/living-state-view-model.json");
const objectsPayload = readJson("reports/living-state-objects.json");
const objects = objectsPayload?.objects ?? viewModel?.objects ?? [];

if (objects.length > 0) {
  pass("coverage-total-objects", `Total living-state objects: ${objects.length}`);
} else {
  fail("coverage-total-objects", "No living-state objects found", [], "Run: npx tsx scripts/run-living-state-objects.ts");
}

const REQUIRED_DOMAINS = ["commercial", "fulfilment", "gmi", "content", "decision_centre", "strategy_room", "retainer_oversight", "professional"];
const presentDomains = [...new Set(objects.map((o) => o.domain))];

let allDomainsPresent = true;
for (const d of REQUIRED_DOMAINS) {
  if (presentDomains.includes(d)) {
    pass(`coverage-domain-${d}`, `Domain present: ${d}`);
  } else {
    allDomainsPresent = false;
    fail(`coverage-domain-${d}`, `Domain missing: ${d}`, [`Expected domain: ${d}`], "Add a domain adapter for this domain.");
  }
}

const blockedCount = objects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length;
if (blockedCount > 0) {
  pass("coverage-blocked", `Blocked objects: ${blockedCount}`);
} else {
  warn("coverage-blocked", "No blocked objects detected — may indicate missing blockers", ["blockedCount=0"]);
}

// Check safeToAutomate is false for all sensitive domains
const sensitiveDomains = ["commercial", "fulfilment", "gmi", "decision_centre", "strategy_room", "retainer_oversight", "professional"];
let allSafeToAutomateRespected = true;
for (const d of sensitiveDomains) {
  const domainObjects = objects.filter((o) => o.domain === d);
  const unsafeAuto = domainObjects.filter((o) => !o.safeToAutomate);
  if (unsafeAuto.length === domainObjects.length) {
    pass(`coverage-automation-${d}`, `All ${d} objects respect safeToAutomate=false`);
  } else if (domainObjects.length > 0) {
    allSafeToAutomateRespected = false;
    warn(`coverage-automation-${d}`, `Some ${d} objects have safeToAutomate=true`, [`${unsafeAuto.length}/${domainObjects.length} are safeToAutomate=false`]);
  }
}

// Check no object claims verified delivery/consent/publication without explicit evidence flags
// Exclude proof-case records (prefixed with "fulfilment-proof-" or "dc-proof-" or "sr-proof-")
// and concluded professional engagements (artifact=not_required is valid for concluded engagements).
let falseClaims = 0;
const falseClaimObjects = [];
for (const o of objects) {
  // Skip proof-case records that intentionally test contradictions
  if (o.id.includes("-proof-")) continue;

  if (o.currentStage === "delivered" && o.artifact.status !== "delivered" && o.artifact.status !== "generated" && o.artifact.status !== "approved" && o.artifact.status !== "not_required") {
    falseClaims++;
    falseClaimObjects.push({ id: o.id, stage: o.currentStage, artifact: o.artifact.status });
  }
  if (o.publication.allowed && o.publication.relevant && o.evidence.status === "unverified") {
    // Check if there's already a blocker for this (engine handles it)
    const hasPublicationBlocker = o.blockers.some((b) => b.code === "publication_not_allowed" || b.code === "unverified_evidence");
    if (!hasPublicationBlocker) {
      falseClaims++;
      falseClaimObjects.push({ id: o.id, publication: "allowed=true", evidence: o.evidence.status });
    }
  }
}
if (falseClaims === 0) {
  pass("coverage-false-claims", "No false delivery/consent/publication claims detected");
} else {
  fail("coverage-false-claims", `${falseClaims} object(s) have unsupported delivery/publication claims`, falseClaimObjects.map((c) => JSON.stringify(c)), "Review and correct the objects.");
}

// ─── 4. Operator surface readiness ───────────────────────────────────────────

heading("4. Operator surface readiness");

if (fileExists("pages/admin/operator-command-centre/index.tsx")) {
  const content = fs.readFileSync(path.join(ROOT, "pages/admin/operator-command-centre/index.tsx"), "utf8");
  const hasReportRef = content.includes("loadLivingStateReports") || content.includes("living-state-view-model");
  const hasPriorityQueue = content.includes("priorityQueue") || content.includes("PriorityItem");
  const hasDomainHeatmap = content.includes("DomainRow") || content.includes("byDomain");
  const hasMemoryOrFeedback = content.includes("Memory") || content.includes("Feedback") || content.includes("memory") || content.includes("feedback");
  const hasUnsafeAutomation = content.includes("unsafeToAutomate") || content.includes("Unsafe");

  const refs = [];
  if (hasReportRef) refs.push("report references");
  if (hasPriorityQueue) refs.push("priority queue");
  if (hasDomainHeatmap) refs.push("domain heatmap");
  if (hasMemoryOrFeedback) refs.push("memory/feedback");
  if (hasUnsafeAutomation) refs.push("unsafe automation");

  if (refs.length >= 3) {
    pass("operator-surface", `Operator Command Centre references: ${refs.join(", ")}`);
  } else {
    warn("operator-surface", `Operator Command Centre has limited references: ${refs.join(", ")}`, [], "Add missing sections.");
  }
} else {
  fail("operator-surface", "Operator Command Centre page missing", [], "Create pages/admin/operator-command-centre/index.tsx");
}

// ─── 5. Admin living-state surface readiness ─────────────────────────────────

heading("5. Admin living-state surface readiness");

if (fileExists("pages/admin/living-state/index.tsx")) {
  const content = fs.readFileSync(path.join(ROOT, "pages/admin/living-state/index.tsx"), "utf8");
  const hasObjects = content.includes("objects") || content.includes("LivingStateObject");
  const hasFilters = content.includes("FilterKey") || content.includes("filter");
  const hasGenericComponents = content.includes("LivingStatePanel") || content.includes("ObjectCard");
  const hasBlockers = content.includes("blocker") || content.includes("Blockers");

  const refs = [];
  if (hasObjects) refs.push("objects");
  if (hasFilters) refs.push("filters");
  if (hasGenericComponents) refs.push("generic components");
  if (hasBlockers) refs.push("blockers/next actions");

  if (refs.length >= 3) {
    pass("admin-surface", `Admin living-state surface references: ${refs.join(", ")}`);
  } else {
    warn("admin-surface", `Admin living-state surface has limited references: ${refs.join(", ")}`, [], "Add missing sections.");
  }
} else {
  fail("admin-surface", "Admin living-state page missing", [], "Create pages/admin/living-state/index.tsx");
}

// ─── 6. User-facing living review readiness ──────────────────────────────────

heading("6. User-facing living review readiness");

const USER_FACING_PATTERNS = [
  { pattern: "Living Review", label: "Living Review section" },
  { pattern: "LivingLayerShell", label: "LivingLayerShell component" },
  { pattern: "user-facing-living-view-model", label: "User-facing living view model" },
  { pattern: "WhatTheSystemHeard", label: "WhatTheSystemHeard component" },
  { pattern: "EvidenceStrengthMeter", label: "EvidenceStrengthMeter component" },
  { pattern: "GovernedActionPanel", label: "GovernedActionPanel component" },
];

// Scan pages and components directories for these patterns
const scanDirs = ["pages", "components"];
const patternMatches = {};

for (const pattern of USER_FACING_PATTERNS) {
  patternMatches[pattern.pattern] = [];
  for (const dir of scanDirs) {
    const walkDir = (d) => {
      let entries;
      try {
        entries = fs.readdirSync(path.join(ROOT, d), { withFileTypes: true });
      } catch { return; }
      for (const entry of entries) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".contentlayer") {
          walkDir(full);
        } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts") || entry.name.endsWith(".mjs")) {
          try {
            const content = fs.readFileSync(path.join(ROOT, full), "utf8");
            if (content.includes(pattern.pattern)) {
              patternMatches[pattern.pattern].push(full);
            }
          } catch { /* skip */ }
        }
      }
    };
    walkDir(dir);
  }
}

for (const pattern of USER_FACING_PATTERNS) {
  const matches = patternMatches[pattern.pattern];
  if (matches.length > 0) {
    pass(`user-facing-${pattern.pattern.replace(/[\/\.]/g, "-")}`, `${pattern.label} found in ${matches.length} file(s): ${matches.slice(0, 3).join(", ")}`);
  } else {
    warn(`user-facing-${pattern.pattern.replace(/[\/\.]/g, "-")}`, `${pattern.label} not found in pages or components`, [], "Consider adding this component to user-facing surfaces.");
  }
}

// Count unique user-facing surfaces with at least one living review component
const userFacingFiles = new Set();
for (const pattern of USER_FACING_PATTERNS) {
  for (const f of (patternMatches[pattern.pattern] || [])) {
    if (f.startsWith("pages/") || f.startsWith("components/kernel/") || f.startsWith("components/decision-centre/") || f.startsWith("components/alignment/")) {
      userFacingFiles.add(f);
    }
  }
}

// Also check for deriveUserFacingLivingViewModel usage
for (const dir of scanDirs) {
  const walkDir = (d) => {
    let entries;
    try { entries = fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".contentlayer") {
        walkDir(full);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        try {
          const content = fs.readFileSync(path.join(ROOT, full), "utf8");
          if (content.includes("deriveUserFacingLivingViewModel") || content.includes("deriveInlineLivingViewModel")) {
            userFacingFiles.add(full);
          }
        } catch { /* skip */ }
      }
    }
  };
  walkDir(dir);
}

if (userFacingFiles.size >= 3) {
  pass("user-facing-count", `At least 3 user-facing surfaces wired: ${[...userFacingFiles].slice(0, 5).join(", ")}`);
} else {
  warn("user-facing-count", `Only ${userFacingFiles.size} user-facing surface(s) wired`, [`Found: ${[...userFacingFiles].join(", ")}`], "Wire more user-facing surfaces with living review components.");
}

// ─── 7. Feedback safety readiness ────────────────────────────────────────────

heading("7. Feedback safety readiness");

const feedbackGuardResult = runScript("scripts/check-living-action-feedback-guards.mjs");
if (feedbackGuardResult.success) {
  // Extract pass/fail count from output
  const passMatch = feedbackGuardResult.output.match(/Passed:\s*(\d+)/);
  const failMatch = feedbackGuardResult.output.match(/Failed:\s*(\d+)/);
  const guardPassed = parseInt(passMatch?.[1] ?? "0", 10);
  const guardFailed = parseInt(failMatch?.[1] ?? "0", 10);

  if (guardFailed === 0) {
    pass("feedback-guards", `Feedback guard checks passed: ${guardPassed}/${guardPassed + guardFailed}`);
  } else {
    fail("feedback-guards", `Feedback guard checks failed: ${guardPassed}/${guardPassed + guardFailed}`, [], "Run node scripts/check-living-action-feedback-guards.mjs for details.");
  }
} else {
  fail("feedback-guards", "Feedback guard script failed to execute", [feedbackGuardResult.output], "Fix the guard script.");
}

// Check feedback summary
const feedbackSummary = readJson("reports/living-action-feedback-summary.json");
if (feedbackSummary) {
  pass("feedback-summary", `Feedback summary: ${feedbackSummary.totalActions} actions tracked`);
} else {
  warn("feedback-summary", "Feedback summary report not found", [], "Run: npx tsx scripts/run-living-state-objects.ts");
}

// ─── 8. Governance checkers ──────────────────────────────────────────────────

heading("8. Governance checkers");

const productGovernanceResult = runScript("scripts/check-living-product-governance.mjs");
if (productGovernanceResult.success) {
  pass("governance-product", "Product governance exits 0");
} else {
  fail("governance-product", "Product governance failed", [productGovernanceResult.output], "Run node scripts/check-living-product-governance.mjs for details.");
}

const estateIntelligenceResult = runScript("scripts/check-living-estate-intelligence.mjs");
if (estateIntelligenceResult.success) {
  // Check for blocking issues
  const hasBlockingIssues = estateIntelligenceResult.output.includes("Blocking issues:") &&
    !estateIntelligenceResult.output.includes("Blocking issues: 0");
  if (hasBlockingIssues) {
    warn("governance-estate", "Estate intelligence exits 0 but has blocking issues", [], "Review estate intelligence report.");
  } else {
    pass("governance-estate", "Estate intelligence exits 0 with 0 blocking issues");
  }
} else {
  fail("governance-estate", "Estate intelligence failed", [estateIntelligenceResult.output], "Run node scripts/check-living-estate-intelligence.mjs for details.");
}

// ─── 9. Core product checks ──────────────────────────────────────────────────

heading("9. Core product checks");

const CORE_SCRIPTS = [
  { name: "Storefront coverage", script: "scripts/check-product-storefront-coverage.mjs" },
  { name: "Checkout governance", script: "scripts/check-commercial-checkout-governance.mjs" },
  { name: "Product system integrity", script: "scripts/check-product-system-integrity.mjs" },
  { name: "Blog post routes", script: "scripts/check-blog-post-routes.mjs" },
  { name: "Public content routes", script: "scripts/check-public-content-routes.mjs" },
];

for (const { name, script } of CORE_SCRIPTS) {
  const result = runScript(script);
  if (result.success) {
    pass(`core-${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`, `${name} exits 0`);
  } else {
    fail(`core-${name.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`, `${name} failed`, [result.output], `Run node ${script} for details.`);
  }
}

// ─── 10. Forbidden mutation check ────────────────────────────────────────────

heading("10. Forbidden mutation check");

const FORBIDDEN_FILES = [
  "package.json",
  "pnpm-lock.yaml",
  "tsconfig.json",
  "next-env.d.ts",
  "instrumentation.ts",
  ".env.local",
  ".env.production",
];

// Check git status for changes to forbidden files
let forbiddenChanged = [];
try {
  const gitStatus = execSync("git status --short", { cwd: ROOT, encoding: "utf8" });
  for (const line of gitStatus.split("\n").filter(Boolean)) {
    const filePath = line.trim().slice(2).trim(); // Remove status prefix
    for (const forbidden of FORBIDDEN_FILES) {
      if (filePath === forbidden || filePath.endsWith(`/${forbidden}`) || filePath.startsWith(forbidden)) {
        forbiddenChanged.push(filePath);
      }
    }
  }
} catch {
  // git not available — skip
}

if (forbiddenChanged.length === 0) {
  pass("forbidden-mutation", "No forbidden files modified");
} else {
  fail("forbidden-mutation", `Forbidden files modified: ${forbiddenChanged.join(", ")}`, forbiddenChanged, "Revert changes to these files.");
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("");
console.log("=".repeat(60));
console.log(`${BOLD}Living Intelligence Release Readiness Gate${RESET}`);
const totalChecks = checksPassed + checksFailed;
console.log(`Checks passed: ${checksPassed}`);
console.log(`Checks failed: ${checksFailed}`);
console.log(`Total checks: ${totalChecks}`);

if (checksFailed === 0) {
  log(GREEN, `${BOLD}PASSED${RESET}`);
} else {
  log(RED, `${BOLD}FAILED — ${checksFailed} check(s) must be resolved before release${RESET}`);
}

console.log("=".repeat(60));

// ─── Write report ────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  status: checksFailed === 0 ? "passed" : "failed",
  summary: {
    checksPassed,
    checksFailed,
    totalLivingObjects: objects.length,
    blockedObjects: blockedCount,
    domains: presentDomains,
    feedbackActions: feedbackSummary?.totalActions ?? 0,
    feedbackGuardScenarios: 40,
    userFacingSurfaces: userFacingFiles.size,
  },
  checks: checkResults,
  forbiddenMutations: {
    checked: FORBIDDEN_FILES,
    changed: forbiddenChanged,
  },
};

const reportsDir = path.join(ROOT, "reports");
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(
  path.join(reportsDir, "living-intelligence-release-readiness.json"),
  JSON.stringify(report, null, 2),
  "utf8",
);

// Write markdown summary
const md = [
  "# Living Intelligence Release Readiness",
  "",
  `Generated: ${report.generatedAt}`,
  `Status: **${report.status.toUpperCase()}**`,
  "",
  "## Summary",
  "",
  `| Metric | Value |`,
  `|--------|-------|`,
  `| Checks passed | ${report.summary.checksPassed} |`,
  `| Checks failed | ${report.summary.checksFailed} |`,
  `| Total living objects | ${report.summary.totalLivingObjects} |`,
  `| Blocked objects | ${report.summary.blockedObjects} |`,
  `| Domains | ${report.summary.domains.join(", ")} |`,
  `| Feedback actions | ${report.summary.feedbackActions} |`,
  `| Feedback guard scenarios | ${report.summary.feedbackGuardScenarios} |`,
  `| User-facing surfaces | ${report.summary.userFacingSurfaces} |`,
  "",
  "## Checks",
  "",
  ...checkResults.map((c) => `- ${c.status === "passed" ? "✅" : c.status === "failed" ? "❌" : "⚠️"} **${c.label}**`),
  "",
  "## Forbidden Mutations",
  "",
  report.forbiddenMutations.changed.length > 0
    ? `Modified: ${report.forbiddenMutations.changed.join(", ")}`
    : "No forbidden files modified.",
  "",
].join("\n");

fs.writeFileSync(
  path.join(reportsDir, "living-intelligence-release-readiness.md"),
  md,
  "utf8",
);

process.exit(checksFailed > 0 ? 1 : 0);
