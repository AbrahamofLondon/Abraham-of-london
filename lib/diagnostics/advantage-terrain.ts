/**
 * Proactive Advantage Engine
 *
 * Shifts the system from "what must be fixed" to "where to move ahead."
 * Every decision now includes:
 * - Forward terrain projection (where can the org advance)
 * - Opportunity moves (what creates advantage, not just resolves risk)
 * - Competitive position classification
 *
 * The system does four things: Detect → Warn → Enforce → Advance.
 */

export type CompetitivePosition =
  | "BEHIND"
  | "AT_RISK"
  | "STABLE"
  | "ADVANCING"
  | "LEADING";

export type OpportunityMove = {
  action: string;
  leverageType: "automate" | "augment" | "redesign" | "eliminate" | "accelerate" | "consolidate";
  expectedImpact: string;
  timeframe: string;
  competitiveEffect: string;
};

export type AdvantagePath = {
  competitivePosition: CompetitivePosition;
  positionNarrative: string;
  forwardProjection: {
    days30: string;
    days60: string;
    days90: string;
  };
  opportunityMoves: OpportunityMove[];
  advantageNarrative: string;
};

export type AdvantageInputs = {
  /** Current decision velocity gap (% behind baseline, negative = ahead) */
  velocityGapPercent: number;
  /** AI terrain classification */
  aiClassification: string;
  /** Active contradiction count */
  contradictionCount: number;
  /** Resolved contradiction count (evidence of progress) */
  resolvedContradictionCount: number;
  /** Sector for context-aware moves */
  sector: string;
  /** Whether competitors have AI adoption */
  competitorAIAdoption: boolean;
  /** Active decision domains */
  activeDomains: string[];
  /** Revenue band */
  revenueBand: string;
};

export function assessAdvantageTerrain(inputs: AdvantageInputs): AdvantagePath {
  const {
    velocityGapPercent,
    aiClassification,
    contradictionCount,
    resolvedContradictionCount,
    sector,
    competitorAIAdoption,
    activeDomains,
  } = inputs;

  // Competitive position classification
  const position: CompetitivePosition =
    velocityGapPercent <= -20 ? "LEADING"
    : velocityGapPercent <= 0 ? "ADVANCING"
    : velocityGapPercent <= 30 ? "STABLE"
    : velocityGapPercent <= 80 ? "AT_RISK"
    : "BEHIND";

  // Position narrative
  const positionNarrative =
    position === "LEADING"
      ? "Decision velocity exceeds market baseline. The organisation is creating structural advantage through speed and coherence."
    : position === "ADVANCING"
      ? "Decision velocity is accelerating toward market leadership. Maintain enforcement discipline to lock in the advantage."
    : position === "STABLE"
      ? "Decision velocity is at market parity. This is not safety — competitors are accelerating. The window for advantage is narrowing."
    : position === "AT_RISK"
      ? "Decision velocity is falling behind the market. Each cycle of delay compounds structural disadvantage."
    : "Decision velocity is materially behind market baseline. Without intervention, the gap becomes irreversible.";

  // Forward projection
  const resolvedRatio = contradictionCount > 0
    ? resolvedContradictionCount / (contradictionCount + resolvedContradictionCount)
    : 0.5;

  const momentum = resolvedRatio > 0.6 ? "positive" : resolvedRatio > 0.3 ? "neutral" : "negative";

  const forwardProjection = {
    days30: momentum === "positive"
      ? "Contradiction resolution rate suggests improving velocity. If sustained, competitive position advances within this period."
      : momentum === "neutral"
      ? "Current trajectory holds position but does not advance. Opportunity cost is accumulating."
      : "Declining resolution rate. Competitive position will deteriorate without corrective action.",
    days60: momentum === "positive"
      ? "At current resolution rate, structural advantage becomes measurable. Decision throughput exceeds sector average."
      : momentum === "neutral"
      ? "Parity holds but competitors with AI adoption will outpace within this window. Action required to advance."
      : "Gap widens. Cost of recovery exceeds cost of prevention. Intervention urgency elevates.",
    days90: momentum === "positive"
      ? "Advantage position established. Decision infrastructure operates faster than sector baseline. Defensible moat forming."
      : momentum === "neutral"
      ? "Without acceleration, position shifts from stable to at-risk. The market does not wait."
      : "Structural disadvantage embeds. Recovery requires full reconstitution, not incremental improvement.",
  };

  // Opportunity moves
  const moves: OpportunityMove[] = [];

  // AI-specific moves
  if (aiClassification === "AI_LAG" || aiClassification === "AI_FRAGMENTED") {
    moves.push({
      action: "Implement governed AI decision acceleration in highest-friction domain",
      leverageType: "augment",
      expectedImpact: "30-50% reduction in decision cycle time for targeted domain",
      timeframe: "30 days",
      competitiveEffect: "Closes velocity gap. Prevents competitors from extending structural lead.",
    });
  }

  if (competitorAIAdoption && position !== "LEADING") {
    moves.push({
      action: "Deploy AI-augmented contradiction detection across active decision domains",
      leverageType: "automate",
      expectedImpact: "Earlier identification of structural dysfunction. Reduced time-to-intervention.",
      timeframe: "60 days",
      competitiveEffect: "Matches competitor intelligence capability. Prevents asymmetric information disadvantage.",
    });
  }

  // Domain-specific moves
  if (activeDomains.some((d) => d.toLowerCase().includes("governance") || d.toLowerCase().includes("authority"))) {
    moves.push({
      action: "Consolidate governance authority into single decision chain",
      leverageType: "consolidate",
      expectedImpact: "Eliminates parallel authority structures. Reduces decision friction by 40%.",
      timeframe: "45 days",
      competitiveEffect: "Creates execution speed advantage. Competitors with fragmented governance cannot match.",
    });
  }

  if (activeDomains.some((d) => d.toLowerCase().includes("execution") || d.toLowerCase().includes("operations"))) {
    moves.push({
      action: "Redesign execution pathway to eliminate manual handoffs",
      leverageType: "redesign",
      expectedImpact: "Reduces execution cycle from weeks to days. Eliminates coordination tax.",
      timeframe: "60 days",
      competitiveEffect: "Execution speed becomes a structural advantage, not just an operational improvement.",
    });
  }

  // Momentum-based moves
  if (momentum === "positive" && contradictionCount <= 2) {
    moves.push({
      action: "Shift from defensive enforcement to proactive terrain acquisition",
      leverageType: "accelerate",
      expectedImpact: "Organisation moves from resolving risk to creating advantage. Decision posture shifts from reactive to offensive.",
      timeframe: "30 days",
      competitiveEffect: "First-mover advantage in decision coherence. Market position advances from stable to leading.",
    });
  }

  // Advantage narrative
  const advantageNarrative =
    position === "LEADING" || position === "ADVANCING"
      ? "This decision is not only about resolving risk. It defines whether you extend your lead or allow competitors to close the gap."
    : position === "STABLE"
      ? "This decision is not only about resolving risk. It defines whether you fall behind or move ahead."
    : "This decision is not only about resolving risk. It determines whether recovery is still possible at current cost.";

  return {
    competitivePosition: position,
    positionNarrative,
    forwardProjection,
    opportunityMoves: moves.slice(0, 3),
    advantageNarrative,
  };
}
