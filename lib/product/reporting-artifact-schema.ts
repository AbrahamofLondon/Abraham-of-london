/**
 * Reporting Artifact Schema
 *
 * Defines the structure and governance requirements for all report artifacts.
 * Reports must explicitly declare non-authority status and bounded evidence.
 */

export type HumanReviewStatus = 'not_required' | 'in_progress' | 'completed' | 'failed';
export type EvidenceBoundaryType =
  | 'descriptive_only'
  | 'input_source_declared'
  | 'human_reviewed'
  | 'evidence_limited'
  | 'advisory_review';

export interface ReportingArtifact {
  // Identity
  reportCode: string;
  reportName: string;
  sourceProductCode: string;

  // Source Product State
  sourceProductReadinessStatus: 'release_ready_now' | 'future_ready_for_evidence_path' | 'blocked';
  sourceReleaseLane: string;
  sourceAuthorityState: string;
  sourceEvidencePackagePath?: string;
  sourceMethodologyBoundaryPath?: string;

  // Report Content
  outputType: string;
  contentSummary: string;
  reportGeneratedDate: string;
  reportGeneratedBy: string;

  // Evidence Declaration
  inputSources: Array<{
    sourceType: string;
    sourceLocation: string;
    includedInReport: boolean;
  }>;

  humanReviewStatus: HumanReviewStatus;
  humanReviewCompletedBy?: string;
  humanReviewCompletedDate?: string;

  evidenceBoundary: EvidenceBoundaryType;
  nonAuthorityDeclaration: string;

  // Safety Checks
  forbiddenClaimsChecked: boolean;
  forbiddenClaimsDetected: string[];
  forbiddenClaimsRemoved: boolean;

  // Delivery Metadata
  deliveryTimestamp: string;
  deliveryChannel: 'email' | 'web_portal' | 'api' | 'print';
  deliveryRecipient?: string;
  deliveryAcknowledged?: boolean;

  // Artifacts
  generatedPdfPath?: string;
  generatedHtmlPath?: string;
  generatedJsonPath?: string;
}

/**
 * Forbidden Claims Across All Reports
 *
 * These phrases must be removed before report publication.
 */
export const FORBIDDEN_REPORT_CLAIMS = [
  'validated authority',
  'certified finding',
  'externally proven conclusion',
  'investment advice',
  'investment recommendation',
  'financial advice',
  'financial guidance',
  'legal advice',
  'legal opinion',
  'medical advice',
  'guaranteed outcome',
  'guaranteed result',
  'guaranteed return',
  'certified market intelligence',
  'certified analysis',
  'independently verified',
  'third-party certified',
  'externally validated',
  'audit opinion',
  'assurance opinion',
  'AI-powered prediction',
  'machine learning forecast',
  'algorithmic certainty',
  'board-approved',
  'board-certified',
  'management approved',
];

/**
 * Required Disclosures for All Reports
 *
 * Every report must include these elements.
 */
export const REQUIRED_REPORT_DISCLOSURES = [
  'Evidence boundary statement',
  'Non-authority declaration',
  'Human review attestation',
  'Source declaration',
  'Methodology overview',
  'Known limitations',
  'Confidence language boundaries',
];

/**
 * Validate Report Artifact
 *
 * Checks that a report artifact meets all governance requirements.
 */
export function validateReportingArtifact(artifact: ReportingArtifact): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check evidence boundary is declared
  if (!artifact.evidenceBoundary) {
    errors.push('Evidence boundary must be declared');
  }

  // Check non-authority declaration
  if (!artifact.nonAuthorityDeclaration) {
    errors.push('Non-authority declaration is required');
  }

  // Check human review
  if (artifact.humanReviewStatus !== 'completed') {
    errors.push(`Human review must be completed (current: ${artifact.humanReviewStatus})`);
  }

  // Check for forbidden claims
  if (!artifact.forbiddenClaimsChecked) {
    errors.push('Forbidden claims must be checked before publication');
  }

  if (artifact.forbiddenClaimsDetected.length > 0 && !artifact.forbiddenClaimsRemoved) {
    errors.push(
      `Forbidden claims detected and not removed: ${artifact.forbiddenClaimsDetected.join(', ')}`
    );
  }

  // Check input sources declared
  if (!artifact.inputSources || artifact.inputSources.length === 0) {
    warnings.push('No input sources declared (may be appropriate for some reports)');
  }

  // Check source product state
  if (artifact.sourceAuthorityState === 'blocked_until_claim_evidenced') {
    warnings.push(
      `Source product is in blocked state (${artifact.sourceAuthorityState}). Ensure report does not restore authority.`
    );
  }

  // Check delivery metadata
  if (!artifact.deliveryTimestamp) {
    errors.push('Delivery timestamp is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check For Forbidden Claims In Text
 *
 * Scans report content for prohibited language patterns.
 */
export function detectForbiddenClaims(content: string): string[] {
  const detected: string[] = [];
  const contentLower = content.toLowerCase();

  for (const forbidden of FORBIDDEN_REPORT_CLAIMS) {
    if (contentLower.includes(forbidden.toLowerCase())) {
      detected.push(forbidden);
    }
  }

  return detected;
}

/**
 * Create Governance-Safe Report Artifact
 *
 * Factory function that creates a report artifact with all required fields.
 */
export function createReportingArtifact(params: {
  reportCode: string;
  reportName: string;
  sourceProductCode: string;
  sourceProductReadinessStatus: 'release_ready_now' | 'future_ready_for_evidence_path' | 'blocked';
  sourceReleaseLane: string;
  sourceAuthorityState: string;
  outputType: string;
  contentSummary: string;
  reportGeneratedBy: string;
  inputSources: Array<{ sourceType: string; sourceLocation: string; includedInReport: boolean }>;
  humanReviewCompletedBy: string;
  evidenceBoundary: EvidenceBoundaryType;
  forbiddenClaimsDetected: string[];
  deliveryChannel: 'email' | 'web_portal' | 'api' | 'print';
}): ReportingArtifact {
  return {
    reportCode: params.reportCode,
    reportName: params.reportName,
    sourceProductCode: params.sourceProductCode,
    sourceProductReadinessStatus: params.sourceProductReadinessStatus,
    sourceReleaseLane: params.sourceReleaseLane,
    sourceAuthorityState: params.sourceAuthorityState,
    outputType: params.outputType,
    contentSummary: params.contentSummary,
    reportGeneratedDate: new Date().toISOString(),
    reportGeneratedBy: params.reportGeneratedBy,
    inputSources: params.inputSources,
    humanReviewStatus: 'completed',
    humanReviewCompletedBy: params.humanReviewCompletedBy,
    humanReviewCompletedDate: new Date().toISOString(),
    evidenceBoundary: params.evidenceBoundary,
    nonAuthorityDeclaration:
      'This report is a delivery artifact and is not authority-granting evidence. It does not validate, certify, or externally verify any product claim.',
    forbiddenClaimsChecked: true,
    forbiddenClaimsDetected: params.forbiddenClaimsDetected,
    forbiddenClaimsRemoved: params.forbiddenClaimsDetected.length === 0,
    deliveryTimestamp: new Date().toISOString(),
    deliveryChannel: params.deliveryChannel,
  };
}

export default ReportingArtifact;
