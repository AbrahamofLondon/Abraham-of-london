/**
 * Scoring Mathematics — shared foundation for all assessment engines.
 *
 * Replaces hardcoded threshold jumps with smooth, defensible math.
 * Every function here must be:
 * - Mathematically sound (no magic numbers without justification)
 * - Smooth (no 1-point input flips producing 35-point output swings)
 * - Testable (pure functions, no side effects)
 */

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-AXIS SCORING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a meaningful composite from resonance (0-10) and certainty (0-10).
 *
 * The old formula: resonance * (certainty / 10) gave certainty a 0-1 range,
 * making it mathematically irrelevant. A user with R=7,C=2 scored 1.4 while
 * R=1,C=10 scored 1.0 — the system couldn't distinguish conviction from confusion.
 *
 * New formula: geometric mean normalised to 0-100.
 * - sqrt(R * C) * 10 gives both axes equal weight
 * - R=7,C=2 → sqrt(14)*10 = 37.4 (low certainty drags score down)
 * - R=7,C=8 → sqrt(56)*10 = 74.8 (high both = high score)
 * - R=1,C=10 → sqrt(10)*10 = 31.6 (low resonance despite high certainty)
 * - R=10,C=10 → sqrt(100)*10 = 100 (ceiling)
 *
 * This creates real discrimination: both axes must be present for a strong score.
 */
export function dualAxisScore(resonance: number, certainty: number): number {
  const r = clamp(resonance, 0, 10);
  const c = clamp(certainty, 0, 10);
  return Math.round(Math.sqrt(r * c) * 10);
}

/**
 * Confidence gap — how far apart resonance and certainty are.
 * High gap = user claims alignment they haven't verified (or vice versa).
 * Returns 0-10 scale.
 */
export function confidenceGap(resonance: number, certainty: number): number {
  return Math.abs(clamp(resonance, 0, 10) - clamp(certainty, 0, 10));
}

// ─────────────────────────────────────────────────────────────────────────────
// SMOOTH BAND CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

export type BandResult<T extends string> = {
  band: T;
  score: number;
  /** 0-1: how close to the next threshold. 0 = firmly in band, 1 = on the edge */
  proximity: number;
  /** Whether this score is within the hysteresis margin of the next/previous band */
  borderline: boolean;
};

/**
 * Classify a score into bands with proximity awareness.
 * Thresholds are sorted descending: [80, 60, 40] means >=80 is labels[0], etc.
 *
 * Unlike hard cutoffs, this tells you HOW CLOSE the score is to flipping.
 * A score of 79 with threshold 80 gets proximity=0.9 (very close to next band).
 */
