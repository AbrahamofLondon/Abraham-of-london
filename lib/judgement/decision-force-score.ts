/**
 * lib/judgement/decision-force-score.ts
 *
 * Decision Force Score
 *
 * Measures the "force" or usefulness of a diagnostic decision output.
 * Not just whether it's structured, but whether it actually helps decide.
 *
 * Critical dimensions (must be >= 7.0 each):
 * - actualDecisionNamed: Is the REAL decision named, not the wrapper?
 * - falsificationStrength: Is the test concrete and falsifiable?
 * - accountabilityStrength: Is owner/deadline/success check present?
 * - nonGenericity: Does it avoid generic advice language?
 *
 * Overall threshold: >= 8.5 for diagnostic_product
 */

export interface DecisionForceScore {
  /** Is the actual decision clearly named (not the wrapper question)? */
  actualDecisionNamed: number; // 0-10

  /** Is the trade-off sharpened (what's actually being traded)? */
  tradeOffSharpness: number;

  /** Is the hidden assumption explicitly named? */
  assumptionSpecificity: number;

  /** Is the falsification test concrete and testable? */
  falsificationStrength: number;

  /** Is the next move owned, timed, measurable? */
  accountabilityStrength: number;

  /** Is the consequence specific to this case? */
  consequenceSpecificity: number;

  /** Does output avoid generic advice language? */
  nonGenericity: number;

  /** Does output create pressure to decide/act? */
  actionPressure: number;

  /** Would another decision-maker reuse this logic? */
  reusableValue: number;

  /** Overall score (average of above) */
  overall: number;

  /** Why did it fail (if it failed) */
  failureReasons: string[];

  /** Which critical dimensions failed */
  criticalFailures: string[];

  /** Recommendation */
  recommendation: "upgrade_to_diagnostic" | "blocked_until_force_improved" | "investigate_specific_layers";
}

/**
 * Score a decision diagnostic output
 */
