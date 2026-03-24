export const ENTERPRISE_ALIGNMENT_DOMAIN_ORDER = [
  "mandate_clarity",
  "decision_integrity",
  "environmental_coherence",
  "operational_discipline",
  "emotional_cultural_order",
  "legacy_continuity_orientation",
] as const;

export type EnterpriseAlignmentDomain =
  (typeof ENTERPRISE_ALIGNMENT_DOMAIN_ORDER)[number];

export const ENTERPRISE_ALIGNMENT_DOMAIN_LABELS: Record<
  EnterpriseAlignmentDomain,
  string
> = {
  mandate_clarity: "Mandate Clarity",
  decision_integrity: "Decision Integrity",
  environmental_coherence: "Environmental Coherence",
  operational_discipline: "Operational Discipline",
  emotional_cultural_order: "Emotional & Cultural Order",
  legacy_continuity_orientation: "Legacy & Continuity Orientation",
};

export type EnterpriseAlignmentBand =
  | "ALIGNED"
  | "DRIFTING"
  | "MISALIGNED"
  | "DISORDERED";

// Literal union for intelligence signals to prevent "magic strings" in the UI
export type FragilitySignal = "HIGH" | "MEDIUM" | "LOW";

export type EnterpriseQuestion = {
  id: string;
  domain: EnterpriseAlignmentDomain;
  statement: string;
};

export type EnterpriseDomainScore = {
  domain: EnterpriseAlignmentDomain;
  earned: number;
  possible: number;
  percent: number;
};

export type EnterpriseVarianceScore = {
  domain: EnterpriseAlignmentDomain;
  variance: number;
};

export type EnterpriseLeadershipGap = {
  domain: EnterpriseAlignmentDomain;
  executivePercent: number;
  nonExecutivePercent: number;
  delta: number;
};

export type EnterpriseAssessmentResult = {
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
  // Intelligence extensions
  varianceScores?: EnterpriseVarianceScore[];
  fragilitySignal?: FragilitySignal;
  dissonanceArea?: number;
};

export type OrganisationSummary = {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  sizeBand: string | null;
  region: string | null;
};

export type CampaignSummary = {
  id: string;
  organisationId: string;
  title: string;
  objective: string | null;
  status: string;
  opensAt: string | null;
  closesAt: string | null;
  cadenceType: string;
  createdByMembershipId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeamSnapshotView = {
  teamName: string;
  respondentCount: number;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
};

export type LeadershipGapView = {
  overallGapPercent: number;
  domainGaps: EnterpriseLeadershipGap[];
  interpretationFlags: string[];
};

export type EnterpriseOrganisationSnapshotView = {
  respondentCount: number;
  invitedCount: number;
  completionRate: number;
  totalScore: number;
  possibleScore: number;
  percentScore: number;
  band: EnterpriseAlignmentBand;
  weakestDomains: EnterpriseAlignmentDomain[];
  strongestDomains: EnterpriseAlignmentDomain[];
  domainScores: EnterpriseDomainScore[];
  varianceScores: EnterpriseVarianceScore[];
  // Intelligence extensions
  fragilitySignal: FragilitySignal | null;
  dissonanceArea: number;
};

export type EnterpriseDashboardView = {
  organisation: OrganisationSummary;
  campaign: CampaignSummary;
  organisationSnapshot: EnterpriseOrganisationSnapshotView | null;
  teamSnapshots: TeamSnapshotView[];
  leadershipGap: LeadershipGapView | null;
  trendSeries: Array<{
    label: string;
    score: number;
  }>;
};