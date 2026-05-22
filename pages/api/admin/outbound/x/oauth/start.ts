/**
 * pages/api/admin/outbound/x/oauth/start.ts
 *
 * GET — Initiates X (Twitter) OAuth 2.0 PKCE flow.
 * Admin-only. Generates verifier + challenge, sets cookies, redirects to X.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

import { requireAdminApi } from "@/lib/access/server";
import {
  X_OAUTH_STATE_COOKIE,
  X_PKCE_VERIFIER_COOKIE,
  generateOAuthState,
  generatePKCEVerifier,
  derivePKCEChallenge,
  buildXAuthUrl,
} from "@/lib/outbound/x-oauth";
import { recordXPublishingAuditSafe } from "@/lib/outbound/x-publishing-audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const clientId = process.env.X_CLIENT_ID;
  const redirectUri = process.env.X_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      ok: false,
      error:
        "X OAuth is not configured. Set X_CLIENT_ID and X_REDIRECT_URI in environment.",
    });
  }

  const returnTo =
    typeof req.query.returnTo === "string"
      ? req.query.returnTo
      : "/admin/outbound/x";

  const state = generateOAuthState(returnTo);
  const verifier = generatePKCEVerifier();
  const challenge = derivePKCEChallenge(verifier);

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600, // 10 minutes
  };

  res.setHeader("Set-Cookie", [
    serialize(X_OAUTH_STATE_COOKIE, state, cookieOptions),
    serialize(X_PKCE_VERIFIER_COOKIE, verifier, cookieOptions),
  ]);

  await recordXPublishingAuditSafe({
    eventType: "X_OAUTH_STARTED",
    actorId: guard.session?.user?.id ?? null,
  }).catch(() => null);

  const authUrl = buildXAuthUrl({ state, codeChallenge: challenge });
  return res.redirect(302, authUrl);
}
