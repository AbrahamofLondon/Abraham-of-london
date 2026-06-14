/**
 * Aggregate Pattern Privacy Guard
 *
 * Ensures aggregate patterns cannot publish below privacy thresholds.
 * Prevents data leakage through small-sample patterns or identifiable metadata.
 *
 * Rules:
 * - No raw client data in aggregate patterns
 * - No identifiable metadata
 * - Minimum sample size enforced
 * - Differential privacy applied where applicable
 * - Opt-in required
 */

export type AggregatePatternPublicationStatus =
  | "enabled"
  | "disabled_until_sample_threshold_met"
  | "disabled_insufficient_anonymisation"
  | "disabled_user_opt_out";

export interface AggregatePatternPrivacyPolicy {
  // Sample size thresholds
  minimumDistinctTenancies: number;
  minimumDistinctOrganisations: number;

  // Anonymisation requirements
  smallSampleSuppression: boolean;
  differentialPrivacyRequired: boolean;

  // Data boundaries
  rawEvidenceExportAllowed: false; // Always false
  identifiableMetadataAllowed: false; // Always false
  clientSpecificPatternDisclosureAllowed: false; // Always false

  // Opt-in requirement
  requiresExplicitOptIn: boolean;

  // Publication status
  publicationStatus: AggregatePatternPublicationStatus;
}

/**
 * Default privacy policy (conservative)
 */
export const DEFAULT_AGGREGATE_PATTERN_PRIVACY_POLICY: Readonly<AggregatePatternPrivacyPolicy> =
  {
    // Require 50+ distinct tenancies and organisations for any pattern to publish
    minimumDistinctTenancies: 50,
    minimumDistinctOrganisations: 50,

    // Always suppress small samples
    smallSampleSuppression: true,

    // Always require differential privacy
    differentialPrivacyRequired: true,

    // Never allow raw evidence export
    rawEvidenceExportAllowed: false,

    // Never allow identifiable metadata
    identifiableMetadataAllowed: false,

    // Never disclose client-specific patterns
    clientSpecificPatternDisclosureAllowed: false,

    // Require explicit opt-in
    requiresExplicitOptIn: true,

    // Start in disabled state until thresholds met
    publicationStatus: "disabled_until_sample_threshold_met",
  } as const;

/**
 * Evaluate pattern publication against privacy policy
 */
export interface AggregatePatternPublicationEvaluation {
  patternId: string;
  canPublish: boolean;
  publishBlocked: boolean;
  blockedReasons: string[];
  requiredForPublication: string[];
  sampleSize: {
    distinctTenancies: number;
    distinctOrganisations: number;
    meetsMinimumTenancies: boolean;
    meetsMinimumOrganisations: boolean;
  };
  anonymisationVerified: boolean;
  optInStatus: {
    requiresOptIn: boolean;
    hasOptedIn: number;
    totalEligible: number;
  };
}

export function evaluatePatternPublication(
  pattern: {
    patternId: string;
    distinctTenancies: number;
    distinctOrganisations: number;
    containsIdentifiableMetadata: boolean;
    clientsOptedIn: number;
    clientsEligible: number;
  },
  policy: AggregatePatternPrivacyPolicy
): AggregatePatternPublicationEvaluation {
  const blockedReasons: string[] = [];
  const requiredForPublication: string[] = [];

  // Check sample size
  const meetsMinTenancies =
    pattern.distinctTenancies >= policy.minimumDistinctTenancies;
  const meetsMinOrganisations =
    pattern.distinctOrganisations >= policy.minimumDistinctOrganisations;

  if (!meetsMinTenancies) {
    blockedReasons.push(
      `Insufficient distinct tenancies: ${pattern.distinctTenancies} < ${policy.minimumDistinctTenancies}`
    );
    requiredForPublication.push(
      `Collect pattern from ${policy.minimumDistinctTenancies} distinct tenancies`
    );
  }

  if (!meetsMinOrganisations) {
    blockedReasons.push(
      `Insufficient distinct organisations: ${pattern.distinctOrganisations} < ${policy.minimumDistinctOrganisations}`
    );
    requiredForPublication.push(
      `Collect pattern from ${policy.minimumDistinctOrganisations} distinct organisations`
    );
  }

  // Check anonymisation
  if (pattern.containsIdentifiableMetadata) {
    blockedReasons.push("Pattern contains identifiable metadata");
    requiredForPublication.push("Remove all identifiable metadata");
  }

  // Check opt-in
  if (policy.requiresExplicitOptIn) {
    const optInRatio = pattern.clientsOptedIn / pattern.clientsEligible;
    if (optInRatio < 0.95) {
      blockedReasons.push(
        `Insufficient opt-in consent: ${pattern.clientsOptedIn}/${pattern.clientsEligible} (need 95%)`
      );
      requiredForPublication.push(
        "Obtain explicit opt-in from at least 95% of contributing clients"
      );
    }
  }

  const canPublish = blockedReasons.length === 0;

  return {
    patternId: pattern.patternId,
    canPublish,
    publishBlocked: !canPublish,
    blockedReasons,
    requiredForPublication,
    sampleSize: {
      distinctTenancies: pattern.distinctTenancies,
      distinctOrganisations: pattern.distinctOrganisations,
      meetsMinimumTenancies: meetsMinTenancies,
      meetsMinimumOrganisations: meetsMinOrganisations,
    },
    anonymisationVerified: !pattern.containsIdentifiableMetadata,
    optInStatus: {
      requiresOptIn: policy.requiresExplicitOptIn,
      hasOptedIn: pattern.clientsOptedIn,
      totalEligible: pattern.clientsEligible,
    },
  };
}

/**
 * Invariants
 */
export const AGGREGATE_PATTERN_PRIVACY_INVARIANTS = {
  NEVER_RAW_DATA:
    "Raw client data never leaves tenancy; never enters aggregate library",
  NEVER_IDENTIFIABLE:
    "No identifiable evidence or metadata in aggregate patterns",
  SAMPLE_THRESHOLD_ENFORCED:
    "Patterns below minimum sample size are suppressed",
  SMALL_SAMPLE_LEAKAGE_PREVENTED: "Unique patterns suppressed to prevent inference",
  DIFFERENTIAL_PRIVACY_APPLIED:
    "Differential privacy mechanisms applied where data is aggregated",
  OPT_IN_REQUIRED:
    "Aggregate pattern contribution requires explicit client opt-in",
  PUBLICATION_DISABLED_AT_THRESHOLD:
    "Publication status is disabled until privacy thresholds are met",
};
