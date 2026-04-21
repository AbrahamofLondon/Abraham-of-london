import type { TensionSignal } from "@/lib/diagnostics/tension-thread";
import type { TeamAssessmentAggregate } from "@/lib/team/sentiment-aggregation";

export function extractRespondentDerivedTeamTensions(
  aggregate: TeamAssessmentAggregate,
): TensionSignal[] {
  const out: TensionSignal[] = [];
  const trust = aggregate.domains.trust_communication;
  const execution = aggregate.domains.execution_integrity;
  const authority = aggregate.domains.authority_escalation;

  if (trust && (trust.teamMean < 45 || (trust.deltaFromLeader ?? 0) <= -15)) {
    out.push({
      domain: "trust_communication",
      signal: "trust asymmetry reinforced by respondent-derived evidence",
      severity: trust.teamMean < 35 ? "high" : "medium",
      source: "team",
      evidence: `${aggregate.respondentCount} respondents; team trust mean ${trust.teamMean}; leader delta ${trust.deltaFromLeader ?? "n/a"}.`,
    });
  }

  if (execution && execution.disagreementDensity >= 45) {
    out.push({
      domain: "execution_integrity",
      signal: "execution drift reinforced by wide respondent disagreement",
      severity: execution.disagreementDensity >= 70 ? "high" : "medium",
      source: "team",
      evidence: `${aggregate.respondentCount} respondents; execution disagreement density ${execution.disagreementDensity}.`,
    });
  }

  if (authority && (authority.variance >= 300 || authority.spread >= 40)) {
    out.push({
      domain: "authority_escalation",
      signal: "authority instability reinforced by escalation variance",
      severity: authority.spread >= 60 ? "high" : "medium",
      source: "team",
      evidence: `${aggregate.respondentCount} respondents; authority spread ${authority.spread}; variance ${authority.variance}.`,
    });
  }

  return out;
}
