import { logConstitutionalEvent } from "./event-log";
import { detectCaseBreaches } from "./breach-detector";
import { detectSystemDrift } from "./drift-rules";
import { openTribunalsForDrift } from "./drift-tribunal";
import { buildConstitutionalDashboardSnapshot } from "./observability-dashboard";
import type { ConstitutionalDecision } from "./rules";

export function runConstitutionalObservability(input: {
  caseKey: string;
  operatorKey: string;
  decision: ConstitutionalDecision;
  readinessScore: number;
  seriousness: number;
  narrativeCoherence: number;
  authorityType: string;
}) {
  logConstitutionalEvent({
    caseKey: input.caseKey,
    operatorKey: input.operatorKey,
    type: "ROUTE_ASSIGNED",
    severity: "INFO",
    title: "Constitutional route assigned",
    detail: `Case routed to ${input.decision.route} with confidence ${Math.round(
      input.decision.confidence * 100,
    )}%.`,
    metadata: {
      route: input.decision.route,
      confidence: input.decision.confidence,
    },
  });

  const caseBreaches = detectCaseBreaches(input);

  const driftFlags = detectSystemDrift();

  driftFlags.forEach((flag) => {
    logConstitutionalEvent({
      type: "DRIFT_FLAGGED",
      severity: flag.severity,
      title: flag.title,
      detail: flag.detail,
      metadata: {
        category: flag.category,
        affectedCaseKeys: flag.affectedCaseKeys,
      },
    });
  });

  const tribunals = openTribunalsForDrift();
  const dashboard = buildConstitutionalDashboardSnapshot();

  return {
    caseBreaches,
    driftFlags,
    tribunals,
    dashboard,
  };
}