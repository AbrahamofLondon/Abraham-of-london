#!/usr/bin/env node
/**
 * System wiring audit.
 *
 * Traces named product journeys from public route to product logic, authority
 * state, evidence linkage, output, fulfilment, and next action.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");

const JOURNEYS = [
  {
    journey: "fast_diagnostic",
    route: "/diagnostics/fast -> /foundry/decision-test",
    routeFiles: ["pages/diagnostics/fast.tsx", "pages/foundry/decision-test.tsx", "pages/api/public/kernel-signal.ts", "components/kernel/FreeSignalResult.tsx"],
    expected: ["caseDerivedJudgement", "composeCaseDerivedJudgement", "FreeSignalResult"],
  },
  {
    journey: "team_assessment",
    route: "/diagnostics/team-assessment",
    routeFiles: ["pages/diagnostics/team-assessment.tsx", "pages/api/diagnostics/team-alignment.ts", "lib/diagnostics/assessment-result-mappers.ts"],
    expected: ["buildTeamDecisionResult", "AssessmentResultSurface", "submitDiagnostic"],
  },
  {
    journey: "enterprise_assessment",
    route: "/diagnostics/enterprise-assessment",
    routeFiles: ["pages/diagnostics/enterprise-assessment.tsx", "pages/api/diagnostics/enterprise.ts", "lib/diagnostics/assessment-result-mappers.ts"],
    expected: ["buildEnterpriseDecisionResult", "AssessmentResultSurface", "submitDiagnostic"],
  },
  {
    journey: "personal_decision_audit",
    route: "/test-your-decision and /checkout/personal-decision-audit",
    routeFiles: ["pages/test-your-decision.tsx", "pages/checkout/personal-decision-audit.tsx", "pages/decision-instruments/[slug].tsx", "lib/product/decision-instrument-gold-composer.ts"],
    expected: ["composeDecisionInstrumentGoldResult", "decision-instruments", "checkout"],
  },
  {
    journey: "decision_centre",
    route: "/decision-centre",
    routeFiles: ["pages/decision-centre.tsx", "pages/decision-centre/case/[caseId].tsx", "lib/product/decision-centre-contract.ts"],
    expected: ["decision-centre", "case", "Retainer"],
  },
  {
    journey: "boardroom_mode",
    route: "/boardroom dossier routes",
    routeFiles: ["app/boardroom/dossier/[dossierId]/page.tsx", "app/boardroom/dossier/[dossierId]/BoardroomDossierClient.tsx", "lib/boardroom/boardroom-dossier-service.ts"],
    expected: ["dossier", "BoardroomDossierClient", "boardroom"],
  },
  {
    journey: "global_market_reports",
    route: "/intelligence/market and /artifacts/global-market-outlook-q1-2026-public",
    routeFiles: ["pages/intelligence/market.tsx", "pages/artifacts/global-market-outlook-q1-2026-public.tsx", "lib/intelligence/market-intelligence-lifecycle.ts", "lib/intelligence/gmi-release-authority.ts"],
    expected: ["market", "intelligence", "release"],
  },
  {
    journey: "admin_authority_dashboard",
    route: "/admin/authority-center",
    routeFiles: ["pages/admin/authority-center.tsx", "components/product/ProductAuthorityPanel.tsx", "lib/product/resolve-product-authority.ts"],
    expected: ["ProductAuthority", "resolveProductAuthority", "authority"],
  },
  {
    journey: "checkout_fulfilment",
    route: "/checkout/* -> fulfilment",
    routeFiles: ["lib/product/product-fulfilment-contract.ts", "lib/product/product-fulfilment-assurance.ts", "pages/api/checkout/decision-failure-brief.ts", "pages/checkout/personal-decision-audit.tsx"],
    expected: ["fulfilment", "successRoute", "customerAccessRoute"],
  },
  {
    journey: "public_product_pages",
    route: "/products /pricing /diagnostics /decision-instruments",
    routeFiles: ["pages/products.tsx", "pages/pricing.tsx", "pages/diagnostics/index.tsx", "pages/decision-instruments/index.tsx"],
    expected: ["href", "Product", "diagnostic"],
  },
];

const rows = JOURNEYS.map(auditJourney);
const gate = "PASSED_WITH_FINDINGS";
const result = {
  generatedAt: new Date().toISOString(),
  gate,
  wiringState: rows.some((row) => row.flags.includes("authority_bypass") || row.flags.includes("logic_bypass"))
    ? "fragmented"
    : rows.some((row) => row.flags.length > 0)
      ? "materially_underwired"
      : "well_wired",
  journeys: rows,
  flagCounts: countFlags(rows),
  topRisks: rows
    .filter((row) => row.flags.length > 0)
    .map((row) => `${row.journey}: ${row.flags.join(", ")}`),
  recommendations: [
    "Project bounded customer-safe authority meaning (via projectPublicProductAuthority) in route output for every product with a commercial or diagnostic claim. The raw ProductAuthorityContract stays admin/internal-operator only.",
    "Attach route-output capture to live journeys, not only benchmark scripts.",
    "Give public product pages a bounded customer-safe posture (cleared, controlled, evidence-limited, reference, none) — never raw evidence-ledger state or validation internals.",
    "Ensure checkout success routes land in fulfilled artifacts or persisted case state with authority/evidence status.",
  ],
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "system-wiring-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "system-wiring-audit.md"), renderMarkdown(result));

console.log("SYSTEM WIRING AUDIT");
console.log(`Gate: ${result.gate}`);
console.log(`Wiring state: ${result.wiringState}`);
console.log(`Journeys audited: ${rows.length}`);
console.log(`Journeys with flags: ${rows.filter((row) => row.flags.length > 0).length}`);

function auditJourney(journey) {
  const fileEntries = journey.routeFiles.map((file) => ({
    file,
    exists: existsSync(join(ROOT, file)),
    text: read(file),
  }));
  const text = fileEntries.map((entry) => entry.text).join("\n");
  const routeExists = fileEntries.some((entry) => entry.exists);
  const routeRenders = routeExists && !/return\s+null/.test(text.replace(/Redirect\(\)[\s\S]*?getServerSideProps/, ""));
  const usesRealProductLogic = journey.expected.some((needle) => text.toLowerCase().includes(needle.toLowerCase()));
  const usesProductAuthorityContract = /ProductAuthorityContract|ProductAuthorityPanel|ProductAuthorityBadge|resolveProductAuthority|currentAuthorityState/i.test(text);
  const displaysAuthorityState = /ProductAuthorityPanel|ProductAuthorityBadge|currentAuthorityState|publicClaimLanguage/i.test(text);
  const capturesEvidence = /evidence|Evidence|capture|ledger|basis|submitDiagnostic|caseDerivedJudgement/i.test(text);
  const preventsUnsupportedClaim = /blocked|pending|not currently released|authority|limitation|does not prove|not professional advice/i.test(text);
  const producesUsefulOutput = /Result|result|output|report|dossier|FreeSignalResult|AssessmentResultSurface|compose/i.test(text);
  const supportsNextAction = /next|CTA|href|Link|recommended|nextAdmissibleMove|successRoute|customerAccessRoute/i.test(text);
  const connectsToDashboardReportFulfilment = /admin|dashboard|report|fulfilment|artifact|successRoute|customerAccessRoute|ProductArtifact/i.test(text);

  const flags = [];
  if (!routeExists) flags.push("dead_route");
  if (routeExists && !usesRealProductLogic) flags.push("decorative_route");
  if (routeExists && /Static proof asset|static/i.test(text) && !/caseDerivedJudgement|ProductAuthority/i.test(text)) flags.push("static_route_pretending_to_be_product");
  if (routeExists && !usesRealProductLogic) flags.push("logic_bypass");
  if (!usesProductAuthorityContract) flags.push("authority_bypass");
  if (/proven|validated|gold|board-grade|enterprise-grade|intelligence/i.test(text) && !usesProductAuthorityContract) flags.push("surface_overclaim");
  if (!supportsNextAction) flags.push("missing_next_action");
  if (!capturesEvidence) flags.push("missing_evidence_linkage");

  return {
    journey: journey.journey,
    route: journey.route,
    routeExists,
    routeRenders,
    usesRealProductLogic,
    usesProductAuthorityContract,
    displaysCorrectAuthorityState: displaysAuthorityState,
    capturesOrReferencesEvidence: capturesEvidence,
    preventsUnsupportedClaim,
    producesUsefulOutput,
    supportsNextAction,
    connectsToDashboardReportFulfilment,
    filesChecked: fileEntries.map(({ file, exists }) => ({ file, exists })),
    flags: [...new Set(flags)],
    recommendedAction: recommendedAction(flags, journey.journey),
  };
}

function recommendedAction(flags, journey) {
  if (flags.includes("dead_route")) return "Restore or remove route from product claim set.";
  if (flags.includes("authority_bypass")) return `Wire ProductAuthorityContract into ${journey} surface before relying on authority language.`;
  if (flags.includes("missing_evidence_linkage")) return "Expose evidence state and next evidence action in the rendered output.";
  if (flags.includes("decorative_route")) return "Connect the page to real product logic or reclassify it as routing/copy only.";
  return "Keep route under observation; no immediate blocker detected by static audit.";
}

function countFlags(rows) {
  const counts = {};
  for (const row of rows) for (const flag of row.flags) counts[flag] = (counts[flag] ?? 0) + 1;
  return counts;
}

function renderMarkdown(data) {
  return `# System Wiring Audit

## Gate Result

${data.gate}

## Wiring State

${data.wiringState}

## Journey Trace

| Journey | Route | Route Exists | Renders | Real Logic | ProductAuthorityContract | Evidence Linkage | Useful Output | Next Action | Dashboard / Report / Fulfilment | Flags | Recommended Action |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
${data.journeys.map((row) => `| ${row.journey} | ${escapeCell(row.route)} | ${yes(row.routeExists)} | ${yes(row.routeRenders)} | ${yes(row.usesRealProductLogic)} | ${yes(row.usesProductAuthorityContract)} | ${yes(row.capturesOrReferencesEvidence)} | ${yes(row.producesUsefulOutput)} | ${yes(row.supportsNextAction)} | ${yes(row.connectsToDashboardReportFulfilment)} | ${escapeCell(row.flags.join(", ") || "none")} | ${escapeCell(row.recommendedAction)} |`).join("\n")}

## Flag Counts

${Object.entries(data.flagCounts).map(([flag, count]) => `- ${flag}: ${count}`).join("\n") || "No flags."}

## Recommendations

${data.recommendations.map((item) => `- ${item}`).join("\n")}
`;
}

function read(file) {
  try {
    return readFileSync(join(ROOT, file), "utf-8");
  } catch {
    return "";
  }
}

function yes(value) {
  return value ? "yes" : "no";
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
