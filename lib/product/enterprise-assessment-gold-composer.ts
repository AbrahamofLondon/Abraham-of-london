/**
 * Enterprise Assessment — gold-standard composer.
 *
 * Enterprise assessment must identify the actual governance or strategic
 * friction pattern, not describe "enterprise challenges" generically.
 * Diagnosis branches on the detected pattern (governance failure, strategic
 * overreach, decision latency, cross-functional misalignment, operating model
 * ambiguity, initiative overload, transformation theatre, board/executive
 * visibility gap, risk ownership failure). The consequence, next move, and
 * escalation trigger all derive from what this pattern means for this
 * enterprise, not from shared enterprise boilerplate.
 */

import {
  validateWaveOneUniversalOutput,
  type WaveOneUniversalOutput,
  type WaveOneValidationResult,
} from "@/lib/product/wave-one-gold-standard";
import { composeCaseDerivedJudgement } from "@/lib/judgement/compose-case-derived-judgement";
import type { DecisionPattern } from "@/lib/judgement/decision-pattern-model";

export interface EnterpriseAssessmentGoldInput {
  productCode: "enterprise_assessment";
  enterpriseContext: string;
  observedFriction: string;
  enterpriseEvidence: string[];
  boardVisibility?: string;
  governanceStructure?: string;
  strategicAlignment?: string;
  crossFunctionalVelocity?: string;
  minutesAskedOfUser: number;
  consequenceOfInaction?: string;
  stakeholders?: string[];
  deadline?: string;
  desiredOutcome?: string;
}

export interface EnterpriseAssessmentGoldResult {
  productCode: "enterprise_assessment";
  patternStatus: "judged" | "insufficient_pattern_evidence";
  primaryPattern: DecisionPattern | null;
  secondaryPatterns: DecisionPattern[];
  patternEvidence: string[];
  enterpriseContext: string;
  dominantEnterpriseFriction: string;
  causedByPattern: string;
  strategicConsequence: string;
  minimumViableCorrection: string;
  whatThisResultDoesNotYetProve: string;
  whenToEscalate: string;
  recommendedNextStep: string;
  governanceImplication: string;
  executionSequence: string[];
  timeValueSurplus: { passes: boolean; minutesRespected: number };
  validation: WaveOneValidationResult;
}

export function composeEnterpriseAssessmentGoldResult(
  input: EnterpriseAssessmentGoldInput,
): EnterpriseAssessmentGoldResult {
  const result = composeCaseDerivedJudgement({
    decisionDescription: `Enterprise governance friction: ${input.observedFriction}`,
    stakeholders: input.stakeholders ?? ["executive", "board", "operations"],
    deadline: input.deadline ?? "next business cycle",
    evidenceAvailable: input.enterpriseEvidence,
    constraint: input.observedFriction,
    desiredOutcome: input.desiredOutcome ?? "enterprise decision velocity and accountability restored",
    priorAttempts: [],
    consequenceOfDelay:
      input.consequenceOfInaction ??
      "governance fog persists, strategic misalignment compounds, board visibility gaps widen",
    optionsUnderConsideration: [],
  });

  const enterpriseContext = `Enterprise assessment: ${input.enterpriseContext}`;

  // If pattern classification succeeds, use the classification; otherwise, fall back to input-derived diagnosis
  if (result.status === "insufficient_pattern_evidence") {
    return fallbackEnterpriseReport(input, enterpriseContext, result.missingSignals);
  }

  const { judgement, classification } = result;

  // Derive consequence specifically from this enterprise's situation
  const strategicConsequence =
    input.consequenceOfInaction ||
    `If this ${classification.primaryPattern} remains unaddressed: strategic decisions slow, cross-functional coordination breaks down, and the board's visibility into execution deteriorates. This pattern typically compounds across quarterly cycles, creating compounding misalignment.`;

  // Governance-specific implication
  const governanceImplication = deriveGovernanceImplication(classification.primaryPattern);

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: judgement.primaryDiagnosis,
    whyThisMatters: `${enterpriseContext}. The detected pattern is ${classification.primaryPattern}.`,
    evidenceOrReasoningBasis: [...input.enterpriseEvidence, ...classification.evidenceMatched],
    decisionFrictionOrContradiction: input.observedFriction,
    consequenceIfIgnored: strategicConsequence,
    oneSpecificNextMove: judgement.recommendedNextMove,
    whatThisDoesNotProve: judgement.limitations.join(" "),
    escalationTrigger: judgement.escalationTrigger,
    optionalDeeperRoute: governanceImplication,
  };

  const validation = validateWaveOneUniversalOutput(universal);

  const timeValuePassed = input.minutesAskedOfUser <= 15 && validation.passes;

  return {
    productCode: input.productCode,
    patternStatus: "judged",
    primaryPattern: classification.primaryPattern,
    secondaryPatterns: classification.secondaryPatterns,
    patternEvidence: classification.evidenceMatched,
    enterpriseContext,
    dominantEnterpriseFriction: judgement.primaryDiagnosis,
    causedByPattern: `This enterprise friction is caused by a ${classification.primaryPattern} pattern.`,
    strategicConsequence,
    minimumViableCorrection: judgement.recommendedNextMove,
    whatThisResultDoesNotYetProve: judgement.limitations.join(" "),
    whenToEscalate: judgement.escalationTrigger,
    recommendedNextStep: judgement.recommendedNextMove,
    governanceImplication,
    executionSequence: judgement.executionSequence,
    timeValueSurplus: {
      passes: timeValuePassed,
      minutesRespected: input.minutesAskedOfUser,
    },
    validation,
  };
}

