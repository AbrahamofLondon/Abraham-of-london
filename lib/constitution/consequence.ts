/**
 * lib/constitution/consequence.ts — Dynamic consequence modelling.
 *
 * Binds consequence output to real decision data:
 * - decision text and blocker
 * - delay duration and owner clarity
 * - exposure data from economic model
 * - contradiction severity from kernel
 * - execution state from decision-state-engine
 *
 * Produces a structured consequence chain, not static text trees.
 */

export type ConsequenceNode = {
  step: string;
  impact: string;
  severity: "low" | "medium" | "high" | "critical";
  timeframe?: string;
  /** What evidence supports this consequence */
  basis?: string;
};

export type ConsequenceInput = {
  trajectory: string;
  readiness: number;
  /** The unresolved decision (from case object) */
  decision?: string | null;
  /** What's blocking resolution */
  blocker?: string | null;
  /** Owner clarity score (0-100) */
  ownerClarity?: number | null;
  /** Days since decision was first identified */
  daysSinceIdentified?: number | null;
  /** Economic exposure estimate (£) */
  estimatedExposure?: number | null;
  /** Contradiction severity from kernel (0-1) */
  contradictionSeverity?: number | null;
  /** Current execution state */
  executionState?: "PENDING" | "EXECUTED" | "BLOCKED" | "ESCALATED" | "FAILED" | null;
  /** Number of people affected */
  headcountAffected?: number | null;
  /** Condition class from diagnostic */
  conditionClass?: "authority" | "definition" | "execution" | "instability" | null;
};

function severityFromScore(score: number): ConsequenceNode["severity"] {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

export function buildConsequenceTree(input: ConsequenceInput): ConsequenceNode[] {
  const nodes: ConsequenceNode[] = [];
  const days = input.daysSinceIdentified ?? 0;
  const ownerClarity = input.ownerClarity ?? 50;
  const contradictionSev = input.contradictionSeverity ?? 0;

  // Compute compound severity: trajectory + delay + contradiction + execution state
  let compoundScore = 0;
  if (input.trajectory === "DETERIORATING") compoundScore += 35;
  else if (input.trajectory === "STABLE") compoundScore += 15;

  if (days > 60) compoundScore += 25;
  else if (days > 30) compoundScore += 15;
  else if (days > 14) compoundScore += 8;

  if (contradictionSev > 0.7) compoundScore += 20;
  else if (contradictionSev > 0.4) compoundScore += 10;

  if (input.executionState === "BLOCKED" || input.executionState === "FAILED") compoundScore += 15;
  else if (input.executionState === "ESCALATED") compoundScore += 10;

  if (ownerClarity < 30) compoundScore += 10;

  const overallSeverity = severityFromScore(Math.min(100, compoundScore));

  // NODE 1: Primary consequence — bound to condition class
  if (input.conditionClass === "authority") {
    nodes.push({
      step: "Authority gap remains unresolved",
      impact: ownerClarity < 40
        ? "No one can make this decision binding. Parallel authority produces conflicting actions."
        : "Authority exists but is not exercised. The decision drifts without enforcement.",
      severity: overallSeverity,
      timeframe: days > 30 ? `${days} days unresolved` : undefined,
      basis: input.blocker ? `Stated blocker: ${input.blocker}` : "Owner clarity below threshold",
    });
  } else if (input.conditionClass === "execution") {
    nodes.push({
      step: "Execution failure compounds",
      impact: input.executionState === "BLOCKED"
        ? "Action was attempted but blocked. Resources are spent without forward movement."
        : "Decision exists but is not being acted on. Delay normalises inaction.",
      severity: overallSeverity,
      timeframe: days > 14 ? `${days} days since identified` : undefined,
      basis: input.executionState ? `Execution state: ${input.executionState}` : undefined,
    });
  } else if (input.conditionClass === "definition") {
    nodes.push({
      step: "Decision remains undefined",
      impact: "The problem has been named but the decision has not been framed. People discuss the situation without converging on what must actually be decided.",
      severity: overallSeverity,
      basis: input.decision ? `Current framing: "${input.decision.slice(0, 100)}"` : undefined,
    });
  } else if (input.conditionClass === "instability") {
    nodes.push({
      step: "Structural instability persists",
      impact: "Multiple systems are stressed simultaneously. Fixing one area without addressing root cause shifts pressure to adjacent systems.",
      severity: overallSeverity,
      basis: contradictionSev > 0.5 ? `Contradiction severity: ${(contradictionSev * 100).toFixed(0)}%` : undefined,
    });
  } else {
    // Fallback for unknown condition class
    nodes.push({
      step: input.trajectory === "DETERIORATING" ? "Unresolved tension is compounding" : "Decision remains open",
      impact: input.trajectory === "DETERIORATING"
        ? "Without intervention, the structural weakness compounds with time."
        : "The situation is stable but unresolved. Opportunity cost accumulates.",
      severity: overallSeverity,
    });
  }

  // NODE 2: Time-based consequence — only if meaningful delay
  if (days > 14) {
    const timeNode: ConsequenceNode = {
      step: days > 60 ? "Delay has become structural" : days > 30 ? "Delay is normalising" : "Early drift detected",
      impact: days > 60
        ? "The cost of reversing direction now exceeds the cost of the original decision. Workarounds have become process."
        : days > 30
          ? "Stakeholders are beginning to act from different assumptions. Coordination cost is rising."
          : "The decision window is still open but narrowing. Early action has highest leverage.",
      severity: days > 60 ? "critical" : days > 30 ? "high" : "medium",
      timeframe: `${days} days`,
    };
    nodes.push(timeNode);
  }

  // NODE 3: Financial consequence — only from real data
  if (input.estimatedExposure != null && input.estimatedExposure > 0) {
    nodes.push({
      step: "Financial exposure is quantifiable",
      impact: `Estimated exposure: £${input.estimatedExposure.toLocaleString()} over the decision window. This is a scenario projection from your declared inputs, not a forecast.`,
      severity: input.estimatedExposure >= 100_000 ? "critical" : input.estimatedExposure >= 20_000 ? "high" : "medium",
      basis: "Derived from user-supplied financial data and delay exposure score",
    });
  }

  // NODE 4: People consequence — only if headcount supplied
  if (input.headcountAffected != null && input.headcountAffected > 5) {
    nodes.push({
      step: "People are affected",
      impact: `${input.headcountAffected} people are operating under the unresolved decision. Each day of ambiguity reduces execution quality and increases coordination cost.`,
      severity: input.headcountAffected > 50 ? "high" : "medium",
      basis: "User-declared headcount",
    });
  }

  // NODE 5: Contradiction consequence — only if kernel detected interference
  if (contradictionSev > 0.5) {
    nodes.push({
      step: "Cross-assessment contradiction detected",
      impact: "Evidence from different assessment stages points in conflicting directions. The system cannot produce a unified recommendation until this is resolved.",
      severity: contradictionSev > 0.8 ? "critical" : "high",
      basis: `Contradiction severity: ${(contradictionSev * 100).toFixed(0)}%`,
    });
  }

  return nodes;
}
