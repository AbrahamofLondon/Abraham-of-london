/**
 * pages/api/admin/outbound/facebook/diagnostics.ts
 *
 * GET — returns Facebook Page connection status for the admin console.
 * Admin-only. Never returns the access token or any credential value.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const status = await getFacebookConnectionStatus();

  return res.status(200).json({
    ok: true,
    // Explicitly omit any token field — status object never contains one
    status,
  });
}
