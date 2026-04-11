export type ExecutiveReportRoute = "PROCEED" | "DIAGNOSE" | "REJECT";
export type ExecutiveReportSeriousness = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type ExecutiveReport = {
  headline: string;
  route: ExecutiveReportRoute;
  seriousness: ExecutiveReportSeriousness;
  governanceRisk: number;
  topPressurePoints: [string, string, string];
  domainBreakdown: {
    strategic: number;
    financial: number;
    operational: number;
    humanCapital: number;
    governance: number;
  };
  decisionOptions: string[];
  tradeOffMap: string[];
  correctionPriorities: string[];
  executionSequence: {
    next7Days: string[];
    next30Days: string[];
    next90Days: string[];
  };
  escalationRecommendation: string;
};