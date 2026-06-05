/* pages/api/admin/system/upstash-health.ts — Upstash/Redis health check */
/* Admin-only. Returns configured/reachable/backend status. Does not expose secrets. */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getRateLimitBackendStatus } from "@/lib/server/security/rate-limit-provider";

type Response = {
  ok: boolean;
  backend: string;
  configured: boolean;
  reachable: boolean;
  fallbackReason?: string;
  redisConfigured: boolean;
  redisDisabled: boolean;
  hasRedisUrl: boolean;
  error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({
      ok: false,
      backend: "unknown",
      configured: false,
      reachable: false,
      redisConfigured: false,
      redisDisabled: false,
      hasRedisUrl: false,
      error: "ADMIN_REQUIRED",
    });
  }

  try {
    const status = await getRateLimitBackendStatus();

    return res.status(200).json({
      ok: true,
      backend: status.backend,
      configured: status.configured,
      reachable: status.reachable,
      fallbackReason: status.fallbackReason,
      redisConfigured: Boolean(process.env.REDIS_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.REDIS_HOST?.trim()),
      redisDisabled: process.env.REDIS_DISABLED === "true" || process.env.USE_REDIS === "false",
      hasRedisUrl: Boolean(process.env.REDIS_URL?.trim()),
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
      error: error instanceof Error ? error.message : "HEALTH_CHECK_FAILED",
    });
  }
}
