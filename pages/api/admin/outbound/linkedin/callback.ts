/**
 * pages/api/admin/outbound/linkedin/callback.ts
 *
 * GET /api/admin/outbound/linkedin/callback
 *
 * LinkedIn OAuth 2.0 callback endpoint.
 * - Verifies CSRF state token
 * - Exchanges authorization code for access token
 * - Stores encrypted token in database
 * - Redirects back to the outbound dashboard
 *
 * Admin-only. Requires authentication.
 * Never exposes tokens to the client or in logs.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { exchangeCodeForToken } from "@/lib/outbound/linkedin-oauth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const { code, state, error: oauthError } = req.query;

  // Handle LinkedIn authorization denial
  if (oauthError) {
    console.error("[LINKEDIN_CALLBACK] LinkedIn authorization denied:", oauthError);
    return res.redirect(
      302,
      `/outbound/linkedin?connection=denied&error=${encodeURIComponent(String(oauthError))}`,
    );
  }

  // Verify authorization code
  if (!code || typeof code !== "string") {
    return res.redirect(
      302,
      "/outbound/linkedin?connection=error&error=Missing+authorization+code",
    );
  }

  // Verify CSRF state token
  const storedState = req.cookies?.linkedin_oauth_state;
  if (!storedState) {
    return res.redirect(
      302,
      "/outbound/linkedin?connection=error&error=Missing+CSRF+state+token.+Try+again.",
    );
  }

  if (state !== storedState) {
    return res.redirect(
      302,
      "/outbound/linkedin?connection=error&error=CSRF+state+mismatch.+Try+again.",
    );
  }

  // Clear the state cookie
  res.setHeader(
    "Set-Cookie",
    `linkedin_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/api/admin/outbound/linkedin/callback; Max-Age=0`,
  );

  try {
    const userId = guard.session?.user?.id || undefined;
    const result = await exchangeCodeForToken(code, userId);

    if (!result.ok) {
      console.error("[LINKEDIN_CALLBACK] Token exchange failed:", result.error);
      return res.redirect(
        302,
        `/outbound/linkedin?connection=error&error=${encodeURIComponent(result.error || "Token+exchange+failed")}`,
      );
    }

    return res.redirect(
      302,
      "/outbound/linkedin?connection=success",
    );
  } catch (error) {
    console.error("[LINKEDIN_CALLBACK] Unexpected error:", error);
    return res.redirect(
      302,
      "/outbound/linkedin?connection=error&error=Unexpected+error",
    );
  }
}
