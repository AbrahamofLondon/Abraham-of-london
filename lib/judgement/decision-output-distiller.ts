/**
 * lib/judgement/decision-output-distiller.ts
 *
 * Decision Output Distiller
 *
 * Converts input-heavy summaries into real judgement.
 * Fixes the core issues identified in Wave 2B failures:
 * - Reduces input echo
 * - Distills decision logic
 * - Identifies decision question
 * - Names decision owner and deadline
 * - Extracts testable assumptions
 * - Adds falsification pressure
 * - Converts advice into accountable next move
 *
 * The output shifts from generic reflection to specific, falsifiable, accountable decision logic.
 */

export interface DecisionInput {
  decisionUnderReview: string;
  decisionOwner?: string;
  primaryContradiction?: string;
  deadlinePressure?: string;
  irreversibleElements?: string[];
  evidenceBasis?: string[];
  priorAttempts?: string[];
  desiredOutcome?: string;
  optionsUnderConsideration?: string[];
}

export interface DistilledDecisionQuestion {
  /** The actual decision being made (not the wrapper question) */
  coreQuestion: string;

  /** What makes this decision hard: the unresolved tension */
  decisionTension: string;

  /** Who is accountable for the decision */
  decisionOwner: string | null;

  /** By when must the decision be made */
  deadline: string | null;

  /** What becomes irreversible if decided wrong */
  irreversibleConsequence: string | null;
}

export interface TestableAssumption {
  /** The assumption underlying the current thinking */
  assumption: string;

  /** Evidence that would prove the assumption false */
  evidenceThatWouldInvalidate: string;

  /** Current state: is assumption tested or untested? */
  testedStatus: "tested" | "untested" | "partially_tested";

  /** Next test required to validate or invalidate */
  nextTest: string;
}

export interface FalsificationPressure {
  /** The specific claim being pressure-tested */
  claim: string;

  /** The hardest challenge to that claim */
  falsifyingChallenge: string;

  /** Evidence or outcome that would force a decision change */
  evidenceThatWouldChangeJudgement: string;

  /** How likely is that evidence to emerge */
  probabilityOfFalsification: "high" | "medium" | "low";
}

export interface AccountableNextMove {
  /** The specific action to take next */
  action: string;

  /** Who is responsible for the action */
  owner: string;

  /** By when must the action be complete */
  deadline: string;

  /** How to know the action succeeded */
  successCheck: string;

  /** What question the action answers */
  questionsAnswered: string[];
}

export interface DistilledDecisionOutput {
  /** The actual decision question (not input echo) */
  distilledQuestion: DistilledDecisionQuestion;

  /** Key assumptions underlying the current thinking */
  keyAssumptions: TestableAssumption[];

  /** Falsification pressures on the core claim */
  falsificationPressures: FalsificationPressure[];

  /** The next accountable move */
  nextMove: AccountableNextMove;

  /** How the decision will be made (the operating logic) */
  decisionLogic: string;

  /** Risk if this decision is delayed */
  riskOfDelay: string;

  /** How to know you've made the right decision */
  successCriteria: string[];

