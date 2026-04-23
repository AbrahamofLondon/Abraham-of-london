/**
 * AI Intervention Library — structured interventions mapped to AI risk.
 *
 * Auto-suggests top 2-3 interventions based on:
 * - AI exposure level
 * - Forward terrain state
 * - Contradiction severity
 * - Decision velocity gap
 *
 * Attached to Strategy Room decisions.
 */

export type AIIntervention = {
  id: string;
  category: "AUTOMATE" | "AUGMENT" | "ELIMINATE" | "REPOSITION";
  description: string;
  expectedImpact: string;
  timeframe: string;
  prerequisite: string | null;
  riskIfIgnored: string;
};

// Canonical intervention library
const INTERVENTIONS: AIIntervention[] = [
  // AUTOMATE
  {
    id: "auto_decision_triage",
    category: "AUTOMATE",
    description: "Automate decision triage — AI pre-classifies incoming decisions by urgency, domain, and contradiction risk before human review.",
    expectedImpact: "40-60% reduction in decision queue time. Eliminates low-value deliberation.",
    timeframe: "14 days",
    prerequisite: null,
    riskIfIgnored: "Decision backlog compounds. Each unprocessed decision ages into higher-cost intervention.",
  },
  {
    id: "auto_contradiction_scan",
    category: "AUTOMATE",
    description: "Automate contradiction detection — deploy continuous monitoring for structural contradictions across decision domains.",
    expectedImpact: "Contradictions surfaced 3-5x earlier than manual review. Prevents embedding.",
    timeframe: "21 days",
    prerequisite: "Requires active evidence graph with >10 nodes.",
    riskIfIgnored: "Contradictions persist undetected. Cost of resolution increases exponentially with time.",
  },
  {
    id: "auto_stakeholder_alignment",
    category: "AUTOMATE",
    description: "Automate stakeholder alignment tracking — continuous divergence monitoring replaces periodic manual surveys.",
    expectedImpact: "Real-time visibility into authority disagreement. Prevents decision paralysis from hidden divergence.",
    timeframe: "30 days",
    prerequisite: "Requires multi-stakeholder campaign data.",
    riskIfIgnored: "Stakeholder divergence compounds into execution failure. Decisions made under hidden disagreement produce conflicting streams.",
  },

  // AUGMENT
  {
    id: "aug_executive_synthesis",
    category: "AUGMENT",
    description: "Augment executive synthesis — AI compresses diagnostic evidence into decision-ready briefs with priced consequences.",
    expectedImpact: "Executive review time reduced from hours to minutes. Decision quality maintained with speed gain.",
    timeframe: "14 days",
    prerequisite: null,
    riskIfIgnored: "Executive bandwidth becomes bottleneck. Decision velocity capped at human processing speed.",
  },
  {
    id: "aug_consequence_projection",
    category: "AUGMENT",
    description: "Augment consequence modelling — AI projects 30/60/90 day outcomes using historical pattern data and sector baselines.",
    expectedImpact: "Consequence accuracy improves 2-3x over heuristic estimation. Enables preemptive intervention.",
    timeframe: "21 days",
    prerequisite: "Requires >3 longitudinal snapshots for calibration.",
    riskIfIgnored: "Consequence pricing remains heuristic. Intervention timing based on intuition rather than projected trajectory.",
  },

  // ELIMINATE
  {
    id: "elim_manual_reporting",
    category: "ELIMINATE",
    description: "Eliminate manual reporting cycles — replace periodic reports with live compression views that update on every decision event.",
    expectedImpact: "Removes 15-30 hours/month of report assembly. Information is always current.",
    timeframe: "30 days",
    prerequisite: null,
    riskIfIgnored: "Reports are always stale. Decisions made on outdated information produce avoidable errors.",
  },
  {
    id: "elim_redundant_approval",
    category: "ELIMINATE",
    description: "Eliminate redundant approval chains — consolidate parallel authority structures into single governed decision path.",
    expectedImpact: "Decision cycle reduced by 40-60%. Eliminates coordination tax between overlapping authorities.",
    timeframe: "45 days",
    prerequisite: "Requires stakeholder alignment mapping completed.",
    riskIfIgnored: "Parallel authority creates contradictory execution. Each redundant approval adds delay without adding quality.",
  },

  // REPOSITION
  {
    id: "repo_competitive_moat",
    category: "REPOSITION",
    description: "Reposition decision infrastructure as competitive moat — decision speed and coherence become the differentiator, not product features.",
    expectedImpact: "Organisation competes on execution velocity rather than product parity. Defensible structural advantage.",
    timeframe: "60-90 days",
    prerequisite: "Requires STABLE or higher competitive position. Active contradictions must be <3.",
    riskIfIgnored: "Competitors who reposition first capture the structural advantage. Second-mover position requires 3x investment.",
  },
  {
    id: "repo_ai_native_ops",
    category: "REPOSITION",
    description: "Reposition operations as AI-native — redesign core processes around AI capabilities rather than retrofitting AI onto legacy workflows.",
    expectedImpact: "Step-change in operational throughput. Moves from AI-augmented to AI-native competitive position.",
    timeframe: "90 days",
    prerequisite: "Requires AI_GOVERNED classification. Cannot reposition from AI_LAG directly.",
    riskIfIgnored: "Organisation locked into AI-retrofit pattern. Diminishing returns on each incremental AI investment.",
  },
];

