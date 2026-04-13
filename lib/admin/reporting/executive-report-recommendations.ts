// lib/admin/reporting/executive-report-recommendations.ts
import { buildDecisionGuidance } from "@/lib/decision/decision-guidance-service";
import type { ConstitutionalIntake } from "@/lib/decision/system-constitution";

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function arr<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function buildExecutiveReportRecommendationsFromReport(args: {
  report: any;
  organisationName?: string;
  participantCount?: number;
}) {
  const resonanceDomains = arr(args.report?.resonance?.telemetry?.domains);
  const avgDissonance = n(args.report?.resonance?.telemetry?.averageDissonance, 0);
  const burnout = n(args.report?.hcdAggregate?.overallBurnoutIndex, 0);
  const summary =
    s(args.report?.narrative?.summary) ||
    s(args.report?.narrative?.headline) ||
    "Executive reporting posture requires governed interpretation.";

  const state = s(args.report?.state, "DRIFTING");
  const authority = args.report?.ogr?.isAuthorizedToExecute ? "DIRECT" : "PROXY";
  const revenue = Math.max(
    250000,
    n(args.report?.financialExposure?.totalExposure, 1000000),
  );

  const intake: ConstitutionalIntake = {
    fullName: s(args.organisationName, "Executive Requestor"),
    email: "",
    organisation: s(args.organisationName, "Unknown Organisation"),
    sector: "governance",
    revenueBand: revenue >= 1_000_000 ? "ENTERPRISE" : revenue >= 250_000 ? "MID" : "SMB",
    authorityRole: authority,
    authorityScope: authority,
    urgencyWindow: burnout >= 70 ? "month" : "quarter",
    problemStatement: summary,
    symptoms: `avgDissonance=${avgDissonance} burnout=${burnout} criticalDomains=${arr(args.report?.hcdAggregate?.criticalDomains).length}`,
    desiredOutcome: "institutional realignment",
    currentConstraint: state,
    marketExposure:
      avgDissonance >= 70 ? "HIGH" : avgDissonance >= 45 ? "MEDIUM" : "LOW",
    boardInvolved: "unknown",
  };

  return buildDecisionGuidance({
    intake,
    options: {
      assetLimit: 8,
      minAssetScore: 18,
    },
  });
}

export const buildExecutiveReportRecommendations =
  buildExecutiveReportRecommendationsFromReport;