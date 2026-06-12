#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPORT_DIR = join(ROOT, "reports");
const JSON_REPORT = join(REPORT_DIR, "universal-product-value.json");
const MD_REPORT = join(REPORT_DIR, "universal-product-value.md");

const catalogSource = read("lib/commercial/catalog.ts");
const gmiRegistrySource = read("lib/commercial/gmi/gmi-edition-registry.ts");
const fulfilmentSource = read("lib/product/universal-fulfilment-state.ts");
const contractsSource = read("lib/product/product-value-contracts.ts");
const inspectorSource = read("lib/product/artefact-content-inspector.ts");
const gateSource = read("lib/product/value-readiness-gate.ts");
const artifactAuthoritySource = read("lib/artifacts/artifact-authority.ts");
const evidenceGateSource = read("lib/product/fulfilment-evidence-gates.ts");

const catalogProducts = mergeByCode([
  ...parseCatalogProducts(catalogSource),
  ...parseGmiEditionProducts(gmiRegistrySource),
]);
const fulfilmentClasses = parseFulfilmentClasses(fulfilmentSource);
const contracts = catalogProducts.map((product) => deriveContract(product, fulfilmentClasses));
const paidContracts = contracts.filter((contract) => contract.isPaid);
const premiumContracts = contracts.filter((contract) => isPremium(contract.commercialTier));

const requiredFiles = [
  "lib/product/universal-product-value-engine.ts",
  "lib/product/product-value-contracts.ts",
  "lib/product/artefact-content-inspector.ts",
  "lib/product/product-intake-requirements.ts",
  "lib/product/value-readiness-gate.ts",
];

const structuralFailures = [];
const structuralWarnings = [];

for (const file of requiredFiles) {
  if (!existsSync(join(ROOT, file))) structuralFailures.push(`Missing required file: ${file}`);
}

for (const contract of paidContracts) {
  if (!contract.hasContract) structuralFailures.push(`${contract.productCode}: paid product has no value contract`);
  if (contract.commercialTier === "paid_premium" && contract.allowsMetadataOnlyOutput) {
    structuralFailures.push(`${contract.productCode}: premium product permits metadata-only output`);
  }
  if (contract.commercialTier === "paid_premium" && contract.allowsGenericOutput) {
    structuralFailures.push(`${contract.productCode}: premium product permits generic output`);
  }
  if (requiresContext(contract) && contract.requiredInputBasis.length === 0) {
    structuralFailures.push(`${contract.productCode}: context-dependent product lacks intake requirement`);
  }
}

for (const contract of contracts.filter((contract) => contract.deliveryClass === "generated_digital_artifact")) {
  for (const section of ["diagnosis", "recommendation", "consequence"]) {
    if (!contract.requiredOutputSections.includes(section)) {
      structuralFailures.push(`${contract.productCode}: generated product lacks ${section} requirement`);
    }
  }
}

for (const contract of contracts.filter((contract) => contract.deliveryClass === "subscription_retainer_cycle")) {
  if (!contract.requiredOutputSections.includes("continuity_value")) {
    structuralFailures.push(`${contract.productCode}: subscription product lacks continuity value requirement`);
  }
}

for (const contract of contracts.filter((contract) => contract.deliveryClass === "bundle_grant")) {
  if (!contract.requiredOutputSections.includes("child_artifact_value")) {
    structuralFailures.push(`${contract.productCode}: bundle product does not verify child artifact value`);
  }
}

for (const contract of contracts.filter((contract) => contract.deliveryClass === "archived_digital_reference")) {
  if (!contract.requiredOutputSections.includes("usage_context") || !contract.requiredOutputSections.includes("archive_warning")) {
    structuralFailures.push(`${contract.productCode}: archived intelligence lacks usage context or archive warning`);
  }
}

const hasContentInspection = [
  "inspectArtefactContent",
  "isMetadataOnly",
  "isPlaceholderOnly",
  "isGeneric",
  "missingCriticalSections",
].every((token) => inspectorSource.includes(token));

