/**
 * #9 — Decision Scenario Stress-Testing
 *
 * Tests actual decision-making under simulated pressure.
 * Not "how did you decide in the past" but "here is a scenario — decide NOW."
 *
 * WHY IRREPLICABLE: Tests revealed decision logic, not remembered decisions.
 * The response under pressure is the diagnostic, not the self-report.
 */

export type StressScenario = {
  id: string;
  /** Which assessment type this scenario belongs to */
  assessmentType: "purpose" | "constitutional" | "team" | "enterprise";
  /** The scenario description */
  situation: string;
  /** Time pressure: how fast must you decide */
  timeConstraint: string;
  /** What's at stake */
  stakes: string;
  /** The forced choice */
  options: [string, string];
  /** What each choice reveals about the respondent */
  reveals: [string, string];
  /** Which domains this scenario tests */
  testsDomains: string[];
};

export type ScenarioResponse = {
  scenarioId: string;
  chosenOption: 0 | 1;
  confidence: number;    // 0-10: how confident in the choice
  reasoning: string;     // free text: why this choice
  responseTimeMs: number; // how long they took to decide
};

export type ScenarioAnalysis = {
  scenarioId: string;
  /** What the choice reveals */
  insight: string;
  /** Whether the choice is consistent with their assessment scores */
  consistentWithScores: boolean;
  /** If inconsistent, what that means */
  inconsistencyNote: string;
  /** Decision speed signal */
  speedSignal: "decisive" | "deliberate" | "hesitant" | "paralysed";
  /** Confidence-choice alignment */
  confidenceAlignment: "aligned" | "overconfident" | "underconfident";
};

/**
 * Centralised enterprise scenario IDs.
 * Use these constants in forms, tests, and analysis — never hardcode strings.
 */
export const ENTERPRISE_SCENARIO_IDS = {
  DELAY_30: 'enterprise_delay_30',
  OWNER_UNAVAILABLE: 'enterprise_owner_unavailable',
  CHALLENGE_EVIDENCE: 'enterprise_challenge_evidence',
  GOVERNANCE_TEST: 'enterprise_governance_test',
} as const

export type EnterpriseScenarioId = typeof ENTERPRISE_SCENARIO_IDS[keyof typeof ENTERPRISE_SCENARIO_IDS]

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO BANK
// ─────────────────────────────────────────────────────────────────────────────

