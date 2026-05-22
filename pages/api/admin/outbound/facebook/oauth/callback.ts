/**
 * pages/api/admin/outbound/facebook/oauth/callback.ts
 *
 * GET — Handles the Facebook OAuth redirect callback.
 * Exchanges the auth code for a long-lived Page access token,
 * encrypts it, and stores it in the database.
 *
 * Admin-only (state cookie + session validation).
 * No token value is ever returned in the response body.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { parse as parseCookies } from "cookie";

import { requireAdminApi } from "@/lib/access/server";
import {
  FACEBOOK_OAUTH_STATE_COOKIE,
  parseOAuthState,
  exchangeFacebookCodeForToken,
  getLongLivedPageToken,
  storeFacebookOAuthConnection,
} from "@/lib/outbound/facebook-oauth";
import { recordFacebookPublishingAuditSafe } from "@/lib/outbound/facebook-publishing-audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const actorId = guard.session?.user?.id ?? null;

  const { code, state, error: oauthError } = req.query as Record<string, string | undefined>;

  // ── OAuth error from Meta ─────────────────────────────────────────────────
  if (oauthError) {
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_OAUTH_FAILED",
      actorId,
    }).catch(() => null);
    return res.redirect(302, `/admin/outbound/facebook?error=oauth_denied`);
  }

  if (!code || !state) {
    return res.redirect(302, `/admin/outbound/facebook?error=oauth_missing_params`);
  }

  // ── Validate state cookie ─────────────────────────────────────────────────
  const cookies = parseCookies(req.headers.cookie ?? "");
  const storedState = cookies[FACEBOOK_OAUTH_STATE_COOKIE];

  if (!storedState || storedState !== state) {
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_OAUTH_FAILED",
      actorId,
    }).catch(() => null);
    return res.redirect(302, `/admin/outbound/facebook?error=oauth_state_mismatch`);
  }

  const parsedState = parseOAuthState(state);
  if (!parsedState) {
    return res.redirect(302, `/admin/outbound/facebook?error=oauth_state_invalid`);
  }

  const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
  if (!pageId) {
    return res.redirect(302, `/admin/outbound/facebook?error=page_id_missing`);
  }

  // ── Exchange code for short-lived token ───────────────────────────────────
  const tokenResult = await exchangeFacebookCodeForToken(code);
  if (!tokenResult) {
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_OAUTH_FAILED",
      actorId,
    }).catch(() => null);
    return res.redirect(302, `/admin/outbound/facebook?error=token_exchange_failed`);
  }

  // ── Exchange for long-lived Page token ────────────────────────────────────
  const pageResult = await getLongLivedPageToken(tokenResult.accessToken, pageId);
  if (!pageResult) {
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_OAUTH_FAILED",
      actorId,
    }).catch(() => null);
    return res.redirect(302, `/admin/outbound/facebook?error=page_token_exchange_failed`);
  }

  // ── Store encrypted connection ─────────────────────────────────────────────
  try {
    await storeFacebookOAuthConnection({
      pageId,
      pageName: pageResult.pageName,
      pageToken: pageResult.pageToken,
      userToken: tokenResult.accessToken,
      scopes: ["pages_manage_posts", "pages_read_engagement", "pages_show_list"],
      actorId,
    });
  } catch {
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_OAUTH_FAILED",
      actorId,
    }).catch(() => null);
    return res.redirect(302, `/admin/outbound/facebook?error=store_failed`);
  }

  await recordFacebookPublishingAuditSafe({
    eventType: "FACEBOOK_OAUTH_CONNECTED",
    pageId,
    actorId,
  }).catch(() => null);

  // Clear the state cookie
  res.setHeader("Set-Cookie", `${FACEBOOK_OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);

  return res.redirect(302, `${parsedState.returnTo}?connected=1`);
}
