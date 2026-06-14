/**
 * Evidence Package Contract
 *
 * Centralised schema for all evidence artifacts across the product estate.
 * Prevents fragmentation by enforcing uniform structure, validation, and authority boundaries.
 */

export type EvidencePackageKind =
  | 'product_release'
  | 'release_instance'
  | 'shared_layer'
  | 'authority_restoration_preparation'
  | 'methodology_boundary'
  | 'reporting_output_layer';

export type EvidencePackageAuthorityRole =
  | 'non_authority_supporting_artifact'
  | 'authority_review_input'
  | 'descriptive_methodology'
  | 'delivery_boundary'
  | 'forbidden_as_authority_evidence';

export interface EvidencePackageContract {
  packageId: string;
  productCode: string;
  releaseInstanceCode?: string;
  packageName?: string;

  // Package Classification
  packageKind: EvidencePackageKind;
  authorityRole: EvidencePackageAuthorityRole;
  targetReleaseLane: string;

  // Evidence Definition
  evidenceBoundary: string;
  methodologySummary: string;
  sourceTypesAllowed: string[];
  sourceTypesExcluded: string[];

  // Governance Requirements
  humanReviewRequired: boolean;
  boundaryAcknowledgementRequired: boolean;

  // Hardcoded Invariants (Cannot be overridden)
  reportAsEvidenceAllowed: false;
  authorityGrantAllowed: false;
  positiveAuthorityGranted: false;

  // Claims Management
  allowedClaims: string[];
  forbiddenClaims: string[];

  // Artifact Tracking
  requiredArtifacts: string[];
  revocationConditions: string[];

  // Metadata
  createdDate?: string;
  lastValidatedDate?: string;
  validationStatus?: 'valid' | 'invalid' | 'pending';
}

/**
 * Hardcoded Invariants
 *
 * These properties are immutable and define the core authority boundary.
 * They cannot be changed without going through the authority-restoration process.
 */
export const EVIDENCE_PACKAGE_INVARIANTS = {
  reportAsEvidenceAllowed: false as const,
  authorityGrantAllowed: false as const,
  positiveAuthorityGranted: false as const,
} as const;

/**
 * Validate Evidence Package Contract
 *
 * Ensures all evidence packages meet governance requirements.
 */
export function validateEvidencePackageContract(contract: EvidencePackageContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check hardcoded invariants
  if (contract.reportAsEvidenceAllowed !== false) {
    errors.push('reportAsEvidenceAllowed must be false (reports cannot become authority evidence)');
  }

  if (contract.authorityGrantAllowed !== false) {
    errors.push('authorityGrantAllowed must be false (evidence packages cannot grant authority)');
  }

  if (contract.positiveAuthorityGranted !== false) {
    errors.push('positiveAuthorityGranted must be false (no positive authority is granted)');
  }

  // Check required fields
  if (!contract.packageId) {
    errors.push('packageId is required');
  }

  if (!contract.productCode) {
    errors.push('productCode is required');
  }

  if (!contract.evidenceBoundary) {
    errors.push('evidenceBoundary is required');
  }

  if (!contract.methodologySummary) {
    errors.push('methodologySummary is required');
  }

  if (!contract.allowedClaims || contract.allowedClaims.length === 0) {
    errors.push('allowedClaims must be defined (at least one claim type)');
  }

  if (!contract.forbiddenClaims || contract.forbiddenClaims.length === 0) {
    errors.push('forbiddenClaims must be defined (at least one claim type)');
  }

  // Check for overlap between allowed and forbidden
  const allowedLower = contract.allowedClaims.map(c => c.toLowerCase());
  const forbiddenLower = contract.forbiddenClaims.map(c => c.toLowerCase());
  const overlap = allowedLower.filter(a => forbiddenLower.includes(a));

  if (overlap.length > 0) {
    errors.push(`Claims appear in both allowed and forbidden: ${overlap.join(', ')}`);
  }

  // Check sources
  if (!contract.sourceTypesAllowed || contract.sourceTypesAllowed.length === 0) {
    errors.push('sourceTypesAllowed must be defined');
  }

  if (!contract.sourceTypesExcluded) {
    errors.push('sourceTypesExcluded must be defined (even if empty)');
  }

  // Check revocation conditions exist
  if (!contract.revocationConditions || contract.revocationConditions.length === 0) {
    errors.push('revocationConditions must be defined (at least one condition)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Package Kind Descriptions
 *
 * Helps classify evidence packages by their role in the estate.
 */
export const EVIDENCE_PACKAGE_KIND_DESCRIPTIONS: Record<EvidencePackageKind, string> = {
  product_release: 'Evidence for a product moving to release-ready status',
  release_instance: 'Evidence for a specific instance of a product (e.g., Q2 2026)',
  shared_layer: 'Evidence for shared infrastructure (e.g., reporting layer)',
  authority_restoration_preparation: 'Evidence prepared for authority restoration review',
  methodology_boundary: 'Documentation of methodology and boundaries',
  reporting_output_layer: 'Evidence for report generation infrastructure',
};

/**
 * Authority Role Descriptions
 *
 * Clarifies how each evidence package relates to authority granting.
 */
export const EVIDENCE_PACKAGE_AUTHORITY_ROLE_DESCRIPTIONS: Record<EvidencePackageAuthorityRole, string> = {
  non_authority_supporting_artifact:
    'Artifact that supports product development but does not grant or support authority',
  authority_review_input: 'Input for authority restoration review (not authority itself)',
  descriptive_methodology: 'Documentation of methodology and boundaries (descriptive only)',
  delivery_boundary: 'Boundary statement for delivery artifacts (defines limitations)',
  forbidden_as_authority_evidence: 'Explicitly forbidden from use as authority evidence',
};

export default EvidencePackageContract;