export type InterventionSuggestion = {
  intervention: AIIntervention;
  relevanceScore: number;
  reason: string;
};

export type SuggestInputs = {
  aiExposureLevel: string;
  forwardTerrainState: string;
  contradictionCount: number;
  velocityGapPercent: number;
  hasMultiStakeholder: boolean;
  competitivePosition: string;
};

export function suggestInterventions(inputs: SuggestInputs): InterventionSuggestion[] {
  const {
    aiExposureLevel,
    forwardTerrainState,
    contradictionCount,
    velocityGapPercent,
    hasMultiStakeholder,
    competitivePosition,
  } = inputs;

  const scored: InterventionSuggestion[] = [];

  for (const intervention of INTERVENTIONS) {
    let score = 0;
    let reason = "";

    // AUTOMATE scoring
    if (intervention.category === "AUTOMATE") {
      if (velocityGapPercent > 50) { score += 30; reason = "Decision velocity gap exceeds 50%. Automation closes the gap."; }
      if (contradictionCount > 2) { score += 20; reason = reason || "Multiple active contradictions. Automated detection prevents persistence."; }
      if (intervention.id === "auto_stakeholder_alignment" && hasMultiStakeholder) { score += 25; reason = "Multi-stakeholder divergence present. Continuous monitoring required."; }
      if (aiExposureLevel === "CRITICAL" || aiExposureLevel === "HIGH") score += 15;
    }

    // AUGMENT scoring
    if (intervention.category === "AUGMENT") {
      if (velocityGapPercent > 30) { score += 25; reason = "Executive bandwidth limiting decision throughput. Augmentation unlocks speed."; }
      if (forwardTerrainState === "SHIFTING" || forwardTerrainState === "ACCELERATING") { score += 20; reason = reason || "Terrain shifting. Augmented projection required for accurate intervention timing."; }
      if (aiExposureLevel === "HIGH") score += 15;
    }

    // ELIMINATE scoring
    if (intervention.category === "ELIMINATE") {
      if (velocityGapPercent > 40) { score += 20; reason = "Process friction contributing to velocity gap. Elimination removes drag."; }
      if (contradictionCount > 3) { score += 15; reason = reason || "Structural dysfunction suggests redundant processes. Elimination reduces complexity."; }
    }

    // REPOSITION scoring
    if (intervention.category === "REPOSITION") {
      if (competitivePosition === "STABLE" || competitivePosition === "ADVANCING") {
        score += 30; reason = "Competitive position supports offensive repositioning. Window is open.";
      }
      if (forwardTerrainState === "DISRUPTING") { score += 25; reason = reason || "Terrain disruption creates repositioning opportunity for prepared organisations."; }
      // Penalise if not ready
      if (competitivePosition === "BEHIND" || competitivePosition === "AT_RISK") score -= 20;
    }

    if (score > 10) {
      scored.push({ intervention, relevanceScore: score, reason });
    }
  }

  // Sort by relevance, return top 3
  return scored
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 3);
}
