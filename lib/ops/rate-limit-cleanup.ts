/**
 * lib/ops/rate-limit-cleanup.ts
 *
 * Periodic cleanup for the RateLimitEvent table.
 * Removes rows where the window has expired (windowStart + windowSeconds < now).
 *
 * Run via cron or scheduled job daily.
 * Safe to run multiple times — idempotent.
 *
 * The index rate_limit_event_cleanup_idx on windowStart makes this efficient.
 */

import { prisma } from "@/lib/prisma.server";

/**
 * Deletes expired rate limit rows.
 * Returns the number of rows deleted.
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const now = new Date();

  // Delete rows where windowStart + windowSeconds is in the past
  // We use a raw query because Prisma doesn't support arithmetic in where clauses
  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM "rate_limit_events"
     WHERE "windowStart" + ("windowSeconds" * interval '1 second') < $1`,
    now,
  );

  return result;
}

/**
 * Returns the count of current (non-expired) rate limit rows.
 */
export async function countActiveRateLimits(): Promise<number> {
  const now = new Date();
  const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*)::bigint as count FROM "rate_limit_events"
     WHERE "windowStart" + ("windowSeconds" * interval '1 second') >= $1`,
    now,
  );
  return Number(result[0]?.count ?? 0);
}
