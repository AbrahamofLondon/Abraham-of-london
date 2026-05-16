/**
 * lib/product/benchmark-context-aggregate.ts
 *
 * SQL aggregate helper for the benchmark context endpoint.
 *
 * Responsibility:
 * - Define the BenchmarkAggregateRow shape (matches SQL output aliases)
 * - Normalise raw query results (bigint → number, unknown → 0)
 * - Convert aggregate row(s) into a typed BenchmarkContext
 * - Derive mostCommonTimeToAct from per-band counts
 *
 * The route layer owns SQL execution and caching.
 * This module owns computation and type safety only.
 *
 * Rules:
 * - Never receives individual contribution data (no caseId, email, actorId)
 * - Always returns sourceLabel and disclaimer
 * - Rates are null when denominator is 0
 * - Availability is BUILDING below BENCHMARK_MIN_N
 */

import {
  BENCHMARK_MIN_N,
  buildEmptyBenchmarkContext,
  type BenchmarkContext,
  type OutcomeContributionTimeToActBand,
} from "@/lib/product/outcome-contribution-contract";

// ─── Row type ─────────────────────────────────────────────────────────────────

/**
 * Shape produced by the SQL GROUP BY aggregate query.
 * Aliases match the column names in the query exactly.
 * All numeric fields may arrive as bigint from the PG driver; normalise first.
 */
export type BenchmarkAggregateRow = {
  assessmentKind: string | null;
  total: number;
  // Outcome counts
  improved: number;
  resolved: number;
  unchanged: number;
  worsened: number;
  abandoned: number;
  // Time-to-act counts
  immediate: number;
  short: number;
  medium: number;
  long: number;
  didNotAct: number;
  // Boolean signal counts
  findingAccurateTotal: number;
  findingAccurateTrue: number;
  recommendationUsefulTotal: number;
  recommendationUsefulTrue: number;
};

/** Sentinel key for the global (unfiltered) aggregate row. */
export const BENCHMARK_AGGREGATE_GLOBAL_KEY = "__ALL__";

/** Cache TTL for the materialised aggregate table, in milliseconds. */
export const BENCHMARK_AGGREGATE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalise a raw SQL query row into a typed BenchmarkAggregateRow.
 * Handles bigint, number, string → number coercion safely.
 */
export function normaliseAggregateRow(
  raw: Record<string, unknown>,
): BenchmarkAggregateRow {
  function n(v: unknown): number {
    if (typeof v === "bigint") return Number(v);
    if (typeof v === "number") return isFinite(v) ? v : 0;
    if (typeof v === "string") return parseInt(v, 10) || 0;
    return 0;
  }

  return {
    assessmentKind: typeof raw.assessmentKind === "string" ? raw.assessmentKind : null,
    total:                    n(raw.total),
    improved:                 n(raw.improved),
    resolved:                 n(raw.resolved),
    unchanged:                n(raw.unchanged),
    worsened:                 n(raw.worsened),
    abandoned:                n(raw.abandoned),
    immediate:                n(raw.immediate),
    short:                    n(raw.short),
    medium:                   n(raw.medium),
    long:                     n(raw.long),
    didNotAct:                n(raw.didNotAct),
    findingAccurateTotal:     n(raw.findingAccurateTotal),
    findingAccurateTrue:      n(raw.findingAccurateTrue),
    recommendationUsefulTotal: n(raw.recommendationUsefulTotal),
    recommendationUsefulTrue:  n(raw.recommendationUsefulTrue),
  };
}

// ─── Computation ──────────────────────────────────────────────────────────────

function safePercent(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((numerator / denominator) * 100);
}

/**
 * Derive the most-common time-to-act band from per-band counts.
 * Returns null when all counts are zero.
 */
function mostCommonBand(row: BenchmarkAggregateRow): OutcomeContributionTimeToActBand | null {
  const bands: [OutcomeContributionTimeToActBand, number][] = [
    ["IMMEDIATE",  row.immediate],
    ["SHORT",      row.short],
    ["MEDIUM",     row.medium],
    ["LONG",       row.long],
    ["DID_NOT_ACT", row.didNotAct],
  ];

  let best: OutcomeContributionTimeToActBand | null = null;
  let bestCount = 0;
  for (const [band, count] of bands) {
    if (count > bestCount) {
      bestCount = count;
      best = band;
    }
  }
  return best;
}

/**
 * Merge multiple aggregate rows into one (used when the SQL returns per-kind rows
 * but we need the global total).
 */
