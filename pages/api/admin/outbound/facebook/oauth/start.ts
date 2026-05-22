/**
 * pages/api/admin/outbound/facebook/oauth/start.ts
 *
 * GET — Initiates the Facebook OAuth flow.
 * Admin-only. Sets a state cookie and redirects to Meta's OAuth dialog.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

import { requireAdminApi } from "@/lib/access/server";
import {
  FACEBOOK_AUTH_URL,
  FACEBOOK_OAUTH_SCOPES,
  FACEBOOK_OAUTH_STATE_COOKIE,
  generateOAuthState,
} from "@/lib/outbound/facebook-oauth";
import { recordFacebookPublishingAuditSafe } from "@/lib/outbound/facebook-publishing-audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const appId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return res.status(500).json({
      ok: false,
      error:
        "Facebook OAuth is not configured. Set FACEBOOK_APP_ID and FACEBOOK_REDIRECT_URI in environment.",
    });
  }

  const returnTo =
    typeof req.query.returnTo === "string"
      ? req.query.returnTo
      : "/admin/outbound/facebook";

  const state = generateOAuthState(returnTo);

  // Set state cookie (SameSite=Lax, HttpOnly, Secure in production)
  const isProduction = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    serialize(FACEBOOK_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 minutes
    }),
  );

  const authUrl = new URL(FACEBOOK_AUTH_URL);
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", FACEBOOK_OAUTH_SCOPES.join(","));
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("response_type", "code");

  await recordFacebookPublishingAuditSafe({
    eventType: "FACEBOOK_OAUTH_STARTED",
    actorId: guard.session?.user?.id ?? null,
  }).catch(() => null);

  return res.redirect(302, authUrl.toString());
}