function deriveGovernanceImplication(pattern: string): string {
  const patterns: Record<string, string> = {
    governance_failure:
      `Governance structure must be rewritten: who decides what, at what level, with what approval? The current structure permits decisions to stall or collide. Start with the decision that is currently stuck.`,
    strategic_overreach:
      `The enterprise strategy must be resized to what this organization can execute in parallel. Overreach typically means every leader is accountable for everything, and nobody is accountable for anything.`,
    decision_latency:
      `Establish a decision-approval timeline. Name the decision maker for each category of decision (strategic, tactical, operational). Set maximum approval time at each level.`,
    misalignment:
      `Run a cross-functional strategy alignment workshop: have each function state what the enterprise strategy means for their domain in one sentence. If alignment diverges, the strategy is not understood at the working level.`,
    operating_model_ambiguity:
      `The operating model must be written and published. Who reports to whom? Who owns what decision? What is the escalation path? Ambiguity delegated to leaders creates divergent execution.`,
    initiative_overload:
      `Count the number of active initiatives and strategic priorities. If the count exceeds the number of leaders who can track them, the portfolio is overloaded. Stop or defer items until capacity aligns with ambition.`,
    transformation_theatre:
      `Define what transformation success means: what metric changes? By when? Who is accountable? If the definition is missing or vague, the transformation is theatre, not execution.`,
    board_visibility_gap:
      `The board needs one monthly view: strategic status, execution status, risk status, and accountability assignments. If the board cannot see this in one page, information architecture is the problem.`,
    risk_ownership_failure:
      `Each material risk must have a named owner—not a function, a person—and an escalation trigger. Risk ownership distributed across many owners is the same as distributed to no owner.`,
  };
  return patterns[pattern] || `This ${pattern} pattern must be resolved at the executive level before enterprise execution can stabilize.`;
}

