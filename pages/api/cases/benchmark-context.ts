/**
 * pages/api/cases/benchmark-context.ts
 *
 * GET /api/cases/benchmark-context
 *
 * Public endpoint. Returns aggregate benchmark context derived from
 * anonymised opt-in outcome contributions.
 *
 * No individual contribution data, case ID, user email, raw decision text,
 * actor ID, private note, or evidence content is exposed in this response.
 *
 * Architecture:
 * 1. Check BenchmarkAggregate (materialised cache) for a fresh row
 *    (computedAt within BENCHMARK_AGGREGATE_TTL_MS = 1 hour).
 * 2. Cache hit: convert stored row to BenchmarkContext and return.
 * 3. Cache miss / stale: run SQL GROUP BY aggregate over AuditEvent,
 *    upsert result into BenchmarkAggregate, return computed context.
 *
 * The SQL query uses the partial index on AuditEvent for efficiency:
 *   idx_audit_event_outcome_contribution_benchmark
 *
 * HTTP cache: public, max-age=3600, stale-while-revalidate=86400
 * Vary: by assessmentKind query param
 *
 * Query params:
 *   assessmentKind — optional: filter to a specific assessment kind.
 *                    Validated against /^[A-Z0-9_:-]{2,80}$/ — invalid values
 *                    are treated as absent (no filter), never interpolated raw.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { BenchmarkContext } from "@/lib/product/outcome-contribution-contract";
import {
  normaliseAggregateRow,
  aggregateRowToBenchmarkContext,
  aggregateRowToPrismaData,
  prismaRecordToAggregateRow,
  mergeAggregateRows,
  BENCHMARK_AGGREGATE_GLOBAL_KEY,
  BENCHMARK_AGGREGATE_TTL_MS,
  type BenchmarkAggregateRow,
} from "@/lib/product/benchmark-context-aggregate";
import { createId } from "@paralleldrive/cuid2";

// ─── Types ────────────────────────────────────────────────────────────────────

type ErrorResponse = { error: string };

export type BenchmarkContextApiResponse = {
  ok: true;
  generatedAt: string;
  filter: { assessmentKind: string | null };
  benchmark: BenchmarkContext;
};

// ─── Input sanitisation ───────────────────────────────────────────────────────

const VALID_KIND_RE = /^[A-Z0-9_:-]{2,80}$/;

function sanitiseAssessmentKind(raw: string | string[] | undefined): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const trimmed = raw.trim();
  return VALID_KIND_RE.test(trimmed) ? trimmed : null;
}

// ─── Cache key ────────────────────────────────────────────────────────────────

function cacheKey(assessmentKind: string | null): string {
  return assessmentKind ?? BENCHMARK_AGGREGATE_GLOBAL_KEY;
}

function isFresh(computedAt: Date): boolean {
  return Date.now() - computedAt.getTime() < BENCHMARK_AGGREGATE_TTL_MS;
}

// ─── SQL aggregate query ──────────────────────────────────────────────────────

/**
 * Run the GROUP BY aggregate over AuditEvent.
 * Returns one row per assessmentKind (or one row when filtered).
 * Never returns raw contribution fields — only aggregate counts.
 */