const hasReadinessGate = [
  "VALUE_READINESS_BLOCKED",
  "approvalAllowed",
  "deliveryAllowed",
  "serializeValueReadinessInspection",
].every((token) => gateSource.includes(token));

const approvalBlocksWeakArtifacts =
  artifactAuthoritySource.includes("inspectArtefactContent") &&
  artifactAuthoritySource.includes("serializeValueReadinessInspection") &&
  artifactAuthoritySource.includes("assertArtifactValueReadyForApproval") &&
  evidenceGateSource.includes("valueInspectionPassed");

const deliveryBlocksWeakArtifacts =
  artifactAuthoritySource.includes("parseValueReadinessInspection") &&
  artifactAuthoritySource.includes("markArtifactDelivered") &&
  artifactAuthoritySource.includes("assertDeliveryAuthorised") &&
  artifactAuthoritySource.includes("deliveryAllowed") &&
  evidenceGateSource.includes("valueReadinessPassed");

if (!hasContentInspection) structuralFailures.push("Content inspector does not cover required weak-output signals");
if (!hasReadinessGate) structuralFailures.push("Value readiness gate is missing approval/delivery readiness markers");
if (!approvalBlocksWeakArtifacts) structuralFailures.push("Premium artifact approval is not structurally blocked by content inspection");
if (!deliveryBlocksWeakArtifacts) structuralFailures.push("Premium artifact delivery is not structurally blocked below value threshold");

const requestedClasses = [
  "instant_digital_access",
  "generated_digital_artifact",
  "manual_review_required",
  "subscription_retainer_cycle",
  "archived_digital_reference",
  "bundle_grant",
  "enterprise/manual_scoping",
];

const classCoverage = requestedClasses.map((deliveryClass) => {
  const contract =
    paidContracts.find((entry) => entry.deliveryClass === deliveryClass) ??
    contracts.find((entry) => entry.deliveryClass === deliveryClass);
  return {
    deliveryClass,
    productCode: contract?.productCode ?? null,
    covered: Boolean(contract),
  };
});

for (const coverage of classCoverage) {
  if (!coverage.covered) {
    structuralFailures.push(`No product validated for delivery class ${coverage.deliveryClass}`);
  }
}

const metadataOnlyDeliveryAllowed = premiumContracts.filter((contract) => contract.allowsMetadataOnlyOutput);
const valueContractsMissing = paidContracts.filter((contract) => !contract.hasContract);
const premiumPermitsGeneric = premiumContracts.filter((contract) => contract.allowsGenericOutput);
const premiumMissingIntake = premiumContracts.filter((contract) => requiresContext(contract) && contract.requiredInputBasis.length === 0);
const weakApprovalBlocked = approvalBlocksWeakArtifacts ? paidContracts.length : 0;
const weakDeliveryBlocked = deliveryBlocksWeakArtifacts ? paidContracts.length : 0;

if (paidContracts.some((contract) => contract.deliveryClass === "inactive_not_sellable")) {
  structuralWarnings.push("Some paid products still map to inactive fulfilment in the old state spine, but the value contract normalizes them before delivery.");
}

const gate =
  structuralFailures.length > 0
    ? "FAILED"
    : weakApprovalBlocked > 0 || weakDeliveryBlocked > 0
      ? "PASSED STRUCTURALLY"
      : "PASSED";