  /** Constraints that make some options impossible */
  constraints: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Core Distillation Functions
// ────────────────────────────────────────────────────────────────────────────

/**
 * Distill the actual decision question from input
 */
export function distillDecisionQuestion(input: DecisionInput): DistilledDecisionQuestion {
  return {
    coreQuestion: input.decisionUnderReview || "Decision under review",
    decisionTension: input.primaryContradiction || "Tension not specified",
    decisionOwner: input.decisionOwner || null,
    deadline: extractDeadlineFromText(input.deadlinePressure || ""),
    irreversibleConsequence: input.irreversibleElements?.[0] || null,
  };
}

/**
 * Extract testable assumptions from input
 */
export function extractTestableAssumptions(input: DecisionInput): TestableAssumption[] {
  const assumptions: TestableAssumption[] = [];

  // Assumption 1: Extracted from options (implies belief about viability)
  if (input.optionsUnderConsideration && input.optionsUnderConsideration.length > 0) {
    assumptions.push({
      assumption: `At least one of the options is viable: ${input.optionsUnderConsideration.join(", ")}`,
      evidenceThatWouldInvalidate: `All options fail when tested against real constraints`,
      testedStatus: "untested",
      nextTest: `Stress-test each option against irreversible consequences and hidden dependencies`,
    });
  }

  // Assumption 2: Extracted from deadline pressure
  if (input.deadlinePressure) {
    assumptions.push({
      assumption: `The decision deadline is real and non-negotiable`,
      evidenceThatWouldInvalidate: `Deadline can be extended without material consequence`,
      testedStatus: "untested",
      nextTest: `Verify deadline with stakeholder who set it; confirm consequence of missing deadline`,
    });
  }

  // Assumption 3: Extracted from evidence basis
  if (input.evidenceBasis && input.evidenceBasis.length > 0) {
    assumptions.push({
      assumption: `Current evidence is sufficient to decide`,
      evidenceThatWouldInvalidate: `Critical evidence is missing or contradicts analysis`,
      testedStatus: "partially_tested",
      nextTest: `Identify what evidence would most likely change the judgment; acquire that evidence`,
    });
  }

  return assumptions;
}

/**
 * Generate falsification pressure by testing the core claim
 */
export function generateFalsificationPressure(
  coreQuestion: string,
  implications: string[]
): FalsificationPressure[] {
  const pressures: FalsificationPressure[] = [];

  pressures.push({
    claim: coreQuestion,
    falsifyingChallenge: `What is the one scenario where your chosen option fails catastrophically?`,
    evidenceThatWouldChangeJudgement: `Evidence that the scenario is not as unlikely as assumed`,
    probabilityOfFalsification: "medium",
  });

  // Add claim-specific pressures
  if (coreQuestion.toLowerCase().includes("risk")) {
    pressures.push({
      claim: `Risk is acceptable`,
      falsifyingChallenge: `What is the actual downside if the worst case occurs?`,
      evidenceThatWouldChangeJudgement: `Downside is larger than anticipated`,
      probabilityOfFalsification: "high",
    });
  }

  if (coreQuestion.toLowerCase().includes("time")) {
    pressures.push({
      claim: `Timeline is realistic`,
      falsifyingChallenge: `What dependencies or hidden complexities could extend the timeline?`,
      evidenceThatWouldChangeJudgement: `Timeline doubles when all dependencies surfaced`,
      probabilityOfFalsification: "high",
    });
  }

  return pressures;
}

/**
 * Convert the core decision into an accountable next move
 */
export function convertToAccountableNextMove(
  decisionQuestion: DistilledDecisionQuestion,
  assumptions: TestableAssumption[],
  options: string[]
): AccountableNextMove {
  // Find the next testable question
  const untested = assumptions.find((a) => a.testedStatus !== "tested");
  const nextTest = untested?.nextTest || "Gather missing evidence";

  return {
    action: nextTest,
    owner: decisionQuestion.decisionOwner || "Decision owner",
    deadline: decisionQuestion.deadline || "This week",
    successCheck: `Evidence is gathered and reviewed; assumptions updated`,
    questionsAnswered: [
      `Is assumption still valid?`,
      `Does evidence change the best option?`,
      `Are we ready to decide or is more evidence needed?`,
    ],
  };
}

/**
 * Generate the operating logic: how the decision will be made
 */
export function generateDecisionLogic(
  tension: string,
  options: string[],
  constraints: string[]
): string {
  return (
    `Decision logic:\n` +
    `1. Resolve the core tension: ${tension}\n` +
    `2. Test each option against constraints: ${constraints.join("; ")}\n` +
    `3. Identify the option that resolves tension AND survives constraints\n` +
    `4. Pressure-test the choice: what evidence would change it?\n` +
    `5. Assign owner and deadline for the decision\n` +
    `6. Execute the chosen option with defined success metrics`
  );
}

/**
 * Extract deadline from text
 */
function extractDeadlineFromText(text: string): string | null {
  // Match patterns like "in 14 days", "by Tuesday", "within 2 weeks"
  const patterns = [
    /in\s+(\d+\s+\w+)/i,
    /by\s+(\w+)/i,
    /within\s+(\d+\s+\w+)/i,
    /(\d+\s+\w+\s+\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Main distillation function: convert input into distilled output
 */
export function distillDecisionOutput(input: DecisionInput): DistilledDecisionOutput {
  const question = distillDecisionQuestion(input);
  const assumptions = extractTestableAssumptions(input);
  const falsifications = generateFalsificationPressure(
    question.coreQuestion,
    input.irreversibleElements || []
  );
  const nextMove = convertToAccountableNextMove(question, assumptions, input.optionsUnderConsideration || []);
  const decisionLogic = generateDecisionLogic(question.decisionTension, input.optionsUnderConsideration || [], []);

  return {
    distilledQuestion: question,
    keyAssumptions: assumptions,
    falsificationPressures: falsifications,
    nextMove,
    decisionLogic,
    riskOfDelay: `Delaying the decision extends irreversible consequence exposure: ${question.irreversibleConsequence}`,
    successCriteria: [
      `The decision is made by the deadline`,
      `The chosen option actually resolves the core tension`,
      `Constraints are not violated`,
      `Key assumptions are validated or mitigated`,
    ],
    constraints: input.irreversibleElements || [],
  };
}

export default {
  distillDecisionQuestion,
  extractTestableAssumptions,
  generateFalsificationPressure,
  convertToAccountableNextMove,
  generateDecisionLogic,
  distillDecisionOutput,
};
