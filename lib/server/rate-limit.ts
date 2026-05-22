/**
 * lib/server/rate-limit.ts
 *
 * Scoped, Postgres-primary rate limiter for governance endpoints.
 *
 * Uses the RateLimitEvent table as the authoritative store. Identifiers are
 * HMAC-hashed before storage — raw IP or email is never persisted.
 *
 * Scopes map to specific product surfaces and carry their own limit configs.
 * Limits are enforced atomically via Prisma upsert + increment.
 *
 * Suggested limits (from architecture brief):
 *   PROVENANCE_DEMO_VERIFY:    10 / 60s   / IP
 *   PROVENANCE_PUBLIC_VERIFY:  20 / 60s   / IP
 *   PROVENANCE_VERIFY_CASE:    30 / 60s   / user
 *   SEND_TO_SELF:               3 / 3600s / email+IP
 *   BENCHMARK_CONTEXT:         30 / 60s   / IP
 *   OUTCOME_CONTRIBUTION:      20 / 3600s / user
 *   RETURN_BRIEF_GENERATION:    5 / 3600s / user
 *   API_V1:                  1000 / 86400s / API key
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

// ─── Scope registry ───────────────────────────────────────────────────────────

export type RateLimitScope =
  | "PROVENANCE_DEMO_VERIFY"
  | "PROVENANCE_PUBLIC_VERIFY"
  | "PROVENANCE_VERIFY_CASE"
  | "SEND_TO_SELF"
  | "BENCHMARK_CONTEXT"
  | "OUTCOME_CONTRIBUTION"
  | "RETURN_BRIEF_GENERATION"
  | "API_V1"
  | "FACEBOOK_OUTBOUND_PUBLISH";

export type RateLimitResult = {
  allowed: boolean;
  scope: RateLimitScope;
  limit: number;
  count: number;
  remaining: number;
  resetAt: string; // ISO-8601
};

// ─── Identifier hashing ───────────────────────────────────────────────────────

function hashIdentifier(identifier: string): string {
  const pepper =
    process.env.RATE_LIMIT_PEPPER ||
    process.env.ACCESS_KEY_PEPPER ||
    process.env.ANONYMITY_SALT ||
    "dev-rate-limit-pepper";
  return crypto.createHmac("sha256", pepper).update(identifier).digest("hex");
}

// ─── Window alignment ─────────────────────────────────────────────────────────

function getWindowStart(now: Date, windowSeconds: number): Date {
  const ms = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}

// ─── Core check ───────────────────────────────────────────────────────────────

export async function checkRateLimit(input: {
  scope: RateLimitScope;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = getWindowStart(now, input.windowSeconds);
  const resetAt = new Date(windowStart.getTime() + input.windowSeconds * 1000);
  const identifierHash = hashIdentifier(input.identifier);

  let count: number;
  let effectiveLimit: number;

  try {
    const row = await prisma.rateLimitEvent.upsert({
      where: {
        scope_identifier_window: {
          scope: input.scope,
          identifierHash,
          windowStart,
          windowSeconds: input.windowSeconds,
        },
      },
      create: {
        scope: input.scope,
        identifierHash,
        windowStart,
        windowSeconds: input.windowSeconds,
        count: 1,
        limit: input.limit,
      },
      update: {
        count: { increment: 1 },
        updatedAt: now,
      },
      select: { count: true, limit: true },
    });

    count = row.count;
    effectiveLimit = row.limit;
  } catch (err) {
    // Fail closed: if Postgres is unavailable, block the request
    console.error("[rate-limit] Postgres upsert failed — failing closed", err);
    return {
      allowed: false,
      scope: input.scope,
      limit: input.limit,
      count: input.limit + 1,
      remaining: 0,
      resetAt: resetAt.toISOString(),
    };
  }

  // Opportunistic cleanup: fire-and-forget, ~1% of requests
  if (Math.random() < 0.01) {
    void pruneExpiredRateLimitEvents();
  }

  const allowed = count <= effectiveLimit;

  return {
    allowed,
    scope: input.scope,
    limit: effectiveLimit,
    count,
    remaining: Math.max(effectiveLimit - count, 0),
    resetAt: resetAt.toISOString(),
  };
}

// ─── Cleanup (opportunistic + cron-safe) ─────────────────────────────────────

/**
 * Delete all rate_limit_events rows where the window has expired.
 * Window expiry = windowStart + windowSeconds seconds.
 * Safe to call concurrently; uses a single bulk DELETE.
 * Returns the number of rows deleted.
 */
export async function pruneExpiredRateLimitEvents(): Promise<number> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM rate_limit_events
      WHERE "windowStart" + ("windowSeconds" * INTERVAL '1 second') < NOW()
    `;
    return result;
  } catch (err) {
    console.error("[rate-limit] prune failed", err);
    return 0;
  }
}

// ─── Standard response headers ────────────────────────────────────────────────

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const resetEpoch = Math.ceil(new Date(result.resetAt).getTime() / 1000);
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(resetEpoch),
  };
}
