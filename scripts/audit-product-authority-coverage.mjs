#!/usr/bin/env node
/**
 * Estate-wide product authority coverage matrix.
 *
 * This audit treats the canonical fulfilment contract as the 43-product estate
 * and checks whether each product either demonstrates authority state in its
 * routes/surfaces or is explicitly exempted by design.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const REQUIRED_PRODUCT_COUNT = 43;

const GROUP_A = new Set(["fast_diagnostic"]);
const GROUP_B = new Set(["team_assessment", "enterprise_assessment"]);
const GROUP_C = new Set([
  "personal_decision_audit",
  "decision_exposure_instrument",
  "mandate_clarity_framework",
  "intervention_path_selector",
  "escalation_readiness_scorecard",
  "boardroom_brief",
  "boardroom_mode",
  "diagnostic_report_basic",
]);
const DECISION_INFRASTRUCTURE = new Set([
  "decision_centre",
  "control_room",
  "operator_console",
  "oversight_brief",
  "return_brief",
]);
const STATIC_REFERENCE = new Set([
  "case_dossier_tariff_shock",
  "case_dossier_team_alignment",
  "case_dossier_escalation_denied",
  "gmi_q1_2026",
  "gmi_q2_2026",
  "gmi_q3_2026",
  "diagnostic_report_basic",
  "diagnostic_report_pro",
  "executive_reporting_priority",
]);

const contracts = parseFulfilmentContracts();
const authorityContracts = readJson("reports/product-authority-contract.json")?.contracts ?? [];
const routeProof = readJson("reports/category-route-proof.json");
const marketAudit = readJson("reports/market-adoption-posture-audit.json");
const surfaceClaimAudit = readJson("reports/surface-claim-authority-gate.json");
const productReality = readJson("reports/product-reality-audit.json");
const files = listFiles(["pages", "app", "components", "lib", "content"]);
const fileText = new Map(files.map((file) => [file, read(file)]));

const products = contracts.map(buildCoverageRow);
const classificationCounts = countBy(products, "currentCoverageClassification");
const publicProducts = products.filter((row) => row.routeExists && !row.staticReferenceInternalExemption);
const publicWithoutAuthority = publicProducts.filter((row) => !row.authorityVisiblyRendered);
const unsupportedClaims = products.filter((row) => row.currentCoverageClassification === "overclaimed");
const silentBlockedProducts = products.filter((row) =>
  ["blocked_until_claim_evidenced", "blocked_until_v2_revalidation", "measurement_inconclusive"].includes(row.currentAuthorityState) &&
  !row.limitationVisiblyRendered,
);
const legacyPresentedAsV2 = products.filter((row) =>
  row.currentAuthorityState === "legacy_validated_pending_v2_revalidation" &&
  row.authorityVisiblyRendered &&
  /externally proven|v2 proven|gold/i.test(row.surfaceExcerpt),
);
const staticPretending = products.filter((row) =>
  STATIC_REFERENCE.has(row.productCode) &&
  row.routeExists &&
  !row.staticReferenceInternalExemption &&
  /intelligence|diagnostic|judgement|proven|validated/i.test(row.surfaceExcerpt),
);

const result = {
  generatedAt: new Date().toISOString(),
  gate: "PASSED_WITH_FINDINGS",
  requiredProductCount: REQUIRED_PRODUCT_COUNT,
  productsReviewed: products.length,
  estateCoverageComplete: products.length === REQUIRED_PRODUCT_COUNT,
  classificationCounts,
  estateWideSuccessCriteria: {
    all43ProductsClassified: products.length === REQUIRED_PRODUCT_COUNT && products.every((row) => row.currentCoverageClassification),
    allPublicProductsHaveAuthorityCoverage: publicWithoutAuthority.length === 0,
    allCheckoutProductsShowAuthorityBeforePurchase: products.filter((row) => row.checkoutPath && !row.authorityVisiblyRendered).length === 0,
    allReportsShowAuthorityStatus: products.filter((row) => row.reportSurfaceExists && !row.authorityVisiblyRendered).length === 0,
    allAdminFulfilmentShowsAuthorityBeforeRelease: products.filter((row) => row.adminSurfaceExists && row.requiresAdminRelease && !row.authorityVisiblyRendered).length === 0,
    unsupportedPublicClaims: unsupportedClaims.length,
    silentBlockedProducts: silentBlockedProducts.length,
    legacyProductsPresentedAsV2Proven: legacyPresentedAsV2.length,
    staticReferencesPretendingToBeIntelligence: staticPretending.length,
  },
  categoryReadinessState: deriveCategoryReadiness(products),
  marketAdoptionState: marketAudit?.marketAdoptionState ?? "unknown",
  products,
  stageTargets: {
    stage1CoverageMatrix: products.length === REQUIRED_PRODUCT_COUNT ? "complete_with_findings" : "incomplete",
    stage2PublicRouteCoverage: publicWithoutAuthority.length === 0 ? "complete" : "incomplete",
    stage3CheckoutFulfilmentCoverage: products.filter((row) => row.checkoutPath && !row.authorityVisiblyRendered).length === 0 ? "complete" : "incomplete",
    stage4ReportAdminCoverage: products.filter((row) => (row.reportSurfaceExists || row.adminSurfaceExists) && !row.authorityVisiblyRendered).length === 0 ? "complete" : "incomplete",
    stage5MarketLanguageAlignment: unsupportedClaims.length === 0 ? "complete" : "incomplete",
  },
  implementationPriorities: buildImplementationPriorities(products),
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "product-authority-coverage-matrix.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "product-authority-coverage-matrix.md"), renderMarkdown(result));

console.log("PRODUCT AUTHORITY COVERAGE MATRIX");
console.log(`Gate: ${result.gate}`);
console.log(`Products reviewed: ${result.productsReviewed}/${result.requiredProductCount}`);
console.log(`Category readiness: ${result.categoryReadinessState}`);
console.log(`Authority demonstrated: ${classificationCounts.authority_demonstrated ?? 0}`);
console.log(`Underwired: ${classificationCounts.underwired ?? 0}`);
console.log(`Overclaimed: ${classificationCounts.overclaimed ?? 0}`);

function buildCoverageRow(contract) {
  const productCode = contract.productCode;
  const routePath = contract.customerAccessRoute || contract.intakeRoute || contract.successRoute || contract.checkoutRoute || null;
  const routeFiles = unique([
    ...routeToFiles(contract.intakeRoute),
    ...routeToFiles(contract.customerAccessRoute),
    ...routeToFiles(contract.successRoute),
    ...routeToFiles(routePath),
  ]);
  const checkoutFiles = routeToFiles(contract.checkoutRoute);
  const adminFiles = routeToFiles(contract.adminRoute);
  const reportFiles = routeToFiles(contract.customerAccessRoute).filter((file) => /report|dossier|brief|intelligence|gmi|artifact/i.test(file));
  const exactRefs = exactReferenceFiles(productCode, contract.entitlementSlug, routePath).slice(0, 20);
  const evidenceFiles = unique([...routeFiles, ...checkoutFiles, ...adminFiles, ...reportFiles, ...exactRefs]);
  const combinedText = evidenceFiles.map((file) => fileText.get(file) ?? read(file)).join("\n");
  const authorityContract = authorityContracts.find((entry) => entry.productCode === productCode) ?? null;
  const currentAuthorityState = authorityStateFor(contract, authorityContract);
  const staticReferenceInternalExemption = isExplicitlyExempt(contract, combinedText);
  const productAuthorityContractExists = Boolean(authorityContract) || hasExact(combinedText, [
    "ProductAuthorityContract",
    "resolveProductAuthority",
    "ProductAuthorityPanel",
    "ProductAuthorityBadge",
    "ProductAuthorityNotice",
    "currentAuthorityState",
    "publicClaimLanguage",
  ]);
  const authorityVisiblyRendered = hasExact(combinedText, [
    "<ProductAuthority",
    "ProductAuthorityPanel",
    "ProductAuthorityBadge",
    "ProductAuthorityNotice",
    "resolveProductAuthority(",
    "currentAuthorityState",
    "Authority state",
    "authorityState",
  ]);
  const evidenceStateVisiblyRendered = hasExact(combinedText, [
    "ProductEvidenceStatus",
    "Evidence state",
    "evidenceSupportedClaim",
    "evidenceSource",
    "Evidence Ledger",
    "evidence state",
  ]);
  const limitationVisiblyRendered = hasExact(combinedText, [
    "blockingReasons",
    "limitation",
    "does not prove",
    "not currently released",
    "pending v2",
    "blocked",
    "unsupported",
    "not proven",
  ]);
  const nextEvidenceActionVisiblyRendered = hasExact(combinedText, [
    "nextEvidenceAction",
    "Next evidence action",
    "next evidence",
    "nextAdmissibleMove",
    "next action",
  ]);
  const unsupportedClaimBlockingVisible = hasExact(combinedText, [
    "publicClaimAllowed",
    "ProductAuthorityNotice",
    "unsupported claim",
    "blocked",
    "legacy validated",
    "pending v2",
    "claim-limited",
  ]);
  const decisionRiskVisible = hasExact(combinedText, ["Decision risk", "decisionRisk", "risk state", "riskScore", "exposure"]);
  const falsificationTriggerVisible = hasExact(combinedText, ["falsification", "falsify", "what would change", "What would change"]);
  const marketPainClarity = hasExact(combinedText, ["buyer", "pain", "cost of delay", "decision risk", "misalignment", "evidence gap"]) ||
    Boolean(marketAudit?.rows?.some((row) => row.productCode === productCode && row.marketPain));
  const genericAiContrast = hasExact(combinedText, ["generic AI", "generic prompt", "unaccountable AI", "unsupported advice"]);
  const checkoutPathExists = routeExists(contract.checkoutRoute);
  const reportSurfaceExists = reportFiles.length > 0 || /executive_report_artifact|human_reviewed_dossier/.test(contract.fulfilmentType ?? "");
  const adminSurfaceExists = routeExists(contract.adminRoute);
  const routeExistsValue = routeExists(routePath);
  const routeProofEntry = findRouteProof(productCode);
  const surfaceClaimSupport = findSurfaceClaimSupport(productCode);
  const targetClaim = targetClaimFor(contract);
  const evidenceSupportedClaim = authorityContract?.evidenceSupportedClaim ?? evidenceSupportedClaimFor(currentAuthorityState, contract);
  const requiredNextAction = requiredActionFor({
    contract,
    currentAuthorityState,
    productAuthorityContractExists,
    authorityVisiblyRendered,
    evidenceStateVisiblyRendered,
    limitationVisiblyRendered,
    nextEvidenceActionVisiblyRendered,
    unsupportedClaimBlockingVisible,
    checkoutPathExists,
    reportSurfaceExists,
    adminSurfaceExists,
    staticReferenceInternalExemption,
  });
  const currentCoverageClassification = classifyCoverage({
    contract,
    currentAuthorityState,
    routeExists: routeExistsValue,
    checkoutPathExists,
    reportSurfaceExists,
    adminSurfaceExists,
    productAuthorityContractExists,
    authorityVisiblyRendered,
    evidenceStateVisiblyRendered,
    limitationVisiblyRendered,
    nextEvidenceActionVisiblyRendered,
    unsupportedClaimBlockingVisible,
    decisionRiskVisible,
    falsificationTriggerVisible,
    staticReferenceInternalExemption,
    surfaceClaimSupport,
  });

  return {
    productCode,
    productName: contract.displayName,
    currentAuthorityState,
    targetClaim,
    evidenceSupportedClaim,
    routeExists: routeExistsValue,
    routePath,
    checkoutPathExists,
    checkoutPath: contract.checkoutRoute,
    reportSurfaceExists,
    adminSurfaceExists,
    adminRoute: contract.adminRoute,
    productAuthorityContractExists,
    authorityVisiblyRendered,
    evidenceStateVisiblyRendered,
    limitationVisiblyRendered,
    nextEvidenceActionVisiblyRendered,
    unsupportedClaimBlockingVisible,
    staticReferenceInternalExemption,
    marketPainClarity,
    genericAiContrast,
    decisionRiskVisible,
    falsificationTriggerVisible,
    currentCoverageClassification,
    requiredNextAction,
    group: groupFor(productCode, contract),
    commercialStatus: contract.commercialStatus,
    fulfilmentType: contract.fulfilmentType,
    readinessStatus: contract.readinessStatus,
    requiresAdminRelease: ["human_reviewed_dossier", "executive_report_artifact", "scheduled_session", "retainer_cycle"].includes(contract.fulfilmentType ?? ""),
    checkedFiles: evidenceFiles,
    routeProof: routeProofEntry,
    surfaceClaimSupport,
    surfaceExcerpt: excerpt(combinedText),
  };
}

function classifyCoverage(input) {
  const c = input.contract;
  if (input.staticReferenceInternalExemption) {
    if (["inactive", "contracted", "manual_billing"].includes(c.commercialStatus ?? "") && !input.checkoutPathExists) return "internal_only_exempt";
    return "static_reference_correctly_labelled";
  }
  if (c.checkoutRoute && !input.authorityVisiblyRendered) return "checkout_or_fulfilment_risk";
  if (input.reportSurfaceExists && !input.authorityVisiblyRendered) return "report_surface_risk";
  if (!input.productAuthorityContractExists) return "authority_contract_missing";
  if (!input.authorityVisiblyRendered && /gold|validated|proven|diagnostic|judgement|board-grade|intelligence/i.test(input.surfaceClaimSupport?.claimText ?? "")) return "overclaimed";
  if (!input.authorityVisiblyRendered) return input.routeExists ? "underwired" : "not_market_ready";
  const demonstrated = input.evidenceStateVisiblyRendered &&
    input.limitationVisiblyRendered &&
    input.nextEvidenceActionVisiblyRendered &&
    input.unsupportedClaimBlockingVisible &&
    (input.decisionRiskVisible || input.falsificationTriggerVisible);
  if (demonstrated) return "authority_demonstrated";
  return "authority_visible_but_thin";
}

function requiredActionFor(input) {
  if (input.staticReferenceInternalExemption) return "Keep exemption explicit on every route and claim surface.";
  if (!input.productAuthorityContractExists) return "Create or resolve ProductAuthorityContract coverage for this product.";
  if (!input.authorityVisiblyRendered) return "Render authority state on the product route and all claim-bearing surfaces.";
  if (!input.evidenceStateVisiblyRendered) return "Render evidence-supported claim and evidence state.";
  if (!input.limitationVisiblyRendered) return "Render limitation/blocking status before any public claim or sale.";
  if (!input.nextEvidenceActionVisiblyRendered) return "Render next evidence action.";
  if (input.checkoutPathExists && !input.authorityVisiblyRendered) return "Block checkout until authority state is visible before purchase.";
  if (input.reportSurfaceExists && !input.authorityVisiblyRendered) return "Add authority status to report/dossier output.";
  return "Maintain coverage and verify with live route capture.";
}

function parseFulfilmentContracts() {
  const source = read("lib/product/product-fulfilment-contract.ts");
  const blocks = [];
  const regex = /export const\s+([A-Z0-9_]+)_CONTRACT\s*=\s*contract\(\{([\s\S]*?)\n\}\);/g;
  let match;
  while ((match = regex.exec(source)) !== null) {
    const block = match[2];
    const productCode = str(block, "productCode");
    if (!productCode) continue;
    blocks.push({
      productCode,
      displayName: str(block, "displayName") ?? titleize(productCode),
      entitlementSlug: str(block, "entitlementSlug"),
      stripePriceId: str(block, "stripePriceId"),
      commercialStatus: str(block, "commercialStatus") ?? inferCommercialStatus(productCode),
      checkoutRoute: str(block, "checkoutRoute"),
      intakeRoute: str(block, "intakeRoute"),
      successRoute: str(block, "successRoute"),
      customerAccessRoute: str(block, "customerAccessRoute"),
      adminRoute: str(block, "adminRoute"),
      fulfilmentType: str(block, "fulfilmentType") ?? inferFulfilmentType(productCode),
      readinessStatus: str(block, "readinessStatus") ?? "not_applicable",
      proofRunCompleted: bool(block, "proofRunCompleted"),
    });
  }
  return blocks;
}

function authorityStateFor(contract, authorityContract) {
  if (authorityContract?.currentAuthorityState) return authorityContract.currentAuthorityState;
  if (GROUP_A.has(contract.productCode)) return "externally_proven_gold_product";
  if (GROUP_B.has(contract.productCode)) return "legacy_validated_pending_v2_revalidation";
  if (STATIC_REFERENCE.has(contract.productCode) || contract.fulfilmentType === "free_asset") return "static_reference";
  if (["inactive", "contracted", "manual_billing"].includes(contract.commercialStatus ?? "")) return "internal_only";
  return "blocked_until_claim_evidenced";
}

function evidenceSupportedClaimFor(state, contract) {
  if (state === "externally_proven_gold_product") return `${contract.displayName} is externally proven under v2 evidence validation.`;
  if (state === "legacy_validated_pending_v2_revalidation") return `${contract.displayName} is legacy validated and pending v2 revalidation.`;
  if (state === "static_reference") return `${contract.displayName} is a static/reference product unless evidence-governed logic is visible.`;
  if (state === "internal_only") return `${contract.displayName} is internal-only or manually governed by design.`;
  return `${contract.displayName} authority is not granted until product-specific evidence is visible.`;
}

function targetClaimFor(contract) {
  if (contract.fulfilmentType === "free_asset") return "Static/reference evidence asset.";
  if (contract.fulfilmentType === "executive_report_artifact") return "Evidence-governed report artifact.";
  if (contract.fulfilmentType === "interactive_instrument") return "Evidence-governed decision instrument.";
  if (contract.fulfilmentType === "scheduled_session") return "Evidence-governed session product.";
  if (contract.fulfilmentType === "retainer_cycle") return "Continuity and oversight product.";
  if (contract.fulfilmentType === "human_reviewed_dossier") return "Human-reviewed evidence dossier.";
  return `${contract.displayName} authority-bearing product surface.`;
}

function isExplicitlyExempt(contract, text) {
  if (contract.commercialStatus === "inactive") return true;
  if (contract.commercialStatus === "contracted") return true;
  if (contract.commercialStatus === "manual_billing" && !contract.checkoutRoute) return true;
  if (contract.fulfilmentType === "free_asset") return hasExact(text, ["static", "reference", "case dossier", "reuse value", "limitation"]);
  if (STATIC_REFERENCE.has(contract.productCode) && /static|reference|archived|draft|not released|manual/i.test(text)) return true;
  return false;
}

function groupFor(productCode, contract) {
  if (GROUP_A.has(productCode)) return "A_currently_authority_proven";
  if (GROUP_B.has(productCode)) return "B_legacy_pending_v2";
  if (GROUP_C.has(productCode)) return "C_blocked_under_validation";
  if (DECISION_INFRASTRUCTURE.has(productCode)) return "D_decision_infrastructure";
  if (STATIC_REFERENCE.has(productCode) || contract.fulfilmentType === "free_asset") return "E_static_reference_market_report";
  if (contract.checkoutRoute || contract.adminRoute) return "F_checkout_fulfilment_admin";
  return "estate_product";
}

function deriveCategoryReadiness(rows) {
  if (rows.length !== REQUIRED_PRODUCT_COUNT) return "not_category_ready";
  if (rows.some((row) => ["authority_contract_missing", "checkout_or_fulfilment_risk", "report_surface_risk", "overclaimed", "not_market_ready"].includes(row.currentCoverageClassification))) {
    return "category_infrastructure_present_but_not_visible";
  }
  if (rows.some((row) => row.currentCoverageClassification === "authority_visible_but_thin" || row.currentCoverageClassification === "underwired")) {
    return "category_foundation_ready";
  }
  return "category_defining_ready";
}

function buildImplementationPriorities(rows) {
  const priorities = [];
  if (rows.some((row) => row.currentCoverageClassification === "authority_contract_missing")) priorities.push("Expand ProductAuthorityContract resolution from 4 products to all 43 estate products.");
  if (rows.some((row) => row.currentCoverageClassification === "checkout_or_fulfilment_risk")) priorities.push("Add authority state to every paid checkout and fulfilment path before purchase or release.");
  if (rows.some((row) => row.currentCoverageClassification === "report_surface_risk")) priorities.push("Add authority, evidence, limitation, and next evidence action to reports/dossiers.");
  if (rows.some((row) => row.currentCoverageClassification === "overclaimed")) priorities.push("Make public product claims conditional on rendered authority state.");
  priorities.push("Re-run live route capture after coverage wiring; static coverage cannot grant final category readiness.");
  return priorities;
}

function findRouteProof(productCode) {
  const rows = routeProof?.captures ?? routeProof?.routes ?? routeProof?.results ?? [];
  const match = Array.isArray(rows)
    ? rows.find((row) => JSON.stringify(row).includes(productCode) || JSON.stringify(row).includes(kebab(productCode)))
    : null;
  return match ? "present" : "not_found";
}

function findSurfaceClaimSupport(productCode) {
  const serialized = JSON.stringify(surfaceClaimAudit ?? {});
  const index = serialized.indexOf(productCode);
  return {
    present: index !== -1,
    claimText: index === -1 ? "" : serialized.slice(Math.max(0, index - 160), index + 240),
  };
}

function exactReferenceFiles(productCode, entitlementSlug, routePath) {
  const needles = [productCode, kebab(productCode), entitlementSlug, routePath].filter(Boolean);
  return files.filter((file) => {
    const text = fileText.get(file) ?? "";
    return needles.some((needle) => needle && text.includes(needle));
  });
}

function routeExists(route) {
  return routeToFiles(route).length > 0;
}

function routeToFiles(route) {
  if (!route || route === "Qualified introduction") return [];
  const clean = route.split("→")[0].trim().split("?")[0].replace(/\/$/, "");
  if (!clean.startsWith("/")) return [];
  const candidates = [];
  if (clean.startsWith("/api/")) {
    const apiPath = clean.replace(/^\/api\//, "");
    candidates.push(
      `pages/api/${apiPath}.ts`,
      `pages/api/${apiPath}.tsx`,
      `pages/api/${apiPath}/index.ts`,
      `app/api/${apiPath}/route.ts`,
      `app/api/${apiPath}/route.tsx`,
    );
  } else {
    candidates.push(
      `pages${clean}.tsx`,
      `pages${clean}.ts`,
      `pages${clean}/index.tsx`,
      `pages${clean}/index.ts`,
      `app${clean}/page.tsx`,
      `app${clean}/page.ts`,
    );
    const parts = clean.split("/").filter(Boolean);
    if (parts.length > 1) {
      candidates.push(
        `pages/${parts[0]}/[slug].tsx`,
        `pages/${parts[0]}/[id].tsx`,
        `pages/${parts[0]}/[caseId].tsx`,
        `pages/${parts[0]}/[...slug].tsx`,
        `app/${parts[0]}/[slug]/page.tsx`,
        `app/${parts[0]}/[id]/page.tsx`,
      );
    }
    if (parts.length > 2) {
      candidates.push(
        `pages/${parts[0]}/${parts[1]}/[slug].tsx`,
        `pages/${parts[0]}/${parts[1]}/[id].tsx`,
        `app/${parts[0]}/${parts[1]}/[slug]/page.tsx`,
      );
    }
  }
  return unique(candidates.filter((candidate) => existsSync(join(ROOT, candidate))));
}

function listFiles(roots) {
  const out = [];
  for (const root of roots) walk(join(ROOT, root), out);
  return out.map((file) => relative(ROOT, file).replaceAll("\\", "/"));
}

function walk(dir, out) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || ["node_modules", ".next", ".contentlayer"].includes(entry.name)) continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, out);
    } else if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".mdx"].includes(extname(entry.name))) {
      out.push(absolute);
    }
  }
}

function read(file) {
  try {
    return readFileSync(join(ROOT, file), "utf8");
  } catch {
    return "";
  }
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  } catch {
    return null;
  }
}

function str(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*(?:"([^"]*)"|null)`));
  return match ? (match[1] ?? null) : null;
}

function bool(block, field) {
  const match = block.match(new RegExp(`${field}:\\s*(true|false)`));
  return match ? match[1] === "true" : null;
}

function inferCommercialStatus(productCode) {
  if (/retainer|enterprise|additional_collaborator/.test(productCode)) return "contracted";
  if (/case_dossier|fast|team_assessment|enterprise_assessment|boardroom_mode/.test(productCode)) return "free_controlled";
  return "paid";
}

function inferFulfilmentType(productCode) {
  if (/case_dossier/.test(productCode)) return "free_asset";
  if (/gmi|report/.test(productCode)) return "executive_report_artifact";
  if (/strategy_room/.test(productCode)) return "scheduled_session";
  if (/retainer|professional|enterprise|inner_circle/.test(productCode)) return "retainer_cycle";
  if (/pack|suite/.test(productCode)) return "bundle_grant";
  if (/playbook|protocol|framework/.test(productCode)) return "governed_methodology_run";
  return "interactive_instrument";
}

function hasExact(text, needles) {
  return needles.some((needle) => text.includes(needle));
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function kebab(value) {
  return String(value).replaceAll("_", "-");
}

function titleize(value) {
  return String(value).split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function excerpt(text) {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.slice(0, 500);
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function renderMarkdown(report) {
  const lines = [
    "# Product Authority Coverage Matrix",
    "",
    "## Gate Result",
    "",
    `Gate: ${report.gate}`,
    "",
    `Products reviewed: ${report.productsReviewed}/${report.requiredProductCount}`,
    "",
    `Category readiness state: ${report.categoryReadinessState}`,
    "",
    `Market adoption state: ${report.marketAdoptionState}`,
    "",
    "## Classification Counts",
    "",
    ...Object.entries(report.classificationCounts).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Estate-Wide Success Criteria",
    "",
    ...Object.entries(report.estateWideSuccessCriteria).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Coverage Matrix",
    "",
    "| Product | Name | Authority State | Route | Checkout | Report | Admin | Contract | Authority | Evidence | Limitation | Next Evidence | Blocking | Risk | Falsification | Classification | Required Next Action |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...report.products.map((row) => `| ${row.productCode} | ${escapeMd(row.productName)} | ${row.currentAuthorityState} | ${yes(row.routeExists)} | ${yes(row.checkoutPathExists)} | ${yes(row.reportSurfaceExists)} | ${yes(row.adminSurfaceExists)} | ${yes(row.productAuthorityContractExists)} | ${yes(row.authorityVisiblyRendered)} | ${yes(row.evidenceStateVisiblyRendered)} | ${yes(row.limitationVisiblyRendered)} | ${yes(row.nextEvidenceActionVisiblyRendered)} | ${yes(row.unsupportedClaimBlockingVisible)} | ${yes(row.decisionRiskVisible)} | ${yes(row.falsificationTriggerVisible)} | ${row.currentCoverageClassification} | ${escapeMd(row.requiredNextAction)} |`),
    "",
    "## Implementation Priorities",
    "",
    ...report.implementationPriorities.map((item) => `- ${item}`),
  ];
  return `${lines.join("\n")}\n`;
}

function yes(value) {
  return value ? "yes" : "no";
}

function escapeMd(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}