export function smoothBand<T extends string>(
  score: number,
  thresholds: number[],
  labels: T[],
  margin: number = 3,
): BandResult<T> {
  const sorted = [...thresholds].sort((a, b) => b - a);
  const fallback = labels[labels.length - 1]!;

  for (let i = 0; i < sorted.length; i++) {
    if (score >= sorted[i]!) {
      const band = labels[i] ?? fallback;
      const nextThreshold = i > 0 ? sorted[i - 1]! : sorted[i]! + 20;
      const prevThreshold = sorted[i]!;
      const rangeToNext = nextThreshold - prevThreshold;
      const distToNext = nextThreshold - score;
      const proximity = rangeToNext > 0 ? 1 - (distToNext / rangeToNext) : 0;
      const borderline = score - prevThreshold < margin || distToNext < margin;

      return { band, score, proximity: Math.round(proximity * 100) / 100, borderline };
    }
  }

  return { band: fallback, score, proximity: 0, borderline: score >= (sorted[sorted.length - 1]! - margin) };
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGMOID TRANSITIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sigmoid function for graduated bonuses/penalties.
 * Replaces binary 12-or-0 jumps with smooth curves.
 *
 * - sigmoid(0, 2, 1.5) ≈ 0.05 (minimal bonus at 0 matches)
 * - sigmoid(1, 2, 1.5) ≈ 0.18 (partial bonus at 1 match)
 * - sigmoid(2, 2, 1.5) = 0.50 (half bonus at midpoint)
 * - sigmoid(4, 2, 1.5) ≈ 0.95 (near-full bonus at 4 matches)
 */
export function sigmoid(x: number, midpoint: number, steepness: number): number {
  return 1 / (1 + Math.exp(-steepness * (x - midpoint)));
}

/**
 * Graduated bonus: replaces binary keyword bonuses.
 * matchCount keywords found → return 0 to maxBonus smoothly.
 */
export function graduatedBonus(matchCount: number, maxBonus: number, midpoint: number = 2): number {
  return Math.round(sigmoid(matchCount, midpoint, 1.5) * maxBonus * 10) / 10;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCH DENSITY (replaces includesAny boolean)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns 0-1 density of matched patterns in text.
 * Unlike includesAny (boolean), this rewards multiple matches proportionally.
 */
export function matchDensity(text: string, patterns: string[]): number {
  if (!text || patterns.length === 0) return 0;
  const lower = text.toLowerCase();
  const matches = patterns.filter((p) => lower.includes(p.toLowerCase())).length;
  return Math.min(1, matches / Math.max(1, Math.ceil(patterns.length * 0.4)));
}

/**
 * Count pattern matches in text. Returns raw count.
 */
export function matchCount(text: string, patterns: string[]): number {
  if (!text || patterns.length === 0) return 0;
  const lower = text.toLowerCase();
  return patterns.filter((p) => lower.includes(p.toLowerCase())).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL CONSISTENCY
// ─────────────────────────────────────────────────────────────────────────────

export type ConsistencyResult = {
  consistent: boolean;
  contradictions: Array<{ domainA: string; domainB: string; gap: number; note: string }>;
  consistencyScore: number; // 0-100, where 100 = perfectly consistent
};

/**
 * Detect internal contradictions in a set of domain scores.
 * A user scoring identity=90 and decision=20 is either gaming the system
 * or revealing a genuine contradiction. Either way, it should be flagged.
 */
export function detectInternalContradictions(
  domains: Array<{ domain: string; score: number }>,
  threshold: number = 35,
): ConsistencyResult {
  const contradictions: ConsistencyResult["contradictions"] = [];

  for (let i = 0; i < domains.length; i++) {
    for (let j = i + 1; j < domains.length; j++) {
      const a = domains[i]!;
      const b = domains[j]!;
      const gap = Math.abs(a.score - b.score);
      if (gap >= threshold) {
        const higher = a.score > b.score ? a : b;
        const lower = a.score > b.score ? b : a;
        contradictions.push({
          domainA: higher.domain,
          domainB: lower.domain,
          gap,
          note: `${higher.domain} scores ${higher.score} while ${lower.domain} scores ${lower.score}. A ${gap}-point gap suggests either a genuine contradiction or incomplete self-assessment.`,
        });
      }
    }
  }

  // Consistency score: penalise for each contradiction proportionally
  const totalGap = contradictions.reduce((s, c) => s + c.gap, 0);
  const maxPossibleGap = (domains.length * (domains.length - 1) / 2) * 100;
  const consistencyScore = maxPossibleGap > 0
    ? Math.round(100 - (totalGap / maxPossibleGap) * 100)
    : 100;

  return {
    consistent: contradictions.length === 0,
    contradictions,
    consistencyScore: Math.max(0, consistencyScore),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// POSTURE COMPOSITE (replaces AND-gated threshold classification)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute a weighted posture composite from multiple metrics.
 * This replaces the broken AND-gate logic where a score of
 * coherence=74, friction=34, governance=69 falls to MISALIGNED
 * despite being 1 point from ORDERED on every axis.
 */
export function postureComposite(metrics: {
  coherence: number;
  friction: number;
  governance: number;
  trust?: number;
  authority?: number;
}): number {
  const w = {
    coherence: 0.30,
    antifriction: 0.20,
    governance: 0.25,
    trust: 0.15,
    authority: 0.10,
  };

  return Math.round(
    (metrics.coherence * w.coherence) +
    ((100 - metrics.friction) * w.antifriction) +
    (metrics.governance * w.governance) +
    ((metrics.trust ?? metrics.coherence) * w.trust) +
    ((metrics.authority ?? metrics.governance) * w.authority)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIFICITY SCORING (replaces word-count-as-quality)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score text quality by specificity, not word count.
 *
 * Measures:
 * - Named entities (numbers, dates, roles, organisations)
 * - Structural density (sentences per word — higher = more structured)
 * - Causal language (because, therefore, which means)
 * - Diminishing returns on length (log scale, not linear)
 *
 * A concise 30-word problem statement with 3 named entities scores
 * higher than a rambling 80-word statement with zero specifics.
 */
export function specificityScore(text: string): number {
  if (!text || text.trim().length < 5) return 0;

  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]+/g) || []).length || 1;

  // Named entities: numbers, percentages, currency, dates, capitalised terms
  const entityPatterns = [
    /\d+%/g,                        // percentages
    /£[\d,.]+|€[\d,.]+|\$[\d,.]+/g, // currency
    /\d{4}/g,                       // years
    /\d+\s*(days?|weeks?|months?|years?|hours?)/gi, // time spans
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g, // multi-word capitalised (names, orgs)
  ];
  let entityCount = 0;
  for (const pattern of entityPatterns) {
    const matches = text.match(pattern);
    if (matches) entityCount += matches.length;
  }

  // Causal language
  const causalPatterns = ["because", "therefore", "which means", "as a result", "leading to", "causing", "so that", "in order to", "resulting in"];
  const causalCount = matchCount(text, causalPatterns);

  // Structural density: sentences per 20 words (more structured = more sentences relative to length)
  const structuralDensity = Math.min(1, (sentences / Math.max(1, words / 20)));

  // Length with diminishing returns (log scale)
  const lengthScore = Math.min(1, Math.log(Math.max(1, words) / 8) / Math.log(80 / 8));

  // Composite: entities matter most, then causality, then structure, then length
  const raw = (
    Math.min(entityCount, 5) * 12 +    // up to 60 points from entities
    graduatedBonus(causalCount, 20) +    // up to 20 from causal language
    structuralDensity * 10 +             // up to 10 from structure
    lengthScore * 10                     // up to 10 from length (diminishing)
  );

  return Math.round(clamp(raw, 0, 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
