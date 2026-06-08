/**
 * lib/benchmarks/benchmark-fact-service.ts
 *
 * Benchmark Fact Service — managed interface for benchmark fact persistence.
 *
 * Provides typed methods for writing, reading, and resolving benchmark facts
 * used by the benchmark engine. Enforces anonymization before any write.
 *
 * Architecture:
 * - BenchmarkFacts are written by product surfaces after outcome is known.
 * - Each fact is keyed by a stable subjectHash (SHA-256, not reversible).
 * - No caseId, email, or actorId may appear in any BenchmarkFact.
 * - Cohort filters are dimension tags — never PII.
 * - The service layer owns the anonymization guard; the engine owns computation.
 *
 * Rules:
 * - writeFact() refuses to write if PII fields are detected in dimensions.
 * - All reads return anonymized facts only.
 * - subjectHash is the only identifier — one-way, not reversible.
 * - No fact older than FACT_TTL_DAYS is returned by getFactsForCohort.
 *
 * Prisma model (BenchmarkFact — already migrated):
 *   id             String   @id @default(cuid())
 *   subjectHash    String
 *   assessmentType String
 *   dimensions     Json
 *   metrics        Json
 *   recordedAt     DateTime @default(now())
 */

import { prisma } from "@/lib/prisma";
import type { BenchmarkFact, BenchmarkCohortFilters } from "./benchmark-engine";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Fact TTL in days — facts older than this are excluded from cohort queries. */
export const FACT_TTL_DAYS = 730; // 2 years

/** The subjectHash length (hex digits) for a SHA-256 hash */
export const SESSION_HASH_LENGTH = 64;

// ─── Write input ─────────────────────────────────────────────────────────────

export type BenchmarkFactWriteInput = {
  /**
   * Stable, one-way hash of (orgId + sessionId). Never reversible.
   * Must be a 64-character hex string (SHA-256).
   */
  sessionHash: string;
  /** Assessment kind (e.g. "FAST_DIAGNOSTIC", "TEAM_ASSESSMENT") */
  assessmentKind: string;
  /** Per-metric values for this session */
  metrics: Array<{ metric: string; value: number }>;
  /** Cohort dimension tags — no PII */
  dimensions: BenchmarkCohortFilters;
  /**
   * Must be true — enforced before write.
   * Callers must confirm no PII is in this record before setting anonymized: true.
   */
  anonymized: true;
  /** Optional ISO timestamp; defaults to now */
  recordedAt?: string;
};

// ─── Read result ──────────────────────────────────────────────────────────────

export type BenchmarkFactReadResult = {
  sessionHash: string;
  assessmentKind: string;
  metrics: Array<{ metric: string; value: number }>;
  dimensions: BenchmarkCohortFilters;
  recordedAt: string;
  anonymized: true;
};

// ─── Anonymization guard ──────────────────────────────────────────────────────

/**
 * Validates that a write input is safe for the benchmark pool.
 * Refuses any input that contains PII field names.
 */
export function validateFactAnonymization(input: BenchmarkFactWriteInput): {
  valid: boolean;
  reason?: string;
} {
  if (!input.anonymized) {
    return { valid: false, reason: "anonymized must be true" };
  }

  // Check session hash length
  if (input.sessionHash.length !== SESSION_HASH_LENGTH) {
    return {
      valid: false,
      reason: `sessionHash must be ${SESSION_HASH_LENGTH} hex characters (SHA-256). Got ${input.sessionHash.length}.`,
    };
  }

  // Check metrics are finite numbers
  for (const m of input.metrics) {
    if (!isFinite(m.value)) {
      return { valid: false, reason: `metric ${m.metric} has non-finite value: ${m.value}` };
    }
  }

  // Check dimensions don't contain known PII field names
  const piiFieldNames = ["email", "name", "userId", "caseId", "actorId", "orgName", "phone"];
  const dimensionKeys = Object.keys(input.dimensions);
  for (const key of dimensionKeys) {
    if (piiFieldNames.some((pii) => key.toLowerCase().includes(pii.toLowerCase()))) {
      return { valid: false, reason: `dimension key "${key}" may contain PII — use anonymized dimension tags only` };
    }
  }

  return { valid: true };
}

// ─── Service interface ────────────────────────────────────────────────────────

/**
 * Writes a benchmark fact to the store.
 *
 * Returns null if the fact fails validation.
 * Never throws — callers should handle null as "write skipped silently".
 */
export async function writeBenchmarkFact(
  input: BenchmarkFactWriteInput,
): Promise<{ id: string } | null> {
  const validation = validateFactAnonymization(input);
  if (!validation.valid) {
    console.warn("[BenchmarkFactService] writeFact refused:", validation.reason);
    return null;
  }

  try {
    const result = await prisma.benchmarkFact.create({
      data: {
        subjectHash: input.sessionHash,
        assessmentType: input.assessmentKind,
        metrics: input.metrics as unknown as object,
        dimensions: input.dimensions as unknown as object,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : new Date(),
      },
      select: { id: true },
    });
    return result;
  } catch (err) {
    console.warn("[BenchmarkFactService] writeFact failed:", err);
    return null;
  }
}

/**
 * Retrieves benchmark facts for a given assessment kind and optional cohort filters.
 *
 * Returns an empty array on error.
 */
export async function getFactsForCohort(
  assessmentKind: string,
  filters: Partial<BenchmarkCohortFilters> = {},
): Promise<BenchmarkFactReadResult[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FACT_TTL_DAYS);

  try {
    // Build dimension filter conditions for JSON path matching
    const dimensionConditions = Object.entries(filters)
      .filter(([, v]) => v != null)
      .map(([k, v]) => ({
        dimensions: {
          path: [k],
          equals: v,
        },
      }));

    const records = await prisma.benchmarkFact.findMany({
      where: {
        assessmentType: assessmentKind,
        recordedAt: { gte: cutoff },
        ...(dimensionConditions.length > 0 ? { AND: dimensionConditions } : {}),
      },
      select: {
        subjectHash: true,
        assessmentType: true,
        metrics: true,
        dimensions: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: "desc" },
    });

    return records.map((r) => ({
      sessionHash: r.subjectHash,
      assessmentKind: r.assessmentType,
      metrics: r.metrics as Array<{ metric: string; value: number }>,
      dimensions: r.dimensions as BenchmarkCohortFilters,
      recordedAt: r.recordedAt.toISOString(),
      anonymized: true as const,
    }));
  } catch {
    return [];
  }
}

/**
 * Returns the count of facts in the pool for a given assessment kind.
 * Used to check pool size before enabling benchmark claims.
 *
 * Returns 0 on error.
 */
export async function getFactPoolSize(assessmentKind?: string): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FACT_TTL_DAYS);

  try {
    return await prisma.benchmarkFact.count({
      where: {
        recordedAt: { gte: cutoff },
        ...(assessmentKind ? { assessmentType: assessmentKind } : {}),
      },
    });
  } catch {
    return 0;
  }
}

/**
 * Converts BenchmarkFactReadResult[] to BenchmarkFact[] for use with benchmark-engine.ts.
 */
export function readResultsToEngineFacts(
  results: BenchmarkFactReadResult[],
): BenchmarkFact[] {
  return results.map((r) => ({
    id: r.sessionHash,
    metrics: r.metrics,
    dimensions: r.dimensions as Record<string, string | number | boolean | null | undefined>,
    recordedAt: r.recordedAt,
    anonymized: true as const,
  }));
}