function fallbackEnterpriseReport(
  input: EnterpriseAssessmentGoldInput,
  enterpriseContext: string,
  missingSignals: string[],
): EnterpriseAssessmentGoldResult {
  // When pattern classification fails, still produce case-derived output grounded in the observed friction
  const diagnosis = `Enterprise governance friction: ${input.observedFriction}. Pattern classification incomplete from provided evidence (${missingSignals[0] || "insufficient detail"}), but the friction itself is clear.`;

  // Ground consequence in the specific organizational situation
  const consequence =
    input.consequenceOfInaction ||
    `If this friction — specifically "${input.observedFriction}" — remains unaddressed: execution cascades, team accountability fragments, and board visibility deteriorates. The stated consequence of inaction is: ${input.consequenceOfInaction || "strategic risk compounds."}`;

  // Derive next move from the observed friction
  const nextMove = deriveNextMoveFromFriction(input.observedFriction, input.desiredOutcome);

  // Escalation trigger tied to the specific deadline and impact
  const escalation = input.deadline
    ? `Escalate to the board or executive team if this friction remains unresolved by ${input.deadline}. Define success: "${input.desiredOutcome || "enterprise decision clarity restored"}". If not achieved by deadline, governance intervention is required.`
    : "Escalate when the enterprise friction prevents execution or decision authority for more than one business cycle.";

  // Falsification challenge derived from the specific friction
  const falsificationChallenge = deriveFalsificationChallengeFromFriction(input.observedFriction);

  // Execution sequence tailored to the specific friction type
  const executionSequence = deriveExecutionSequenceFromFriction(input.observedFriction);

  const universal: WaveOneUniversalOutput = {
    productCode: input.productCode,
    signalOrDiagnosis: diagnosis,
    whyThisMatters: enterpriseContext,
    evidenceOrReasoningBasis: input.enterpriseEvidence,
    decisionFrictionOrContradiction: input.observedFriction,
    consequenceIfIgnored: consequence,
    oneSpecificNextMove: nextMove,
    whatThisDoesNotProve: "Pattern-specific remediation (without full classification). Executive intervention should precede detailed process design.",
    escalationTrigger: escalation,
    optionalDeeperRoute: falsificationChallenge,
  };

  const validation = validateWaveOneUniversalOutput(universal);
  const timeValuePassed = input.minutesAskedOfUser <= 15 && validation.passes;

  return {
    productCode: input.productCode,
    patternStatus: "insufficient_pattern_evidence",
    primaryPattern: null,
    secondaryPatterns: [],
    patternEvidence: input.enterpriseEvidence,
    enterpriseContext,
    dominantEnterpriseFriction: diagnosis,
    causedByPattern: falsificationChallenge,
    strategicConsequence: consequence,
    minimumViableCorrection: nextMove,
    whatThisResultDoesNotYetProve: "Pattern-specific remediation without full classification.",
    whenToEscalate: escalation,
    recommendedNextStep: nextMove,
    governanceImplication: deriveGovernanceImplicationFromFriction(input.observedFriction),
    executionSequence,
    timeValueSurplus: { passes: timeValuePassed, minutesRespected: input.minutesAskedOfUser },
    validation,
  };
}

function deriveFalsificationChallengeFromFriction(friction: string): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("disagree")) {
    return `Test the hypothesis: "Once we clarify the decision, all parties will act on it consistently." Falsified if: after the decision is written and signed, implementation still diverges or any party refuses to execute.`;
  }
  if (frictionLower.includes("overload") || frictionLower.includes("initiatives") || frictionLower.includes("priorit")) {
    return `Test the hypothesis: "Reducing the initiative portfolio to the top 3 will improve execution velocity and completion rate." Falsified if: after 6 weeks, the completion rate does not improve by at least 15% or team velocity does not increase materially.`;
  }
  if (frictionLower.includes("visibility")) {
    return `Test the hypothesis: "Once the board has a monthly dashboard, decision velocity will improve." Falsified if: after one quarter, board decision time for key initiatives does not decrease or approval authority does not consolidate.`;
  }
  if (frictionLower.includes("misalign")) {
    return `Test the hypothesis: "Once we align cross-functional understanding of strategy, execution will converge." Falsified if: after the alignment workshop, individual function roadmaps still diverge or dependency conflicts persist.`;
  }
  return `Test whether the resolution of this friction — "${friction}" — actually enables the desired enterprise outcome or decision velocity. Falsified if execution patterns remain unchanged after the proposed intervention.`;
}

