/**
 * lib/validation/validation-evidence-ledger-v2.ts
 *
 * Validation Evidence Ledger v2: Complete Traceability
 *
 * Every validation event must be recorded with complete hash chain.
 * No validation result can grant authority without a valid ledger entry.
 */

export interface ValidationTestResult {
  testName: string;
  passed: boolean;
  score?: number;
  maxScore?: number;
  timestamp: string;
  testerId: string;
  blockingObjections?: string[];
  failureReasons?: string[];
}

export interface ValidationEvidenceRecord {
  // Identity
  productCode: string;
  validationId: string;
  timestamp: string;

  // Product State
  productVersion: string;
  productCommitHash: string;
  productOutputHash: string;
  productRenderedOutputCaptured: boolean;
  productLiveRouteVerified: boolean;

  // Test Scenarios
  scenarioSetId: string;
  scenarioSetHash: string;
  scenarioSetFrozen: boolean;
  scenarioCount: number;
  scenarioHashes: Record<string, string>;

  // Measurement Layer
  scorerVersion: string;
  scorerCommitHash: string;
  scorerChangedThisPass: boolean;
  benchmarkVersion: string;
  benchmarkCommitHash: string;
  benchmarkChangedThisPass: boolean;

  // Product State Validation
  productChangedThisPass: boolean;
  productContentMateriallyChanged: boolean;

  // Route/Capture Validation
  routeChangedThisPass: boolean;
  renderedOutputCaptureMethod: "live_route" | "composed_output" | "stored_artifact";
  outputCaptureHash: string;

  // Full Validation Chain Tests
  testsRun: {
    decisionForce?: ValidationTestResult;
    antiToy?: ValidationTestResult;
    redTeam?: ValidationTestResult;
    genericAiComparison?: ValidationTestResult;
    marketComparison?: ValidationTestResult;
    claimAuthority?: ValidationTestResult;
    surfaceClaimAuthority?: ValidationTestResult;
    antiGaming?: ValidationTestResult;
    validationConstitution?: ValidationTestResult;
  };

  // Validation Integrity
  measurementInconclusiveReasons: string[];
  validationConstitutionViolations: string[];
  antiGamingRisks: string[];

  // Classification Authority
  priorClassification: string;
  proposedClassification: string;
  authorityGranted: string[];
  authorityDenied: string[];
  blockingReasons: string[];

  // Ledger Integrity
  ledgerEntryCreatedAt: string;
  ledgerEntryHash: string;
  ledgerEntrySignatory: string; // operator or system that created this
  ledgerPreviousEntryHash?: string; // for chain validation
  ledgerHashChainValid: boolean;
}

/**
 * Validate a ledger entry
 */
export function validateLedgerEntry(
  entry: ValidationEvidenceRecord
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!entry.productCode) errors.push("productCode required");
  if (!entry.validationId) errors.push("validationId required");
  if (!entry.productCommitHash) errors.push("productCommitHash required");
  if (!entry.scenarioSetHash) errors.push("scenarioSetHash required");
  if (!entry.outputCaptureHash) errors.push("outputCaptureHash required");

  // Measurement layer must be frozen for product comparison
  if (entry.productChangedThisPass) {
    if (entry.scorerChangedThisPass) {
      errors.push("Scorer and product cannot both change in same pass");
    }
    if (entry.benchmarkChangedThisPass) {
      errors.push("Benchmark and product cannot both change in same pass");
    }
    if (entry.routeChangedThisPass) {
      errors.push("Route and product cannot both change in same pass");
    }
  }

  // Validation chain must be complete
  const testResults = Object.values(entry.testsRun).filter((t) => t);
  if (testResults.length < 4) {
    warnings.push(`Only ${testResults.length} tests run, recommend 4 minimum`);
  }

  // Classification must match evidence
  if (entry.blockingReasons && entry.blockingReasons.length > 0) {
    if (
      entry.proposedClassification === "diagnostic_product" ||
      entry.proposedClassification === "judgement_product"
    ) {
      errors.push(
        `Cannot propose ${entry.proposedClassification} with blocking reasons: ${entry.blockingReasons.join("; ")}`
      );
    }
  }

  // Rendered output must be captured for product claims
  if (
    (entry.proposedClassification === "diagnostic_product" ||
      entry.proposedClassification === "judgement_product") &&
    !entry.productRenderedOutputCaptured
  ) {
    errors.push("Diagnostic or judgement claims require rendered output capture");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Compute hash of ledger entry for integrity chain
 */
export function hashLedgerEntry(entry: Omit<ValidationEvidenceRecord, "ledgerEntryHash">): string {
  const crypto = require("crypto");
  const content = JSON.stringify(entry, Object.keys(entry).sort());
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Validate ledger chain integrity
 */
export function validateLedgerChain(
  entries: ValidationEvidenceRecord[]
): {
  valid: boolean;
  brokenLinks: number[];
  errors: string[];
} {
  const errors: string[] = [];
  const brokenLinks: number[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (!entry) {
      errors.push(`Entry ${i} is missing or undefined`);
      brokenLinks.push(i);
      continue;
    }

    // Validate entry itself
    const entryValidation = validateLedgerEntry(entry);
    if (!entryValidation.valid) {
      errors.push(`Entry ${i} invalid: ${entryValidation.errors.join("; ")}`);
      brokenLinks.push(i);
    }

    // Validate chain link
    if (i > 0) {
      const prevEntry = entries[i - 1];
      if (!prevEntry) {
        errors.push(`Entry ${i} chain link broken: previous entry is missing`);
        brokenLinks.push(i);
      } else if (entry.ledgerPreviousEntryHash !== prevEntry.ledgerEntryHash) {
        errors.push(`Entry ${i} chain link broken: hash mismatch with entry ${i - 1}`);
        brokenLinks.push(i);
      }
    }

    // Validate hash
    const computedHash = hashLedgerEntry(entry);
    if (entry.ledgerEntryHash !== computedHash) {
      errors.push(`Entry ${i} hash mismatch: stored ${entry.ledgerEntryHash} != computed ${computedHash}`);
      brokenLinks.push(i);
    }
  }

  return {
    valid: errors.length === 0 && brokenLinks.length === 0,
    brokenLinks,
    errors,
  };
}

export default {
  validateLedgerEntry,
  hashLedgerEntry,
  validateLedgerChain,
};
