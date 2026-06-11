/* pages/api/admin/system/upstash-health.ts — Upstash/Redis health check */
/* Admin-only. Returns configured/reachable/backend status. Does not expose secrets. */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { checkCanonicalRedisHealth } from "@/lib/redis-health";

type Response = {
  ok: boolean;
  backend: string;
  configured: boolean;
  reachable: boolean;
  fallbackReason?: string;
  clientMode?: string;
  redisConfigured: boolean;
  redisDisabled: boolean;
  hasRedisUrl: boolean;
  hasUpstashUrl: boolean;
  hasUpstashToken: boolean;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const session = await requireAdminServer(req, res, { routeKey: "admin-system-upstash-health" });
  if (!session) return;

  try {
    const status = await checkCanonicalRedisHealth();
    const hasRedisUrl = Boolean(process.env.REDIS_URL?.trim());
    const hasUpstashUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim());
    const hasUpstashToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

    return res.status(200).json({
      ok: true,
      backend: status.clientMode,
      clientMode: status.clientMode,
      configured: status.configured,
      reachable: status.ok,
      fallbackReason: status.ok ? undefined : status.message,
      redisConfigured: Boolean(hasRedisUrl || hasUpstashUrl || process.env.REDIS_HOST?.trim()),
      redisDisabled: process.env.REDIS_DISABLED === "true" || process.env.USE_REDIS === "false",
      hasRedisUrl,
      hasUpstashUrl,
      hasUpstashToken,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      backend: "error",
      configured: false,
      reachable: false,
      redisConfigured: false,
      redisDisabled: false,
      hasRedisUrl: false,
      hasUpstashUrl: false,
      hasUpstashToken: false,
      error: error instanceof Error ? error.message : "HEALTH_CHECK_FAILED",
    });
  }
}
