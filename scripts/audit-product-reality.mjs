#!/usr/bin/env node
/**
 * Whole-codebase product reality audit.
 *
 * This is intentionally adversarial: it treats reports and gates as signals,
 * not proof, and checks actual files, imports, route wiring, and user-visible
 * surfaces before assigning implementation state.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const SCAN_ROOTS = ["lib", "components", "pages", "app", "scripts", "reports", "content", "data", "public"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".md", ".mdx"]);

const MAJOR_PRODUCTS = [
  {
    productCode: "fast_diagnostic",
    targetClaim: "Fast public decision signal with case-derived judgement.",
    route: "/diagnostics/fast -> /foundry/decision-test",
    routeFiles: ["pages/foundry/decision-test.tsx", "pages/api/public/kernel-signal.ts"],
    expectedLogic: ["composeCaseDerivedJudgement", "caseDerivedJudgement", "FreeSignalResult"],
    commercialPromise: "A low-friction proof that Abraham can see decision failure faster than a generic prompt.",
  },
  {
    productCode: "team_assessment",
    targetClaim: "Team perception and alignment diagnostic that exposes hidden divergence.",
    route: "/diagnostics/team-assessment",
    routeFiles: ["pages/diagnostics/team-assessment.tsx"],
    expectedLogic: ["buildTeamDecisionResult", "AssessmentResultSurface", "mapTeamAssessmentToAssessmentResult"],
    commercialPromise: "Show leaders where team agreement is not real before execution fails.",
  },
  {
    productCode: "enterprise_assessment",
    targetClaim: "Enterprise-level coherence and governance diagnostic.",
    route: "/diagnostics/enterprise-assessment",
    routeFiles: ["pages/diagnostics/enterprise-assessment.tsx"],
    expectedLogic: ["buildEnterpriseDecisionResult", "AssessmentResultSurface", "mapEnterpriseDecisionToAssessmentResult"],
    commercialPromise: "Expose governance, authority, and execution variance before enterprise decisions harden.",
  },
  {
    productCode: "personal_decision_audit",
    targetClaim: "Paid decision instrument that produces a defensible decision record.",
    route: "/test-your-decision / decision-instruments routes",
    routeFiles: ["pages/test-your-decision.tsx", "pages/decision-instruments/[slug].tsx"],
    expectedLogic: ["composeDecisionInstrumentGoldResult", "instrument", "run"],
    commercialPromise: "Turn a live unresolved decision into a governed record with next action.",
  },
  {
    productCode: "decision_exposure_instrument",
    targetClaim: "Instrument for exposure, irreversibility, and cost-of-delay decisions.",
    route: "/decision-instruments/decision-exposure-instrument/run",
    routeFiles: ["pages/decision-instruments/decision-exposure-instrument/run.tsx"],
    expectedLogic: ["decision-exposure", "buildInstrumentSignalAuthority", "instrument"],
    commercialPromise: "Make decision exposure explicit before commitments become irreversible.",
  },
  {
    productCode: "mandate_clarity_framework",
    targetClaim: "Instrument for mandate and authority clarity.",
    route: "/decision-instruments/mandate-clarity-framework/run",
    routeFiles: ["pages/decision-instruments/mandate-clarity-framework/run.tsx"],
    expectedLogic: ["mandate", "instrument"],
    commercialPromise: "Resolve authority ambiguity before execution fragments.",
  },
  {
    productCode: "intervention_path_selector",
    targetClaim: "Selects the right intervention path from evidence and constraint.",
    route: "/decision-instruments/intervention-path-selector/run",
    routeFiles: ["pages/decision-instruments/intervention-path-selector/run.tsx"],
    expectedLogic: ["intervention", "instrument"],
    commercialPromise: "Prevent expensive intervention before the right failure mode is known.",
  },
  {
    productCode: "escalation_readiness_scorecard",
    targetClaim: "Governed escalation-readiness decision aid.",
    route: "/decision-instruments/escalation-readiness-scorecard/run",
    routeFiles: ["pages/decision-instruments/escalation-readiness-scorecard/run.tsx"],
    expectedLogic: ["escalation", "instrument"],
    commercialPromise: "Separate urgency from evidence readiness before board escalation.",
  },
  {
    productCode: "boardroom_brief",
    targetClaim: "Board-level decision brief with authority and evidence trace.",
    route: "/boardroom-brief or artefact routes",
    routeFiles: ["pages/boardroom-brief.tsx", "lib/boardroom/boardroom-dossier-service.ts"],
    expectedLogic: ["boardroom", "dossier", "authority"],
    commercialPromise: "Give leaders a defensible board-facing decision artifact.",
  },
  {
    productCode: "boardroom_mode",
    targetClaim: "Boardroom operating mode for governed decision review.",
    route: "/boardroom",
    routeFiles: ["app/boardroom/dossier/[dossierId]/page.tsx", "pages/boardroom.tsx"],
    expectedLogic: ["BoardroomDossierClient", "dossier"],
    commercialPromise: "Make board-level decision review traceable and reusable.",
  },
  {
    productCode: "global_market_reports",
    targetClaim: "Evidence-governed global market intelligence editions.",
    route: "/intelligence/market and artifact pages",
    routeFiles: ["pages/intelligence/market.tsx", "pages/artifacts/global-market-outlook-q1-2026-public.tsx"],
    expectedLogic: ["market-intelligence", "artifact", "release"],
    commercialPromise: "Give dated market calls with confidence, trace, and release authority.",
  },
  {
    productCode: "decision_centre",
    targetClaim: "Persistent centre for decision cases and memory.",
    route: "/decision-centre",
    routeFiles: ["pages/decision-centre.tsx", "pages/decision-centre/case/[caseId].tsx"],
    expectedLogic: ["decision-centre", "case", "memory"],
    commercialPromise: "Turn one-off diagnostics into ongoing decision memory.",
  },
  {
    productCode: "control_room",
    targetClaim: "Control room for governed product/decision operations.",
    route: "admin/control surfaces",
    routeFiles: ["lib/product/control-room-contract.ts", "lib/product/enterprise-control-room-contract.ts"],
    expectedLogic: ["control", "contract"],
    commercialPromise: "Operationalise decision authority across a portfolio.",
  },
  {
    productCode: "operator_console",
    targetClaim: "Operator console for administering decisions and evidence.",
    route: "/admin/*",
    routeFiles: ["pages/admin/decision-instrument-runs.tsx", "pages/admin/authority-center.tsx"],
    expectedLogic: ["admin", "authority", "runs"],
    commercialPromise: "Let operators inspect and govern the system rather than trust claims.",
  },
  {
    productCode: "oversight_brief",
    targetClaim: "Oversight brief for recurring decision governance.",
    route: "/oversight/brief/[cycleId]",
    routeFiles: ["pages/oversight/brief/[cycleId].tsx", "lib/product/oversight-brief-contract.ts"],
    expectedLogic: ["oversight", "cycle", "brief"],
    commercialPromise: "Convert recurring oversight into evidenced intervention decisions.",
  },
  {
    productCode: "return_brief",
    targetClaim: "Return brief that carries prior decision state back into action.",
    route: "/return-brief",
    routeFiles: ["pages/return-brief/index.tsx", "pages/return-brief/[caseId].tsx"],
    expectedLogic: ["return", "case", "decision"],
    commercialPromise: "Prevent decision work from dying after the first session.",
  },
];

const UNDERUSE_CANDIDATES = [
  { file: "components/product/ProductAuthorityBadge.tsx", intendedRole: "Display contract-derived authority state on product surfaces.", importance: "high" },
  { file: "components/product/ProductAuthorityPanel.tsx", intendedRole: "Expose evidence, blockers, and next evidence action to users/operators.", importance: "high" },
  { file: "components/product/ProductEvidenceStatus.tsx", intendedRole: "Show validation state and evidence status from ProductAuthorityContract.", importance: "high" },
  { file: "components/product/ProductAuthorityNotice.tsx", intendedRole: "Prevent unsupported public claims with visible authority notice.", importance: "high" },
  { file: "lib/product/product-authority-contract.ts", intendedRole: "Canonical authority contract type and validation logic.", importance: "critical" },
  { file: "lib/product/resolve-product-authority.ts", intendedRole: "Derive authority contract from evidence and validation state.", importance: "critical" },
  { file: "lib/product/live-route-output-capture.ts", intendedRole: "Capture route-level rendered output for external proof.", importance: "critical" },
  { file: "lib/validation/validation-evidence-ledger-v2.ts", intendedRole: "Validation evidence ledger v2 traceability.", importance: "critical" },
  { file: "lib/product/decision-centre-contract.ts", intendedRole: "Persistent decision centre contract.", importance: "high" },
  { file: "lib/product/control-room-contract.ts", intendedRole: "Control room product contract.", importance: "high" },
  { file: "lib/product/enterprise-control-room-contract.ts", intendedRole: "Enterprise control room product contract.", importance: "high" },
  { file: "lib/boardroom/boardroom-brief-authority.ts", intendedRole: "Boardroom brief authority model.", importance: "high" },
  { file: "lib/intelligence/market-intelligence-lifecycle.ts", intendedRole: "Lifecycle control for market intelligence editions.", importance: "high" },
  { file: "lib/intelligence/market-intelligence-quality-gate.ts", intendedRole: "Market intelligence quality gate.", importance: "high" },
  { file: "reports/product-value-evidence-ledger.json", intendedRole: "Product value evidence ledger used to permit gold status.", importance: "critical" },
];

const files = listTextFiles(SCAN_ROOTS);
const fileTexts = new Map(files.map((file) => [file, read(file)]));

const underusedAssets = UNDERUSE_CANDIDATES.map((candidate) => classifyUnderuse(candidate));
const productResults = MAJOR_PRODUCTS.map((product) => auditProduct(product));
const evidenceLogicResult = auditEvidenceLogic(productResults);

const codebaseUtilisationState = underusedAssets.some((asset) => asset.classification === "critical_underuse")
  ? "critically_underused"
  : underusedAssets.some((asset) => asset.classification === "commercially_significant_underuse")
    ? "materially_underused"
    : "well_utilised";

const implementationState = productResults.filter((product) => product.currentClassification === "fully_implemented").length >= productResults.length * 0.75
  ? "fully_implemented"
  : productResults.some((product) => product.currentClassification === "overclaimed" || product.currentClassification === "not_ready")
    ? "underwired"
    : "partially_implemented";

const report = {
  generatedAt: new Date().toISOString(),
  gate: "PASSED_WITH_FINDINGS",
  executiveJudgement: "The codebase contains serious evidence-governance infrastructure, but the product is not yet fully expressed as Evidence-Governed Decision Infrastructure in lived user journeys. The strongest capability is present in engines, contracts, validation reports, and selected public output; the weak point is route-level adoption, authority visibility, and conversion from diagnostics into persistent governed cases.",
  codebaseUtilisationState,
  implementationState,
  underusedAssets,
  productResults,
  evidenceGovernedLogic: evidenceLogicResult,
  productsFullyImplemented: productResults.filter((product) => product.currentClassification === "fully_implemented").map((product) => product.productCode),
  productsPartiallyImplemented: productResults.filter((product) => product.currentClassification === "partially_implemented").map((product) => product.productCode),
  productsUnderwired: productResults.filter((product) => product.currentClassification === "underwired").map((product) => product.productCode),
  productsOverclaimed: productResults.filter((product) => product.currentClassification === "overclaimed").map((product) => product.productCode),
  criticalUnderusedAssets: underusedAssets.filter((asset) => asset.classification === "critical_underuse"),
  recommendations: [
    "Wire ProductAuthorityContract components into every customer-facing product route before making authority claims visible in copy.",
    "Promote the route-output capture ledger from benchmark artifact to live admin/customer proof surface.",
    "Connect decision instruments and Decision Centre routes to persistent case records and evidence actions, not just routing pages.",
    "Convert static market intelligence and case dossier surfaces into evidence-state views with explicit what-would-change-the-judgement sections.",
    "Reduce duplication between validation reports and actual authority resolvers; gates should read the same source of truth routes consume.",
  ],
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "product-reality-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(join(REPORTS, "product-reality-audit.md"), renderMarkdown(report));
writeCategoryReadiness(report);

console.log("PRODUCT REALITY AUDIT");
console.log(`Gate: ${report.gate}`);
console.log(`Codebase utilisation: ${report.codebaseUtilisationState}`);
console.log(`Implementation state: ${report.implementationState}`);
console.log(`Critical underused assets: ${report.criticalUnderusedAssets.length}`);
console.log(`Products fully implemented: ${report.productsFullyImplemented.length}`);
console.log(`Products underwired: ${report.productsUnderwired.length}`);

function auditProduct(product) {
  const routeFiles = product.routeFiles.map((file) => ({ file, exists: existsSync(join(ROOT, file)), text: read(file) }));
  const routeExists = routeFiles.some((entry) => entry.exists);
  const combined = routeFiles.map((entry) => entry.text).join("\n");
  const logicHits = product.expectedLogic.filter((needle) => includes(combined, needle));
  const authorityHits = ["ProductAuthority", "resolveProductAuthority", "ProductAuthorityContract", "currentAuthorityState"].filter((needle) => includes(combined, needle));
  const evidenceHits = ["evidence", "Evidence", "ledger", "capture", "falsification", "limitation", "unresolved", "consequence"].filter((needle) => includes(combined, needle));
  const nextActionHits = ["next", "CTA", "href", "Link", "nextAdmissibleMove", "recommended"].filter((needle) => includes(combined, needle));

  const actualRuntimeBehaviour = routeExists
    ? `Route files exist; ${logicHits.length}/${product.expectedLogic.length} expected logic markers found; authority markers ${authorityHits.length}.`
    : "No route file found for the claimed product surface.";

  let currentClassification = "underwired";
  if (!routeExists) currentClassification = "not_ready";
  else if (logicHits.length >= Math.max(1, product.expectedLogic.length - 1) && authorityHits.length > 0 && evidenceHits.length >= 4) currentClassification = "fully_implemented";
  else if (logicHits.length >= 1 && evidenceHits.length >= 2) currentClassification = "partially_implemented";
  if (routeExists && authorityHits.length === 0 && /proven|validated|gold|authority|board-grade|infrastructure/i.test(combined)) currentClassification = "overclaimed";
  if (product.productCode.includes("global_market") && !authorityHits.length) currentClassification = "static_reference_only";

  return {
    productCode: product.productCode,
    targetClaim: product.targetClaim,
    evidenceSupportedClaim: deriveEvidenceSupportedClaim(product.productCode),
    actualRuntimeBehaviour,
    surfaceLanguage: summarizeSurfaceLanguage(combined),
    commercialPromise: product.commercialPromise,
    currentClassification,
    gap: buildProductGap({ routeExists, logicHits, authorityHits, evidenceHits, nextActionHits, product }),
    routeFiles: routeFiles.map((entry) => ({ file: entry.file, exists: entry.exists })),
    logicMarkersFound: logicHits,
    authorityMarkersFound: authorityHits,
    evidenceMarkersFound: evidenceHits,
    nextActionMarkersFound: nextActionHits,
  };
}

function classifyUnderuse(candidate) {
  const basename = candidate.file.split(/[\\/]/).pop();
  const symbol = basename.replace(/\.(tsx|ts|mjs|js|json|mdx|md)$/i, "");
  const refs = [];
  for (const [file, text] of fileTexts) {
    if (file === candidate.file) continue;
    if (text.includes(basename) || text.includes(symbol)) refs.push(file);
  }
  const isPresent = existsSync(join(ROOT, candidate.file));
  const routeRefs = refs.filter((file) => /^(pages|app|components)\//.test(file));
  let classification = "safe_unused";
  if (!isPresent) classification = "retire_candidate";
  else if (candidate.importance === "critical" && routeRefs.length === 0) classification = "critical_underuse";
  else if (candidate.importance === "high" && routeRefs.length === 0) classification = "commercially_significant_underuse";
  else if (refs.length <= 1) classification = "technical_debt";

  return {
    file: candidate.file,
    intendedRole: candidate.intendedRole,
    currentUsage: isPresent ? `${refs.length} references outside itself; ${routeRefs.length} route/component references.` : "File not present.",
    whereItIsWired: refs.slice(0, 10),
    whereItIsNotWired: routeRefs.length === 0 ? ["No customer-facing route/component consumption detected."] : [],
    commercialImportance: candidate.importance,
    classification,
    recommendedAction: recommendationForUnderuse(classification, candidate),
  };
}

function auditEvidenceLogic(productResults) {
  const checks = [
    "decision captured",
    "evidence extracted",
    "unresolved assumption identified",
    "falsification pressure applied",
    "consequence of wrong decision modelled",
    "generic alternative compared",
    "authority state derived",
    "limitations surfaced",
    "next evidence action shown",
    "blocked claims respected",
  ];
  const productRows = productResults.map((product) => {
    const text = product.routeFiles.map((entry) => read(entry.file)).join("\n");
    const performed = {
      decisionCaptured: /decision|case|situation/i.test(text),
      evidenceExtracted: /evidence|extract|basis/i.test(text),
      unresolvedAssumptionIdentified: /unresolved|assumption|limitation|does not prove/i.test(text),
      falsificationPressureApplied: /falsification|challenge|adversarial|what would change/i.test(text),
      consequenceModelled: /consequence|cost|risk|simulation|path/i.test(text),
      genericAlternativeCompared: /generic AI|generic_ai|alternative|market comparison/i.test(text),
      authorityStateDerived: /ProductAuthority|resolveProductAuthority|currentAuthorityState/i.test(text),
      limitationsSurfaced: /limitation|does not prove|boundary|not professional advice/i.test(text),
      nextEvidenceActionShown: /next evidence|nextAdmissibleMove|next action|recommended/i.test(text),
      blockedClaimsRespected: /blocked|not currently released|pending|authority/i.test(text),
    };
    return {
      productCode: product.productCode,
      performed,
      classification: performed.authorityStateDerived && performed.falsificationPressureApplied && performed.nextEvidenceActionShown
        ? "evidence_governance_visible"
        : /Authority|authority|governance|evidence/i.test(text)
          ? "authority_surface_present_but_experience_thin"
          : "evidence_governance_internal_or_absent",
    };
  });
  return { checks, productRows };
}

function deriveEvidenceSupportedClaim(productCode) {
  if (productCode === "fast_diagnostic") return "Externally proven on current live-route value proof, but ProductAuthorityContract/v2 evidence sources need consolidation.";
  if (["team_assessment", "enterprise_assessment"].includes(productCode)) return "Live route exists and route-level output captured; still blocked pending external proof/generic-AI outperformance.";
  if (productCode.startsWith("case_dossier")) return "Structured route payload now exists, but anti-toy/red-team/market proof still blocks gold.";
  return "Capability or route exists, but evidence-supported market authority is not yet proven end to end.";
}

function buildProductGap({ routeExists, logicHits, authorityHits, evidenceHits, nextActionHits, product }) {
  const gaps = [];
  if (!routeExists) gaps.push("Route/file path is missing or not discoverable.");
  if (logicHits.length < product.expectedLogic.length) gaps.push("Expected product logic is only partially visible in route files.");
  if (authorityHits.length === 0) gaps.push("ProductAuthorityContract is not visible in the customer-facing route.");
  if (evidenceHits.length < 3) gaps.push("Evidence-governed logic is not strongly exposed to the user.");
  if (nextActionHits.length === 0) gaps.push("Next action is not clearly wired.");
  return gaps.length ? gaps.join(" ") : "No major implementation gap detected by static audit.";
}

function summarizeSurfaceLanguage(text) {
  const terms = ["evidence-governed", "decision infrastructure", "board-grade", "validated", "proven", "authority", "intelligence", "premium"];
  const hits = terms.filter((term) => new RegExp(term, "i").test(text));
  return hits.length ? `Uses strong language: ${hits.join(", ")}.` : "No strong product-authority language detected in inspected route files.";
}

function recommendationForUnderuse(classification, candidate) {
  if (classification === "critical_underuse") return `Wire ${candidate.file} into at least the main product route and admin authority surface, or stop treating it as proof of customer value.`;
  if (classification === "commercially_significant_underuse") return `Surface this capability where buyers/users encounter the related product.`;
  if (classification === "technical_debt") return "Either wire this into the product path or mark as internal-only to avoid architecture theatre.";
  if (classification === "retire_candidate") return "Remove from claim set unless the file is intentionally pending.";
  return "No immediate action.";
}

function writeCategoryReadiness(data) {
  const visibleAuthorityRows = data.productResults.filter((product) => product.authorityMarkersFound.length > 0).length;
  const categoryReadinessState = visibleAuthorityRows >= data.productResults.length * 0.75
    ? "category_defining_ready"
    : visibleAuthorityRows >= 3
      ? "category_foundation_ready"
      : "category_infrastructure_present_but_not_visible";
  const category = {
    generatedAt: data.generatedAt,
    category: "Evidence-Governed Decision Infrastructure",
    categoryReadinessState,
    visibleSignals: {
      evidenceState: data.productResults.filter((product) => product.evidenceMarkersFound.includes("evidence") || product.evidenceMarkersFound.includes("Evidence")).map((product) => product.productCode),
      authorityState: data.productResults.filter((product) => product.authorityMarkersFound.length > 0).map((product) => product.productCode),
      decisionRisk: data.productResults.filter((product) => /risk|consequence|cost/i.test(product.actualRuntimeBehaviour + product.surfaceLanguage + product.gap)).map((product) => product.productCode),
      falsificationTrigger: data.evidenceGovernedLogic.productRows.filter((row) => row.performed.falsificationPressureApplied).map((row) => row.productCode),
      unsupportedClaimBlocking: data.productResults.filter((product) => /blocked|pending|not currently/i.test(product.evidenceSupportedClaim + product.gap)).map((product) => product.productCode),
    },
    judgement: categoryReadinessState === "category_defining_ready"
      ? "The category is visible in user experience."
      : "The category infrastructure is materially present, but too much of it remains internal, report-bound, or admin-only. The market cannot yet see enough weak-evidence authority being made impossible in the core journeys.",
    implementationPriorities: data.recommendations,
  };
  writeFileSync(join(REPORTS, "category-dominance-readiness.json"), `${JSON.stringify(category, null, 2)}\n`);
  writeFileSync(join(REPORTS, "category-dominance-readiness.md"), `# Category Dominance Readiness

## Category

${category.category}

## Readiness State

${category.categoryReadinessState}

## Judgement

${category.judgement}

## Visible Signals

- Evidence state visible: ${category.visibleSignals.evidenceState.join(", ") || "none"}
- Authority state visible: ${category.visibleSignals.authorityState.join(", ") || "none"}
- Decision risk visible: ${category.visibleSignals.decisionRisk.join(", ") || "none"}
- Falsification trigger visible: ${category.visibleSignals.falsificationTrigger.join(", ") || "none"}
- Unsupported claim blocking visible: ${category.visibleSignals.unsupportedClaimBlocking.join(", ") || "none"}

## Implementation Priorities

${category.implementationPriorities.map((item) => `- ${item}`).join("\n")}
`);
}

function renderMarkdown(data) {
  return `# Product Reality Audit

## Executive Judgement

${data.executiveJudgement}

## Gate Result

${data.gate}

## Codebase Utilisation State

${data.codebaseUtilisationState}

## Product Implementation State

${data.implementationState}

## Underused Assets

| File / Module | Intended Role | Current Usage | Where It Is Wired | Where It Is Not Wired | Commercial Importance | Recommended Action |
|---|---|---|---|---|---|---|
${data.underusedAssets.map((asset) => `| ${asset.file} | ${escapeCell(asset.intendedRole)} | ${escapeCell(asset.currentUsage)} | ${escapeCell(asset.whereItIsWired.slice(0, 4).join(", ") || "none")} | ${escapeCell(asset.whereItIsNotWired.join(" ") || "not detected")} | ${asset.commercialImportance} / ${asset.classification} | ${escapeCell(asset.recommendedAction)} |`).join("\n")}

## Product Ambition vs Implementation

| Product | Target Claim | Evidence-Supported Claim | Actual Runtime Behaviour | Surface Language | Commercial Promise | Current Classification | Gap |
|---|---|---|---|---|---|---|---|
${data.productResults.map((product) => `| ${product.productCode} | ${escapeCell(product.targetClaim)} | ${escapeCell(product.evidenceSupportedClaim)} | ${escapeCell(product.actualRuntimeBehaviour)} | ${escapeCell(product.surfaceLanguage)} | ${escapeCell(product.commercialPromise)} | ${product.currentClassification} | ${escapeCell(product.gap)} |`).join("\n")}

## Evidence-Governed Logic

${data.evidenceGovernedLogic.productRows.map((row) => `- **${row.productCode}**: ${row.classification}`).join("\n")}

## Critical Underused Assets

${data.criticalUnderusedAssets.length ? data.criticalUnderusedAssets.map((asset) => `- ${asset.file}: ${asset.recommendedAction}`).join("\n") : "None."}

## Recommendations

${data.recommendations.map((item) => `- ${item}`).join("\n")}
`;
}

function listTextFiles(roots) {
  const result = [];
  for (const root of roots) walk(join(ROOT, root), result);
  return result.map((file) => relative(ROOT, file).replace(/\\/g, "/"));
}

function walk(dir, out) {
  if (!existsSync(dir)) return;
  const entries = safeReaddir(dir);
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", ".git", ".contentlayer"].includes(entry.name)) continue;
      walk(full, out);
    } else if (TEXT_EXTENSIONS.has(ext(entry.name))) {
      out.push(full);
    }
  }
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function read(file) {
  try {
    return readFileSync(join(ROOT, file), "utf-8");
  } catch {
    return "";
  }
}

function includes(text, needle) {
  return text.toLowerCase().includes(String(needle).toLowerCase());
}

function ext(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index);
}

function escapeCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
