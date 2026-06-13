/**
 * Team Assessment — gold-standard composer.
 *
 * Team assessment must identify the actual organizational friction pattern,
 * not describe "team problems" in general. Diagnosis branches on the
 * detected pattern (unclear ownership, execution drift, role conflict, false
 * alignment, communication overload, unresolved decision authority,
 * accountability gap, capacity constraint). The consequence, next move, and
 * escalation trigger all derive from what this specific pattern means for
 * this team, not from a shared template.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import { composeCaseDerivedJudgement } from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export interface TeamAssessmentGoldInput {
  productCode: "team_assessment";
  teamSize?: number;
  teamContext: string;
  observedFriction: string;
  teamEvidence: string[];
  leadershipAlignment?: string;
  executionTracking?: string;
  decisionVelocity?: string;
  minutesAskedOfUser: number;
  consequenceOfInaction?: string;
  stakeholders?: string[];
  deadline?: string;
  desiredOutcome?: string;
}

export interface TeamAssessmentGoldResult {
  productCode: "team_assessment";
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  teamContext: string;
  dominantTeamFriction: string;
  causedByPattern: string;
  commercialConsequence: string;
  minimumViableCorrection: string;
  whatThisResultDoesNotYetProve: string;
  whenToEscalate: string;
  recommendedNextStep: string;
  roleImplication: string;
  executionSequence: string[];
  timeValueSurplus: { passes: boolean; minutesRespected: number };
  validation: WaveOneValidationResult;
}

export function composeTeamAssessmentGoldResult(
  input: TeamAssessmentGoldInput,
): TeamAssessmentGoldResult {
  const result = composeCaseDerivedJudgement({
    decisionDescription: `Team organisational friction: ${input.observedFriction}`,
    stakeholders: input.stakeholders ?? ["team lead", "team members"],
    deadline: input.deadline ?? "immediate execution impact",
    evidenceAvailable: input.teamEvidence,
    constraint: input.observedFriction,
    desiredOutcome: input.desiredOutcome ?? "team velocity and decision clarity restored",
    priorAttempts: [],
    consequenceOfDelay: input.consequenceOfInaction ?? "drift compounds, team dissonance increases, execution degrades",
    optionsUnderConsideration: [],
  });

  const teamContext = `Team assessment for a ${input.teamSize ?? "multi-person"} team facing: ${input.teamContext}`;

  if (result.status === "insufficient_pattern_evidence") {
    return fallbackTeamReport(input, teamContext, result.missingSignals);
  }

  const { judgement, classification } = result;

  // Derive consequence specifically from this team's situation
  const commercialConsequence =
    input.consequenceOfInaction ||
    `If this ${classification.primaryPattern} friction remains unaddressed: execution slows, team members spend cycles on coordination instead of delivery, and accountability becomes diffuse. The pattern typically compounds within 2-4 weeks unless corrected.`;

  // Role-specific implication
  const roleImplication = deriveRoleImplication(classification.primaryPattern, input.teamSize);

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: judgement.primaryDiagnosis,
    whyThisMatters: `${teamContext}. The detected pattern is ${classification.primaryPattern}.`,
    evidenceOrReasoningBasis: [...input.teamEvidence, ...classification.evidenceMatched],
    decisionFrictionOrContradiction: input.observedFriction,
    consequenceIfIgnored: commercialConsequence,
    oneSpecificNextMove: judgement.recommendedNextMove,
    whatThisDoesNotProve: judgement.limitations.join(" "),
    escalationTrigger: judgement.escalationTrigger,
    optionalDeeperRoute: roleImplication,
  };

  const validation = validateWaveOneUniversalOutput(universal);

  const timeValuePassed =
    input.minutesAskedOfUser <= 12 && validation.passes;

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    teamContext,
    dominantTeamFriction: judgement.primaryDiagnosis,
    causedByPattern: `This team friction is caused by a ${classification.primaryPattern} pattern.`,
    commercialConsequence,
    minimumViableCorrection: judgement.recommendedNextMove,
    whatThisResultDoesNotYetProve: judgement.limitations.join(" "),
    whenToEscalate: judgement.escalationTrigger,
    recommendedNextStep: judgement.recommendedNextMove,
    roleImplication,
    executionSequence: judgement.executionSequence,
    timeValueSurplus: {
      passes: timeValuePassed,
      minutesRespected: input.minutesAskedOfUser,
    },
    validation,
  };
}

function deriveRoleImplication(pattern: string, teamSize?: number): string {
  const size = teamSize ? `${teamSize}-person` : "multi-person";
  const patterns: Record<string, string> = {
    ownership_ambiguity:
      `The team lead must write down the decision and the named owner, circulate to all leads, and confirm in writing. Ownership ambiguity delegated to a team compounds daily.`,
    execution_drift:
      `Execution tracking must move from weekly to daily. The team needs a visible execution log—not a status meeting, a log. Drift undetected for more than 48 hours typically requires re-planning.`,
    role_conflict:
      `The conflicting roles must be resolved in writing: which function owns which decision? Start with the decision that is currently stuck because of the conflict.`,
    false_alignment:
      `Run a quiet, individual survey: ask each team member what the top priority is and what decision is pending. Compare results. If divergence exceeds 30%, alignment is illusory.`,
    communication_overload:
      `Cut the number of synchronous meetings by 50%. Async communication should carry decisions; sync should resolve contradictions. Overload typically means decisions are being re-discussed in meetings.`,
    decision_latency:
      `Establish a decision date for the pending decision. Set the minimum evidence the team lead needs and the escalation owner if the date slips.`,
    accountability_gap:
      `Name the accountable person for this team's delivery. Write their name and the one metric they own. Accountability gap is not a team problem; it is a structure problem.`,
    capacity_constraint:
      `Measure team allocation: what % of capacity is allocated to committed work? If >100%, something must be stopped or deferred. Capacity constraints delegated to the team invite false promises.`,
  };
  return patterns[pattern] || `This ${pattern} pattern must be addressed by the team lead before team execution can stabilize.`;
}

function fallbackTeamReport(
  input: TeamAssessmentGoldInput,
  teamContext: string,
  missingSignals: string[],
): TeamAssessmentGoldResult {
  // When pattern classification fails, still produce case-derived output grounded in the observed friction
  const diagnosis = `Team friction: ${input.observedFriction}. Pattern classification incomplete from provided evidence (${missingSignals[0] || "insufficient detail"}), but the friction itself is clear.`;

  // Ground consequence in the specific team situation
  const consequence =
    input.consequenceOfInaction ||
    `If this friction — specifically "${input.observedFriction}" — remains unaddressed: execution diverges, team coordination breaks down, and delivery velocity declines. The stated consequence of inaction is: ${input.consequenceOfInaction || "team performance degrades."}`;

  // Derive next move from the observed friction
  const nextMove = deriveNextMoveFromTeamFriction(input.observedFriction, input.teamSize);

  // Escalation trigger tied to the team impact
  const escalation = `Escalate to leadership if this friction prevents ${input.teamSize ? "more than one person from" : "any team member from"} executing their work, or if the friction persists for more than 48 hours without visible correction.`;

  // Falsification challenge derived from the specific friction
  const falsificationChallenge = deriveFalsificationChallengeFromTeamFriction(input.observedFriction);

  // Execution sequence tailored to the specific friction type
  const executionSequence = deriveExecutionSequenceFromTeamFriction(input.observedFriction);

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: diagnosis,
    whyThisMatters: teamContext,
    evidenceOrReasoningBasis: input.teamEvidence,
    decisionFrictionOrContradiction: input.observedFriction,
    consequenceIfIgnored: consequence,
    oneSpecificNextMove: nextMove,
    whatThisDoesNotProve: "Pattern-specific remediation (without full classification). Team lead should adjust approach once pattern is confirmed.",
    escalationTrigger: escalation,
    optionalDeeperRoute: falsificationChallenge,
  };

  const validation = validateWaveOneUniversalOutput(universal);
  const timeValuePassed = input.minutesAskedOfUser <= 12 && validation.passes;

  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: input.teamEvidence,
    teamContext,
    dominantTeamFriction: diagnosis,
    causedByPattern: falsificationChallenge,
    commercialConsequence: consequence,
    minimumViableCorrection: nextMove,
    whatThisResultDoesNotYetProve: "Pattern-specific remediation without full classification.",
    whenToEscalate: escalation,
    recommendedNextStep: nextMove,
    roleImplication: deriveRoleImplicationFromFriction(input.observedFriction),
    executionSequence,
    timeValueSurplus: {
      passes: timeValuePassed,
      minutesRespected: input.minutesAskedOfUser,
    },
    validation,
  };
}

function deriveFalsificationChallengeFromTeamFriction(friction: string): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("conflicting") || frictionLower.includes("disagree")) {
    return `Test the hypothesis: "Once the team lead names the priority, all team members will execute against it." Falsified if: after the priority is named, team members still execute different priorities or the stated priority slips within a week.`;
  }
  if (frictionLower.includes("drift")) {
    return `Test the hypothesis: "Once execution is tracked daily, drift will be visible and correctable within 48 hours." Falsified if: after daily tracking starts, drift persists for more than 48 hours or remains unaddressed.`;
  }
  if (frictionLower.includes("alignment")) {
    return `Test the hypothesis: "Team alignment is real (not illusory)." Falsified if: when each team member is quietly asked for the top priority, responses diverge by more than 30% or execution patterns diverge from stated priorities.`;
  }
  if (frictionLower.includes("overload") || frictionLower.includes("capacity")) {
    return `Test the hypothesis: "Once capacity constraints are named and items are stopped, team velocity will improve." Falsified if: after stopping lower-priority work, velocity does not improve by at least 10% or the same items are re-committed within two weeks.`;
  }
  if (frictionLower.includes("unclear") || frictionLower.includes("ambiguous")) {
    return `Test the hypothesis: "Once the decision is written and shared, team clarity will improve and execution will converge." Falsified if: after the decision is written, execution patterns remain divergent or team members report continued confusion.`;
  }
  return `Test whether the resolution of this team friction — "${friction}" — actually improves team execution clarity and velocity. Falsified if team coordination problems persist after the proposed intervention.`;
}

function deriveExecutionSequenceFromTeamFriction(friction: string): string[] {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("conflicting") || frictionLower.includes("disagree")) {
    return [
      "Today: Team lead identifies the conflicting perspectives.",
      "Today: Team lead makes a written decision: 'The priority is [X].'",
      "Today: Team lead shares the decision with the team and confirms understanding.",
      "Next 48 hours: Team members adjust work to align with the stated priority.",
      "Day 5: Measure whether team is executing the stated priority uniformly.",
    ];
  }
  if (frictionLower.includes("drift")) {
    return [
      "Day 1: Set up daily execution log (what was supposed to happen vs. what happened).",
      "Day 2–5: Team lead reviews the log daily with the team.",
      "Day 5: Identify drift patterns. Correct in writing within 24 hours of detection.",
      "Day 7: Measure whether drift is visible and corrected within 48 hours.",
      "Week 2+: Continue daily tracking and 48-hour correction cycles.",
    ];
  }
  if (frictionLower.includes("alignment")) {
    return [
      "Day 1: Conduct quiet individual survey: 'Top 3 priorities this quarter are...'",
      "Day 2: Tabulate responses. Identify divergence.",
      "Day 2: If divergence >30%, hold a team alignment meeting.",
      "Day 3: Team lead names the top 3 priorities in writing.",
      "Day 5: Measure team execution against the stated priorities.",
    ];
  }
  if (frictionLower.includes("overload") || frictionLower.includes("capacity")) {
    return [
      "Day 1: Measure team allocation: % committed to each workstream.",
      "Day 1: If >100%, identify items to stop or defer.",
      "Day 2: Team lead decides what stops and communicates in writing.",
      "Day 3: Reallocate freed capacity to top priorities.",
      "Week 2–4: Track team velocity. Measure whether it improves.",
    ];
  }
  if (frictionLower.includes("unclear") || frictionLower.includes("ambiguous")) {
    return [
      "Today: Team lead writes the decision or the clear priority in one sentence.",
      "Today: Team lead shares it with each team member individually.",
      "Today: Each team member confirms their understanding in writing.",
      "Next 48 hours: Team members adjust work to execute the named priority.",
      "Day 5: Measure whether execution is now uniform and clear.",
    ];
  }
  return [
    "1. Name the team friction in one sentence.",
    "2. Identify who is blocked and what decision or clarity is needed.",
    "3. Team lead decides and communicates in writing.",
    "4. Team members adjust work and confirm understanding.",
    "5. Measure execution clarity and team velocity within one week.",
  ];
}

function deriveNextMoveFromTeamFriction(friction: string, teamSize?: number): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("conflicting") || frictionLower.includes("disagree")) {
    return `Team lead holds a decision meeting within 24 hours with the conflicting parties. Outcome: write one sentence, "The priority is [X]." Get explicit commitment from each person in writing by EOD.`;
  }
  if (frictionLower.includes("unclear") || frictionLower.includes("ambiguous")) {
    return `Team lead writes down the decision and the owner by EOD today. Share it with the team. Each team member confirms understanding in writing within 2 hours. Begin execution tomorrow.`;
  }
  if (frictionLower.includes("overload") || frictionLower.includes("capacity")) {
    return `Team lead measures team allocation by EOD today: what % is committed to each workstream? If >100%, team lead decides what stops or defers by tomorrow 10am. Reallocate freed capacity in writing.`;
  }
  if (frictionLower.includes("drift")) {
    return `Team lead implements daily execution tracking starting tomorrow: visible log of planned vs. actual. Team lead reviews the log each day with the team within 24 hours of completion.`;
  }
  if (frictionLower.includes("alignment")) {
    return `Team lead runs a quiet survey by tomorrow 5pm: ask each team member to write down the top 3 priorities. Compile results by end of day. Hold alignment meeting within 48 hours if divergence >30%.`;
  }
  return `Team lead identifies the specific decision or execution that is blocked by EOD today and resolves it in writing with committed owners and a deadline within 48 hours.`;
}

function deriveRoleImplicationFromFriction(friction: string): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("ownership")) {
    return `The team lead must write the decision and the owner, and confirm in writing. Ownership ambiguity delegated to the team compounds daily.`;
  }
  if (frictionLower.includes("alignment")) {
    return `The team lead must measure and resolve alignment. Illusory alignment (agreement in meetings, divergence in execution) is the most common team failure mode.`;
  }
  if (frictionLower.includes("role")) {
    return `The conflicting roles must be clarified in writing at the team lead level. Start with the one decision that is currently stuck.`;
  }
  if (frictionLower.includes("capacity")) {
    return `The team lead must decide what stops or defers. Capacity overload delegated to the team invites failure promises.`;
  }
  return `The team lead is accountable for resolving this friction. It cannot be resolved by the team members alone.`;
}
