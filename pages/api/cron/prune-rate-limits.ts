/**
 * pages/api/cron/prune-rate-limits.ts
 *
 * POST /api/cron/prune-rate-limits
 * Authorization: Bearer <CRON_SECRET>
 *
 * Deletes expired rate_limit_events rows (windowStart + windowSeconds < now).
 * Prevents unbounded table growth in the Postgres rate limiter.
 *
 * Run schedule: daily (configure in netlify.toml or external scheduler).
 * Safe to run multiple times — idempotent bulk DELETE.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { cleanupExpiredRateLimits } from "@/lib/ops/rate-limit-cleanup";

type Result = { ok: true; deleted: number } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result>,
) {
  const authHeader = req.headers.authorization;
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const deleted = await cleanupExpiredRateLimits();
  return res.status(200).json({ ok: true, deleted });
}
