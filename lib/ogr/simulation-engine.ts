// lib/ogr/simulation-engine.ts — DEPRECATED: OGR simulation engine. Reference only — do not extend. Superseded by Intelligence Foundry engine adapters.

export type ResonanceInputRecord = {
  id: string;
  score?: number | null;
  certainty?: number | null;
  weight?: number | null;
};

export type ResonanceBand =
  | "LOW"
  | "MODERATE"
  | "STRONG"
  | "HIGH"
  | "SOVEREIGN";

export type ResonanceComputation = {
  id: string;
  score: number;
  certainty: number;
  weight: number;
  weightedScore: number;
};

export type ResonanceResult = {
  score: number;
  confidence?: number;
  band?: ResonanceBand;
  count: number;
  items: ResonanceComputation[];
};

export type ResonanceOptions = {
  includeConfidence?: boolean;
  calculateBand?: boolean;
  minWeight?: number;
  maxScore?: number;
  minScore?: number;
};

const DEFAULT_MIN_WEIGHT = 0.0001;
const DEFAULT_MAX_SCORE = 100;
const DEFAULT_MIN_SCORE = 0;
const DEFAULT_CERTAINTY_FALLBACK = 1;
const EPSILON = 0.000001;
const ROUND_PLACES_SCORE = 4;
const ROUND_PLACES_WEIGHT = 6;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function scoreToBand(score: number): ResonanceBand {
  const s = clamp(score, 0, 100);
  if (s >= 90) return "SOVEREIGN";
  if (s >= 75) return "HIGH";
  if (s >= 60) return "STRONG";
  if (s >= 40) return "MODERATE";
  return "LOW";
}

function normaliseRecord(
  input: ResonanceInputRecord,
  minWeight: number,
  minScore: number,
  maxScore: number,
): ResonanceComputation | null {
  const id = String(input?.id ?? "").trim();
  if (!id) return null;

  const rawScore = normalizeNumber(input?.score, 0);
  const rawCertainty = normalizeNumber(
    input?.certainty,
    DEFAULT_CERTAINTY_FALLBACK,
  );
  const rawWeight = normalizeNumber(input?.weight, 1);

  if (!Number.isFinite(rawScore)) return null;
  if (!Number.isFinite(rawCertainty)) return null;
  if (!Number.isFinite(rawWeight) || rawWeight < 0) return null;

  const score = clamp(rawScore, minScore, maxScore);
  const certainty = clamp(rawCertainty, 0, 1);
  const weight = Math.max(minWeight, rawWeight);

  return {
    id,
    score: roundTo(score, ROUND_PLACES_SCORE),
    certainty: roundTo(certainty, ROUND_PLACES_SCORE),
    weight: roundTo(weight, ROUND_PLACES_WEIGHT),
    weightedScore: roundTo(
      score * certainty * weight,
      ROUND_PLACES_WEIGHT,
    ),
  };
}

function computeFromItems(items: ResonanceComputation[]): {
  score: number;
  confidence: number;
} {
  let totalWeight = 0;
  let totalWeightedScore = 0;
  let totalWeightedCertainty = 0;

  for (const item of items) {
    totalWeight += item.weight;
    totalWeightedScore += item.weightedScore;
    totalWeightedCertainty += item.certainty * item.weight;
  }

  if (totalWeight < EPSILON) {
    return { score: 0, confidence: 0 };
  }

  return {
    score: roundTo(totalWeightedScore / totalWeight, ROUND_PLACES_SCORE),
    confidence: roundTo(
      totalWeightedCertainty / totalWeight,
      ROUND_PLACES_SCORE,
    ),
  };
}

function emptyResult(options?: ResonanceOptions): ResonanceResult {
  return {
    score: 0,
    confidence: options?.includeConfidence ? 0 : undefined,
    band: options?.calculateBand ? "LOW" : undefined,
    count: 0,
    items: [],
  };
}

function runResonanceEngine(
  items: ResonanceInputRecord[],
  options?: ResonanceOptions,
): ResonanceResult {
  if (!Array.isArray(items) || items.length === 0) {
    return emptyResult(options);
  }

  const minWeight = options?.minWeight ?? DEFAULT_MIN_WEIGHT;
  const minScore = options?.minScore ?? DEFAULT_MIN_SCORE;
  const maxScore = options?.maxScore ?? DEFAULT_MAX_SCORE;

  const computed: ResonanceComputation[] = [];

  for (const item of items) {
    const record = normaliseRecord(item, minWeight, minScore, maxScore);
    if (record) computed.push(record);
  }

  if (computed.length === 0) {
    return emptyResult(options);
  }

  const { score, confidence } = computeFromItems(computed);

  return {
    score,
    confidence: options?.includeConfidence ? confidence : undefined,
    band: options?.calculateBand ? scoreToBand(score) : undefined,
    count: computed.length,
    items: computed,
  };
}

export async function calculateResonance(
  items: ResonanceInputRecord[],
  options?: ResonanceOptions,
): Promise<ResonanceResult> {
  return runResonanceEngine(items, options);
}

export function calculateResonanceSync(
  items: ResonanceInputRecord[],
  options?: ResonanceOptions,
): ResonanceResult {
  return runResonanceEngine(items, options);
}

export function aggregateResonanceResults(
  results: ResonanceResult[],
): ResonanceResult {
  if (!Array.isArray(results) || results.length === 0) {
    return emptyResult({ includeConfidence: true, calculateBand: true });
  }

  const valid = results.filter((result) => result.count > 0);
  if (valid.length === 0) {
    return emptyResult({ includeConfidence: true, calculateBand: true });
  }

  let totalCount = 0;
  let weightedScoreSum = 0;
  let weightedConfidenceSum = 0;

  for (const result of valid) {
    totalCount += result.count;
    weightedScoreSum += result.score * result.count;
    weightedConfidenceSum += (result.confidence ?? 0) * result.count;
  }

  const score = roundTo(weightedScoreSum / totalCount, ROUND_PLACES_SCORE);
  const confidence = roundTo(
    weightedConfidenceSum / totalCount,
    ROUND_PLACES_SCORE,
  );

  return {
    score,
    confidence,
    band: scoreToBand(score),
    count: totalCount,
    items: valid.flatMap((result) => result.items),
  };
}

export default {
  scoreToBand,
  calculateResonance,
  calculateResonanceSync,
  aggregateResonanceResults,
};