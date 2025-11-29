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

const ADMIN_API_KEY = process.env.INNER_CIRCLE_ADMIN_KEY ?? "";

function logCleanup(action: string, metadata: Record<string, unknown> = {}): void {
  console.log(`🧹 Inner Circle Cleanup: ${action}`, {
    timestamp: new Date().toISOString(),
    ...metadata,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CleanupResponse>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!ADMIN_API_KEY || req.headers["x-inner-circle-admin-key"] !== ADMIN_API_KEY) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Rate limiting
  const rl = rateLimit(
    "inner-circle-admin-cleanup",
    RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_CLEANUP ??
      RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT,
  );
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    res.status(429).json({ ok: false, error: "Rate limit exceeded" });
    return;
  }

  try {
    // Use the server store directly
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
    const errorMessage = err instanceof Error ? err.message : "Cleanup failed";
    
    logCleanup("error", {
      error: errorMessage,
    });

    if (errorMessage.includes('database') || errorMessage.includes('connection')) {
      res.status(503).json({
        ok: false,
        error: "Database temporarily unavailable. Please try again later.",
      });
    } else {
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};