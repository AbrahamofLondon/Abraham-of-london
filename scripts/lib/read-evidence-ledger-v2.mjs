/**
 * scripts/lib/read-evidence-ledger-v2.mjs
 *
 * Shared Evidence Ledger v2 Reader
 *
 * All authority gates must read v2 evidence from this canonical location:
 * reports/product-value-evidence-ledger-v2.json
 *
 * This module provides a single source of truth for v2 evidence validation.
 */

import { readFileSync } from "fs";
import { join } from "path";

const LEDGER_PATH = join(process.cwd(), "reports", "product-value-evidence-ledger-v2.json");

/**
 * Read the canonical Evidence Ledger v2
 */
export function readEvidenceLedgerV2() {
  try {
    const content = readFileSync(LEDGER_PATH, "utf-8");
    const ledger = JSON.parse(content);

    // Support both single record and array of records
    if (Array.isArray(ledger)) {
      return ledger;
    }
    return [ledger];
  } catch (e) {
    return [];
  }
}

/**
 * Find evidence record for a specific product
 */
export function findProductEvidenceLedgerV2(productCode) {
  const records = readEvidenceLedgerV2();
  return records.find(r => r.productCode === productCode) || null;
}

/**
 * Validate v2 evidence quality for a product
 */
export function hasValidV2Evidence(productCode) {
  const record = findProductEvidenceLedgerV2(productCode);
  const blockingReasons = [];

  if (!record) {
    return {
      valid: false,
      record: null,
      blockingReasons: ["No Evidence Ledger v2 record found for product"]
    };
  }

  // Validate record structure
  if (!record.productCode || record.productCode !== productCode) {
    blockingReasons.push("Product code mismatch in evidence ledger");
  }

  if (!record.ledgerEntryHash) {
    blockingReasons.push("Ledger entry hash missing");
  }

  if (!record.scenarioSetHash) {
    blockingReasons.push("Scenario set hash missing");
  }

  if (!record.outputHash) {
    blockingReasons.push("Output hash missing");
  }

  if (record.renderedOutputCaptured !== true) {
    blockingReasons.push("Rendered output not captured");
  }

  // Validate test results
  if (!record.testsRun) {
    blockingReasons.push("Test results missing");
  } else {
    const requiredTests = [
      "decisionForce",
      "antiToy",
      "redTeam",
      "genericAiComparison",
      "marketComparison"
    ];

    for (const test of requiredTests) {
      if (!record.testsRun[test]) {
        blockingReasons.push(`Required test missing: ${test}`);
      } else if (record.testsRun[test].passed !== true) {
        blockingReasons.push(`Required test failed: ${test}`);
      }
    }
  }

  // Validate measurement boundaries
  if (record.productChangedThisPass === true) {
    blockingReasons.push("Product logic changed during validation");
  }
  if (record.scorerChangedThisPass === true) {
    blockingReasons.push("Scorer logic changed during validation");
  }
  if (record.scenarioChangedThisPass === true) {
    blockingReasons.push("Scenarios changed during validation");
  }
  if (record.benchmarkChangedThisPass === true) {
    blockingReasons.push("Benchmark changed during validation");
  }
  if (record.validationInfrastructureChangedThisPass === true) {
    blockingReasons.push("Validation infrastructure changed during validation");
  }

  // Validate result
  if (record.result && record.result !== "passed") {
    blockingReasons.push(`Validation result: ${record.result}`);
  }

  // Validate authority
  if (!record.authorityGranted || record.authorityGranted.length === 0) {
    blockingReasons.push("No authority granted in ledger");
  }

  if (record.blockingReasons && record.blockingReasons.length > 0) {
    blockingReasons.push(...record.blockingReasons);
  }

  return {
    valid: blockingReasons.length === 0,
    record,
    blockingReasons
  };
}

/**
 * Get summary of v2 evidence status
 */
export function getEvidenceStatus(productCode) {
  const validation = hasValidV2Evidence(productCode);
  const record = validation.record;

  if (!validation.valid) {
    return {
      status: "invalid",
      reason: validation.blockingReasons[0] || "Evidence validation failed",
      record: null
    };
  }

  return {
    status: "valid",
    reason: "Evidence Ledger v2 valid and complete",
    record: {
      productCode: record.productCode,
      validationId: record.validationId,
      scenarioSetHash: record.scenarioSetHash,
      outputHash: record.outputHash,
      authorityGranted: record.authorityGranted,
      tests: Object.keys(record.testsRun || {}).reduce((acc, key) => {
        const test = record.testsRun[key];
        acc[key] = { passed: test.passed, score: test.score };
        return acc;
      }, {}),
      ledgerEntryHash: record.ledgerEntryHash
    }
  };
}

/**
 * Verify ledger chain integrity (if chain validation is needed)
 */
export function verifyLedgerChain(productCode) {
  const record = findProductEvidenceLedgerV2(productCode);

  if (!record) {
    return { valid: false, reason: "Record not found" };
  }

  if (record.ledgerHashChainValid === false) {
    return { valid: false, reason: "Ledger hash chain is invalid" };
  }

  return { valid: true, reason: "Ledger chain integrity verified" };
}
