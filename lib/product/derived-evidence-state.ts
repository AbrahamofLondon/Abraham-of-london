/**
 * lib/product/derived-evidence-state.ts
 *
 * Derived Evidence State Loader
 *
 * Evidence state is derived from verified artifact outputs, not from
 * hardcoded product configuration. This module reads the artifact verifier
 * output (reports/evidence-ledger-artifact-verification.json) first, then
 * uses the canonical Evidence Ledger v2 only for supplemental artifact refs.
 *
 * Core Doctrine:
 * - canSupportAuthorityReview may be true when ledger artifacts are verified.
 * - canGrantAuthority must remain false unless a separate authority
 *   restoration pass explicitly approves it.
 * - Unknown or missing derived evidence state fails closed (no grant).
 *
 * This replaces the manual hasValidV2Evidence flag in
 * ProductAuthorityResolverInput.
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const LEDGER_PATH = join(ROOT, "reports", "product-value-evidence-ledger-v2.json");
const VERIFICATION_PATH = join(ROOT, "reports", "evidence-ledger-artifact-verification.json");

/**
 * Derived evidence state for a product.
 * All fields are derived from verifier outputs, never from manual config.
 */
export type DerivedEvidenceState = {
  productCode: string;
  ledgerEntryExists: boolean;
  ledgerStatus:
    | "trusted_artifact_supported"
    | "pending_rendered_output_substance"
    | "pending_contract_mismatch"
    | "pending_boundary_flags"
    | "missing"
    | "blocked"
    | "unknown";
  hasValidV2Evidence: boolean;
  canSupportAuthorityReview: boolean;
  canGrantAuthority: false;
  evidenceReasons: string[];
  artifactRefs: {
    ledger?: string;
    renderedOutput?: string;
    scenarioSet?: string;
    validationRun?: string;
  };
};

/**
 * Raw ledger entry shape (subset of fields needed for derivation)
 */
interface LedgerEntry {
  productCode: string;
  scenarioSetHash?: string;
  outputHash?: string;
  renderedOutputCaptured?: boolean;
  ledgerEntryHash?: string;
  validationRunHash?: string;
  testsRun?: Record<string, { passed?: boolean }>;
  scenarioChangedThisPass?: boolean;
  productChangedThisPass?: boolean;
  scorerChangedThisPass?: boolean;
  benchmarkChangedThisPass?: boolean;
  validationInfrastructureChangedThisPass?: boolean;
  mockAuthorityUsed?: boolean;
  blockingReasons?: string[];
  authorityGranted?: string[];
  ledgerHashChainValid?: boolean;
  proposedClassification?: string;
  [key: string]: unknown;
}

interface VerificationRow {
  productCode: string;
  ledgerTrustState?:
    | "trusted_artifact_supported"
    | "pending_missing_artifact"
    | "pending_hash_mismatch"
    | "pending_contract_mismatch"
    | "pending_surface_propagation"
    | "pending_boundary_flags"
    | "pending_rendered_output_substance"
    | "blocked_report_derived"
    | "blocked_mock_or_fixture"
    | "historical_non_granting"
    | string;
  failures?: string[];
  scenarioPath?: string;
  outputPath?: string;
  validationPath?: string;
  checks?: Record<string, unknown>;
}

interface VerificationReport {
  gate?: string;
  rows?: VerificationRow[];
}

/**
 * Read the canonical Evidence Ledger v2
 */
function readEvidenceLedger(): LedgerEntry[] {
  try {
    if (!existsSync(LEDGER_PATH)) {
      return [];
    }
    const content = readFileSync(LEDGER_PATH, "utf-8");
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed as LedgerEntry[];
    }
    return [parsed as LedgerEntry];
  } catch {
    return [];
  }
}

function readVerificationReport(): VerificationReport | null {
  try {
    if (!existsSync(VERIFICATION_PATH)) {
      return null;
    }
    return JSON.parse(readFileSync(VERIFICATION_PATH, "utf-8")) as VerificationReport;
  } catch {
    return null;
  }
}

