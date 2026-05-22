/**
 * lib/outbound/facebook-oauth.ts
 *
 * Facebook OAuth connection management.
 *
 * Supports two modes:
 *   1. ENV_TOKEN — long-lived Page access token from FACEBOOK_PAGE_ACCESS_TOKEN.
 *      Useful for immediate use before OAuth flow is deployed.
 *      Console shows a clear "OAuth connection pending" warning.
 *   2. OAUTH — full OAuth flow with encrypted token stored in DB.
 *      Preferred production path.
 *
 * The token is NEVER returned to the client. All credential operations
 * are server-only.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import {
  encryptFacebookToken,
  decryptFacebookToken,
} from "./facebook-token-encryption";
import {
  FACEBOOK_REQUIRED_PERMISSIONS,
  type FacebookConnectionStatus,
  type FacebookConnectionState,
} from "./facebook-types";

// ─── Meta Graph API constants ─────────────────────────────────────────────────

export const FB_GRAPH_BASE = "https://graph.facebook.com/v22.0";
export const FACEBOOK_AUTH_URL = "https://www.facebook.com/v22.0/dialog/oauth";
export const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v22.0/oauth/access_token";

export const FACEBOOK_OAUTH_STATE_COOKIE = "facebook_oauth_state";
export const FACEBOOK_OAUTH_SCOPES = [
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_show_list",
];

// ─── State cookie helpers ─────────────────────────────────────────────────────

export function generateOAuthState(returnTo?: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ nonce, returnTo: returnTo ?? "/admin/outbound/facebook" });
  return Buffer.from(payload).toString("base64url");
}

export function parseOAuthState(raw: string): {
  nonce: string;
  returnTo: string;
} | null {
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as { nonce?: string; returnTo?: string };
    if (!parsed.nonce) return null;
    const returnTo = parsed.returnTo ?? "/admin/outbound/facebook";
    // Guard returnTo to only admin paths
    const safeReturnTo = returnTo.startsWith("/admin/") ? returnTo : "/admin/outbound/facebook";
    return { nonce: parsed.nonce, returnTo: safeReturnTo };
  } catch {
    return null;
  }
}

// ─── Token resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the active Page access token.
 * Returns null if no token is available.
 * Never returned to the client — server-side only.
 */
export async function resolveFacebookPageToken(): Promise<{
  token: string;
  source: "env" | "oauth";
  pageId: string;
} | null> {
  // 1. Prefer OAuth-stored token from DB
  try {
    const connection = await prisma.facebookOAuthConnection.findFirst({
      where: { revokedAt: null },
      orderBy: { connectedAt: "desc" },
    });
    if (connection) {
      const token = decryptFacebookToken(connection.encryptedAccessToken);
      return { token, source: "oauth", pageId: connection.pageId };
    }
  } catch {
    // Fall through to env token
  }

  // 2. Fall back to env token (MVP / pre-OAuth)
  const envToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim();
  const envPageId = process.env.FACEBOOK_PAGE_ID?.trim();
  if (envToken && envPageId) {
    return { token: envToken, source: "env", pageId: envPageId };
  }

  return null;
}

// ─── Permission verification ──────────────────────────────────────────────────

async function fetchGrantedPermissions(
  token: string,
): Promise<{ granted: string[]; denied: string[] }> {
  try {
    const url = `${FB_GRAPH_BASE}/me/permissions?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { granted: [], denied: [] };
    const json = (await res.json()) as {
      data?: Array<{ permission: string; status: string }>;
    };
    const granted: string[] = [];
    const denied: string[] = [];
    for (const p of json.data ?? []) {
      if (p.status === "granted") granted.push(p.permission);
      else denied.push(p.permission);
    }
    return { granted, denied };
  } catch {
    return { granted: [], denied: [] };
  }
}

async function fetchPageName(token: string, pageId: string): Promise<string | null> {
  try {
    const url = `${FB_GRAPH_BASE}/${pageId}?fields=name&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const json = (await res.json()) as { name?: string };
    return json.name ?? null;
  } catch {
    return null;
  }
}

// ─── Connection status ────────────────────────────────────────────────────────

