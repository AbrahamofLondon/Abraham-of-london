/**
 * #10 — Institutional Mutation Detection
 *
 * Detects when the organisation itself is changing — not just metrics
 * moving, but the STRUCTURE of the organisation shifting.
 *
 * A "mutation" is when the relationship between metrics changes:
 * - Authority was correlated with execution. Now it isn't.
 * - Trust was stable across respondents. Now it's diverging.
 * - Governance was functional. Now it's being bypassed.
 *
 * WHY IRREPLICABLE: Requires multi-respondent longitudinal model.
 * Single-assessment tools can never detect mutations because they
 * only see one snapshot. This requires the TRAJECTORY of the graph.
 */

export type MutationType =
  | "phase_transition"      // Organisation shifting to a fundamentally different operating mode
  | "authority_fragmentation" // Authority structure breaking apart
  | "trust_collapse"        // Trust eroding across multiple respondents simultaneously
  | "governance_bypass"     // Formal governance being replaced by informal authority
  | "execution_disconnect"  // Execution decoupling from governance
  | "stakeholder_divergence"; // Respondents disagree more than they used to

export type Mutation = {
  type: MutationType;
  severity: number;         // 0-10
  confidence: number;       // 0-1
  /** What changed and when */
  description: string;
  /** The tipping point threshold */
  tippingPoint: {
    metric: string;
    currentValue: number;
    threshold: number;
    distanceToTipping: number;
    atTippingPoint: boolean;
  };
  /** What happens if the mutation completes */
  projectedConsequence: string;
  /** What would reverse the mutation */
  reversal: string;
};

export type MutationAnalysis = {
  mutationsDetected: Mutation[];
  organisationalStability: "stable" | "shifting" | "fragmenting" | "restructuring";
  /** Is the organisation at a tipping point? */
  atTippingPoint: boolean;
  /** Summary for operators */
  narrative: string;
};

/**
 * Detect institutional mutations from longitudinal multi-respondent data.
 */
