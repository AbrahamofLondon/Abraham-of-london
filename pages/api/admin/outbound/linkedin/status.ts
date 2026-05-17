/**
 * pages/api/admin/outbound/linkedin/status.ts
 *
 * GET /api/admin/outbound/linkedin/status
 *
 * Returns the current LinkedIn connection status.
 * Never returns token values.
 *
 * Admin-only. Requires authentication.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getConnectionStatus } from "@/lib/outbound/linkedin-oauth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  try {
    const status = await getConnectionStatus();

    return res.status(200).json({
      ok: true,
      ...status,
    });
  } catch (error) {
    console.error("[LINKEDIN_STATUS] Error:", error);
    return res.status(500).json({
      ok: false,
      connected: false,
      organisationId: null,
      scopes: [],
      expiresAt: null,
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      message: "Error checking LinkedIn connection status.",
    });
  }
}