export async function getFacebookConnectionStatus(): Promise<FacebookConnectionStatus> {
  const required = [...FACEBOOK_REQUIRED_PERMISSIONS] as string[];
  const oauthConfigured = !!(
    process.env.FACEBOOK_APP_ID &&
    process.env.FACEBOOK_APP_SECRET &&
    process.env.FACEBOOK_REDIRECT_URI
  );
  const envTokenPresent = !!(
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN &&
    process.env.FACEBOOK_PAGE_ID
  );

  if (!oauthConfigured && !envTokenPresent) {
    return {
      connected: false,
      state: "not_connected",
      pageId: null,
      pageName: null,
      requiredPermissions: required,
      grantedPermissions: [],
      missingPermissions: required,
      canPublish: false,
      crossPostToXAssumed: "unknown",
      lastPublishAt: null,
      readiness: "CONFIG_MISSING",
      oauthConfigured,
      envTokenPresent,
    };
  }

  const resolved = await resolveFacebookPageToken();
  if (!resolved) {
    return {
      connected: false,
      state: "not_connected",
      pageId: process.env.FACEBOOK_PAGE_ID ?? null,
      pageName: null,
      requiredPermissions: required,
      grantedPermissions: [],
      missingPermissions: required,
      canPublish: false,
      crossPostToXAssumed: "unknown",
      lastPublishAt: null,
      readiness: "NOT_CONNECTED",
      oauthConfigured,
      envTokenPresent,
    };
  }

  const { token, source, pageId } = resolved;
  const state: FacebookConnectionState = source === "env" ? "env_token" : "oauth";

  // Fetch permissions + page name in parallel
  const [{ granted, denied }, pageName, lastAttempt] = await Promise.all([
    fetchGrantedPermissions(token),
    fetchPageName(token, pageId),
    prisma.facebookPublishAttempt
      .findFirst({
        where: { status: "succeeded" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      })
      .catch(() => null),
  ]);

  void denied; // available for diagnostics if needed

  const missing = required.filter((p) => !granted.includes(p));
  const canPublish = missing.length === 0;

  let readiness: FacebookConnectionStatus["readiness"];
  if (!canPublish) readiness = "MISSING_PERMISSION";
  else readiness = "READY";

  return {
    connected: true,
    state,
    pageId,
    pageName,
    requiredPermissions: required,
    grantedPermissions: granted,
    missingPermissions: missing,
    canPublish,
    crossPostToXAssumed: "unknown", // cannot determine from Graph API
    lastPublishAt: lastAttempt?.completedAt?.toISOString() ?? null,
    readiness,
    oauthConfigured,
    envTokenPresent,
    warning:
      source === "env"
        ? "Using environment variable token. OAuth connection is recommended for production."
        : undefined,
  };
}

// ─── OAuth token exchange ─────────────────────────────────────────────────────

export async function exchangeFacebookCodeForToken(code: string): Promise<{
  accessToken: string;
  expiresIn?: number;
} | null> {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) return null;

  try {
    const url = new URL(FACEBOOK_TOKEN_URL);
    url.searchParams.set("client_id", appId);
    url.searchParams.set("client_secret", appSecret);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code", code);

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;
    return { accessToken: json.access_token, expiresIn: json.expires_in };
  } catch {
    return null;
  }
}

export async function getLongLivedPageToken(
  shortLivedToken: string,
  pageId: string,
): Promise<{ pageToken: string; pageName: string | null } | null> {
  // Exchange for long-lived user token first
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) return null;

  try {
    const llUrl = new URL(`${FB_GRAPH_BASE}/oauth/access_token`);
    llUrl.searchParams.set("grant_type", "fb_exchange_token");
    llUrl.searchParams.set("client_id", appId);
    llUrl.searchParams.set("client_secret", appSecret);
    llUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const llRes = await fetch(llUrl.toString(), { signal: AbortSignal.timeout(10000) });
    if (!llRes.ok) return null;
    const llJson = (await llRes.json()) as { access_token?: string };
    if (!llJson.access_token) return null;
    const longLivedUserToken = llJson.access_token;

    // Get Page access token from Pages list
    const pagesUrl = `${FB_GRAPH_BASE}/me/accounts?access_token=${encodeURIComponent(longLivedUserToken)}`;
    const pagesRes = await fetch(pagesUrl, { signal: AbortSignal.timeout(8000) });
    if (!pagesRes.ok) return null;
    const pagesJson = (await pagesRes.json()) as {
      data?: Array<{ id: string; name: string; access_token: string }>;
    };

    const page = pagesJson.data?.find((p) => p.id === pageId);
    if (!page) {
      // If only one page, use it regardless
      const firstPage = pagesJson.data?.[0];
      if (!firstPage) return null;
      return { pageToken: firstPage.access_token, pageName: firstPage.name };
    }

    return { pageToken: page.access_token, pageName: page.name };
  } catch {
    return null;
  }
}

// ─── Store OAuth connection ───────────────────────────────────────────────────

export async function storeFacebookOAuthConnection(input: {
  pageId: string;
  pageName: string | null;
  pageToken: string;
  userToken?: string;
  scopes: string[];
  actorId?: string | null;
  expiresAt?: Date | null;
}): Promise<void> {
  const encryptedAccessToken = encryptFacebookToken(input.pageToken);
  const encryptedUserToken = input.userToken
    ? encryptFacebookToken(input.userToken)
    : null;

  // Revoke any existing connections for this page
  await prisma.facebookOAuthConnection.updateMany({
    where: { pageId: input.pageId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.facebookOAuthConnection.create({
    data: {
      pageId: input.pageId,
      pageName: input.pageName,
      encryptedAccessToken,
      encryptedUserToken,
      scopesJson: JSON.stringify(input.scopes),
      expiresAt: input.expiresAt ?? null,
      actorId: input.actorId ?? null,
    },
  });
}
