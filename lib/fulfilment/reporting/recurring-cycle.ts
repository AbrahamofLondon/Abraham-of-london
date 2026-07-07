/**
 * lib/fulfilment/reporting/recurring-cycle.ts
 *
 * Pure derivation of recurring reporting cycles (no I/O). Deterministic so the
 * due-state, missed-cycle, and continuity behaviour can be proven without a clock
 * or a database.
 */

import type { ReportingCadence, ReportingCycle } from "./reporting-cycle-types";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** First day of the month containing `date`, as YYYY-MM-01. */
export function monthStart(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-01`;
}

/** Last day of the month for a YYYY-MM-01 period start. */
export function monthEnd(periodStart: string): string {
  const [y, m] = periodStart.split("-").map(Number);
  const last = new Date(Date.UTC(y!, m!, 0)).getUTCDate(); // day 0 of next month = last of this
  return `${y}-${pad2(m!)}-${pad2(last)}`;
}

export function periodLabel(periodStart: string): string {
  return periodStart.slice(0, 7); // YYYY-MM
}

export function deriveCycleId(productCode: string, periodStart: string): string {
  return `${productCode}:${periodLabel(periodStart)}`;
}

/** The period start for the month immediately after `periodStart`. */
export function nextPeriodStart(periodStart: string): string {
  const [y, m] = periodStart.split("-").map(Number);
  const d = new Date(Date.UTC(y!, m! - 1, 1));
  d.setUTCMonth(d.getUTCMonth() + 1);
  return monthStart(d);
}

/**
 * Is the cycle for `periodStart` due as of `now`?
 * A monthly cycle becomes due once its period has begun (>= periodStart).
 */
export function isCycleDue(periodStart: string, now: Date, cadence: ReportingCadence = "monthly"): boolean {
  void cadence;
  return now.getTime() >= new Date(`${periodStart}T00:00:00Z`).getTime();
}

/**
 * Given the anchor (first cycle period), current time, and existing cycles,
 * return the period starts that are DUE but have no cycle record yet.
 */
export function deriveDueCyclePeriods(
  anchorPeriodStart: string,
  now: Date,
  existing: ReportingCycle[],
): string[] {
  const known = new Set(existing.map((c) => c.periodLabel));
  const due: string[] = [];
  let period = anchorPeriodStart;
  // Walk months from anchor up to the current month.
  const guard = 240; // 20 years — safety
  for (let i = 0; i < guard; i++) {
    if (!isCycleDue(period, now)) break;
    if (!known.has(periodLabel(period))) due.push(period);
    period = nextPeriodStart(period);
  }
  return due;
}

/**
 * Missed cycles: periods whose month has fully ended (now > periodEnd) but which
 * never reached DELIVERED/ARCHIVED. Surfaces operator-visible gaps.
 */
export function detectMissedCycles(cycles: ReportingCycle[], now: Date): ReportingCycle[] {
  return cycles.filter((c) => {
    const ended = now.getTime() > new Date(`${c.periodEnd}T23:59:59Z`).getTime();
    const done = c.state === "DELIVERED" || c.state === "ARCHIVED";
    return ended && !done;
  });
}