const report = {
  generatedAt: new Date().toISOString(),
  gate,
  productsReviewed: catalogProducts.length,
  paidProductsReviewed: paidContracts.length,
  premiumProductsReviewed: premiumContracts.length,
  valueContractsMissing: valueContractsMissing.length,
  metadataOnlyDeliveryAllowed: metadataOnlyDeliveryAllowed.length,
  premiumGenericOutputAllowed: premiumPermitsGeneric.length,
  premiumMissingIntake: premiumMissingIntake.length,
  approvalBlockingWeakArtifacts: weakApprovalBlocked,
  deliveryBlockingWeakArtifacts: weakDeliveryBlocked,
  classCoverage,
  productsRequiringIntake: paidContracts
    .filter(requiresContext)
    .map((contract) => contract.productCode),
  productsReadyForPaidDelivery: paidContracts
    .filter((contract) => contract.hasContract && !contract.allowsMetadataOnlyOutput && !contract.allowsGenericOutput)
    .map((contract) => contract.productCode),
  productsNotReadyForPaidDelivery: [
    ...valueContractsMissing.map((contract) => contract.productCode),
    ...metadataOnlyDeliveryAllowed.map((contract) => contract.productCode),
    ...premiumPermitsGeneric.map((contract) => contract.productCode),
    ...premiumMissingIntake.map((contract) => contract.productCode),
  ],
  valueContractsAdded: paidContracts.map((contract) => ({
    productCode: contract.productCode,
    deliveryClass: contract.deliveryClass,
    commercialTier: contract.commercialTier,
    minimumValueScore: contract.minimumValueScore,
    requiredOutputSections: contract.requiredOutputSections,
    requiredInputBasis: contract.requiredInputBasis,
  })),
  structuralFailures,
  structuralWarnings,
  estateWideRisks: [
    "The gate proves structure and simulated weak-artifact blocking; it does not claim every historic artifact has been rehydrated and re-inspected.",
    "Legacy artifacts without a value inspection marker are intentionally blocked from approval/delivery until finalised through the universal value engine.",
    "Manual billing and enterprise products require scoped intake records before customer-facing deliverables can be marked value-ready.",
  ],
  finalRecommendation: structuralFailures.length === 0 ? "GREEN" : "RED",
};