export function scoreDecisionForce(output: {
  actualDecisionQuestion: string;
  decisionTension: string;
  unresolvedAssumption: string;
  falsificationTest: { claim: string; challenge: string; evidenceThatWouldChangeJudgement: string };
  accountableNextMove: { action: string; owner: string; deadline: string; successCheck: string };
  consequenceIfWrong: string;
  whatNotToDo: string;
  limitation: string;
}): DecisionForceScore {
  const scores = {
    actualDecisionNamed: scoreActualDecisionNamed(output.actualDecisionQuestion),
    tradeOffSharpness: scoreTradeOffSharpness(output.decisionTension),
    assumptionSpecificity: scoreAssumptionSpecificity(output.unresolvedAssumption),
    falsificationStrength: scoreFalsificationStrength(output.falsificationTest),
    accountabilityStrength: scoreAccountabilityStrength(output.accountableNextMove),
    consequenceSpecificity: scoreConsequenceSpecificity(output.consequenceIfWrong),
    nonGenericity: scoreNonGenericity([
      output.actualDecisionQuestion,
      output.decisionTension,
      output.whatNotToDo,
    ].join(" ")),
    actionPressure: scoreActionPressure(output.accountableNextMove),
    reusableValue: scoreReusableValue(output),
  };

  const overall = Object.values(scores)
    .filter((v) => typeof v === "number")
    .reduce((a, b) => a + (b as number), 0) / Object.keys(scores).length;

  const criticalDimensions = [
    "actualDecisionNamed",
    "falsificationStrength",
    "accountabilityStrength",
    "nonGenericity",
  ];

  const criticalFailures = criticalDimensions.filter(
    (dim) => scores[dim as keyof typeof scores] < 7.0
  );

  const failureReasons: string[] = [];

  if (scores.actualDecisionNamed < 7) {
    failureReasons.push("The actual decision is not clearly named");
  }
  if (scores.tradeOffSharpness < 7) {
    failureReasons.push("The trade-off is not sharpened");
  }
  if (scores.assumptionSpecificity < 7) {
    failureReasons.push("The hidden assumption is not specific");
  }
  if (scores.falsificationStrength < 7) {
    failureReasons.push("The falsification test is not concrete");
  }
  if (scores.accountabilityStrength < 7) {
    failureReasons.push("The accountability layer is weak (owner/deadline/success check missing)");
  }
  if (scores.consequenceSpecificity < 7) {
    failureReasons.push("The consequence is generic, not specific to this case");
  }
  if (scores.nonGenericity < 7) {
    failureReasons.push("Output uses generic advice language");
  }
  if (scores.actionPressure < 7) {
    failureReasons.push("Output does not create pressure to act");
  }

  let recommendation: "upgrade_to_diagnostic" | "blocked_until_force_improved" | "investigate_specific_layers";

  if (overall >= 8.5 && criticalFailures.length === 0) {
    recommendation = "upgrade_to_diagnostic";
  } else if (criticalFailures.length > 0) {
    recommendation = "investigate_specific_layers";
  } else {
    recommendation = "blocked_until_force_improved";
  }

  return {
    actualDecisionNamed: scores.actualDecisionNamed,
    tradeOffSharpness: scores.tradeOffSharpness,
    assumptionSpecificity: scores.assumptionSpecificity,
    falsificationStrength: scores.falsificationStrength,
    accountabilityStrength: scores.accountabilityStrength,
    consequenceSpecificity: scores.consequenceSpecificity,
    nonGenericity: scores.nonGenericity,
    actionPressure: scores.actionPressure,
    reusableValue: scores.reusableValue,
    overall,
    failureReasons,
    criticalFailures,
    recommendation,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Scoring Functions
// ────────────────────────────────────────────────────────────────────────────

function scoreActualDecisionNamed(decisionQuestion: string): number {
  if (!decisionQuestion || decisionQuestion.length < 20) return 0;

  // Check if it mentions something being decided
  const decisionPhrases = [
    "the actual decision is",
    "must decide",
    "the real decision",
    "accept or decline",
    "move or stay",
    "proceed or wait",
  ];

  const hasDecisionPhrase = decisionPhrases.some((phrase) => decisionQuestion.toLowerCase().includes(phrase));

  // Check if it's specific (not "whether to...")
  const isSpecific = !decisionQuestion.toLowerCase().startsWith("whether");

  // Check length (longer = more specific usually)
  const lengthScore = Math.min(10, decisionQuestion.length / 20);

  return hasDecisionPhrase ? 9 : isSpecific ? Math.min(10, 5 + lengthScore) : 3;
}

function scoreTradeOffSharpness(decisionTension: string): number {
  if (!decisionTension || decisionTension.length < 15) return 0;

  const tradeOffPhrases = [
    " vs ",
    "versus",
    "trade-off",
    "either/or",
    "but",
    "however",
    "on the other hand",
  ];

  const hasTradeOff = tradeOffPhrases.some((phrase) => decisionTension.toLowerCase().includes(phrase));

  // Check if it mentions specific things being traded
  const hasSpecifics = /[A-Z][a-z]+ /.test(decisionTension); // Capitalized terms

  return hasTradeOff && hasSpecifics ? 8 : hasTradeOff ? 5 : 2;
}

function scoreAssumptionSpecificity(assumption: string): number {
  if (!assumption || assumption.length < 15) return 1;

  // Check if it's phrased as "You are assuming..."
  const isExplicit = assumption.toLowerCase().includes("assum");

  // Check if it names something specific (not generic "assumption")
  const isSpecific = assumption.length > 40;

  // Check if it's testable
  const isTestable = /if|when|would|will|could/.test(assumption.toLowerCase());

  let score = 0;
  if (isExplicit) score += 3;
  if (isSpecific) score += 3;
  if (isTestable) score += 3;

  return Math.min(10, score + 1);
}

function scoreFalsificationStrength(falsificationTest: {
  claim: string;
  challenge: string;
  evidenceThatWouldChangeJudgement: string;
}): number {
  if (
    !falsificationTest.claim ||
    !falsificationTest.challenge ||
    !falsificationTest.evidenceThatWouldChangeJudgement
  ) {
    return 1;
  }

  // Check if test is concrete
  const claimLength = falsificationTest.claim.length;
  const challengeLength = falsificationTest.challenge.length;
  const evidenceLength = falsificationTest.evidenceThatWouldChangeJudgement.length;

  // All three should be substantial
  const allPresent = claimLength > 15 && challengeLength > 20 && evidenceLength > 25;

  // Check if evidence is measurable/observable
  const isObservable = /if|when|becomes|reaches|drops|increases|falls/.test(
    falsificationTest.evidenceThatWouldChangeJudgement.toLowerCase()
  );

  return allPresent && isObservable ? 8 : allPresent ? 5 : 2;
}

function scoreAccountabilityStrength(nextMove: {
  action: string;
  owner: string;
  deadline: string;
  successCheck: string;
}): number {
  if (!nextMove.action || !nextMove.owner || !nextMove.deadline) return 1;

  // Check specificity
  const actionSpecific = nextMove.action.length > 15;
  const ownerNamed = nextMove.owner && nextMove.owner.length > 0 && !nextMove.owner.includes("?");
  const deadlineSpecific = /\d|days|weeks|month|by|before/.test(nextMove.deadline.toLowerCase());
  const successDefined = nextMove.successCheck && nextMove.successCheck.length > 10;

  let score = 0;
  if (actionSpecific) score += 2;
  if (ownerNamed) score += 2;
  if (deadlineSpecific) score += 2;
  if (successDefined) score += 2;

  return Math.min(10, score + 2);
}

function scoreConsequenceSpecificity(consequence: string): number {
  if (!consequence || consequence.length < 20) return 1;

  // Check if it mentions numbers/specifics
  const hasNumbers = /\d+|percent|million|thousand/.test(consequence);

  // Check if it's specific to the case (not generic "bad outcome")
  const isCaseSpecific = consequence.length > 50;

  // Check if it names a concrete outcome
  const hasOutcome = /will|would|result|lead to|cause/.test(consequence.toLowerCase());

  let score = 2;
  if (hasNumbers) score += 2;
  if (isCaseSpecific) score += 2;
  if (hasOutcome) score += 2;

  return Math.min(10, score);
}

function scoreNonGenericity(output: string): number {
  const genericPhrases = [
    "consider",
    "evaluate",
    "think about",
    "explore",
    "reflect on",
    "it may be helpful",
    "you may want to",
    "balance",
    "take into account",
    "on the one hand",
  ];

  const lowerOutput = output.toLowerCase();
  const genericCount = genericPhrases.filter((phrase) => lowerOutput.includes(phrase)).length;

  // Each generic phrase is a penalty
  const penalty = Math.min(5, genericCount);

  return Math.max(0, 10 - penalty);
}

function scoreActionPressure(nextMove: { action: string; deadline: string; owner: string }): number {
  if (!nextMove.action || !nextMove.deadline) return 1;

  // Does it create urgency?
  const hasUrgency = /immediately|urgent|asap|today|tomorrow|week|before/.test(nextMove.deadline.toLowerCase());

  // Does it assign clear responsibility?
  const isAccountable = nextMove.owner && nextMove.owner !== "decision owner" && nextMove.owner.length > 3;

  // Is the action concrete (not "think about" or "consider")?
  const isConcrete = !["consider", "think about", "reflect", "explore"].some((w) =>
    nextMove.action.toLowerCase().includes(w)
  );

  let score = 2;
  if (hasUrgency) score += 3;
  if (isAccountable) score += 2;
  if (isConcrete) score += 3;

  return Math.min(10, score);
}

function scoreReusableValue(output: any): number {
  // Would another person or another decision use this logic?
  // Check if output is case-specific vs template

  const elements = [
    output.actualDecisionQuestion,
    output.decisionTension,
    output.unresolvedAssumption,
  ].join(" ");

  // Specific names/values indicate case-specific (good for reuse)
  const hasConcretDetails = /\$|percent|months|years|\d{4}/.test(elements);

  // Generic phrases indicate template (bad for reuse)
  const hasGeneric = /consider|think about|may be helpful/.test(elements.toLowerCase());

  if (hasConcretDetails && !hasGeneric) return 8;
  if (hasConcretDetails) return 6;
  if (hasGeneric) return 2;
  return 4;
}

export default {
  scoreDecisionForce,
};
