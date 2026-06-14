/**
 * Evidence Package Registry
 *
 * Centralised registry of all evidence packages in the estate.
 * Prevents fragmentation by tracking all evidence artifacts and their validation status.
 */

import type { EvidencePackageContract } from './evidence-package-contract';

export interface RegistryEntry {
  packageId: string;
  productCode: string;
  releaseInstanceCode?: string;
  packagePath: string;
  methodologyBoundaryPath?: string;
  allowedClaimsPath?: string;
  forbiddenClaimsPath?: string;
  authorityRole: string;
  requiredForReadiness: boolean;
  registrationDate: string;
  validationStatus: 'valid' | 'invalid' | 'pending' | 'not_validated';
  validationErrors?: string[];
}

/**
 * Registry of Centralised Evidence Packages
 *
 * All evidence packages must be registered here.
 * This prevents products from inventing their own evidence structures.
 */
export const EVIDENCE_PACKAGE_REGISTRY: Record<string, RegistryEntry> = {
  market_intelligence_q2: {
    packageId: 'market_intelligence_q2',
    productCode: 'gmi_quarterly',
    releaseInstanceCode: 'market_intelligence_q2',
    packagePath: 'artifacts/validation/market_intelligence_q2/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/market_intelligence_q2/methodology-boundary.md',
    allowedClaimsPath: 'artifacts/validation/market_intelligence_q2/allowed-claims.txt',
    forbiddenClaimsPath: 'artifacts/validation/market_intelligence_q2/forbidden-claims.txt',
    authorityRole: 'evidence_limited_commercial_product',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'valid',
  },

  reporting_output_layer: {
    packageId: 'reporting_output_layer',
    productCode: 'reporting_output_layer',
    packagePath: 'artifacts/validation/reporting_output_layer/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/reporting_output_layer/methodology-boundary.md',
    allowedClaimsPath: 'artifacts/validation/reporting_output_layer/allowed-claims.txt',
    forbiddenClaimsPath: 'artifacts/validation/reporting_output_layer/forbidden-claims.txt',
    authorityRole: 'shared_layer_non_authority',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'valid',
  },

  // Reserved slots for future packages (Workstream 1B-1E)
  diagnostic_extended: {
    packageId: 'diagnostic_extended',
    productCode: 'diagnostic_extended',
    packagePath: 'artifacts/validation/diagnostic_extended/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/diagnostic_extended/methodology-boundary.md',
    authorityRole: 'evidence_limited_diagnostic',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'pending',
  },

  assessment_standard: {
    packageId: 'assessment_standard',
    productCode: 'assessment_standard',
    packagePath: 'artifacts/validation/assessment_standard/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/assessment_standard/methodology-boundary.md',
    authorityRole: 'evidence_limited_assessment',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'pending',
  },

  competitor_tracker: {
    packageId: 'competitor_tracker',
    productCode: 'competitor_tracker',
    packagePath: 'artifacts/validation/competitor_tracker/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/competitor_tracker/methodology-boundary.md',
    authorityRole: 'evidence_limited_intelligence',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'pending',
  },

  trend_monitor: {
    packageId: 'trend_monitor',
    productCode: 'trend_monitor',
    packagePath: 'artifacts/validation/trend_monitor/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/trend_monitor/methodology-boundary.md',
    authorityRole: 'evidence_limited_intelligence',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'pending',
  },

  signal_watch: {
    packageId: 'signal_watch',
    productCode: 'signal_watch',
    packagePath: 'artifacts/validation/signal_watch/evidence-package.json',
    methodologyBoundaryPath: 'artifacts/validation/signal_watch/methodology-boundary.md',
    authorityRole: 'evidence_limited_intelligence',
    requiredForReadiness: true,
    registrationDate: '2026-06-14',
    validationStatus: 'pending',
  },
};

/**
 * Get Registry Entry By Product Code
 */
export function getRegistryEntryByProductCode(productCode: string): RegistryEntry | undefined {
  return Object.values(EVIDENCE_PACKAGE_REGISTRY).find(entry => entry.productCode === productCode);
}

/**
 * Get Registry Entry By Package ID
 */
export function getRegistryEntryByPackageId(packageId: string): RegistryEntry | undefined {
  return EVIDENCE_PACKAGE_REGISTRY[packageId];
}

/**
 * Get All Valid Packages
 */
export function getValidPackages(): RegistryEntry[] {
  return Object.values(EVIDENCE_PACKAGE_REGISTRY).filter(entry => entry.validationStatus === 'valid');
}

/**
 * Get All Pending Packages
 */
export function getPendingPackages(): RegistryEntry[] {
  return Object.values(EVIDENCE_PACKAGE_REGISTRY).filter(
    entry => entry.validationStatus === 'pending' || entry.validationStatus === 'not_validated'
  );
}

/**
 * Get All Invalid Packages
 */
export function getInvalidPackages(): RegistryEntry[] {
  return Object.values(EVIDENCE_PACKAGE_REGISTRY).filter(entry => entry.validationStatus === 'invalid');
}

/**
 * Register New Evidence Package
 *
 * Adds a new entry to the registry (typically after validation).
 */
export function registerEvidencePackage(entry: RegistryEntry): void {
  EVIDENCE_PACKAGE_REGISTRY[entry.packageId] = entry;
}

/**
 * Update Registry Entry Validation Status
 */
export function updateValidationStatus(
  packageId: string,
  status: 'valid' | 'invalid' | 'pending' | 'not_validated',
  errors?: string[]
): void {
  const entry = EVIDENCE_PACKAGE_REGISTRY[packageId];
  if (entry) {
    entry.validationStatus = status;
    entry.validationErrors = errors;
  }
}

/**
 * Get Registry Statistics
 */
export function getRegistryStats(): {
  total: number;
  valid: number;
  invalid: number;
  pending: number;
} {
  const entries = Object.values(EVIDENCE_PACKAGE_REGISTRY);
  return {
    total: entries.length,
    valid: entries.filter(e => e.validationStatus === 'valid').length,
    invalid: entries.filter(e => e.validationStatus === 'invalid').length,
    pending: entries.filter(e => e.validationStatus === 'pending' || e.validationStatus === 'not_validated').length,
  };
}

export default EVIDENCE_PACKAGE_REGISTRY;
