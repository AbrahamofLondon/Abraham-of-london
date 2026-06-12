/**
 * scripts/check-report-experience-gold-standard.mjs
 *
 * Pass B — Report Experience Gold Standard Gate
 *
 * Verifies that every paid/boardroom/executive/retainer report output in the registry:
 *   - Has a premium or institutional visual standard
 *   - Has arrival experience implemented
 *   - Has customer access route defined
 *   - Has admin preview route defined
 *   - Has required forensic, provenance, and evidence flags set per tier
 *   - Has no unsafe paid output (paid tier without customer access)
 *   - Has PDF generation route defined for non-web-only outputs
 *   - Static P0 PDFs (boardroom/executive/retainer with pdf or both) are classified
 *   - No product labelled scale-ready on structural proof alone (live-cycle pending warning)
 *
 * Gate will NOT go GREEN if any hard failure is found.
 * Gate will stay AMBER if live-cycle evidence is absent.
 */

import { createRequire } from "module";
import { pathToFileURL } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const TSCONFIG = path.join(PROJECT_ROOT, "tsconfig.json");

// Use tsx to import TypeScript module
const { execSync } = await import("child_process");

let registry;
try {
  const registryScript = `
    import { REPORT_OUTPUT_REGISTRY } from '../lib/reporting/report-output-registry.ts';
    process.stdout.write(JSON.stringify(REPORT_OUTPUT_REGISTRY));
  `;
  const tmpFile = path.join(PROJECT_ROOT, "scripts", "_tmp_registry_dump.mjs");
  fs.writeFileSync(tmpFile, registryScript);
  try {
    const result = execSync(`npx tsx --tsconfig "${TSCONFIG}" "${tmpFile}"`, {
      cwd: PROJECT_ROOT,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    registry = JSON.parse(result);
  } finally {
    fs.unlinkSync(tmpFile);
  }
} catch (err) {
  console.error("Failed to load REPORT_OUTPUT_REGISTRY:", err.message);
  process.exit(1);
}

// ─── Gate Definitions ─────────────────────────────────────────────────────────

const PAID_TIERS = new Set(["paid", "boardroom", "executive", "retainer"]);
const PREMIUM_VISUAL_TIERS = new Set(["boardroom", "executive", "retainer"]);
const P0_PDF_TIERS = new Set(["boardroom", "executive", "retainer"]);

const results = {
  passed: [],
  warnings: [],
  hardFailures: [],
};

// Track P0 PDFs for static classification audit
const p0PdfProducts = [];

for (const entry of registry) {
  const code = entry.reportCode;
  const tier = entry.reportStandardTier;
  const isPaid = PAID_TIERS.has(tier);

  // AC1 — Paid tier must have customerAccessRoute defined and non-empty
  if (isPaid) {
    if (!entry.customerAccessRoute || entry.customerAccessRoute === "/account") {
      results.hardFailures.push({
        reportCode: code,
        ac: "AC1",
        message: `Paid-tier report has no specific customerAccessRoute (got: ${entry.customerAccessRoute ?? "undefined"})`,
      });
    } else {
      results.passed.push({ reportCode: code, ac: "AC1", message: "customerAccessRoute defined" });
    }
  }

  // AC2 — Paid tier must have adminPreviewRoute defined
  if (isPaid) {
    if (!entry.adminPreviewRoute || entry.adminPreviewRoute === "/admin/fulfilment") {
      results.warnings.push({
        reportCode: code,
        ac: "AC2",
        message: `Paid-tier report uses generic adminPreviewRoute (${entry.adminPreviewRoute}) — should have specific admin view`,
      });
    } else {
      results.passed.push({ reportCode: code, ac: "AC2", message: "adminPreviewRoute specific" });
    }
  }

  // AC3 — Visual standard must be premium or higher for premium tiers
  if (PREMIUM_VISUAL_TIERS.has(tier)) {
    const vs = entry.standard?.visualStandard;
    if (!["premium", "institutional", "boardroom-grade"].includes(vs)) {
      results.hardFailures.push({
        reportCode: code,
        ac: "AC3",
        message: `Premium tier (${tier}) has insufficient visualStandard: ${vs}`,
      });
    } else {
      results.passed.push({ reportCode: code, ac: "AC3", message: `visualStandard: ${vs}` });
    }
  }

  // AC4 — Arrival experience must be implemented for paid tiers
  if (isPaid && !entry.arrivalImplemented) {
    results.hardFailures.push({
      reportCode: code,
      ac: "AC4",
      message: `Paid-tier report has arrivalImplemented: false`,
    });
  } else if (isPaid) {
    results.passed.push({ reportCode: code, ac: "AC4", message: `arrival implemented (variant: ${entry.arrivalVariant})` });
  }

  // AC5 — Boardroom/executive/retainer must require forensic layer
  if (["boardroom", "executive", "retainer"].includes(tier)) {
    if (!entry.standard?.requiresForensicLayer) {
      results.hardFailures.push({
        reportCode: code,
        ac: "AC5",
        message: `${tier} tier report missing requiresForensicLayer`,
      });
    } else {
      results.passed.push({ reportCode: code, ac: "AC5", message: "requiresForensicLayer: true" });
    }
  }

  // AC6 — Boardroom must require provenance hash and falsification section
  if (tier === "boardroom") {
    if (!entry.standard?.requiresProvenanceHash) {
      results.hardFailures.push({
        reportCode: code,
        ac: "AC6a",
        message: `boardroom tier missing requiresProvenanceHash`,
      });
    }
    if (!entry.standard?.requiresFalsificationSection) {
      results.hardFailures.push({
        reportCode: code,
        ac: "AC6b",
        message: `boardroom tier missing requiresFalsificationSection`,
      });
    }
    if (entry.standard?.requiresProvenanceHash && entry.standard?.requiresFalsificationSection) {
      results.passed.push({ reportCode: code, ac: "AC6", message: "provenance hash + falsification section required" });
    }
  }

  // AC7 — PDF generation route must be defined for non-web-only outputs
  if (entry.outputType !== "web" && (!entry.pdfGenerationRoute || entry.pdfGenerationRoute === "")) {
    results.hardFailures.push({
      reportCode: code,
      ac: "AC7",
      message: `Non-web output (${entry.outputType}) missing pdfGenerationRoute`,
    });
  } else if (entry.outputType !== "web") {
    results.passed.push({ reportCode: code, ac: "AC7", message: `pdfGenerationRoute: ${entry.pdfGenerationRoute}` });
  }

  // AC8 — Static P0 PDFs: boardroom/executive/retainer with pdf or both output must be tracked
  if (P0_PDF_TIERS.has(tier) && ["pdf", "both"].includes(entry.outputType)) {
    p0PdfProducts.push({
      reportCode: code,
      productCode: entry.productCode,
      tier,
      pdfGenerationRoute: entry.pdfGenerationRoute,
      adminPreviewRoute: entry.adminPreviewRoute,
    });
    results.passed.push({ reportCode: code, ac: "AC8", message: `P0 PDF classified: tier=${tier}, route=${entry.pdfGenerationRoute}` });
  }

  // AC9 — No unsafe paid output: paid tier without requiresCustomerAccess
  if (isPaid && !entry.standard?.requiresCustomerAccess) {
    results.hardFailures.push({
      reportCode: code,
      ac: "AC9",
      message: `Paid tier (${tier}) has requiresCustomerAccess: false — unsafe paid output`,
    });
  } else if (isPaid) {
    results.passed.push({ reportCode: code, ac: "AC9", message: "requiresCustomerAccess: true" });
  }

  // AC10 — Evidence basis required for all paid tiers
  if (isPaid && !entry.standard?.requiresEvidenceBasis) {
    results.hardFailures.push({
      reportCode: code,
      ac: "AC10",
      message: `Paid tier missing requiresEvidenceBasis`,
    });
  } else if (isPaid) {
    results.passed.push({ reportCode: code, ac: "AC10", message: "requiresEvidenceBasis: true" });
  }

  // AC11 — Forwardability and citability for paid tiers
  if (isPaid) {
    const fwd = entry.standard?.requiresForwardability;
    const cit = entry.standard?.requiresCitability;
    if (!fwd || !cit) {
      results.warnings.push({
        reportCode: code,
        ac: "AC11",
        message: `Paid-tier report missing forwardability (${fwd}) or citability (${cit})`,
      });
    } else {
      results.passed.push({ reportCode: code, ac: "AC11", message: "forwardability + citability: true" });
    }
  }
}

// AC12 — Live-cycle evidence gate: all 8 proof-ready products still have pending live-cycle
// This is a standing AMBER gate until operator confirms live transactions
const PROOF_READY_PRODUCTS = [
  "boardroom_brief", "strategy_room", "strategy_room_extended",
  "professional", "professional_annual", "executive_reporting",
  "operator_decision_pack", "gmi_q1_2026",
];

results.warnings.push({
  reportCode: "ALL_PROOF_READY",
  ac: "AC12",
  message: `Live-cycle evidence pending for ${PROOF_READY_PRODUCTS.length} products. Gate cannot go GREEN until at least one end-to-end transaction is confirmed per delivery class. See reports/product-live-proof-closeout.md.`,
});

// AC13 — Stripe webhook authority unconfirmed
results.warnings.push({
  reportCode: "SYSTEM",
  ac: "AC13",
  message: "Stripe webhook authority unconfirmed — operator must confirm /api/billing/webhook is the registered endpoint before live sales.",
});

// ─── Output ────────────────────────────────────────────────────────────────────

const totalEntries = registry.length;
const passCount = results.passed.length;
const warnCount = results.warnings.length;
const failCount = results.hardFailures.length;

console.log("\n╔═══════════════════════════════════════════════════════════════╗");
console.log("║        REPORT EXPERIENCE GOLD STANDARD GATE — PASS B         ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");
console.log(`Registry entries:  ${totalEntries}`);
console.log(`Checks passed:     ${passCount}`);
console.log(`Warnings:          ${warnCount}`);
console.log(`Hard failures:     ${failCount}`);
console.log(`P0 PDFs tracked:   ${p0PdfProducts.length}`);

if (results.hardFailures.length > 0) {
  console.log("\n── HARD FAILURES ─────────────────────────────────────────────────");
  for (const f of results.hardFailures) {
    console.log(`  ❌ [${f.ac}] ${f.reportCode}: ${f.message}`);
  }
}

if (results.warnings.length > 0) {
  console.log("\n── WARNINGS ──────────────────────────────────────────────────────");
  for (const w of results.warnings) {
    console.log(`  ⚠️  [${w.ac}] ${w.reportCode}: ${w.message}`);
  }
}

if (p0PdfProducts.length > 0) {
  console.log("\n── P0 PDF CLASSIFICATION ─────────────────────────────────────────");
  for (const p of p0PdfProducts) {
    console.log(`  📄 ${p.reportCode} (${p.tier}) — ${p.pdfGenerationRoute}`);
  }
}

const gateStatus = failCount > 0 ? "FAILED" : warnCount > 0 ? "AMBER" : "GREEN";

console.log(`\n── GATE STATUS: ${gateStatus} ──`);
if (gateStatus === "AMBER") {
  console.log("   Structural quality checks passed.");
  console.log("   Gate is AMBER pending: live-cycle evidence + Stripe webhook confirmation.");
}
if (gateStatus === "FAILED") {
  console.log("   Hard failures must be resolved before gate can pass.");
}

// Write reports
const reportMd = `# Report Experience Gold Standard — Gate Report
**Date:** 2026-06-12
**Gate Status:** ${gateStatus}

## Summary
- Registry entries evaluated: ${totalEntries}
- Quality checks passed: ${passCount}
- Warnings: ${warnCount}
- Hard failures: ${failCount}
- P0 PDFs tracked: ${p0PdfProducts.length}

## Gate Status: ${gateStatus}

${failCount > 0 ? `## Hard Failures\n${results.hardFailures.map(f => `- [${f.ac}] **${f.reportCode}**: ${f.message}`).join("\n")}\n` : ""}
${warnCount > 0 ? `## Warnings\n${results.warnings.map(w => `- [${w.ac}] **${w.reportCode}**: ${w.message}`).join("\n")}\n` : ""}

## P0 PDF Classification (Static Assets Requiring Admin Preview Safety)

| Report Code | Product | Tier | PDF Generation Route |
|---|---|---|---|
${p0PdfProducts.map(p => `| ${p.reportCode} | ${p.productCode} | ${p.tier} | ${p.pdfGenerationRoute} |`).join("\n")}

## Acceptance Criteria Definitions
- **AC1**: Paid-tier reports must have specific customerAccessRoute
- **AC2**: Paid-tier reports must have specific adminPreviewRoute (not generic /admin/fulfilment)
- **AC3**: Premium tiers (boardroom/executive/retainer) must have premium/institutional/boardroom-grade visual standard
- **AC4**: Paid-tier reports must have arrival experience implemented
- **AC5**: Boardroom/executive/retainer must require forensic layer
- **AC6**: Boardroom tier must require provenance hash and falsification section
- **AC7**: Non-web outputs must have pdfGenerationRoute
- **AC8**: P0 PDF classification — boardroom/executive/retainer pdf outputs tracked
- **AC9**: No unsafe paid output — paid tier requires requiresCustomerAccess: true
- **AC10**: Paid tiers require evidence basis
- **AC11**: Paid tiers require forwardability and citability
- **AC12**: Live-cycle evidence required before GREEN (AMBER until confirmed)
- **AC13**: Stripe webhook authority confirmation required before GREEN

## Green Criteria
This gate will move from AMBER to GREEN when:
1. Stripe webhook authority confirmed (/api/billing/webhook is active registered endpoint)
2. At least one end-to-end transaction confirmed per delivery class
3. boardroom_brief: order completed through to delivered state with customer access confirmed
4. operator_decision_pack: 3 entitlements confirmed present post-purchase
`;

const reportJson = {
  generatedAt: "2026-06-12",
  gateStatus,
  totalEntries,
  passCount,
  warnCount,
  failCount,
  p0PdfCount: p0PdfProducts.length,
  p0PdfProducts,
  hardFailures: results.hardFailures,
  warnings: results.warnings,
};

const reportsDir = path.join(PROJECT_ROOT, "reports");
fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(path.join(reportsDir, "report-experience-gold-standard.md"), reportMd);
fs.writeFileSync(path.join(reportsDir, "report-experience-gold-standard.json"), JSON.stringify(reportJson, null, 2));

console.log("\nReports written:");
console.log("  reports/report-experience-gold-standard.md");
console.log("  reports/report-experience-gold-standard.json");

process.exit(failCount > 0 ? 1 : 0);
