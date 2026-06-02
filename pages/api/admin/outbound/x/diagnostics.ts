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

  return res.status(200).json({
    ok: true,
    provider: "x",
    configured: status.oauthConfigured,
    missingEnv: status.missingEnv,
    requestedScopes: status.requestedScopes,
    publishingEnabled: status.publishingEnabled,
    readiness: status.readiness,
    connected: status.connected,
    tokenRecordExists: status.state !== "not_connected",
    tokenExpired: status.state === "expired",
    canPublish: status.canPublish,
    status,
  });
}
