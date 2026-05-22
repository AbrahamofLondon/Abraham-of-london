/**
 * pages/api/admin/outbound/x/diagnostics.ts
 *
 * GET — returns X (Twitter) connection status for the admin console.
 * Admin-only. Never returns the access token or any credential.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const status = await getXConnectionStatus();

  return res.status(200).json({ ok: true, status });
}
