/**
 * lib/research/performance-range-service.ts
 *
 * Pure business logic for Performance Range benchmarks.
 * Extracted for testability — no auth, no DB, no side effects.
 *
 * Rules (enforced here, not in the route):
 *   - Max 25 iterations
 *   - Max 10 seconds total
 *   - Timeout risk flagged when maxMs > 2000ms
 *   - Non-callable engine must be rejected by the caller before invoking runBenchmark()
 */

export const MAX_ITERATIONS = 25;
export const MAX_TOTAL_MS = 10_000;
export const TIMEOUT_RISK_THRESHOLD_MS = 2_000;

export type PerformanceStats = {
  minMs: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  totalMs: number;
  completedIterations: number;
  timeoutRisk: boolean;
};

/**
 * Clamp an iteration count to the allowed range [1, MAX_ITERATIONS].
 * Always enforced server-side regardless of client input.
 */
export function clampIterations(requested: number): number {
  const n = Math.round(Number(requested));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_ITERATIONS);
}

/**
 * Compute performance statistics from a list of timing observations.
 * Returns clamped, rounded values suitable for display and ResearchRun capture.
 */
export function computeStats(timings: number[]): PerformanceStats {
  if (timings.length === 0) {
    return { minMs: 0, avgMs: 0, p95Ms: 0, maxMs: 0, totalMs: 0, completedIterations: 0, timeoutRisk: false };
  }

  const sorted = [...timings].sort((a, b) => a - b);
  const totalMs = timings.reduce((sum, t) => sum + t, 0);
  const minMs = sorted[0]!;
  const maxMs = sorted[sorted.length - 1]!;
  const avgMs = totalMs / sorted.length;
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  const p95Ms = sorted[p95Index]!;

  return {
    minMs: round1(minMs),
    avgMs: round1(avgMs),
    p95Ms: round1(p95Ms),
    maxMs: round1(maxMs),
    totalMs: Math.round(totalMs),
    completedIterations: timings.length,
    timeoutRisk: maxMs > TIMEOUT_RISK_THRESHOLD_MS,
  };
}

/**
 * Run an engine adapter repeatedly, collecting timings.
 * Enforces MAX_ITERATIONS and MAX_TOTAL_MS hard stops.
 * Returns timings and whether the time cap was hit.
 */
export async function collectTimings(
  runFn: (payload: Record<string, unknown>) => Promise<unknown>,
  fixture: Record<string, unknown>,
  iterations: number,
): Promise<{ timings: number[]; hitTimeCap: boolean }> {
  const clamped = clampIterations(iterations);
  const timings: number[] = [];
  let elapsed = 0;

  for (let i = 0; i < clamped; i++) {
    const start = Date.now();
    await runFn(fixture);
    const iterMs = Date.now() - start;
    timings.push(iterMs);
    elapsed += iterMs;
    if (elapsed >= MAX_TOTAL_MS) {
      return { timings, hitTimeCap: true };
    }
  }

  return { timings, hitTimeCap: false };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