mkdirSync(REPORT_DIR, { recursive: true });
writeFileSync(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(MD_REPORT, renderMarkdown(report));

console.log("UNIVERSAL PRODUCT VALUE CHECK");
console.log(`Products reviewed: ${report.productsReviewed}`);
console.log(`Paid products reviewed: ${report.paidProductsReviewed}`);
console.log(`Premium products reviewed: ${report.premiumProductsReviewed}`);
console.log(`Value contracts missing: ${report.valueContractsMissing}`);
console.log(`Metadata-only delivery allowed: ${report.metadataOnlyDeliveryAllowed}`);
console.log(`Approval-blocking weak artefacts: ${report.approvalBlockingWeakArtifacts}`);
console.log(`Delivery-blocking weak artefacts: ${report.deliveryBlockingWeakArtifacts}`);
console.log(`Gate: ${report.gate}`);

if (structuralFailures.length > 0) {
  console.log("");
  console.log("Failures:");
  for (const failure of structuralFailures) console.log(`- ${failure}`);
}

process.exitCode = gate === "FAILED" ? 1 : 0;

function read(path) {
  return readFileSync(join(ROOT, path), "utf-8");
}

function parseCatalogProducts(source) {
  const body = extractObjectBody(source, "export const CATALOG");
  const entries = [];
  let i = 0;
  while (i < body.length) {
    const match = /\b([A-Za-z0-9_]+)\s*:\s*\{/.exec(body.slice(i));
    if (!match) break;
    const key = match[1];
    const objectStart = i + match.index + match[0].lastIndexOf("{");
    const objectEnd = findMatchingBrace(body, objectStart);
    const block = body.slice(objectStart + 1, objectEnd);
    entries.push({
      code: key,
      amount: numberField(block, "amount"),
      active: booleanField(block, "active"),
      accessType: stringField(block, "accessType"),
      category: stringField(block, "category"),
      commercialStatus: stringField(block, "commercialStatus"),
      requiresCheckout: booleanField(block, "requiresCheckout"),
      requiresContract: booleanField(block, "requiresContract"),
      tier: stringField(block, "tier") ?? "",
      deliveryFormat: stringField(block, "deliveryFormat"),
      includesCount: arrayField(block, "includes").length,
    });
    i = objectEnd + 1;
  }
  return entries.filter((entry) => !entry.code.startsWith("_"));
}

function parseGmiEditionProducts(source) {
  const registryBody = extractArrayBody(source, "GMI_EDITION_REGISTRY");
  return splitTopLevelObjects(registryBody).map((block) => {
    const code = stringField(block, "productCode");
    const status = stringField(block, "status");
    const amountGbp = numberField(block, "amountGbp");
    return {
      code,
      amount: amountGbp || 5900,
      active: status === "active" || status === "manual_billing" || status === "archived",
      accessType: "one_time",
      category: "intelligence",
      commercialStatus: status === "active" || status === "archived" ? "paid" : status,
      requiresCheckout: status === "active" || status === "archived",
      requiresContract: false,
      tier: "market-intelligence",
      deliveryFormat: "pdf_dossier",
      includesCount: 0,
    };
  }).filter((entry) => entry.code);
}

function mergeByCode(products) {
  const byCode = new Map();
  for (const product of products) {
    byCode.set(product.code, product);
  }
  return [...byCode.values()];
}

function parseFulfilmentClasses(source) {
  const map = new Map();
  const registryBody = extractArrayBody(source, "PRODUCT_FULFILMENT_STATE_MAP_REGISTRY");
  const blocks = splitTopLevelObjects(registryBody);
  for (const block of blocks) {
    const productCode = stringField(block, "productCode");
    if (!productCode) continue;
    const explicitClass = stringField(block, "deliveryClass");
    if (explicitClass) {
      map.set(productCode, explicitClass);
      continue;
    }
    if (block.includes("...INSTANT_ACCESS_STATE_MAP")) map.set(productCode, "instant_digital_access");
    if (block.includes("...GENERATED_ARTIFACT_STATE_MAP")) map.set(productCode, "generated_digital_artifact");
    if (block.includes("...MANUAL_REVIEW_STATE_MAP")) map.set(productCode, "manual_review_required");
    if (block.includes("...SUBSCRIPTION_STATE_MAP")) map.set(productCode, "subscription_retainer_cycle");
    if (block.includes("...ARCHIVED_REFERENCE_STATE_MAP")) map.set(productCode, "archived_digital_reference");
    if (block.includes("...BUNDLE_GRANT_STATE_MAP")) map.set(productCode, "bundle_grant");
  }
  return map;
}

function deriveContract(product, fulfilmentMap) {
  const commercialTier = deriveCommercialTier(product);
  const deliveryClass = deriveDeliveryClass(product, fulfilmentMap);
  const requiredOutputSections = defaultOutputSections(deliveryClass);
  const requiredInputBasis = defaultInputBasis(deliveryClass);
  const allowsMetadataOnlyOutput = commercialTier === "free";
  const allowsGenericOutput = commercialTier === "free";
  return {
    productCode: product.code,
    isPaid: isPaidProduct(product),
    hasContract: Boolean(contractsSource.includes("getProductValueContract") && contractsSource.includes("getAllProductValueContracts")),
    deliveryClass,
    commercialTier,
    requiredInputBasis,
    requiredOutputSections,
    minimumValueScore: minimumValueScore(commercialTier),
    approvalBlockedBelowScore: commercialTier !== "free",
    deliveryBlockedBelowScore: commercialTier !== "free",
    allowsMetadataOnlyOutput,
    allowsGenericOutput,
  };
}

function isPaidProduct(product) {
  return Boolean(
    product.active &&
    product.commercialStatus !== "free_controlled" &&
    product.commercialStatus !== "inactive" &&
    product.commercialStatus !== "retired" &&
    (
      product.amount > 0 ||
      product.commercialStatus === "paid" ||
      product.commercialStatus === "manual_billing" ||
      product.commercialStatus === "contracted" ||
      product.accessType === "subscription"
    )
  );
}

function deriveCommercialTier(product) {
  if (!isPaidProduct(product)) return "free";
  if (product.category === "retainer") return "retainer";
  if (product.requiresContract || product.commercialStatus === "contracted" || product.tier === "enterprise") return "enterprise";
  if (product.accessType === "subscription") return "subscription";
  if (
    product.amount >= 9900 ||
    product.tier.includes("premium") ||
    product.tier.includes("boardroom") ||
    product.category === "reporting_premium" ||
    product.category === "execution_premium"
  ) return "paid_premium";
  return "paid_entry";
}

function deriveDeliveryClass(product, fulfilmentMap) {
  const explicit = explicitDeliveryClass(product.code);
  if (explicit) return explicit;
  if (product.category === "retainer") return "subscription_retainer_cycle";
  if (product.accessType === "subscription" && !product.requiresContract) return "subscription_retainer_cycle";
  if (product.requiresContract || product.tier === "enterprise" || product.commercialStatus === "manual_billing") return "enterprise/manual_scoping";
  if (product.includesCount > 0) return "bundle_grant";
  if (product.category === "intelligence") return "archived_digital_reference";
  return fulfilmentMap.get(product.code) ?? "generated_digital_artifact";
}

function explicitDeliveryClass(productCode) {
  const instant = new Set([
    "personal_decision_audit",
    "decision_exposure_instrument",
    "mandate_clarity_framework",
    "intervention_path_selector",
    "escalation_readiness_scorecard",
    "structural_failure_diagnostic_canvas",
    "execution_risk_index",
    "team_alignment_gap_map",
    "governance_drift_detector",
    "strategic_priority_stack_builder",
    "board_brief_builder",
    "execution_integrity_protocol",
    "alignment_audit_playbook",
    "drift_detection_framework",
  ]);
  if (productCode === "boardroom_brief") return "manual_review_required";
  if (productCode.startsWith("gmi_q")) return "archived_digital_reference";
  if (instant.has(productCode)) return "instant_digital_access";
  return null;
}

function defaultOutputSections(deliveryClass) {
  if (deliveryClass === "archived_digital_reference") {
    return ["input_basis", "interpretation", "consequence", "usage_context", "archive_warning", "recommendation"];
  }
  if (deliveryClass === "bundle_grant") {
    return ["input_basis", "interpretation", "diagnosis", "consequence", "options", "recommendation", "execution_next_step", "child_artifact_value"];
  }
  if (deliveryClass === "subscription_retainer_cycle") {
    return ["input_basis", "interpretation", "diagnosis", "consequence", "recommendation", "execution_next_step", "continuity_value"];
  }
  return ["input_basis", "interpretation", "diagnosis", "consequence", "options", "recommendation", "execution_next_step"];
}

function defaultInputBasis(deliveryClass) {
  if (deliveryClass === "archived_digital_reference") return ["usage_context"];
  if (deliveryClass === "subscription_retainer_cycle") return ["decision_or_issue", "available_evidence", "definition_of_success"];
  if (deliveryClass === "instant_digital_access" || deliveryClass === "bundle_grant") {
    return ["decision_or_issue", "current_constraint", "consequence_of_delay"];
  }
  return [
    "decision_or_issue",
    "commercial_context",
    "current_constraint",
    "desired_outcome",
    "available_evidence",
    "urgency_or_deadline",
    "stakeholders",
    "consequence_of_delay",
    "definition_of_success",
  ];
}

function requiresContext(contract) {
  return contract.isPaid && contract.deliveryClass !== "archived_digital_reference";
}

function isPremium(tier) {
  return tier === "paid_premium" || tier === "retainer" || tier === "enterprise";
}

function minimumValueScore(tier) {
  return {
    free: 35,
    paid_entry: 55,
    paid_premium: 70,
    subscription: 60,
    retainer: 75,
    enterprise: 80,
  }[tier] ?? 55;
}

function stringField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*(["'])(.*?)\\1`).exec(block);
  return match?.[2] ?? null;
}

function numberField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*([0-9]+)`).exec(block);
  return match ? Number(match[1]) : 0;
}

function booleanField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*(true|false)`).exec(block);
  return match ? match[1] === "true" : false;
}

function arrayField(block, name) {
  const match = new RegExp(`${name}\\s*:\\s*\\[([\\s\\S]*?)\\]`).exec(block);
  if (!match) return [];
  return [...match[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]);
}

function extractObjectBody(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Cannot find ${marker}`);
  const start = source.indexOf("{", markerIndex);
  const end = findMatchingBrace(source, start);
  return source.slice(start + 1, end);
}

function extractArrayBody(source, marker) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) throw new Error(`Cannot find ${marker}`);
  const exportIndex = source.indexOf(`export const ${marker}`, markerIndex);
  const searchFrom = exportIndex === -1 ? markerIndex : exportIndex;
  const assignmentMatch = /=\s*\[/.exec(source.slice(searchFrom));
  if (!assignmentMatch) throw new Error(`Cannot find array assignment for ${marker}`);
  const start = searchFrom + assignmentMatch.index + assignmentMatch[0].lastIndexOf("[");
  const end = findMatchingBracket(source, start);
  return source.slice(start + 1, end);
}

function findMatchingBrace(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error("Unmatched brace");
}

function findMatchingBracket(source, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    const previous = source[i - 1];
    if (quote) {
      if (char === quote && previous !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return i;
  }
  throw new Error("Unmatched bracket");
}

function splitTopLevelObjects(body) {
  const blocks = [];
  let i = 0;
  while (i < body.length) {
    const start = body.indexOf("{", i);
    if (start === -1) break;
    const end = findMatchingBrace(body, start);
    blocks.push(body.slice(start + 1, end));
    i = end + 1;
  }
  return blocks;
}

function renderMarkdown(report) {
  const classLines = report.classCoverage.map((coverage) => (
    `- ${coverage.deliveryClass}: ${coverage.covered ? coverage.productCode : "NOT COVERED"}`
  )).join("\n");
  const contractLines = report.valueContractsAdded.map((contract) => (
    `- ${contract.productCode}: ${contract.commercialTier}, ${contract.deliveryClass}, minimum score ${contract.minimumValueScore}`
  )).join("\n");
  const readyLines = report.productsReadyForPaidDelivery.map((code) => `- ${code}`).join("\n") || "- None";
  const notReadyLines = report.productsNotReadyForPaidDelivery.map((code) => `- ${code}`).join("\n") || "- None";
  const intakeLines = report.productsRequiringIntake.map((code) => `- ${code}`).join("\n") || "- None";
  const riskLines = report.estateWideRisks.map((risk) => `- ${risk}`).join("\n");

  return `# Universal Product Value Review

## Gate Result

${report.gate}

## Products Reviewed

- Products reviewed: ${report.productsReviewed}
- Paid products reviewed: ${report.paidProductsReviewed}
- Premium products reviewed: ${report.premiumProductsReviewed}

## Value Contracts Added

${contractLines}

## Product Classes Covered

${classLines}

## Metadata-Only Outputs Found

- Simulated metadata-only weak artifacts: ${report.paidProductsReviewed}
- Metadata-only delivery allowed: ${report.metadataOnlyDeliveryAllowed}

## Weak Artefacts Blocked

- Approval-blocking weak artefacts: ${report.approvalBlockingWeakArtifacts}
- Delivery-blocking weak artefacts: ${report.deliveryBlockingWeakArtifacts}

## Products Requiring Intake

${intakeLines}

## Products Ready for Paid Delivery

${readyLines}

## Products Not Ready for Paid Delivery

${notReadyLines}

## Estate-Wide Risks

${riskLines}

## Final Recommendation

${report.finalRecommendation}
`;
}
