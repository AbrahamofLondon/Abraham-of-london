/**
 * #8 — Domain Interdependency Mapping
 *
 * Causal chains between domains. Not "these are both weak" but
 * "identity weakness CAUSES decision weakness CAUSES behaviour drift."
 * This creates intervention sequencing logic impossible to copy
 * without understanding the causal model.
 */

export type CausalLink = {
  from: string;
  to: string;
  strength: number;  // 0-1
  mechanism: string;
  /** If 'from' improves, how much does 'to' improve? */
  leverageMultiplier: number;
};

export type InterventionSequence = {
  /** Domain to fix first */
  primaryTarget: string;
  /** Why this domain first */
  reason: string;
  /** What fixing this unlocks */
  unlocks: string[];
  /** Expected cascade effect */
  cascadeEffect: string;
  /** Leverage score: how much total improvement from fixing this one thing */
  leverageScore: number;
};

// Causal model: which domains cause which
const CAUSAL_MODEL: CausalLink[] = [
  // Identity gates everything
  { from: "identity", to: "decision", strength: 0.85, mechanism: "Unclear mandate produces unclear decisions.", leverageMultiplier: 1.8 },
  { from: "identity", to: "behaviour", strength: 0.70, mechanism: "Without mandate clarity, daily behaviour defaults to reactive.", leverageMultiplier: 1.5 },
  { from: "identity", to: "legacy", strength: 0.60, mechanism: "Legacy requires sustained identity. Without it, long-term building stalls.", leverageMultiplier: 1.3 },

  // Decision gates execution
  { from: "decision", to: "behaviour", strength: 0.80, mechanism: "Poor decision integrity produces inconsistent execution.", leverageMultiplier: 1.6 },
  { from: "decision", to: "execution", strength: 0.75, mechanism: "Avoided decisions create execution vacuum.", leverageMultiplier: 1.5 },

  // Authority gates governance
  { from: "authority", to: "governance", strength: 0.85, mechanism: "Unclear authority undermines governance structures.", leverageMultiplier: 1.7 },
  { from: "authority", to: "execution", strength: 0.70, mechanism: "Contested authority produces parallel execution streams.", leverageMultiplier: 1.4 },
  { from: "authority", to: "trust", strength: 0.65, mechanism: "Authority ambiguity erodes trust in the decision process.", leverageMultiplier: 1.3 },

  // Trust enables coherence
  { from: "trust", to: "coherence", strength: 0.75, mechanism: "Low trust produces political decision-making.", leverageMultiplier: 1.5 },
  { from: "trust", to: "execution", strength: 0.60, mechanism: "Without trust, people hedge rather than commit.", leverageMultiplier: 1.2 },

  // Environment amplifies or dampens
  { from: "environment", to: "behaviour", strength: 0.55, mechanism: "Hostile environment drains energy from intentional behaviour.", leverageMultiplier: 1.1 },
  { from: "environment", to: "emotional_order", strength: 0.50, mechanism: "External pressure destabilises internal discipline.", leverageMultiplier: 1.0 },

  // Governance enables execution
  { from: "governance", to: "execution", strength: 0.80, mechanism: "Governance structures direct execution. Without them, effort scatters.", leverageMultiplier: 1.6 },
];

/**
 * Given domain scores, compute the optimal intervention sequence.
 * The domain with the highest leverage (most downstream impact when fixed)
 * should be targeted first.
 */
export function computeInterventionSequence(
  scores: Record<string, number>,
): InterventionSequence[] {
  const results: InterventionSequence[] = [];

  // For each weak domain, compute its leverage score
  for (const [domain, score] of Object.entries(scores)) {
    if (score >= 65) continue; // only consider weak domains

    // Find all downstream effects if this domain improves
    const downstream = CAUSAL_MODEL.filter((link) => link.from === domain);
    let totalLeverage = 0;
    const unlocks: string[] = [];

    for (const link of downstream) {
      const targetScore = scores[link.to] ?? 50;
      if (targetScore < 65) { // only count if downstream is also weak
        totalLeverage += link.leverageMultiplier * link.strength * (65 - targetScore) / 65;
        unlocks.push(`${link.to}: ${link.mechanism}`);
      }
    }

    const leverageScore = Math.round(totalLeverage * 100) / 100;

    results.push({
      primaryTarget: domain,
      reason: downstream.length > 0
        ? `${domain} gates ${downstream.length} downstream domain${downstream.length > 1 ? "s" : ""}. Fixing it unlocks cascade improvement.`
        : `${domain} is weak but has no downstream dependencies. Fix independently.`,
      unlocks,
      cascadeEffect: leverageScore > 1.5
        ? `High leverage: fixing ${domain} produces ${Math.round(leverageScore * 100)}% of the total possible improvement.`
        : leverageScore > 0.5
        ? `Moderate leverage: fixing ${domain} partially unlocks downstream domains.`
        : `Low leverage: fixing ${domain} has limited cascade effect.`,
      leverageScore,
    });
  }

  // Sort by leverage descending
  return results.sort((a, b) => b.leverageScore - a.leverageScore);
}

/**
 * Detect circular dependencies (A→B→C→A) which indicate systemic lock.
 */
export function detectSystemicLock(scores: Record<string, number>): {
  locked: boolean;
  cycle: string[];
  narrative: string;
} {
  const weak = new Set(Object.entries(scores).filter(([, s]) => s < 50).map(([d]) => d));

  // BFS for cycles among weak domains
  for (const start of weak) {
    const visited = new Set<string>();
    const queue: Array<{ domain: string; path: string[] }> = [{ domain: start, path: [start] }];

    while (queue.length > 0) {
      const { domain, path } = queue.shift()!;
      const downstream = CAUSAL_MODEL.filter((l) => l.from === domain && weak.has(l.to));

      for (const link of downstream) {
        if (link.to === start && path.length >= 2) {
          return {
            locked: true,
            cycle: [...path, start],
            narrative: `Systemic lock detected: ${path.join(" → ")} → ${start}. These domains are weakening each other in a cycle. Breaking the cycle requires intervening on the weakest link simultaneously, not sequentially.`,
          };
        }
        if (!visited.has(link.to)) {
          visited.add(link.to);
          queue.push({ domain: link.to, path: [...path, link.to] });
        }
      }
    }
  }

  return { locked: false, cycle: [], narrative: "No systemic lock detected. Domains can be addressed sequentially." };
}
