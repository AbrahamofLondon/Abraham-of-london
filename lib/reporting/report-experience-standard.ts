export type ReportTier =
  | "free"
  | "paid"
  | "boardroom"
  | "executive"
  | "retainer"
  | "public-proof";

export type ReportFormat = "web" | "pdf" | "both";

export type ArrivalVariant =
  | "signal"
  | "brief"
  | "transmission"
  | "sealed"
  | "intelligence";

export type VisualStandard =
  | "clean"
  | "premium"
  | "institutional"
  | "boardroom-grade";

export type ArrivalExperience = {
  hasPreLoadScreen: boolean;
  hasAmbientAtmosphere: boolean;
  hasIdentityMoment: boolean;
  hasClassificationReveal: boolean;
  hasProvenanceMoment: boolean;
  hasPersonalAddress: boolean;
  hasWeightStatement: boolean;
  hasBriefingTone: boolean;
};

export type ReportExperienceStandard = {
  reportCode: string;
  productCode?: string;
  tier: ReportTier;
  format: ReportFormat;

  arrival: ArrivalExperience;

  requiresCover: boolean;
  requiresForensicLayer: boolean;
  requiresProvenanceHash: boolean;
  requiresEvidenceBasis: boolean;
  requiresFalsificationSection: boolean;
  requiresOutcomeHypothesis: boolean;
  requiresNextAction: boolean;
  requiresFeedbackWidget: boolean;
  requiresCustomerAccess: boolean;
  requiresCaseStudyEligibility: boolean;

  visualStandard: VisualStandard;

  requiresForwardability: boolean;
  requiresCitability: boolean;
  requiresReturnability: boolean;
};

export const ARRIVAL_BY_VARIANT: Record<ArrivalVariant, ArrivalExperience> = {
  signal: {
    hasPreLoadScreen: true,
    hasAmbientAtmosphere: false,
    hasIdentityMoment: true,
    hasClassificationReveal: false,
    hasProvenanceMoment: false,
    hasPersonalAddress: false,
    hasWeightStatement: true,
    hasBriefingTone: true,
  },
  brief: {
    hasPreLoadScreen: true,
    hasAmbientAtmosphere: false,
    hasIdentityMoment: true,
    hasClassificationReveal: true,
    hasProvenanceMoment: true,
    hasPersonalAddress: true,
    hasWeightStatement: true,
    hasBriefingTone: true,
  },
  transmission: {
    hasPreLoadScreen: true,
    hasAmbientAtmosphere: true,
    hasIdentityMoment: true,
    hasClassificationReveal: true,
    hasProvenanceMoment: true,
    hasPersonalAddress: true,
    hasWeightStatement: true,
    hasBriefingTone: true,
  },
  sealed: {
    hasPreLoadScreen: true,
    hasAmbientAtmosphere: true,
    hasIdentityMoment: true,
    hasClassificationReveal: true,
    hasProvenanceMoment: true,
    hasPersonalAddress: true,
    hasWeightStatement: true,
    hasBriefingTone: true,
  },
  intelligence: {
    hasPreLoadScreen: true,
    hasAmbientAtmosphere: true,
    hasIdentityMoment: true,
    hasClassificationReveal: true,
    hasProvenanceMoment: true,
    hasPersonalAddress: false,
    hasWeightStatement: true,
    hasBriefingTone: true,
  },
};

const DEFAULTS_BY_TIER: Record<
  ReportTier,
  Omit<ReportExperienceStandard, "reportCode" | "productCode" | "format" | "arrival">
> = {
  free: {
    tier: "free",
    requiresCover: false,
    requiresForensicLayer: false,
    requiresProvenanceHash: false,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: false,
    requiresOutcomeHypothesis: false,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: false,
    requiresCaseStudyEligibility: false,
    visualStandard: "clean",
    requiresForwardability: false,
    requiresCitability: false,
    requiresReturnability: true,
  },
  paid: {
    tier: "paid",
    requiresCover: true,
    requiresForensicLayer: true,
    requiresProvenanceHash: false,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: false,
    requiresOutcomeHypothesis: true,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: true,
    requiresCaseStudyEligibility: false,
    visualStandard: "premium",
    requiresForwardability: true,
    requiresCitability: true,
    requiresReturnability: true,
  },
  boardroom: {
    tier: "boardroom",
    requiresCover: true,
    requiresForensicLayer: true,
    requiresProvenanceHash: true,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: true,
    requiresOutcomeHypothesis: true,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: true,
    requiresCaseStudyEligibility: true,
    visualStandard: "boardroom-grade",
    requiresForwardability: true,
    requiresCitability: true,
    requiresReturnability: true,
  },
  executive: {
    tier: "executive",
    requiresCover: true,
    requiresForensicLayer: true,
    requiresProvenanceHash: true,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: true,
    requiresOutcomeHypothesis: true,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: true,
    requiresCaseStudyEligibility: true,
    visualStandard: "institutional",
    requiresForwardability: true,
    requiresCitability: true,
    requiresReturnability: true,
  },
  retainer: {
    tier: "retainer",
    requiresCover: true,
    requiresForensicLayer: true,
    requiresProvenanceHash: true,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: true,
    requiresOutcomeHypothesis: true,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: true,
    requiresCaseStudyEligibility: true,
    visualStandard: "institutional",
    requiresForwardability: true,
    requiresCitability: true,
    requiresReturnability: true,
  },
  "public-proof": {
    tier: "public-proof",
    requiresCover: true,
    requiresForensicLayer: true,
    requiresProvenanceHash: true,
    requiresEvidenceBasis: true,
    requiresFalsificationSection: true,
    requiresOutcomeHypothesis: false,
    requiresNextAction: true,
    requiresFeedbackWidget: true,
    requiresCustomerAccess: false,
    requiresCaseStudyEligibility: false,
    visualStandard: "institutional",
    requiresForwardability: true,
    requiresCitability: true,
    requiresReturnability: true,
  },
};

export function defineReportExperienceStandard(input: {
  reportCode: string;
  productCode?: string;
  tier: ReportTier;
  format: ReportFormat;
  arrivalVariant: ArrivalVariant;
  overrides?: Partial<ReportExperienceStandard>;
}): ReportExperienceStandard {
  const base = DEFAULTS_BY_TIER[input.tier];

  return {
    ...base,
    reportCode: input.reportCode,
    productCode: input.productCode,
    format: input.format,
    arrival: ARRIVAL_BY_VARIANT[input.arrivalVariant],
    ...input.overrides,
  };
}
