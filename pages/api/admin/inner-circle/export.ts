// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { exportInnerCircleAdminSummary, getPrivacySafeStats } from "@/lib/server/innerCircleMembership";

type AdminExportRow = {
  created_at: string;
  status: string;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminExportResponse = {
  ok: boolean;
  rows?: AdminExportRow[];
  stats?: Awaited<ReturnType<typeof getPrivacySafeStats>>;
  error?: string;
};

const ADMIN_API_KEY = process.env.INNER_CIRCLE_ADMIN_KEY ?? "";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (
    !ADMIN_API_KEY ||
    req.headers["x-inner-circle-admin-key"] !== ADMIN_API_KEY
  ) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  const rl = rateLimit(
    "inner-circle-admin-export",
    RATE_LIMIT_CONFIGS.INNER_CIRCLE_ADMIN_EXPORT
  );
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    res.status(429).json({ ok: false, error: "Rate limit exceeded" });
    return;
  }

  try {
    const [rows, stats] = await Promise.all([
      exportInnerCircleAdminSummary(),
      getPrivacySafeStats(),
    ]);

    res.status(200).json({
      ok: true,
      rows,
      stats,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : "Failed to export summary",
    });
  }
}
