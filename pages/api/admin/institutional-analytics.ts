import type { NextApiRequest, NextApiResponse } from "next";
import { getInstitutionalAnalyticsServer } from "@/lib/server/institutional-analytics";

/**
 * pages/api/admin/institutional-analytics.ts
 * Pages Router API endpoint for client dashboards.
 *
 * Notes:
 * - Add auth gating here if this is truly admin-only.
 * - Cache disabled: analytics should reflect current filesystem/registry state.
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow GET only
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // Hard no-cache (dashboard accuracy > CDN “speed”)
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    // TODO: Admin gate (examples)
    // - next-auth session check
    // - signed header / internal token
    // - role claims
    // if (!isAdmin(req)) return res.status(401).json({ success:false, error:"Unauthorized" });

    const result = await getInstitutionalAnalyticsServer();
    return res.status(result.success ? 200 : 500).json(result);
  } catch (e) {
    console.error("[API_INSTITUTIONAL_ANALYTICS_ERROR]:", e);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}