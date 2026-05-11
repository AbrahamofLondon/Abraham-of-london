/**
 * lib/sovereign/intelligence-commons.ts
 *
 * The Intelligence Commons — cross-client anonymised data layer.
 * Accumulates diagnostic signals, calculates percentile distributions,
 * and provides the statistical grounding for intelligence signals and
 * forensic accounts.
 *
 * Every diagnostic session writes to the commons (anonymised, tagged by
 * industry/stage/pressure type). The commons answers questions no individual
 * client's data can answer.
 *
 * Data source: populated by instrumented diagnostic sessions. Until sufficient
 * volume exists, bootstrap functions return theoretically-grounded estimates
 * flagged as THEORETICAL.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommonsDataSource = "EMPIRICAL" | "THEORETICAL" | "HYBRID";

export type PercentileResult = {
  score: number;
  percentile: number;
  band: "BOTTOM_QUARTILE" | "LOWER_MID" | "UPPER_MID" | "TOP_QUARTILE";
  cohortSize: number;
  dataSource: CommonsDataSource;
  descriptor: string;
};

export type PatternFrequency = {
  patternId: string;
  patternName: string;
  frequency: number; // 0–100 as percentage
  cohortSize: number;
  dataSource: CommonsDataSource;
};

export type CommonsRecord = {
  id: string;
  sessionHash: string; // SHA-256 of (orgId + sessionId) — one-way, not reversible
  industryTag: string;
  revenueBand: string;
  teamSizeBand: string;
  founderLed: boolean;
  sessionNumber: number;

  // Scores
  authorityClarity: number; // 0–100
  narrativeCoherence: number; // 0–100
  interventionReadiness: number; // 0–100
  executionReadiness: number; // 0–100
  overallPosture: "SOVEREIGN" | "ALIGNED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  trajectory: "IMPROVING" | "STABLE" | "DETERIORATING" | "COLLAPSING";
  failureModeCount: number;

  // Signals detected
  activeSignalIds: string[];

  // Outcomes (populated on follow-up sessions or admin input)
  outcomeTag?: string;
  outcomeTimeDays?: number;

  recordedAt: string; // ISO timestamp
};

export type BenchmarkDistribution = {
  metric: string;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  cohortTag: string;
  cohortSize: number;
  dataSource: CommonsDataSource;
};

// ─── Bootstrap Distributions ─────────────────────────────────────────────────
// Theoretically grounded distributions used before empirical data accumulates.
// These are calibrated against the content framework's case knowledge.

const BOOTSTRAP_DISTRIBUTIONS: Record<string, BenchmarkDistribution> = {
  // ── SMB cohorts ────────────────────────────────────────────────────────────
  "authorityClarity.SMB.SCALING": {
    metric: "authorityClarity",
    percentiles: { p10: 28, p25: 40, p50: 57, p75: 72, p90: 84 },
    cohortTag: "SMB.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.SMB.STABLE": {
    metric: "authorityClarity",
    percentiles: { p10: 35, p25: 48, p50: 62, p75: 76, p90: 88 },
    cohortTag: "SMB.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.SMB.STRESS": {
    metric: "authorityClarity",
    percentiles: { p10: 18, p25: 30, p50: 44, p75: 60, p90: 74 },
    cohortTag: "SMB.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.SMB.CRISIS": {
    metric: "authorityClarity",
    percentiles: { p10: 10, p25: 20, p50: 34, p75: 50, p90: 66 },
    cohortTag: "SMB.CRISIS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.SMB.SCALING": {
    metric: "narrativeCoherence",
    percentiles: { p10: 25, p25: 38, p50: 54, p75: 68, p90: 80 },
    cohortTag: "SMB.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.SMB.STABLE": {
    metric: "narrativeCoherence",
    percentiles: { p10: 30, p25: 44, p50: 60, p75: 73, p90: 84 },
    cohortTag: "SMB.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.SMB.STRESS": {
    metric: "narrativeCoherence",
    percentiles: { p10: 16, p25: 28, p50: 42, p75: 57, p90: 70 },
    cohortTag: "SMB.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.SMB.SCALING": {
    metric: "interventionReadiness",
    percentiles: { p10: 28, p25: 40, p50: 55, p75: 69, p90: 80 },
    cohortTag: "SMB.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.SMB.STABLE": {
    metric: "interventionReadiness",
    percentiles: { p10: 32, p25: 45, p50: 60, p75: 74, p90: 84 },
    cohortTag: "SMB.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.SMB.STRESS": {
    metric: "interventionReadiness",
    percentiles: { p10: 18, p25: 29, p50: 44, p75: 61, p90: 75 },
    cohortTag: "SMB.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.SMB.CRISIS": {
    metric: "interventionReadiness",
    percentiles: { p10: 8, p25: 18, p50: 31, p75: 48, p90: 63 },
    cohortTag: "SMB.CRISIS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.SMB.SCALING": {
    metric: "executionReadiness",
    percentiles: { p10: 30, p25: 42, p50: 58, p75: 71, p90: 83 },
    cohortTag: "SMB.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.SMB.STABLE": {
    metric: "executionReadiness",
    percentiles: { p10: 36, p25: 50, p50: 64, p75: 76, p90: 87 },
    cohortTag: "SMB.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.SMB.STRESS": {
    metric: "executionReadiness",
    percentiles: { p10: 20, p25: 31, p50: 46, p75: 62, p90: 75 },
    cohortTag: "SMB.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },

  // ── MID cohorts ────────────────────────────────────────────────────────────
  "authorityClarity.MID.SCALING": {
    metric: "authorityClarity",
    percentiles: { p10: 31, p25: 44, p50: 60, p75: 74, p90: 86 },
    cohortTag: "MID.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.MID.STABLE": {
    metric: "authorityClarity",
    percentiles: { p10: 38, p25: 52, p50: 66, p75: 78, p90: 89 },
    cohortTag: "MID.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.MID.STRESS": {
    metric: "authorityClarity",
    percentiles: { p10: 22, p25: 34, p50: 49, p75: 64, p90: 78 },
    cohortTag: "MID.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.MID.SCALING": {
    metric: "narrativeCoherence",
    percentiles: { p10: 22, p25: 35, p50: 51, p75: 66, p90: 78 },
    cohortTag: "MID.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.MID.STABLE": {
    metric: "narrativeCoherence",
    percentiles: { p10: 32, p25: 46, p50: 61, p75: 74, p90: 85 },
    cohortTag: "MID.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.MID.SCALING": {
    metric: "interventionReadiness",
    percentiles: { p10: 30, p25: 43, p50: 58, p75: 71, p90: 82 },
    cohortTag: "MID.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.MID.STRESS": {
    metric: "interventionReadiness",
    percentiles: { p10: 20, p25: 32, p50: 47, p75: 63, p90: 77 },
    cohortTag: "MID.STRESS",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.MID.SCALING": {
    metric: "executionReadiness",
    percentiles: { p10: 33, p25: 46, p50: 61, p75: 74, p90: 85 },
    cohortTag: "MID.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.MID.STABLE": {
    metric: "executionReadiness",
    percentiles: { p10: 40, p25: 54, p50: 68, p75: 79, p90: 89 },
    cohortTag: "MID.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },

  // ── SEED cohorts ───────────────────────────────────────────────────────────
  "authorityClarity.SEED.SCALING": {
    metric: "authorityClarity",
    percentiles: { p10: 22, p25: 34, p50: 50, p75: 66, p90: 80 },
    cohortTag: "SEED.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.SEED.STABLE": {
    metric: "authorityClarity",
    percentiles: { p10: 28, p25: 42, p50: 58, p75: 72, p90: 84 },
    cohortTag: "SEED.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.SEED.SCALING": {
    metric: "narrativeCoherence",
    percentiles: { p10: 20, p25: 33, p50: 50, p75: 65, p90: 78 },
    cohortTag: "SEED.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.SEED.SCALING": {
    metric: "interventionReadiness",
    percentiles: { p10: 24, p25: 36, p50: 52, p75: 67, p90: 79 },
    cohortTag: "SEED.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.SEED.SCALING": {
    metric: "executionReadiness",
    percentiles: { p10: 26, p25: 38, p50: 54, p75: 68, p90: 80 },
    cohortTag: "SEED.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },

  // ── ENTERPRISE cohorts ─────────────────────────────────────────────────────
  "authorityClarity.ENTERPRISE.STABLE": {
    metric: "authorityClarity",
    percentiles: { p10: 42, p25: 56, p50: 70, p75: 81, p90: 91 },
    cohortTag: "ENTERPRISE.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "authorityClarity.ENTERPRISE.SCALING": {
    metric: "authorityClarity",
    percentiles: { p10: 36, p25: 50, p50: 64, p75: 77, p90: 88 },
    cohortTag: "ENTERPRISE.SCALING",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "narrativeCoherence.ENTERPRISE.STABLE": {
    metric: "narrativeCoherence",
    percentiles: { p10: 38, p25: 52, p50: 66, p75: 78, p90: 88 },
    cohortTag: "ENTERPRISE.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "interventionReadiness.ENTERPRISE.STABLE": {
    metric: "interventionReadiness",
    percentiles: { p10: 36, p25: 50, p50: 64, p75: 76, p90: 87 },
    cohortTag: "ENTERPRISE.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
  "executionReadiness.ENTERPRISE.STABLE": {
    metric: "executionReadiness",
    percentiles: { p10: 44, p25: 58, p50: 72, p75: 83, p90: 92 },
    cohortTag: "ENTERPRISE.STABLE",
    cohortSize: 0,
    dataSource: "THEORETICAL",
  },
};

// ─── In-Memory Commons Store ──────────────────────────────────────────────────
// In production this writes to the database. For now, an in-process accumulator
// that persists for the lifetime of the server process.

const _commonsStore: CommonsRecord[] = [];

// ─── Commons API ─────────────────────────────────────────────────────────────

/**
 * Records an anonymised diagnostic session into the intelligence commons.
 * Call this at the end of every completed diagnostic session.
 *
 * The sessionHash is a one-way hash — the commons cannot be used to
 * re-identify any individual client.
 */
