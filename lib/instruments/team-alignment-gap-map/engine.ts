/**
 * Team Alignment Gap Map — governed instrument engine.
 *
 * Measures where stated agreement and practical alignment diverge.
 * 6 alignment domains, each scored 0-10 for both leader perception
 * and team reality estimate.
 *
 * Deterministic. Same input → same output.
 */
import { evaluateDecision, type DecisionKernelOutput } from "@/lib/decision/kernel";

export type AlignmentDomain = "strategicDirection" | "priorityAgreement" | "roleClarity" | "communicationEffectiveness" | "decisionOwnership" | "executionCommitment";

export type AlignmentInput = {
  leaderPerception: Record<AlignmentDomain, number>; // 0-10
  teamEstimate: Record<AlignmentDomain, number>; // 0-10
};

export type AlignmentGap = {
  domain: AlignmentDomain;
  leaderScore: number;
  teamScore: number;
  gap: number; // absolute difference
  direction: "LEADER_OVERESTIMATES" | "TEAM_OVERESTIMATES" | "ALIGNED";
};

export type AlignmentResult = {
  overallAlignmentScore: number; // 0-100 (100 = perfectly aligned)
  alignmentBand: "STRONG" | "ADEQUATE" | "WEAK" | "CRITICAL";
  gaps: AlignmentGap[];
  largestGap: AlignmentGap;
  misalignmentZones: string[];
  divergenceSignal: string;
  recommendation: string;
  decisionKernel: DecisionKernelOutput;
  deterministic: true;
  version: "1.0";
};

const DOMAIN_LABELS: Record<AlignmentDomain, string> = {
  strategicDirection: "Strategic direction",
  priorityAgreement: "Priority agreement",
  roleClarity: "Role clarity",
  communicationEffectiveness: "Communication effectiveness",
  decisionOwnership: "Decision ownership",
  executionCommitment: "Execution commitment",
};

function clamp(v: number): number {
  return Math.max(0, Math.min(10, Math.round(v)));
}

export function scoreTeamAlignment(input: AlignmentInput): AlignmentResult {
  const domains = Object.keys(DOMAIN_LABELS) as AlignmentDomain[];
  const gaps: AlignmentGap[] = [];
  let totalGap = 0;

  for (const domain of domains) {
    const leader = clamp(input.leaderPerception[domain] ?? 5);
    const team = clamp(input.teamEstimate[domain] ?? 5);
    const gap = Math.abs(leader - team);
    totalGap += gap;

    gaps.push({
      domain,
      leaderScore: leader,
      teamScore: team,
      gap,
      direction: gap <= 1 ? "ALIGNED" : leader > team ? "LEADER_OVERESTIMATES" : "TEAM_OVERESTIMATES",
    });
  }

  // Max possible gap = 10 * 6 = 60
  const alignmentScore = Math.round(Math.max(0, 100 - (totalGap / 60) * 100));

  const band: AlignmentResult["alignmentBand"] =
    alignmentScore >= 80 ? "STRONG" : alignmentScore >= 60 ? "ADEQUATE" : alignmentScore >= 40 ? "WEAK" : "CRITICAL";

  const sortedGaps = [...gaps].sort((a, b) => b.gap - a.gap);
  const largestGap = sortedGaps[0]!;

  const misalignmentZones = sortedGaps
    .filter((g) => g.gap >= 3)
    .map((g) => `${DOMAIN_LABELS[g.domain]}: ${g.direction === "LEADER_OVERESTIMATES" ? "Leader perception exceeds team reality" : g.direction === "TEAM_OVERESTIMATES" ? "Team perceives more strongly than leader" : "Aligned"} (gap: ${g.gap})`);

  const divergenceSignal = misalignmentZones.length === 0
    ? "No significant perception gaps detected. The team appears aligned on the stated dimensions."
    : misalignmentZones.length <= 2
      ? `${misalignmentZones.length} alignment gap${misalignmentZones.length !== 1 ? "s" : ""} detected. The largest is in ${DOMAIN_LABELS[largestGap.domain]} (gap: ${largestGap.gap}/10).`
      : `Widespread misalignment detected across ${misalignmentZones.length} domains. The team and leadership are operating under different assumptions about ${DOMAIN_LABELS[largestGap.domain]}.`;

  const recommendations: Record<AlignmentResult["alignmentBand"], string> = {
    STRONG: "Alignment is strong across all measured dimensions. Monitor for drift, particularly in execution commitment.",
    ADEQUATE: `Alignment is adequate but ${DOMAIN_LABELS[largestGap.domain]} shows a gap worth addressing. Confirm whether the leader and team share the same understanding of this dimension.`,
    WEAK: `Alignment is weak. ${DOMAIN_LABELS[largestGap.domain]} is the most acute gap (${largestGap.gap}/10). This gap will compound under execution pressure. Mandate Clarity Framework recommended.`,
    CRITICAL: `Alignment is critically weak. The team and leadership appear to be operating under fundamentally different assumptions about ${DOMAIN_LABELS[largestGap.domain]}. Strategy Room intervention recommended before execution commitment.`,
  };

  const decisionKernel = evaluateDecision({
    id: `team-alignment:${alignmentScore}`,
    source: band === "CRITICAL" ? "strategy_room" : "executive_reporting",
    condition: `${band.toLowerCase()} team alignment (score ${alignmentScore}/100)`,
    decisionRequired: recommendations[band],
    evidenceChain: gaps.map((g) => ({
      inputSource: "team_alignment_gap_map",
      observedPattern: `${DOMAIN_LABELS[g.domain]}: leader ${g.leaderScore}/10 vs team ${g.teamScore}/10 (gap ${g.gap})`,
      weight: 1 / 6,
      explanation: "Team alignment gap map measures where stated agreement and practical alignment diverge.",
    })),
    internalContradictions: misalignmentZones.length >= 2 ? [`${misalignmentZones.length} alignment gaps detected`] : [],
    scores: Object.fromEntries(gaps.map((g) => [g.domain, alignmentScore])),
    signalStrength: band === "CRITICAL" ? "STRONG" : band === "WEAK" ? "MODERATE" : "WEAK",
    sources: [{ type: "system_computed" as const, count: 1 }],
    expectedOutcome: recommendations[band],
  });

  return {
    overallAlignmentScore: alignmentScore,
    alignmentBand: band,
    gaps,
    largestGap,
    misalignmentZones,
    divergenceSignal,
    recommendation: recommendations[band],
    decisionKernel,
    deterministic: true,
    version: "1.0",
  };
}
