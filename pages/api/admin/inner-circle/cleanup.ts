// pages/api/admin/inner-circle/cleanup.ts
import type { NextApiRequest, NextApiResponse } from "next";

import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { getInnerCircleStore } from "@/lib/server/innerCircleStore";

type CleanupResponse = {
  ok: boolean;
  deletedMembers?: number;
  deletedKeys?: number;
  stats?: any;
  error?: string;
};

/** Admin auth key */
const ADMIN_API_KEY = process.env.INNER_CIRCLE_ADMIN_KEY ?? "";

/** Small helper */
function logCleanup(
  action: string,
  metadata: Record<string, unknown> = {}
): void {
  console.log(`🧹 Inner Circle Cleanup: ${action}`, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

/**
 * Safely resolve the cleanup rate-limit config.
 * Ensures TS never fails even if configs evolve.
 */
const CLEANUP_RATE_LIMIT =
  (RATE_LIMIT_CONFIGS as Record<string, any>)["INNER_CIRCLE_ADMIN_CLEANUP"] ??
  RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Admin authentication
  if (
    !ADMIN_API_KEY ||
    req.headers["x-inner-circle-admin-key"] !== ADMIN_API_KEY
  ) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Rate limiting
  const rl = rateLimit("inner-circle-admin-cleanup", CLEANUP_RATE_LIMIT);
  const rlHeaders = createRateLimitHeaders(rl);

  for (const [k, v] of Object.entries(rlHeaders)) {
    res.setHeader(k, v);
  }

  if (!rl.allowed) {
    res.status(429).json({ ok: false, error: "Rate limit exceeded" });
    return;
  }

  try {
    const store = getInnerCircleStore();

    const [result, stats] = await Promise.all([
      store.cleanupOldData(),
      store.getPrivacySafeStats(),
    ]);

    logCleanup("success", {
      deletedMembers: result.deletedMembers,
      deletedKeys: result.deletedKeys,
      totalMembers: stats.totalMembers,
      activeMembers: stats.activeMembers,
    });

    res.status(200).json({
      ok: true,
      deletedMembers: result.deletedMembers,
      deletedKeys: result.deletedKeys,
      stats,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Cleanup failed";

    logCleanup("error", { error: errorMessage });

    if (
      errorMessage.includes("database") ||
      errorMessage.includes("connection")
    ) {
      res.status(503).json({
        ok: false,
        error: "Database temporarily unavailable. Please try again later.",
      });
    } else {
      res.status(500).json({ ok: false, error: errorMessage });
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};