export function recordCommonsEntry(record: Omit<CommonsRecord, "id">): CommonsRecord {
  const entry: CommonsRecord = {
    id: `commons_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ...record,
  };
  _commonsStore.push(entry);
  return entry;
}

/**
 * Returns all commons records matching optional filter criteria.
 */
export function queryCommons(filter?: {
  revenueBand?: string;
  industryTag?: string;
  orgState?: string;
  minSessionNumber?: number;
}): CommonsRecord[] {
  return _commonsStore.filter((r) => {
    if (filter?.revenueBand && r.revenueBand !== filter.revenueBand) return false;
    if (filter?.industryTag && r.industryTag !== filter.industryTag) return false;
    if (filter?.minSessionNumber !== undefined && r.sessionNumber < filter.minSessionNumber)
      return false;
    return true;
  });
}

/**
 * Calculates the percentile position of a given score within the commons dataset.
 * Falls back to bootstrap distributions when empirical data is insufficient.
 */
export function calculatePercentile(
  metric: "authorityClarity" | "narrativeCoherence" | "interventionReadiness" | "executionReadiness",
  score: number,
  cohortKey: string,
): PercentileResult {
  // Filter by the revenue band (first segment of cohortKey e.g. "SMB.SCALING")
  const revenueBandSegment = cohortKey.split(".")[0] ?? "";
  const cohortRecords = revenueBandSegment
    ? _commonsStore.filter((r) => r.revenueBand === revenueBandSegment)
    : _commonsStore.slice();

  const MIN_EMPIRICAL = 20;

  if (cohortRecords.length >= MIN_EMPIRICAL) {
    const scores = cohortRecords
      .map((r) => r[metric] as number)
      .filter((s) => typeof s === "number")
      .sort((a, b) => a - b);

    const rank = scores.filter((s) => s <= score).length;
    const percentile = Math.round((rank / scores.length) * 100);

    return {
      score,
      percentile,
      band: percentileToBand(percentile),
      cohortSize: scores.length,
      dataSource: "EMPIRICAL",
      descriptor: percentileDescriptor(metric, percentile, cohortKey),
    };
  }

  // Bootstrap fallback
  const distKey = `${metric}.${cohortKey}`;
  const dist = BOOTSTRAP_DISTRIBUTIONS[distKey];

  if (!dist) {
    // No bootstrap available — return a neutral position
    return {
      score,
      percentile: 50,
      band: "UPPER_MID",
      cohortSize: 0,
      dataSource: "THEORETICAL",
      descriptor: `Insufficient data for ${metric} benchmark in cohort ${cohortKey}.`,
    };
  }

  const percentile = interpolatePercentile(score, dist.percentiles);

  return {
    score,
    percentile,
    band: percentileToBand(percentile),
    cohortSize: dist.cohortSize,
    dataSource: "THEORETICAL",
    descriptor: percentileDescriptor(metric, percentile, cohortKey),
  };
}

function interpolatePercentile(
  score: number,
  percentiles: BenchmarkDistribution["percentiles"],
): number {
  if (score <= percentiles.p10) return Math.round((score / percentiles.p10) * 10);
  if (score <= percentiles.p25)
    return Math.round(10 + ((score - percentiles.p10) / (percentiles.p25 - percentiles.p10)) * 15);
  if (score <= percentiles.p50)
    return Math.round(25 + ((score - percentiles.p25) / (percentiles.p50 - percentiles.p25)) * 25);
  if (score <= percentiles.p75)
    return Math.round(50 + ((score - percentiles.p50) / (percentiles.p75 - percentiles.p50)) * 25);
  if (score <= percentiles.p90)
    return Math.round(75 + ((score - percentiles.p75) / (percentiles.p90 - percentiles.p75)) * 15);
  return Math.round(90 + ((score - percentiles.p90) / (100 - percentiles.p90)) * 10);
}

function percentileToBand(
  percentile: number,
): PercentileResult["band"] {
  if (percentile <= 25) return "BOTTOM_QUARTILE";
  if (percentile <= 50) return "LOWER_MID";
  if (percentile <= 75) return "UPPER_MID";
  return "TOP_QUARTILE";
}

function percentileDescriptor(metric: string, percentile: number, cohortKey: string): string {
  const metricLabels: Record<string, string> = {
    authorityClarity: "authority clarity",
    narrativeCoherence: "narrative coherence",
    interventionReadiness: "intervention readiness",
    executionReadiness: "execution readiness",
  };
  const label = metricLabels[metric] ?? metric;
  const cohortDesc = cohortKey.replace(/\./g, " ").toLowerCase();

  return `Your ${label} score places you in the ${percentile}th percentile for ${cohortDesc} organisations.`;
}

/**
 * Returns the frequency of a given signal pattern across the commons dataset.
 */
export function getPatternFrequency(
  patternId: string,
  filter?: { revenueBand?: string; industryTag?: string },
): PatternFrequency {
  const records = queryCommons(filter);

  // Bootstrap frequencies from the content framework knowledge
  const BOOTSTRAP_FREQUENCIES: Record<string, { name: string; frequency: number }> = {
    "authority-diffusion-revenue-pressure": { name: "Authority Diffusion Under Revenue Pressure", frequency: 34 },
    "narrative-coherence-collapse": { name: "Narrative Coherence Collapse", frequency: 28 },
    "execution-fragility-cascade": { name: "Execution Fragility Cascade", frequency: 12 },
    "stable-drift-false-floor": { name: "Stable Drift — False Floor Pattern", frequency: 19 },
    "second-line-drift-scaling": { name: "Second-Line Drift Under Scaling Conditions", frequency: 41 },
    "intelligence-debt-scaling": { name: "Intelligence Debt in Scaling Organisation", frequency: 37 },
    "sovereign-trajectory-signal": { name: "Sovereign Trajectory Signal", frequency: 9 },
    "authority-collapse-under-pressure": { name: "Authority Collapse Under Pressure", frequency: 8 },
    "intervention-blocked": { name: "Intervention Capacity Blocked", frequency: 22 },
    "founder-identity-operational-lock": { name: "Founder Identity Locked to Operational Role", frequency: 47 },
    "multi-session-plateau": { name: "Multi-Session Plateau — Persistent Structural Inertia", frequency: 31 },
  };

  if (records.length < 20) {
    const bootstrap = BOOTSTRAP_FREQUENCIES[patternId];
    return {
      patternId,
      patternName: bootstrap?.name ?? patternId,
      frequency: bootstrap?.frequency ?? 0,
      cohortSize: records.length,
      dataSource: records.length === 0 ? "THEORETICAL" : "HYBRID",
    };
  }

  const matching = records.filter((r) => r.activeSignalIds.includes(patternId)).length;
  return {
    patternId,
    patternName: BOOTSTRAP_FREQUENCIES[patternId]?.name ?? patternId,
    frequency: Math.round((matching / records.length) * 100),
    cohortSize: records.length,
    dataSource: "EMPIRICAL",
  };
}

/**
 * Returns the commons record count — useful for display ("drawn from N organisations").
 */
export function getCommonsSize(filter?: { revenueBand?: string; industryTag?: string }): number {
  return queryCommons(filter).length;
}

/**
 * Computes a complete benchmark report for a given score set and cohort.
 * Suitable for display in the diagnostic output.
 */
export function computeBenchmarkReport(input: {
  authorityClarity: number;
  narrativeCoherence: number;
  interventionReadiness: number;
  executionReadiness: number;
  revenueBand: string;
  orgState: string;
}): Record<string, PercentileResult> {
  const cohortKey = `${input.revenueBand}.${input.orgState}`;

  return {
    authorityClarity: calculatePercentile("authorityClarity", input.authorityClarity, cohortKey),
    narrativeCoherence: calculatePercentile("narrativeCoherence", input.narrativeCoherence, cohortKey),
    interventionReadiness: calculatePercentile(
      "interventionReadiness",
      input.interventionReadiness,
      cohortKey,
    ),
    executionReadiness: calculatePercentile(
      "executionReadiness",
      input.executionReadiness,
      cohortKey,
    ),
  };
}
