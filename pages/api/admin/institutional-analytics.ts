import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { getInstitutionalAnalyticsServer } from "@/lib/server/institutional-analytics";

/**
 * pages/api/admin/institutional-analytics.ts
 * Pages Router API endpoint for client dashboards.
 *
 * Notes:
 * - Cache disabled: analytics should reflect current filesystem/registry state.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res);
  if (!admin) return; // 401/403 already sent

  // Allow GET only
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Hard no-cache (dashboard accuracy > CDN "speed")
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const result = await getInstitutionalAnalyticsServer();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (e) {
    console.error("[API_INSTITUTIONAL_ANALYTICS_ERROR]:", e);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
