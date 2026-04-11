export type ExecutiveReportState =
  | "ORDERED"
  | "DRIFTING"
  | "MISALIGNED"
  | "DISORDERED";

export type ConstitutionalRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type ExecutiveReportPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "SOVEREIGN";
export type ExecutiveReportTemperature =
  | "COLD"
  | "WARM"
  | "HOT"
  | "SCORCHING";
export type ExecutiveReportAuthorityType = "DIRECT" | "PROXY" | "UNCLEAR";
export type ExecutiveReportReadinessTier =
  | "FRAGILE"
  | "EMERGING"
  | "STABILIZING"
  | "EXECUTION_READY"
  | "SOVEREIGN";
export type ExecutiveReportMarketRiskBand =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";
export type ExecutiveReportRevenueBand =
  | "MICRO"
  | "SMB"
  | "MID"
  | "ENTERPRISE"
  | "WHALE";

export interface ExecutiveReportConstitution {
  route: ConstitutionalRoute;
  priority: ExecutiveReportPriority;
  temperature: ExecutiveReportTemperature;
  orgState: ExecutiveReportState;
  readinessTier: ExecutiveReportReadinessTier;
  authorityType: ExecutiveReportAuthorityType;
  revenueBand: ExecutiveReportRevenueBand;
  marketRiskBand: ExecutiveReportMarketRiskBand;

  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityScore: number;
  revenueScore: number;

  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];

  narrativeSummary: string;
  rationale: string[];
}

export interface ExecutiveReportRecommendation {
  id: string;
  title: string;
  href?: string | null;
  kind: string;
  score: number;
  summary: string;
  reasons: string[];
}

export interface ExecutiveReportGuidance {
  summary: string;
  rationale: string[];
  recommendations: ExecutiveReportRecommendation[];
  nextAction: string;
}

export interface ExecutiveReportPdfConstitutionPayload {
  route: ConstitutionalRoute;
  priority: ExecutiveReportPriority;
  temperature: ExecutiveReportTemperature;
  orgState: ExecutiveReportState;
  readinessTier: ExecutiveReportReadinessTier;
  authorityType: ExecutiveReportAuthorityType;
  revenueBand: ExecutiveReportRevenueBand;
  marketRiskBand: ExecutiveReportMarketRiskBand;

  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityScore: number;
  revenueScore: number;

  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];

  narrativeSummary: string;
  rationale: string[];
}

export interface ReturnTypeSerializeExecutiveReportToPdfPayload {
  title: string;
  subtitle: string;
  generatedAt: string;
  state: ExecutiveReportState;
  headline: string;
  summary: string;
  mandate: string;
  priorities: string[];
  failureModes: string[];
  domains: Array<{
    label: string;
    intent: number;
    reality: number;
    dissonance: number;
  }>;
  exposure: {
    replacementCost: string;
    executionLoss: string;
    totalExposure: string;
  };
  integrity: {
    sovereignCertainty: number;
    averageDissonance: number;
    burnoutIndex: number;
    authorized: boolean;
  };
  constitution: ExecutiveReportPdfConstitutionPayload;
  recommendations: ExecutiveReportRecommendation[];
}

export interface CanonicalExecutiveReportExport {
  schemaVersion: "canonical-report-v2";
  generatedAt: string;
  reportId: string;
  campaign: {
    id: string;
    title: string;
    organisationName: string;
    generatedAt: string;
  };
  registry: {
    model: string;
    node: string;
    protocol: string;
  };
  sections: {
    executiveSummary: {
      title: string;
      subtitle: string;
      state: ExecutiveReportState;
      headline: string;
      summary: string;
      mandate: string;
    };
    constitutionalPosture: ExecutiveReportConstitution;
    strategicDomainAnalysis: {
      averageDissonance: number;
      domains: Array<{
        label: string;
        intent: number;
        reality: number;
        dissonance: number;
      }>;
    };
    financialExposure: {
      replacementCost: number;
      executionLoss: number;
      totalExposure: number;
      replacementCostFormatted: string;
      executionLossFormatted: string;
      totalExposureFormatted: string;
    };
    integritySnapshot: {
      sovereignCertainty: number;
      burnoutIndex: number;
      averageDissonance: number;
      authorized: boolean;
    };
    governedRecommendations: {
      summary: string;
      nextAction: string;
      rationale: string[];
      recommendations: ExecutiveReportRecommendation[];
    };
    priorityStack: {
      items: string[];
    };
    failureModes: {
      items: string[];
    };
    requiredInterventions: {
      items: string[];
    };
    dominantDomains: {
      items: string[];
    };
    worldviewAnchors: {
      items: string[];
    };
    sponsorTypes: {
      items: string[];
    };
    rationale: {
      items: string[];
    };
  };
}

export interface ExecutiveReportApiPayload {
  report: any;
  campaign: {
    id: string;
    title: string;
    organisationName: string;
    generatedAt: string;
    correctionNodes?: any[];
  };
  context: {
    campaignId: string;
    organisationName: string;
    completedParticipantCount: number;
    correctionNodeCount: number;
  };
  constitution: ExecutiveReportConstitution;
  guidance: ExecutiveReportGuidance;
  jsonPayload: CanonicalExecutiveReportExport;
}