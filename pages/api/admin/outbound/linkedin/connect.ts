/**
 * pages/api/admin/outbound/linkedin/connect.ts
 *
 * GET /api/admin/outbound/linkedin/connect
 *
 * Initiates LinkedIn OAuth 2.0 Authorization Code flow.
 * Builds the authorization URL with required scopes and CSRF state token,
 * then redirects the admin to LinkedIn for authorization.
 *
 * Admin-only. Requires authentication.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { buildAuthorizationUrl } from "@/lib/outbound/linkedin-oauth";

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
    const { url, state } = buildAuthorizationUrl();

    // Store state in a cookie for CSRF verification on callback
    res.setHeader(
      "Set-Cookie",
      `linkedin_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/admin/outbound/linkedin/callback; Max-Age=600`,
    );

    // Redirect to LinkedIn
    res.redirect(302, url);
  } catch (error) {
    console.error("[LINKEDIN_CONNECT] Error building authorization URL:", error);
    res.status(500).json({
      ok: false,
      error: "Failed to initiate LinkedIn connection. Check LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are configured.",
    });
  }
}