async function runSqlAggregate(
  assessmentKind: string | null,
): Promise<BenchmarkAggregateRow[]> {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>(
    Prisma.sql`
      SELECT
        (metadata->>'assessmentKind')::text              AS "assessmentKind",
        COUNT(*)::int                                    AS "total",

        SUM(CASE WHEN metadata->>'outcomeState' = 'IMPROVED'  THEN 1 ELSE 0 END)::int AS "improved",
        SUM(CASE WHEN metadata->>'outcomeState' = 'RESOLVED'  THEN 1 ELSE 0 END)::int AS "resolved",
        SUM(CASE WHEN metadata->>'outcomeState' = 'UNCHANGED' THEN 1 ELSE 0 END)::int AS "unchanged",
        SUM(CASE WHEN metadata->>'outcomeState' = 'WORSENED'  THEN 1 ELSE 0 END)::int AS "worsened",
        SUM(CASE WHEN metadata->>'outcomeState' = 'ABANDONED' THEN 1 ELSE 0 END)::int AS "abandoned",

        SUM(CASE WHEN metadata->>'timeToAct' = 'IMMEDIATE'   THEN 1 ELSE 0 END)::int AS "immediate",
        SUM(CASE WHEN metadata->>'timeToAct' = 'SHORT'        THEN 1 ELSE 0 END)::int AS "short",
        SUM(CASE WHEN metadata->>'timeToAct' = 'MEDIUM'       THEN 1 ELSE 0 END)::int AS "medium",
        SUM(CASE WHEN metadata->>'timeToAct' = 'LONG'         THEN 1 ELSE 0 END)::int AS "long",
        SUM(CASE WHEN metadata->>'timeToAct' = 'DID_NOT_ACT'  THEN 1 ELSE 0 END)::int AS "didNotAct",

        SUM(CASE WHEN metadata ? 'findingAccurate'        THEN 1 ELSE 0 END)::int AS "findingAccurateTotal",
        SUM(CASE WHEN metadata->>'findingAccurate' = 'true' THEN 1 ELSE 0 END)::int AS "findingAccurateTrue",

        SUM(CASE WHEN metadata ? 'recommendationUseful'          THEN 1 ELSE 0 END)::int AS "recommendationUsefulTotal",
        SUM(CASE WHEN metadata->>'recommendationUseful' = 'true' THEN 1 ELSE 0 END)::int AS "recommendationUsefulTrue"

      FROM "AuditEvent"

      WHERE "objectType" = 'OUTCOME_CONTRIBUTION'
        AND "actionType" = 'CONTRIBUTED'
        AND COALESCE((metadata->>'retracted')::boolean, false) = false
        AND (
          ${assessmentKind}::text IS NULL
          OR metadata->>'assessmentKind' = ${assessmentKind}
        )

      GROUP BY (metadata->>'assessmentKind')::text
      ORDER BY "assessmentKind" ASC NULLS LAST
    `,
  );

  return rows.map((r) => normaliseAggregateRow(r as Record<string, unknown>));
}

// ─── Materialised cache upsert ────────────────────────────────────────────────

async function upsertAggregate(
  key: string,
  row: BenchmarkAggregateRow,
): Promise<void> {
  const data = aggregateRowToPrismaData(row, key);
  await prisma.benchmarkAggregate.upsert({
    where: { key },
    create: { id: createId(), ...data },
    update: data,
  });
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<BenchmarkContextApiResponse | ErrorResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const assessmentKind = sanitiseAssessmentKind(req.query.assessmentKind);
  const key = cacheKey(assessmentKind);

  try {
    // ── 1. Try materialised cache ─────────────────────────────────────────
    const cached = await prisma.benchmarkAggregate.findUnique({
      where: { key },
    });

    if (cached && isFresh(cached.computedAt)) {
      const row = prismaRecordToAggregateRow(cached);
      const benchmark = aggregateRowToBenchmarkContext(row);

      res.setHeader(
        "Cache-Control",
        "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      );
      res.setHeader("Vary", "assessmentKind");
      return res.status(200).json({
        ok: true,
        generatedAt: cached.computedAt.toISOString(),
        filter: { assessmentKind },
        benchmark,
      });
    }

    // ── 2. Cache miss / stale — run SQL aggregate ─────────────────────────
    const aggregateRows = await runSqlAggregate(assessmentKind);

    // Merge rows into a single aggregate (SQL returns one per kind)
    const merged =
      aggregateRows.length === 0
        ? ({
            assessmentKind: null,
            total: 0, improved: 0, resolved: 0, unchanged: 0, worsened: 0, abandoned: 0,
            immediate: 0, short: 0, medium: 0, long: 0, didNotAct: 0,
            findingAccurateTotal: 0, findingAccurateTrue: 0,
            recommendationUsefulTotal: 0, recommendationUsefulTrue: 0,
          } satisfies BenchmarkAggregateRow)
        : mergeAggregateRows(aggregateRows);

    // Override assessmentKind on the merged row for correct storage
    const rowToStore: BenchmarkAggregateRow = {
      ...merged,
      assessmentKind: assessmentKind,
    };

    // Upsert into materialised table (fire-and-forget — don't block response)
    void upsertAggregate(key, rowToStore).catch((err) => {
      console.error("[benchmark-context] upsert failed (non-fatal):", err);
    });

    const benchmark = aggregateRowToBenchmarkContext(merged);

    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    );
    res.setHeader("Vary", "assessmentKind");
    return res.status(200).json({
      ok: true,
      generatedAt: new Date().toISOString(),
      filter: { assessmentKind },
      benchmark,
    });
  } catch (err) {
    console.error("[benchmark-context]", err);
    return res.status(500).json({ error: "Failed to compute benchmark context" });
  }
}

export const config = {
  api: { bodyParser: false },
};
