import type { ConstitutionalDecision } from "./rules";
import { logConstitutionalEvent } from "./event-log";

export function detectCaseBreaches(input: {
  caseKey: string;
  operatorKey: string;
  decision: ConstitutionalDecision;
  readinessScore: number;
  seriousness: number;
  narrativeCoherence: number;
  authorityType: string;
}): string[] {
  const breaches: string[] = [];

  if (
    input.decision.route === "STRATEGY" &&
    input.readinessScore < 60
  ) {
    breaches.push("Strategy route assigned below strategy readiness floor.");
  }

  if (
    input.decision.route === "STRATEGY" &&
    input.authorityType === "UNCLEAR"
  ) {
    breaches.push("Strategy route assigned under unclear authority.");
  }

  if (
    input.decision.route === "STRATEGY" &&
    input.narrativeCoherence < 50
  ) {
    breaches.push("Strategy route assigned under insufficient narrative coherence.");
  }

  if (
    input.decision.route === "REJECT" &&
    input.seriousness >= 65 &&
    input.readinessScore >= 45
  ) {
    breaches.push("Potential harsh rejection against a substantively serious case.");
  }

  breaches.forEach((detail) => {
    logConstitutionalEvent({
      caseKey: input.caseKey,
      operatorKey: input.operatorKey,
      type: "CONSTITUTIONAL_BREACH",
      severity: "BREACH",
      title: "Case-level constitutional breach detected",
      detail,
      metadata: {
        route: input.decision.route,
        readinessScore: input.readinessScore,
        seriousness: input.seriousness,
        narrativeCoherence: input.narrativeCoherence,
        authorityType: input.authorityType,
      },
    });
  });

  return breaches;
}