export const SCENARIOS: StressScenario[] = [
  // PURPOSE
  {
    id: "purpose_mandate_test",
    assessmentType: "purpose",
    situation: "Your board just rejected your proposed strategy. You have 48 hours before the next board meeting.",
    timeConstraint: "48 hours",
    stakes: "If you present the same strategy, you lose credibility. If you abandon it, you lose mandate clarity.",
    options: ["Defend the original strategy with stronger evidence", "Pivot to a new approach that addresses their concerns"],
    reveals: ["Mandate conviction — you believe in the direction regardless of resistance", "Adaptive pragmatism — you prioritise stakeholder alignment over personal conviction"],
    testsDomains: ["identity", "decision"],
  },
  {
    id: "purpose_pressure_test",
    assessmentType: "purpose",
    situation: "Your most trusted team member just resigned, citing disagreement with your direction. Three others are watching how you respond.",
    timeConstraint: "This week",
    stakes: "If you accommodate, you signal that conviction is negotiable. If you hold firm, you risk further departures.",
    options: ["Hold the direction and address the watching team directly", "Open the direction for review with the team's input"],
    reveals: ["Pressure resilience — you maintain direction under social pressure", "Collaborative recalibration — you value team buy-in over unilateral mandate"],
    testsDomains: ["identity", "emotional_order", "environment"],
  },

  // CONSTITUTIONAL
  {
    id: "constitutional_authority_test",
    assessmentType: "constitutional",
    situation: "Two senior leaders are making contradictory decisions on the same project. Neither reports to the other. Clients are confused.",
    timeConstraint: "This week",
    stakes: "If you intervene, you expose the authority gap publicly. If you don't, execution continues to fragment.",
    options: ["Intervene: call both leaders, clarify authority, document the decision", "Let it play out and address it in the next governance review"],
    reveals: ["Authority enforcement — you prioritise structural clarity over political comfort", "Conflict avoidance — you prefer process over confrontation"],
    testsDomains: ["authority", "governance", "friction"],
  },

  // TEAM
  {
    id: "team_divergence_test",
    assessmentType: "team",
    situation: "Your team just completed a survey. Results show they disagree with your top priority by a 40-point margin. You have a board presentation tomorrow.",
    timeConstraint: "24 hours",
    stakes: "If you present the priority as aligned, you're lying. If you present the gap, you look like you've lost the team.",
    options: ["Present the gap honestly and propose a realignment plan", "Present the priority as planned and address the gap afterwards"],
    reveals: ["Transparency under pressure — you surface truth even when it's costly", "Narrative management — you control the story and fix the reality later"],
    testsDomains: ["trust", "coherence", "execution"],
  },

  // ENTERPRISE — Scenario 1: Delay pressure
  {
    id: ENTERPRISE_SCENARIO_IDS.DELAY_30,
    assessmentType: "enterprise",
    situation: "If this decision is delayed 30 days, what fails first?",
    timeConstraint: "30 days",
    stakes: "Internal delivery, cost, or ownership pressure vs external client, regulatory, market, or evidence pressure.",
    options: [
      "Internal delivery, cost, or ownership pressure",
      "External client, regulatory, market, or evidence pressure",
    ],
    reveals: [
      "Internal focus — you see the primary risk as operational breakdown within the organisation's own systems and commitments",
      "External focus — you see the primary risk as loss of confidence, compliance standing, or market position outside the organisation",
    ],
    testsDomains: ["execution", "risk"],
  },

  // ENTERPRISE — Scenario 2: Owner dependency
  {
    id: ENTERPRISE_SCENARIO_IDS.OWNER_UNAVAILABLE,
    assessmentType: "enterprise",
    situation: "If the main owner becomes unavailable, who or what breaks?",
    timeConstraint: "Immediate",
    stakes: "Whether the decision can continue through defined delegation or depends materially on one owner or informal knowledge.",
    options: [
      "The decision can continue through defined delegation",
      "The decision depends materially on one owner or informal knowledge",
    ],
    reveals: [
      "Structural resilience — you have built delegation and continuity into the decision architecture",
      "Single-point dependency — the decision is vulnerable to key-person risk and informal knowledge concentration",
    ],
    testsDomains: ["governance", "authority"],
  },

  // ENTERPRISE — Scenario 3: Evidence challenge
  {
    id: ENTERPRISE_SCENARIO_IDS.CHALLENGE_EVIDENCE,
    assessmentType: "enterprise",
    situation: "If the board, client, or regulator challenges the evidence, what proof survives?",
    timeConstraint: "Before next review",
    stakes: "Whether the evidence base can survive independent scrutiny or is incomplete, informal, or not independently defensible.",
    options: [
      "The evidence base can survive challenge",
      "The evidence base is incomplete, informal, or not independently defensible",
    ],
    reveals: [
      "Evidence confidence — you believe the supporting data, documentation, and reasoning can withstand external scrutiny",
      "Evidence vulnerability — you recognise gaps in the evidence base that would not survive independent challenge",
    ],
    testsDomains: ["execution", "risk"],
  },

  // ENTERPRISE — Legacy scenario (backward compatibility)
  {
    id: ENTERPRISE_SCENARIO_IDS.GOVERNANCE_TEST,
    assessmentType: "enterprise",
    situation: "A critical enterprise decision has been deferred for 3 months because no one owns it. The cost of delay is now visible. A junior manager has started making decisions informally.",
    timeConstraint: "This week",
    stakes: "If you formalise the junior manager's authority, you undermine the governance structure. If you reassign it, you lose 3 months of informal progress.",
    options: ["Formalise the junior manager's authority with governance guardrails", "Reassign to the correct authority holder and rebuild from their starting point"],
    reveals: ["Pragmatic governance — you adapt structure to reality", "Structural integrity — you enforce the governance model even at execution cost"],
    testsDomains: ["authority", "governance", "execution"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

export function analyseScenarioResponse(
  scenario: StressScenario,
  response: ScenarioResponse,
  currentScores: Record<string, number>,
): ScenarioAnalysis {
  const chosen = response.chosenOption;
  const insight = scenario.reveals[chosen]!;

  // Check consistency with assessment scores
  // Option 0 typically tests conviction/enforcement; Option 1 tests adaptation/collaboration
  const testedDomains = scenario.testsDomains;
  const avgScore = testedDomains.length > 0
    ? testedDomains.reduce((s, d) => s + (currentScores[d] ?? 50), 0) / testedDomains.length
    : 50;

  // If they scored high on tested domains but chose the "softer" option, that's inconsistent
  const expectedChoice = avgScore >= 65 ? 0 : 1; // high scores → expect conviction choice
  const consistentWithScores = chosen === expectedChoice;

  const inconsistencyNote = consistentWithScores
    ? ""
    : chosen === 0 && avgScore < 50
    ? "You chose the conviction path despite scoring low on the relevant domains. Either your scores understate your resolve, or this choice is aspirational."
    : chosen === 1 && avgScore >= 65
    ? "You chose the adaptive path despite scoring high on the relevant domains. Under pressure, your behaviour may differ from your stated alignment."
    : "Scenario choice and assessment scores point in different directions. This gap is itself diagnostic.";

  // Speed signal
  const speedSignal: ScenarioAnalysis["speedSignal"] =
    response.responseTimeMs < 10000 ? "decisive"
    : response.responseTimeMs < 30000 ? "deliberate"
    : response.responseTimeMs < 60000 ? "hesitant"
    : "paralysed";

  // Confidence alignment
  const confidenceAlignment: ScenarioAnalysis["confidenceAlignment"] =
    response.confidence >= 8 && !consistentWithScores ? "overconfident"
    : response.confidence <= 3 && consistentWithScores ? "underconfident"
    : "aligned";

  return {
    scenarioId: scenario.id,
    insight,
    consistentWithScores,
    inconsistencyNote,
    speedSignal,
    confidenceAlignment,
  };
}