function deriveExecutionSequenceFromFriction(friction: string): string[] {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("disagree")) {
    return [
      "Day 1: Executive leadership defines the specific decision in one sentence.",
      "Day 2: Board meets to align on the decision or the decision process.",
      "Day 3: Decision is written and signed by the decision-maker.",
      "Day 4–7: Implementation begins under named accountability.",
      "Day 30: Measure whether implementation is consistent across all parties.",
    ];
  }
  if (frictionLower.includes("overload") || frictionLower.includes("initiatives") || frictionLower.includes("priorit")) {
    return [
      "Week 1: Count active initiatives and measure resource allocation per initiative.",
      "Week 2: Leadership selects the top 3 initiatives with clear win conditions. Pause all others in writing.",
      "Week 3: Communicate pause to teams. Reallocate freed capacity to the top 3.",
      "Week 4–6: Track completion rate and delivery velocity on the top 3.",
      "Week 8: Confirm completion rate improvement (target: 15%+). If <15%, investigate execution blockers.",
    ];
  }
  if (frictionLower.includes("visibility")) {
    return [
      "Week 1: Define the monthly executive dashboard (strategic, execution, risk, accountability).",
      "Week 2: Populate the dashboard with current data.",
      "Week 3: Present to the board. Gather feedback on missing elements.",
      "Week 4: Distribute monthly dashboard to board and executive team.",
      "Month 2–3: Track whether decision approval cycle time improves.",
    ];
  }
  if (frictionLower.includes("misalign")) {
    return [
      "Day 1: Conduct a quiet survey of each function's understanding of enterprise strategy.",
      "Day 2: Analyze divergence. Identify specific areas of misalignment.",
      "Day 3: Hold cross-functional strategy alignment workshop.",
      "Day 4: Have each function write their strategy interpretation in one sentence.",
      "Day 7: Confirm alignment. If divergence persists, revise enterprise strategy.",
    ];
  }
  return [
    "1. Name the enterprise friction concretely.",
    "2. Define what resolution means for this enterprise.",
    "3. Assign accountability and set a resolution date.",
    "4. Execute the minimum viable corrective action.",
    "5. Measure whether enterprise decision velocity or execution improves within the target timeline.",
  ];
}

function deriveNextMoveFromFriction(friction: string, desiredOutcome?: string): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("disagree")) {
    return `The CEO (accountable owner) convenes the disagreeing board members or executives for a single decision meeting within 48-hour window. Outcome by end of meeting: write the decision in one sentence. Named owner signs the decision memo. All parties sign commitment to execute by next business day.`;
  }
  if (frictionLower.includes("overload") || frictionLower.includes("too many") || frictionLower.includes("initiatives") || frictionLower.includes("priorit")) {
    return `The CEO (named accountable owner) calls a portfolio reduction meeting tomorrow 10am with the CTO, VP Engineering, and CFO. Outcome by end of day tomorrow: select the top 3 initiatives. By Wednesday end of business: write a decision memo naming one accountable owner per initiative, success metrics, and completion date for each of the top 3. By Thursday end of day: announce the pause decision to all teams and reallocate freed capacity in writing.`;
  }
  if (frictionLower.includes("visibility") || frictionLower.includes("unclear")) {
    return `The CFO or COO creates one monthly executive dashboard within 2 weeks: strategic status, execution status, risk status, accountability assignments. Distribute to the board by month-end.`;
  }
  if (frictionLower.includes("misalign")) {
    return `The CEO schedules a cross-functional strategy alignment session within one week. Each function lead answers in one sentence: "Our understanding of enterprise strategy in our domain is..." Resolve divergence in writing within 3 days.`;
  }
  if (frictionLower.includes("velocity") || frictionLower.includes("slow")) {
    return `The CEO identifies the decision that is stuck within 24 hours, names the decision owner, and sets a decision date within one week. Communicate the owner and date in writing.`;
  }
  return `The CEO holds a focused governance meeting within 48 hours with the key stakeholders. Outcome by end of meeting: write the decision, name the owner, set the execution checkpoint. ${desiredOutcome ? `Success definition: "${desiredOutcome}".` : ""}`;
}

function deriveGovernanceImplicationFromFriction(friction: string): string {
  const frictionLower = friction.toLowerCase();

  if (frictionLower.includes("disagree")) {
    return `Board disagreement blocks execution. Establish a board decision protocol: who decides, by when, with what approval threshold. Until clarity exists, strategy delivery stalls.`;
  }
  if (frictionLower.includes("overload")) {
    return `Initiative overload reveals a portfolio-management failure. Implement ruthless prioritization and stop low-value work immediately. Overloaded execution prevents any priority from completion.`;
  }
  if (frictionLower.includes("visibility")) {
    return `Board visibility gap indicates information architecture failure. Fix the dashboard before adding more reporting layers. Without visibility, governance cannot function.`;
  }
  if (frictionLower.includes("misalign")) {
    return `Cross-functional misalignment means strategy is not understood at the working level. Rewrite and re-communicate before restructuring. Misaligned execution multiplies the initial friction.`;
  }
  return `The enterprise friction requires executive governance intervention before it can be resolved at the operational level.`;
}
