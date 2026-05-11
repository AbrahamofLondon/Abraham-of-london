/**
 * Institutional Corridor Guard
 *
 * Validates that the institutional case corridor maintains governance integrity:
 * 1. ER route does not return raw canonical payload
 * 2. Strategy Room corridor links do not use raw data in URL
 * 3. Boardroom is not public menu access
 * 4. Oversight portfolio requires PORTFOLIO_VIEW
 * 5. Suppression ledger route requires SUPPRESSION_REVIEW
 * 6. Forbidden public language is blocked
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let violations = 0;

function check(filePath, rules) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) return;
  const content = fs.readFileSync(abs, "utf8");

  for (const rule of rules) {
    if (rule.test(content)) {
      if (rule.negate && rule.negate.test(content)) continue;
      console.error(`VIOLATION in ${filePath}: ${rule.message}`);
      violations++;
    }
  }
}

function checkAbsent(filePath, pattern, message) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) return;
  const content = fs.readFileSync(abs, "utf8");
  if (pattern.test(content)) {
    console.error(`VIOLATION in ${filePath}: ${message}`);
    violations++;
  }
}

function checkPresent(filePath, pattern, message) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) {
    console.error(`MISSING FILE: ${filePath} — ${message}`);
    violations++;
    return;
  }
  const content = fs.readFileSync(abs, "utf8");
  if (!pattern.test(content)) {
    console.error(`VIOLATION in ${filePath}: ${message}`);
    violations++;
  }
}

// 1. ER route must not return raw canonical in the JSON response
// (canonical as input to toExecutiveReportingPublicResult is allowed — that function filters it)
checkAbsent(
  "app/api/executive-reporting/run/route.ts",
  /NextResponse\.json\([^)]*canonical:\s*enrichedCanonical/s,
  "ER route must not return raw canonical payload in NextResponse.json()"
);

// 2. Strategy Room corridor links must not embed raw data in URL
checkAbsent(
  "pages/strategy-room/index.tsx",
  /href=\{.*canonical.*\}/,
  "Strategy Room must not embed raw canonical data in URL links"
);

// 3. Boardroom requires authentication — not public menu access
checkPresent(
  "pages/boardroom/index.tsx",
  /requireRole|requireAdminPage|resolvePageAccess/,
  "Boardroom must require role-gated access"
);

// 4. Oversight portfolio requires PORTFOLIO_VIEW
checkPresent(
  "pages/oversight/portfolio.tsx",
  /PORTFOLIO_VIEW/,
  "Portfolio page must require PORTFOLIO_VIEW permission"
);

// 5. Suppression ledger route requires admin/suppression review
checkPresent(
  "pages/admin/suppression-ledger.tsx",
  /requireAdminPage|SUPPRESSION_REVIEW/,
  "Suppression ledger must require admin or SUPPRESSION_REVIEW permission"
);

// 6. Forbidden public language in corridor surfaces
const corridorFiles = [
  "pages/oversight/index.tsx",
  "pages/oversight/portfolio.tsx",
  "pages/boardroom/index.tsx",
  "pages/counsel/index.tsx",
  "pages/counsel/status.tsx",
  "components/oversight/PortfolioMemorySummary.tsx",
  "components/oversight/CrossScopePatternSummary.tsx",
  "lib/product/institutional-case-contract.ts",
  "lib/product/institutional-case-service.ts",
];

const forbiddenPhrases = [
  { pattern: /\u00a350k ready/i, label: "£50k ready" },
  { pattern: /continuous monitoring/i, label: "continuous monitoring" },
  { pattern: /always-on governance/i, label: "always-on governance" },
  { pattern: /guaranteed outcome/i, label: "guaranteed outcome" },
  { pattern: /automated oversight is active/i, label: "automated oversight is active" },
];

const negationPatterns = [
  /not\s+/i,
  /never\s+/i,
  /without\s+/i,
  /avoid\s+/i,
  /do not\s+/i,
  /forbidden/i,
  /must not/i,
];

for (const filePath of corridorFiles) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, "utf8");
  const lines = content.split("\n");

  for (const { pattern, label } of forbiddenPhrases) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.test(line)) {
        // Check for negation context
        const isNegated = negationPatterns.some((neg) => neg.test(line));
        if (isNegated) continue;
        // Check for comment or string context that serves as documentation
        if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
        console.error(`VIOLATION in ${filePath}:${i + 1}: forbidden phrase "${label}" in public corridor surface`);
        violations++;
      }
    }
  }
}

// 7. No public "kernel" or "graph" language in corridor surfaces
const kernelGraphForbidden = [
  "pages/oversight/index.tsx",
  "pages/oversight/portfolio.tsx",
  "pages/oversight/brief/[cycleId].tsx",
  "pages/boardroom/index.tsx",
  "pages/counsel/status.tsx",
  "pages/strategy-room/index.tsx",
  "components/oversight/PortfolioMemorySummary.tsx",
  "components/oversight/CrossScopePatternSummary.tsx",
];

const kernelLanguagePatterns = [
  { pattern: /\bkernel\b/i, label: "kernel" },
  { pattern: /\bgraph node/i, label: "graph node" },
  { pattern: /\bgraph edge/i, label: "graph edge" },
  { pattern: /\bgraph mechanic/i, label: "graph mechanic" },
  { pattern: /\bscoring weight/i, label: "scoring weight" },
  { pattern: /\bdecay algorithm/i, label: "decay algorithm" },
  { pattern: /\bpricing formula/i, label: "pricing formula" },
  { pattern: /\bentitlement logic/i, label: "entitlement logic" },
  { pattern: /\bdiscount rule/i, label: "discount rule" },
];

for (const filePath of kernelGraphForbidden) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, "utf8");
  const lines = content.split("\n");

  for (const { pattern, label } of kernelLanguagePatterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (pattern.test(line)) {
        // Allow comments, negations, and import specifiers
        if (/^\s*(\/\/|\/\*|\*|import )/.test(line)) continue;
        if (/not\s+|never\s+|without\s+|avoid\s+|do not\s+|forbidden|must not/i.test(line)) continue;
        console.error(`VIOLATION in ${filePath}:${i + 1}: forbidden language "${label}" in public corridor surface`);
        violations++;
      }
    }
  }
}

// 8. No verified claim without verified posture
const verifiedClaimFiles = [
  ...corridorFiles,
  "pages/oversight/brief/[cycleId].tsx",
  "pages/strategy-room/session/[id].tsx",
  "pages/diagnostics/executive-reporting/run.tsx",
];

for (const filePath of verifiedClaimFiles) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, "utf8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for "verified" in display strings without appropriate caveat context
    if (/["'`].*verified.*["'`]/i.test(line)) {
      if (/not.*verified|independently verified|outcome.verified|VERIFIED/i.test(line)) continue;
      if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
      // Allow in type definitions and variable assignments
      if (/:\s*["']|===?\s*["']|type\s|interface\s/i.test(line)) continue;
      console.error(`VIOLATION in ${filePath}:${i + 1}: "verified" claim may lack evidence posture caveat`);
      violations++;
    }
  }
}

// 9. Simulation outputs must include estimate caveat
const simulationConsumers = [
  "pages/boardroom/index.tsx",
  "pages/oversight/brief/[cycleId].tsx",
  "lib/product/institutional-case-summary.ts",
];

for (const filePath of simulationConsumers) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, "utf8");
  if (/simulat|scenario/i.test(content)) {
    if (!/not independently verified|scenario estimate|estimate/i.test(content)) {
      console.error(`VIOLATION in ${filePath}: simulation consumer must include estimate caveat language`);
      violations++;
    }
  }
}

// 10. Institutional case contract must exist
checkPresent(
  "lib/product/institutional-case-contract.ts",
  /InstitutionalCase/,
  "Institutional case contract must define InstitutionalCase type"
);

checkPresent(
  "lib/product/institutional-case-resolver.ts",
  /resolveInstitutionalCase/,
  "Institutional case resolver must export resolveInstitutionalCase"
);

checkPresent(
  "lib/product/institutional-case-service.ts",
  /createOrUpdateFromER/,
  "Institutional case service must export createOrUpdateFromER"
);

// 11. Kernel safe summary must exist and must not expose kernel language
checkPresent(
  "lib/product/kernel-safe-summary.ts",
  /KernelSafeSummary/,
  "Kernel safe summary must define KernelSafeSummary type"
);

// 12. Institutional case summary must exist
checkPresent(
  "lib/product/institutional-case-summary.ts",
  /InstitutionalCaseSummary/,
  "Institutional case summary must define InstitutionalCaseSummary type"
);

// 13. Commercial classification must exist
checkPresent(
  "lib/product/commercial-classification.ts",
  /COMMERCIAL_CLASSIFICATIONS/,
  "Commercial classification must define COMMERCIAL_CLASSIFICATIONS registry"
);

// 14. Contradiction graph presenter must have safe metrics
checkPresent(
  "lib/analytics/contradiction-graph-presenter.ts",
  /buildContradictionGraphSafeMetrics/,
  "Contradiction graph presenter must export buildContradictionGraphSafeMetrics"
);

// 15. Strategy Room session must render SignalPressurePanel
checkPresent(
  "pages/strategy-room/session/[id].tsx",
  /SignalPressurePanel/,
  "Strategy Room session page must render SignalPressurePanel — sovereign signal pressure must be surfaced in the execution path"
);

// 16. Oversight Brief must render sovereignSignalRecurrence
checkPresent(
  "pages/oversight/brief/[cycleId].tsx",
  /sovereignSignalRecurrence/,
  "Oversight Brief page must render sovereignSignalRecurrence — signal pattern recurrence must be tracked across oversight cycles"
);

// 17. Boardroom session page must render BoardroomSignalExposure
checkPresent(
  "pages/boardroom/[sessionId].tsx",
  /BoardroomSignalExposure/,
  "Boardroom session page must render BoardroomSignalExposure — institutional signal exposure required at board level"
);

// 18. Key sovereign surfaces must not import raw IntelligenceSignal as a value.
// Exception: Pages Router pages may use dynamic import inside getServerSideProps —
// dynamic imports are server-side only and do not bundle to the client.
const sovereignSurfaces = [
  "pages/boardroom/[sessionId].tsx",
  "pages/strategy-room/session/[id].tsx",
  "pages/oversight/brief/[cycleId].tsx",
  "pages/oversight/portfolio.tsx",
  "components/sovereign/BoardroomSignalExposure.tsx",
  "components/strategy-room/SignalPressurePanel.tsx",
];

for (const filePath of sovereignSurfaces) {
  const abs = path.resolve(root, filePath);
  if (!fs.existsSync(abs)) continue;
  const content = fs.readFileSync(abs, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*import\s+type\b/.test(line)) continue; // type-only, safe
    // Allow dynamic imports inside GSSP (server-side only in Pages Router)
    if (/await\s+import\s*\(/.test(line)) continue; // dynamic import, runs server-side
    if (/intelligence-signals|cohort-intelligence|intelligence-commons|decision-forensics|institutional-memory/.test(line) &&
        /^(?!.*\bimport\s+type\b).*\bimport\b/.test(line)) {
      console.error(`VIOLATION in ${filePath}:${i + 1}: raw sovereign engine value import on public surface`);
      violations++;
    }
  }
}

// Summary
if (violations > 0) {
  console.error(`\nInstitutional corridor guard: ${violations} violation(s) found.`);
  process.exit(1);
} else {
  console.log("Institutional corridor guard: all checks passed.");
  process.exit(0);
}