export function mergeAggregateRows(rows: BenchmarkAggregateRow[]): BenchmarkAggregateRow {
  return rows.reduce<BenchmarkAggregateRow>(
    (acc, row) => ({
      assessmentKind:           null,
      total:                    acc.total + row.total,
      improved:                 acc.improved + row.improved,
      resolved:                 acc.resolved + row.resolved,
      unchanged:                acc.unchanged + row.unchanged,
      worsened:                 acc.worsened + row.worsened,
      abandoned:                acc.abandoned + row.abandoned,
      immediate:                acc.immediate + row.immediate,
      short:                    acc.short + row.short,
      medium:                   acc.medium + row.medium,
      long:                     acc.long + row.long,
      didNotAct:                acc.didNotAct + row.didNotAct,
      findingAccurateTotal:     acc.findingAccurateTotal + row.findingAccurateTotal,
      findingAccurateTrue:      acc.findingAccurateTrue + row.findingAccurateTrue,
      recommendationUsefulTotal: acc.recommendationUsefulTotal + row.recommendationUsefulTotal,
      recommendationUsefulTrue:  acc.recommendationUsefulTrue + row.recommendationUsefulTrue,
    }),
    {
      assessmentKind: null,
      total: 0, improved: 0, resolved: 0, unchanged: 0, worsened: 0, abandoned: 0,
      immediate: 0, short: 0, medium: 0, long: 0, didNotAct: 0,
      findingAccurateTotal: 0, findingAccurateTrue: 0,
      recommendationUsefulTotal: 0, recommendationUsefulTrue: 0,
    },
  );
}

/**
 * Build a BenchmarkContext from a single aggregate row.
 *
 * This is the pure computation step — no DB access, no caching.
 * Returns the same BenchmarkContext shape used by BenchmarkContextPanel.
 */
export function aggregateRowToBenchmarkContext(row: BenchmarkAggregateRow): BenchmarkContext {
  const { total } = row;

  if (total <= 0) {
    return buildEmptyBenchmarkContext("NO_DATA", 0);
  }

  if (total < BENCHMARK_MIN_N) {
    return buildEmptyBenchmarkContext("BUILDING", total);
  }

  const improvementRate = safePercent(row.improved + row.resolved, total);
  const findingAccuracyRate = safePercent(row.findingAccurateTrue, row.findingAccurateTotal);
  const recommendationUsefulRate = safePercent(row.recommendationUsefulTrue, row.recommendationUsefulTotal);

  return {
    availability: "AVAILABLE",
    n: total,
    improvementRate,
    findingAccuracyRate,
    recommendationUsefulRate,
    mostCommonTimeToAct: mostCommonBand(row),
    sourceLabel: `Based on ${total} governed case${total === 1 ? "" : "s"} with opted-in outcome contributions.`,
    disclaimer:
      "Outcomes are self-reported by users at the time of contribution. The system does not independently verify. Not a guarantee of results.",
  };
}

/**
 * Convert a BenchmarkAggregate Prisma record to BenchmarkAggregateRow.
 * The Prisma model uses the same field names.
 */
export function prismaRecordToAggregateRow(
  record: {
    assessmentKind: string | null;
    n: number; improved: number; resolved: number; unchanged: number;
    worsened: number; abandoned: number;
    timeImmediate: number; timeShort: number; timeMedium: number;
    timeLong: number; timeDidNotAct: number;
    findingAccurateTotal: number; findingAccurateTrue: number;
    recommendationUsefulTotal: number; recommendationUsefulTrue: number;
  },
): BenchmarkAggregateRow {
  return {
    assessmentKind:           record.assessmentKind,
    total:                    record.n,
    improved:                 record.improved,
    resolved:                 record.resolved,
    unchanged:                record.unchanged,
    worsened:                 record.worsened,
    abandoned:                record.abandoned,
    immediate:                record.timeImmediate,
    short:                    record.timeShort,
    medium:                   record.timeMedium,
    long:                     record.timeLong,
    didNotAct:                record.timeDidNotAct,
    findingAccurateTotal:     record.findingAccurateTotal,
    findingAccurateTrue:      record.findingAccurateTrue,
    recommendationUsefulTotal: record.recommendationUsefulTotal,
    recommendationUsefulTrue:  record.recommendationUsefulTrue,
  };
}

/**
 * Convert a BenchmarkAggregateRow to the shape used for Prisma upsert data.
 */
export function aggregateRowToPrismaData(
  row: BenchmarkAggregateRow,
  key: string,
): {
  key: string;
  assessmentKind: string | null;
  n: number; improved: number; resolved: number; unchanged: number;
  worsened: number; abandoned: number;
  timeImmediate: number; timeShort: number; timeMedium: number;
  timeLong: number; timeDidNotAct: number;
  findingAccurateTotal: number; findingAccurateTrue: number;
  recommendationUsefulTotal: number; recommendationUsefulTrue: number;
  computedAt: Date;
} {
  return {
    key,
    assessmentKind:           row.assessmentKind,
    n:                        row.total,
    improved:                 row.improved,
    resolved:                 row.resolved,
    unchanged:                row.unchanged,
    worsened:                 row.worsened,
    abandoned:                row.abandoned,
    timeImmediate:            row.immediate,
    timeShort:                row.short,
    timeMedium:               row.medium,
    timeLong:                 row.long,
    timeDidNotAct:            row.didNotAct,
    findingAccurateTotal:     row.findingAccurateTotal,
    findingAccurateTrue:      row.findingAccurateTrue,
    recommendationUsefulTotal: row.recommendationUsefulTotal,
    recommendationUsefulTrue:  row.recommendationUsefulTrue,
    computedAt:               new Date(),
  };
}
