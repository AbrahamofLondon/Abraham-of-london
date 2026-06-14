#!/usr/bin/env node

/**
 * Generate Product Moat Capability Matrix
 *
 * Resolves all 43 products to their moat activation modes and generates capability matrix.
 * This is the authoritative source for which products can access which moat engines.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const PRODUCTS_CONTRACT_PATH = path.join(
  rootDir,
  "data",
  "ProductAuthorityContract.json"
);
const GOVERNANCE_MATRIX_PATH = path.join(
  rootDir,
  "reports",
  "product-release-governance-matrix.json"
);
const READINESS_MATRIX_PATH = path.join(
  rootDir,
  "reports",
  "product-release-readiness-matrix.json"
);

const OUTPUT_JSON = path.join(
  rootDir,
  "reports",
  "product-moat-capability-matrix.json"
);
const OUTPUT_MD = path.join(
  rootDir,
  "reports",
  "product-moat-capability-matrix.md"
);

// Load all data files
let productContract = {};
let governanceMatrix = {};
let readinessMatrix = {};

try {
  if (fs.existsSync(PRODUCTS_CONTRACT_PATH)) {
    productContract = JSON.parse(
      fs.readFileSync(PRODUCTS_CONTRACT_PATH, "utf-8")
    );
  }
  if (fs.existsSync(GOVERNANCE_MATRIX_PATH)) {
    governanceMatrix = JSON.parse(
      fs.readFileSync(GOVERNANCE_MATRIX_PATH, "utf-8")
    );
  }
  if (fs.existsSync(READINESS_MATRIX_PATH)) {
    readinessMatrix = JSON.parse(
      fs.readFileSync(READINESS_MATRIX_PATH, "utf-8")
    );
  }
} catch (error) {
  console.error("Failed to load required data files:", error);
  process.exit(1);
}

// Get all product codes
const allProductCodes = Object.keys(productContract).sort();

if (allProductCodes.length === 0) {
  console.error("No products found in ProductAuthorityContract");
  process.exit(1);
}

// Generate capability matrix
const capabilityMatrix = {
  generatedAt: new Date().toISOString(),
  totalProducts: allProductCodes.length,
  statistics: {
    activeMemoryWrite: 0,
    passiveContextRead: 0,
    prewiredPendingEvidence: 0,
    auditOnlyBlocked: 0,
    internalOnly: 0,
  },
  products: {},
};

// Process each product
for (const productCode of allProductCodes) {
  const contract = productContract[productCode];
  const readiness = readinessMatrix[productCode];
  const governance = governanceMatrix[productCode];

  if (!readiness) {
    console.warn(`Product ${productCode} missing from readiness matrix`);
    continue;
  }

  // Determine activation mode
  let activationMode = "passive_context_read";

  const readinessStatus = readiness.readinessStatus || "unknown";
  const authorityState = contract?.currentAuthorityState || "unknown";

  if (readinessStatus === "blocked") {
    activationMode = "audit_only_blocked";
  } else if (readinessStatus === "release_ready_now") {
    activationMode = "active_memory_write";
  } else if (readinessStatus === "future_ready_for_evidence_path") {
    activationMode = "prewired_pending_evidence";
  }

  // Get capabilities based on activation mode
  const capabilities = getCapabilitiesForMode(activationMode);

  // Build boundary description
  const boundaryDescription = buildBoundaryDescription(
    productCode,
    readinessStatus,
    activationMode,
    authorityState
  );

  // Next activation requirement
  const nextActivationRequirement = getNextActivationRequirement(
    activationMode
  );

  const record = {
    productCode,
    productName: readiness.productName || productCode,
    activationMode,
    capabilities: {
      canReadStrategicTwin: capabilities.canReadStrategicTwin,
      canWriteDecisionMemory: capabilities.canWriteDecisionMemory,
      canUpdateStrategicTwin: capabilities.canUpdateStrategicTwin,
      canTriggerConsequenceVerification:
        capabilities.canTriggerConsequenceVerification,
      canRunInterventionCalibration:
        capabilities.canRunInterventionCalibration,
      canRecommendNextProduct: capabilities.canRecommendNextProduct,
      canCreateReportingOutput: capabilities.canCreateReportingOutput,
    },
    governance: {
      authorityState,
      readinessStatus,
      releaseLane: governance?.releaseLane || readiness.releaseLane || "unknown",
      releaseMode: governance?.releaseMode || "unknown",
    },
    boundaries: {
      boundaryRequired: capabilities.boundaryRequired,
      boundaryDescription,
      nextActivationRequirement,
    },
  };

  capabilityMatrix.products[productCode] = record;

  // Increment statistics with snake_case key
  const statKey = activationMode
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
  capabilityMatrix.statistics[statKey] =
    (capabilityMatrix.statistics[statKey] || 0) + 1;
}

// Write JSON
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(capabilityMatrix, null, 2));

// Generate markdown report
const markdown = generateMarkdownReport(capabilityMatrix);
fs.writeFileSync(OUTPUT_MD, markdown);

console.log(`✓ Product Moat Capability Matrix generated`);
console.log(`  Total products: ${capabilityMatrix.totalProducts}`);
console.log(
  `  Active memory write: ${capabilityMatrix.statistics.active_memory_write || 0}`
);
console.log(
  `  Prewired pending: ${capabilityMatrix.statistics.prewired_pending_evidence || 0}`
);
console.log(`  Audit-only blocked: ${capabilityMatrix.statistics.audit_only_blocked || 0}`);
console.log(`  Output: ${OUTPUT_JSON}`);
console.log(`  Report: ${OUTPUT_MD}`);

// ============================================================================
// HELPERS
// ============================================================================

function getCapabilitiesForMode(mode) {
  const defaults = {
    active_memory_write: {
      canReadStrategicTwin: true,
      canWriteDecisionMemory: true,
      canUpdateStrategicTwin: true,
      canTriggerConsequenceVerification: true,
      canRunInterventionCalibration: true,
      canRecommendNextProduct: true,
      canCreateReportingOutput: true,
      boundaryRequired: true,
    },
    passive_context_read: {
      canReadStrategicTwin: true,
      canWriteDecisionMemory: false,
      canUpdateStrategicTwin: false,
      canTriggerConsequenceVerification: false,
      canRunInterventionCalibration: false,
      canRecommendNextProduct: false,
      canCreateReportingOutput: false,
      boundaryRequired: true,
    },
    prewired_pending_evidence: {
      canReadStrategicTwin: false,
      canWriteDecisionMemory: false,
      canUpdateStrategicTwin: false,
      canTriggerConsequenceVerification: false,
      canRunInterventionCalibration: false,
      canRecommendNextProduct: false,
      canCreateReportingOutput: false,
      boundaryRequired: false,
    },
    audit_only_blocked: {
      canReadStrategicTwin: false,
      canWriteDecisionMemory: false,
      canUpdateStrategicTwin: false,
      canTriggerConsequenceVerification: false,
      canRunInterventionCalibration: false,
      canRecommendNextProduct: false,
      canCreateReportingOutput: false,
      boundaryRequired: false,
    },
    internal_only: {
      canReadStrategicTwin: true,
      canWriteDecisionMemory: false,
      canUpdateStrategicTwin: false,
      canTriggerConsequenceVerification: false,
      canRunInterventionCalibration: false,
      canRecommendNextProduct: false,
      canCreateReportingOutput: false,
      boundaryRequired: false,
    },
  };

  return defaults[mode] || defaults.passive_context_read;
}

function buildBoundaryDescription(productCode, readinessStatus, activationMode, authorityState) {
  const parts = [];

  if (activationMode === "active_memory_write") {
    parts.push(
      "Product may write governed memory, update Strategic Twin, and run interventions. No authority is granted."
    );
  } else if (activationMode === "passive_context_read") {
    parts.push(
      "Product may read context and patterns. Writes blocked until readiness is satisfied."
    );
  } else if (activationMode === "prewired_pending_evidence") {
    parts.push(
      "Product is prewired for future activation. Write access blocked pending evidence gates."
    );
  } else if (activationMode === "audit_only_blocked") {
    parts.push(
      "Product is blocked. Only audit-safe refusal recording permitted."
    );
  }

  return parts.join(" ");
}

function getNextActivationRequirement(activationMode) {
  const requirements = {
    active_memory_write: undefined,
    passive_context_read:
      "Advance readiness status to release_ready_now or future_ready_for_evidence_path",
    prewired_pending_evidence:
      "Complete evidence collection and satisfy readiness gates",
    audit_only_blocked: "Resolve blocking condition and advance readiness",
    internal_only: undefined,
  };

  return requirements[activationMode];
}

function generateMarkdownReport(matrix) {
  let md = `# Product Moat Capability Matrix\n\n`;

  md += `**Generated:** ${matrix.generatedAt}\n\n`;

  md += `## Summary\n\n`;
  md += `| Category | Count |\n`;
  md += `|----------|-------|\n`;
  md += `| Total Products | ${matrix.totalProducts} |\n`;
  md += `| Active Memory Write | ${matrix.statistics.activeMemoryWrite} |\n`;
  md += `| Prewired Pending Evidence | ${matrix.statistics.prewiredPendingEvidence} |\n`;
  md += `| Audit-Only Blocked | ${matrix.statistics.auditOnlyBlocked} |\n\n`;

  md += `## Active Memory Write Products (${matrix.statistics.activeMemoryWrite})\n\n`;
  md += `These products can actively write governed decision memory.\n\n`;

  const activeProducts = Object.values(matrix.products).filter(
    (p) => p.activationMode === "active_memory_write"
  );
  activeProducts.forEach((p) => {
    md += `- **${p.productCode}** (${p.productName})\n`;
  });

  md += `\n## Prewired Pending Evidence (${matrix.statistics.prewiredPendingEvidence})\n\n`;
  md += `These products are wired for future activation when evidence gates pass.\n\n`;

  const prewiredProducts = Object.values(matrix.products).filter(
    (p) => p.activationMode === "prewired_pending_evidence"
  );
  if (prewiredProducts.length > 0) {
    md += `Products: ${prewiredProducts.map((p) => p.productCode).join(", ")}\n\n`;
  }

  md += `\n## Audit-Only Blocked (${matrix.statistics.auditOnlyBlocked})\n\n`;
  md += `These products cannot write to moat engines.\n\n`;

  const blockedProducts = Object.values(matrix.products).filter(
    (p) => p.activationMode === "audit_only_blocked"
  );
  blockedProducts.forEach((p) => {
    md += `- **${p.productCode}** (${p.productName})\n`;
  });

  md += `\n## Capability Details\n\n`;
  md += `See \`product-moat-capability-matrix.json\` for complete capability details per product.\n`;

  return md;
}
