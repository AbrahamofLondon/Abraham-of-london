/**
 * pages/api/admin/outbound/x/oauth/callback.ts
 *
 * GET — Handles X (Twitter) OAuth 2.0 PKCE callback.
 * Exchanges code + verifier for tokens, encrypts, stores in DB.
 * Admin-only. No token value ever appears in the response body.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { parse as parseCookies } from "cookie";

import { requireAdminApi } from "@/lib/access/server";
import {
  X_OAUTH_STATE_COOKIE,
  X_PKCE_VERIFIER_COOKIE,
  parseOAuthState,
  exchangeXCodeForToken,
  fetchXUserInfo,
  storeXOAuthConnection,
} from "@/lib/outbound/x-oauth";
import { recordXPublishingAuditSafe } from "@/lib/outbound/x-publishing-audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const actorId = guard.session?.user?.id ?? null;
  const { code, state, error: oauthError } = req.query as Record<string, string | undefined>;

  if (oauthError) {
    await recordXPublishingAuditSafe({ eventType: "X_OAUTH_FAILED", actorId }).catch(() => null);
    return res.redirect(302, `/admin/outbound/x?error=oauth_denied`);
  }

  if (!code || !state) {
    return res.redirect(302, `/admin/outbound/x?error=oauth_missing_params`);
  }

  const cookies = parseCookies(req.headers.cookie ?? "");
  const storedState = cookies[X_OAUTH_STATE_COOKIE];
  const storedVerifier = cookies[X_PKCE_VERIFIER_COOKIE];

  if (!storedState || storedState !== state || !storedVerifier) {
    await recordXPublishingAuditSafe({ eventType: "X_OAUTH_FAILED", actorId }).catch(() => null);
    return res.redirect(302, `/admin/outbound/x?error=oauth_state_mismatch`);
  }

  const parsedState = parseOAuthState(state);
  if (!parsedState) {
    return res.redirect(302, `/admin/outbound/x?error=oauth_state_invalid`);
  }

  // Exchange code for tokens
  const tokenResult = await exchangeXCodeForToken(code, storedVerifier);
  if (!tokenResult) {
    await recordXPublishingAuditSafe({ eventType: "X_OAUTH_FAILED", actorId }).catch(() => null);
    return res.redirect(302, `/admin/outbound/x?error=token_exchange_failed`);
  }

  // Fetch user info
  const userInfo = await fetchXUserInfo(tokenResult.accessToken);
  if (!userInfo?.id) {
    await recordXPublishingAuditSafe({ eventType: "X_OAUTH_FAILED", actorId }).catch(() => null);
    return res.redirect(302, `/admin/outbound/x?error=user_info_failed`);
  }

  // Store encrypted connection
  try {
    await storeXOAuthConnection({
      userId: userInfo.id,
      username: userInfo.username,
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
      scopes: tokenResult.scopes,
      expiresIn: tokenResult.expiresIn,
      actorId,
    });
  } catch {
    await recordXPublishingAuditSafe({ eventType: "X_OAUTH_FAILED", actorId }).catch(() => null);
    return res.redirect(302, `/admin/outbound/x?error=store_failed`);
  }

  await recordXPublishingAuditSafe({
    eventType: "X_OAUTH_CONNECTED",
    actorId,
  }).catch(() => null);

  // Clear cookies
  res.setHeader("Set-Cookie", [
    `${X_OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Max-Age=0`,
    `${X_PKCE_VERIFIER_COOKIE}=; Path=/; HttpOnly; Max-Age=0`,
  ]);

  return res.redirect(302, `${parsedState.returnTo}?connected=1`);
}