/**
 * Find evidence record for a specific product
 */
function findProductLedger(productCode: string): LedgerEntry | null {
  const records = readEvidenceLedger();
  return records.find((r) => r.productCode === productCode) ?? null;
}

function findVerificationRow(productCode: string): VerificationRow | null {
  const report = readVerificationReport();
  return report?.rows?.find((row) => row.productCode === productCode) ?? null;
}

/**
 * Derive evidence state for a product from the canonical evidence ledger.
 *
 * This is the single source of truth for evidence state. No manual
 * hasValidV2Evidence flag should be used in authority paths.
 *
 * @param productCode - The product code to derive evidence state for
 * @returns DerivedEvidenceState — always returns a state, never throws
 */
export function deriveEvidenceState(productCode: string): DerivedEvidenceState {
  const verification = findVerificationRow(productCode);
  const record = findProductLedger(productCode);

  if (!verification) {
    return {
      productCode,
      ledgerEntryExists: Boolean(record),
      ledgerStatus: record ? "unknown" : "missing",
      hasValidV2Evidence: false,
      canSupportAuthorityReview: false,
      canGrantAuthority: false,
      evidenceReasons: [
        record
          ? "Evidence ledger entry exists, but artifact verifier output is missing"
          : "No verified Evidence Ledger v2 artifact state found for product",
      ],
      artifactRefs: record
        ? {
            ledger: "reports/product-value-evidence-ledger-v2.json",
          }
        : {},
    };
  }

  const status = mapVerifierStatus(verification.ledgerTrustState);
  const reasons = verification.failures?.length
    ? verification.failures.map((failure) => `Verifier failure: ${failure}`)
    : status === "trusted_artifact_supported"
      ? ["Artifact verifier reports trusted_artifact_supported"]
      : [`Artifact verifier reports ${verification.ledgerTrustState ?? "unknown"}`];
  const hasValidV2Evidence = status === "trusted_artifact_supported";
  const canSupportAuthorityReview =
    status === "trusted_artifact_supported" || status === "pending_contract_mismatch";

  return {
    productCode,
    ledgerEntryExists: Boolean(record),
    ledgerStatus: status,
    hasValidV2Evidence,
    canSupportAuthorityReview,
    canGrantAuthority: false, // NEVER true from derivation alone
    evidenceReasons: reasons.length > 0 ? reasons : ["Evidence Ledger v2 is present and trusted"],
    artifactRefs: {
      ledger: "reports/product-value-evidence-ledger-v2.json",
      renderedOutput: verification.outputPath,
      scenarioSet: verification.scenarioPath,
      validationRun: verification.validationPath ?? record?.validationRunHash ?? record?.ledgerEntryHash,
    },
  };
}

function mapVerifierStatus(status: string | undefined): DerivedEvidenceState["ledgerStatus"] {
  switch (status) {
    case "trusted_artifact_supported":
      return "trusted_artifact_supported";
    case "pending_contract_mismatch":
      return "pending_contract_mismatch";
    case "pending_boundary_flags":
      return "pending_boundary_flags";
    case "pending_rendered_output_substance":
      return "pending_rendered_output_substance";
    case "pending_missing_artifact":
    case "pending_hash_mismatch":
    case "pending_surface_propagation":
      return "blocked";
    case "blocked_report_derived":
    case "blocked_mock_or_fixture":
    case "historical_non_granting":
      return "blocked";
    default:
      return "unknown";
  }
}

/**
 * Batch derive evidence states for multiple products.
 */
export function deriveEvidenceStates(
  productCodes: string[]
): Map<string, DerivedEvidenceState> {
  const map = new Map<string, DerivedEvidenceState>();
  for (const code of productCodes) {
    map.set(code, deriveEvidenceState(code));
  }
  return map;
}

/**
 * Check if the evidence ledger file exists and is readable.
 * Returns true if at least one record can be parsed.
 */
export function evidenceLedgerAvailable(): boolean {
  try {
    const records = readEvidenceLedger();
    return records.length > 0;
  } catch {
    return false;
  }
}
