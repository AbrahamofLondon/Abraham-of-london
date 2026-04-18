// lib/admin/reporting/types.ts

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

export type ExecutiveReportClassification = "RESTRICTED";

export interface ExecutiveReportDomainReading {
  label: string;
  intent: number;
  reality: number;
  dissonance: number;
}

export interface ExecutiveReportFinancialExposure {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
  replacementCostFormatted: string;
  executionLossFormatted: string;
  totalExposureFormatted: string;
}

export interface ExecutiveReportIntegritySnapshot {
  sovereignCertainty: number;
  burnoutIndex: number;
  averageDissonance: number;
  authorized: boolean;
}

export interface ExecutiveReportConstitution {
  route: ConstitutionalRoute;
  confidence: number;
  priority: ExecutiveReportPriority;
  temperature: ExecutiveReportTemperature;
  orgState: ExecutiveReportState;
  posture: ExecutiveReportState;
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
  disqualifiersTriggered: string[];
  escalationAllowed: boolean;

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
  domains: ExecutiveReportDomainReading[];
  exposure: {
    replacementCost: string;
    executionLoss: string;
    totalExposure: string;
  };
  integrity: ExecutiveReportIntegritySnapshot;
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
      domains: ExecutiveReportDomainReading[];
    };
    financialExposure: ExecutiveReportFinancialExposure;
    integritySnapshot: ExecutiveReportIntegritySnapshot;
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

export interface ExecutiveReportCampaignContext {
  campaignId: string;
  organisationName: string;
  completedParticipantCount: number;
  correctionNodeCount: number;
}

export interface ExecutiveReportCampaignPayload {
  id: string;
  title: string;
  organisationName: string;
  generatedAt: string;
  correctionNodes?: unknown[];
}

/** Canonical report data shape produced by executive-report-service */
export interface ExecutiveReportData {
  state?: string;
  narrative?: {
    headline?: string;
    summary?: string;
    mandate?: string;
  };
  resonance?: {
    telemetry?: {
      averageDissonance?: number;
      domains?: Array<{
        label?: string;
        domain?: string;
        intent?: number;
        reality?: number;
        dissonance?: number;
      }>;
    };
  };
  hcdAggregate?: {
    overallBurnoutIndex?: number;
    criticalDomains?: string[];
  };
  hcd?: Array<{
    label?: string;
    potential?: number;
    extraction?: number;
    burnoutIndex?: number;
    wellbeing?: number;
    attritionRisk?: string;
  }>;
  financialExposure?: {
    replacementCost?: number;
    executionLoss?: number;
    totalExposure?: number;
  };
  failureModes?: string[];
  priorityStack?: string[];
  ogr?: {
    sovereignCertainty?: number;
    isAuthorizedToExecute?: boolean;
  };
  [key: string]: unknown;
}

export interface ExecutiveReportApiPayload {
  report: ExecutiveReportData;
  campaign: ExecutiveReportCampaignPayload;
  context: ExecutiveReportCampaignContext;
  constitution: ExecutiveReportConstitution;
  guidance: ExecutiveReportGuidance;
  jsonPayload: CanonicalExecutiveReportExport;
}