export function detectMutations(params: {
  /** Current scores across domains */
  currentScores: Record<string, number>;
  /** Prior scores (from last assessment) */
  priorScores?: Record<string, number>;
  /** Multi-respondent divergence (if available) */
  respondentDivergence?: number;
  /** Prior respondent divergence */
  priorDivergence?: number;
  /** Days since last assessment */
  daysSince?: number;
}): MutationAnalysis {
  const { currentScores, priorScores, respondentDivergence, priorDivergence, daysSince } = params;
  const mutations: Mutation[] = [];

  // 1. Authority fragmentation
  const authority = currentScores["authority"] ?? currentScores["authority_clarity"] ?? 50;
  const priorAuthority = priorScores?.["authority"] ?? priorScores?.["authority_clarity"];
  if (priorAuthority !== undefined && priorAuthority - authority >= 20) {
    mutations.push({
      type: "authority_fragmentation",
      severity: Math.min(10, Math.round((priorAuthority - authority) / 3)),
      confidence: daysSince && daysSince > 14 ? 0.80 : 0.55,
      description: `Authority dropped ${priorAuthority - authority} points. The decision structure is fragmenting.`,
      tippingPoint: {
        metric: "authority",
        currentValue: authority,
        threshold: 35,
        distanceToTipping: Math.max(0, authority - 35),
        atTippingPoint: authority <= 40,
      },
      projectedConsequence: "When authority drops below 35, informal decision-making replaces formal governance. Recovery requires reconstitution, not repair.",
      reversal: "Name one decision owner per contested domain. Document authority boundaries. Enforce in the next decision cycle.",
    });
  }

  // 2. Trust collapse
  const trust = currentScores["trust"] ?? currentScores["trust_condition"] ?? 50;
  const priorTrust = priorScores?.["trust"] ?? priorScores?.["trust_condition"];
  if (priorTrust !== undefined && priorTrust - trust >= 15) {
    mutations.push({
      type: "trust_collapse",
      severity: Math.min(10, Math.round((priorTrust - trust) / 2)),
      confidence: 0.75,
      description: `Trust declined ${priorTrust - trust} points. This is not gradual drift — this is an active trust event.`,
      tippingPoint: {
        metric: "trust",
        currentValue: trust,
        threshold: 30,
        distanceToTipping: Math.max(0, trust - 30),
        atTippingPoint: trust <= 35,
      },
      projectedConsequence: "Below 30, political decision-making replaces principled decision-making. Hidden agendas become the operating norm.",
      reversal: "Identify the trust-breaking event. Address it publicly, not privately. Transparency is the only trust rebuilder at this severity.",
    });
  }

  // 3. Stakeholder divergence increase
  if (respondentDivergence !== undefined && priorDivergence !== undefined) {
    const divergenceIncrease = respondentDivergence - priorDivergence;
    if (divergenceIncrease >= 15) {
      mutations.push({
        type: "stakeholder_divergence",
        severity: Math.min(10, Math.round(divergenceIncrease / 3)),
        confidence: 0.70,
        description: `Respondent divergence increased ${divergenceIncrease} points. Authority is no longer operating from the same reality.`,
        tippingPoint: {
          metric: "respondent_divergence",
          currentValue: respondentDivergence,
          threshold: 45,
          distanceToTipping: Math.max(0, 45 - respondentDivergence),
          atTippingPoint: respondentDivergence >= 40,
        },
        projectedConsequence: "Above 45-point divergence, decisions made by one group are actively contested by another. The organisation is operating as two entities.",
        reversal: "Convene stakeholders with divergent views. Surface the disagreement explicitly. Do not seek consensus — seek clarity on who decides.",
      });
    }
  }

  // 4. Governance bypass detection
  const governance = currentScores["governance"] ?? currentScores["governance_discipline"] ?? 50;
  const execution = currentScores["execution"] ?? currentScores["execution_trust"] ?? 50;
  if (governance < 40 && execution > 60) {
    mutations.push({
      type: "governance_bypass",
      severity: 7,
      confidence: 0.70,
      description: `Governance is ${governance}% but execution is ${execution}%. The formal governance structure is being bypassed. Things get done outside the system.`,
      tippingPoint: {
        metric: "governance_execution_gap",
        currentValue: execution - governance,
        threshold: 30,
        distanceToTipping: Math.max(0, 30 - (execution - governance)),
        atTippingPoint: execution - governance >= 25,
      },
      projectedConsequence: "When execution consistently bypasses governance, informal authority becomes permanent. Reinstating governance later requires dismantling the informal structure.",
      reversal: "Identify who is bypassing governance and why. If governance is too slow, fix governance. If it's being ignored, enforce it once visibly.",
    });
  }

  // 5. Phase transition detection (multiple mutations = structural shift)
  if (mutations.length >= 3) {
    mutations.push({
      type: "phase_transition",
      severity: 9,
      confidence: 0.85,
      description: `${mutations.length} mutations detected simultaneously. The organisation is undergoing a structural phase transition — not just metric movement.`,
      tippingPoint: {
        metric: "mutation_count",
        currentValue: mutations.length,
        threshold: 3,
        distanceToTipping: 0,
        atTippingPoint: true,
      },
      projectedConsequence: "Phase transitions are not recoverable incrementally. The organisation will settle into a new operating mode — either better or worse. The next 30 days determine which.",
      reversal: "This requires executive intervention, not operational adjustment. Convene the decision-making body. Name the transition. Choose the direction explicitly.",
    });
  }

  // Stability classification
  const stability: MutationAnalysis["organisationalStability"] =
    mutations.some((m) => m.type === "phase_transition") ? "restructuring"
    : mutations.length >= 2 ? "fragmenting"
    : mutations.length === 1 ? "shifting"
    : "stable";

  const atTippingPoint = mutations.some((m) => m.tippingPoint.atTippingPoint);

  const narrative = mutations.length === 0
    ? "No institutional mutations detected. The organisation's structure is stable at current measurement."
    : mutations.length === 1
    ? `One mutation detected: ${mutations[0]!.description} ${atTippingPoint ? "The organisation is at a tipping point." : ""}`
    : `${mutations.length} mutations detected. ${stability === "restructuring" ? "The organisation is undergoing a structural phase transition." : "Multiple structural shifts are active simultaneously."} ${atTippingPoint ? "At least one metric is at the tipping point." : ""}`;

  return {
    mutationsDetected: mutations,
    organisationalStability: stability,
    atTippingPoint,
    narrative,
  };
}
