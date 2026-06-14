/**
 * Reporting Output Contract
 *
 * Defines governance rules for all report generation across product families.
 * Reports are delivery artifacts, not authority-granting evidence artifacts.
 */

export type ReportingOutputType =
  | 'monthly_report'
  | 'custom_report'
  | 'quarterly_intelligence_report'
  | 'diagnostic_report'
  | 'assessment_report'
  | 'retainer_oversight_brief'
  | 'board_facing_draft';

export type ReportingEvidenceBoundary =
  | 'descriptive_only'
  | 'input_source_declared'
  | 'human_reviewed'
  | 'evidence_limited'
  | 'authority_referenced_but_not_granted';

export interface ReportingOutputContract {
  reportCode: string;
  sourceProductCode: string;
  outputType: ReportingOutputType;
  evidenceBoundary: ReportingEvidenceBoundary;
  sourceArtifacts: string[];
  sourceReports: string[];
  reportAsEvidenceAllowed: false;
  authorityGrantAllowed: false;
  humanReviewRequired: boolean;
  inputSourceDeclarationRequired: boolean;
  boundaryNoticeRequired: boolean;
  forbiddenClaims: string[];
  requiredDisclosures: string[];
}

/**
 * Report Boundary Notice Template
 *
 * Required on all reports to declare non-authority status.
 */
export const REPORT_BOUNDARY_NOTICE = `This report is a delivery and interpretation artifact. It may describe evidence, source material, and findings, but it is not itself authority-granting evidence and does not validate, certify, or externally verify any product claim.`;

/**
 * Core Doctrine: Invariant Rules
 *
 * These properties are hardcoded and cannot be overridden:
 * - Reports never grant authority
 * - Reports never become authority evidence
 * - Reports must declare input sources
 * - Reports must include evidence boundaries
 */
export const REPORTING_OUTPUT_INVARIANTS = {
  reportAsEvidenceAllowed: false as const,
  authorityGrantAllowed: false as const,
  forbiddenClaimsAcrossAllReports: [
    'validated authority',
    'certified finding',
    'externally proven conclusion',
    'investment advice',
    'legal advice',
    'medical advice',
    'guaranteed outcome',
    'certified market intelligence',
    'independently verified',
    'third-party certified',
    'AI-powered prediction',
    'machine learning forecast',
  ],
} as const;

/**
 * Report Type Profiles
 *
 * Defines standard configuration for each report type family.
 */
export const REPORT_TYPE_PROFILES: Record<ReportingOutputType, Partial<ReportingOutputContract>> = {
  monthly_report: {
    outputType: 'monthly_report',
    evidenceBoundary: 'input_source_declared',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Data sources and collection period',
      'Methodology overview',
      'Known limitations',
      'Evidence boundary statement',
    ],
  },
  custom_report: {
    outputType: 'custom_report',
    evidenceBoundary: 'evidence_limited',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Scope definition',
      'Input sources and scope',
      'Analysis methodology',
      'Known limitations',
      'Evidence boundary',
    ],
  },
  quarterly_intelligence_report: {
    outputType: 'quarterly_intelligence_report',
    evidenceBoundary: 'evidence_limited',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Prior quarter review (calls vs outcomes)',
      'Falsification register',
      'Evidence sources',
      'Confidence language bounded',
      'Evidence boundary',
    ],
  },
  diagnostic_report: {
    outputType: 'diagnostic_report',
    evidenceBoundary: 'input_source_declared',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Decision context',
      'Available evidence',
      'Analysis approach',
      'Limitations and constraints',
      'Evidence boundary',
    ],
  },
  assessment_report: {
    outputType: 'assessment_report',
    evidenceBoundary: 'evidence_limited',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Assessment scope',
      'Methodology and sources',
      'Evidence limitations',
      'Known constraints',
      'Evidence boundary',
    ],
  },
  retainer_oversight_brief: {
    outputType: 'retainer_oversight_brief',
    evidenceBoundary: 'input_source_declared',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Reporting period',
      'Activities monitored',
      'Sources and methods',
      'Limitations',
      'Evidence boundary',
    ],
  },
  board_facing_draft: {
    outputType: 'board_facing_draft',
    evidenceBoundary: 'authority_referenced_but_not_granted',
    humanReviewRequired: true,
    inputSourceDeclarationRequired: true,
    boundaryNoticeRequired: true,
    requiredDisclosures: [
      'Board context and audience',
      'Decision support purpose',
      'Evidence sources',
      'Limitations and caveats',
      'Not board-approved or certified',
      'Evidence boundary',
    ],
  },
};

/**
 * Validate Report Contract
 *
 * Ensures that a report contract meets all governance requirements.
 */
export function validateReportingOutputContract(contract: ReportingOutputContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check invariants
  if (contract.reportAsEvidenceAllowed !== false) {
    errors.push('reportAsEvidenceAllowed must be false (reports are not authority evidence)');
  }

  if (contract.authorityGrantAllowed !== false) {
    errors.push('authorityGrantAllowed must be false (reports cannot grant authority)');
  }

  // Check boundary notice required
  if (!contract.boundaryNoticeRequired) {
    errors.push('boundaryNoticeRequired must be true (all reports must declare non-authority status)');
  }

  // Check human review required
  if (!contract.humanReviewRequired) {
    errors.push('humanReviewRequired must be true (all reports require human review)');
  }

  // Check forbidden claims include core list
  const requiredForbidden = REPORTING_OUTPUT_INVARIANTS.forbiddenClaimsAcrossAllReports;
  const missingForbidden = requiredForbidden.filter(
    claim => !contract.forbiddenClaims.some(fc => fc.toLowerCase().includes(claim.toLowerCase()))
  );

  if (missingForbidden.length > 0) {
    errors.push(`Missing forbidden claims: ${missingForbidden.join(', ')}`);
  }

  // Check that source is defined
  if (!contract.sourceProductCode) {
    errors.push('sourceProductCode must be defined');
  }

  // Check output type is valid
  const validTypes = Object.keys(REPORT_TYPE_PROFILES) as ReportingOutputType[];
  if (!validTypes.includes(contract.outputType)) {
    errors.push(`outputType must be one of: ${validTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default ReportingOutputContract;
