// lib/admin/reporting/executive-report-recommendations.ts
import { buildDecisionGuidance } from "@/lib/decision/decision-guidance-service";

export function buildExecutiveReportRecommendations(args: {
  report: any;
  organisationName?: string;
  participantCount?: number;
}) {
  const resonanceDomains = args.report?.resonance?.telemetry?.domains || [];
  const avgDissonance = args.report?.resonance?.telemetry?.averageDissonance || 0;
  const burnout = args.report?.hcdAggregate?.overallBurnoutIndex || 0;

  const result = buildDecisionGuidance({
    fusionInput: {
      ruleScore: Math.max(0, 100 - avgDissonance),
      aiScore: Math.max(0, 100 - avgDissonance),
      aiConfidence: 0.82,
      revenue: 1_000_000,
      authority: "DIRECT",
      urgency: "quarter",
      problem: args.report?.narrative?.summary || "",
      sessionDepth: 3,
      timeOnSite: 600,
      returnVisitor: true,
    },
    resonance: {
      averageDissonance: avgDissonance,
      domains: resonanceDomains,
    },
    hcd: {
      overallBurnoutIndex: burnout,
      criticalDomains: args.report?.hcdAggregate?.criticalDomains || [],
      elevatedDomains: args.report?.hcdAggregate?.elevatedDomains || [],
      riskScore: args.report?.hcdAggregate?.riskScore || "MEDIUM",
    },
    questionnaire: {
      sector: "governance",
      sponsorRole: "DIRECT",
      statedProblem: args.report?.narrative?.summary || "",
      primaryConcern: args.report?.state || "",
      desiredOutcome: "institutional realignment",
    },
    market: {
      marketRiskBand: "MEDIUM",
      sector: "governance",
    },
    options: {
      assetLimit: 6,
      minAssetScore: 24,
    },
  });

  return result;
}