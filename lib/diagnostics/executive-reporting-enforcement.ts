import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";

export type ExecutiveReportingAccessContext = {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  intakeMode?: "ladder" | "direct_sponsored" | "monitoring" | string | null;
  sponsoredDirect?: boolean;
  sponsorNameOrSeat?: string | null;
  monitoringAccountId?: string | null;
  monitoringContext?: boolean;
};

export type ExecutiveReportingAccessDecision = {
  allowed: boolean;
  reason?: string;
  requiredPath?: string;
  intakeMode: "ladder" | "direct_sponsored" | "monitoring";
};

export async function enforceExecutiveReportingAccess(
  context: ExecutiveReportingAccessContext,
): Promise<ExecutiveReportingAccessDecision> {
  const explicitMode = context.intakeMode;

  if (
    explicitMode === "direct_sponsored" &&
    context.sponsoredDirect &&
    String(context.sponsorNameOrSeat || "").trim()
  ) {
    return {
      allowed: true,
      intakeMode: "direct_sponsored",
      reason: "Sponsored direct institutional intake verified.",
    };
  }

  if (
    explicitMode === "monitoring" &&
    (context.monitoringContext || context.monitoringAccountId)
  ) {
    return {
      allowed: true,
      intakeMode: "monitoring",
      reason: "Monitoring account context verified.",
    };
  }

  const journey = await getDiagnosticJourney(context);
  const hasEnterprise = Boolean(journey.stages.enterprise);
  const hasPriorExecutiveRun = Boolean(journey.stages.executive_reporting);
  const hasExecutiveRouteDecision = journey.routeDecisions.some((decision) => {
    if (!decision || typeof decision !== "object") return false;
    const route = String((decision as Record<string, unknown>).route || "").toUpperCase();
    const nextRoute = String((decision as Record<string, unknown>).nextRoute || "").toUpperCase();
    return route === "EXECUTIVE_REPORTING" || nextRoute === "EXECUTIVE_REPORTING";
  });

  if (hasEnterprise || hasPriorExecutiveRun || hasExecutiveRouteDecision) {
    return {
      allowed: true,
      intakeMode: "ladder",
      reason: "Required upstream diagnostic ladder authority verified.",
    };
  }

  const partialPath = journey.stages.team
    ? "/diagnostics/enterprise-assessment"
    : journey.stages.constitutional
      ? "/diagnostics/team-assessment"
      : "/diagnostics/constitutional-diagnostic";

  return {
    allowed: false,
    intakeMode: "ladder",
    reason:
      "Executive Reporting requires completed upstream ladder authority, sponsored direct intake, or monitoring context.",
    requiredPath: partialPath,
  };
}
