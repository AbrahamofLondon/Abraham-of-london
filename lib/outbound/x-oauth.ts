/**
 * lib/outbound/x-oauth.ts
 *
 * X (Twitter) OAuth 2.0 PKCE connection management.
 *
 * Uses Twitter API v2 OAuth 2.0 Authorization Code with PKCE.
 * Tokens are encrypted at rest (AES-256-GCM) and never returned to the client.
 * Supports offline.access for refresh tokens.
 *
 * Server-side only.
 */

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { encryptXToken, decryptXToken } from "./x-token-encryption";
import {
  X_REQUIRED_SCOPES,
  X_AUTH_URL,
  X_TOKEN_URL,
  X_API_BASE,
  type XConnectionStatus,
} from "./x-types";

// ─── State + PKCE cookies ─────────────────────────────────────────────────────

export const X_OAUTH_STATE_COOKIE = "x_oauth_state";
export const X_PKCE_VERIFIER_COOKIE = "x_pkce_verifier";

export const X_OAUTH_SCOPES = X_REQUIRED_SCOPES.join(" ");

// ─── PKCE helpers ─────────────────────────────────────────────────────────────

export function generatePKCEVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function derivePKCEChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

// ─── State signing ────────────────────────────────────────────────────────────

/**
 * Returns the HMAC secret used to sign OAuth state.
 * Prefers CSRF_SECRET, falls back to NEXTAUTH_SECRET (same pattern as LinkedIn).
 */
function getStateSecret(): string {
  return (
    process.env.CSRF_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "x-oauth-state-development-only"
  );
}

function signState(rawState: string): string {
  return crypto.createHmac("sha256", getStateSecret()).update(rawState).digest("hex");
}

/**
 * Generate a signed OAuth state string.
 * Format: {base64url-payload}.{hmac-sha256-signature}
 * Payload: JSON { nonce, returnTo, issuedAt }
 */
export function generateOAuthState(returnTo?: string): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({
    nonce,
    returnTo: returnTo ?? "/admin/outbound/x",
    issuedAt: Date.now(),
  });
  const rawState = Buffer.from(payload).toString("base64url");
  return `${rawState}.${signState(rawState)}`;
}

/**
 * Validate and parse a signed X OAuth state string.
 * Rejects states with invalid signatures (timing-safe comparison),
 * returnTo outside /admin/, or missing nonce.
 */
export function parseOAuthState(raw: string): {
  nonce: string;
  returnTo: string;
} | null {
  try {
    const [rawState, signature] = raw.split(".");
    if (!rawState || !signature) return null;

    const expectedSignature = signState(rawState);
    if (
      expectedSignature.length !== signature.length ||
      !crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(signature, "hex"),
      )
    ) {
      return null;
    }

    const decoded = Buffer.from(rawState, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as {
      nonce?: string;
      returnTo?: string;
      issuedAt?: number;
    };
    if (!parsed.nonce) return null;

    const returnTo = parsed.returnTo ?? "/admin/outbound/x";
    const safeReturnTo = returnTo.startsWith("/admin/") ? returnTo : "/admin/outbound/x";
    return { nonce: parsed.nonce, returnTo: safeReturnTo };
  } catch {
    return null;
  }
}

// ─── Token resolution ─────────────────────────────────────────────────────────

/**
 * Resolve the active X access token from DB.
 * Returns null if no valid connection is found.
 * Never returned to the client — server-side only.
 */
export async function resolveXAccessToken(): Promise<{
  accessToken: string;
  userId: string;
  username: string | null;
} | null> {
  try {
    const connection = await prisma.xOAuthConnection.findFirst({
      where: { revokedAt: null },
      orderBy: { connectedAt: "desc" },
    });
    if (!connection) return null;

    // Check token expiry
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      // Attempt refresh if we have a refresh token
      if (connection.encryptedRefreshToken) {
        const refreshed = await refreshXToken(
          connection.id,
          decryptXToken(connection.encryptedRefreshToken),
        );
        if (refreshed) return refreshed;
      }
      return null;
    }

    const accessToken = decryptXToken(connection.encryptedAccessToken);
    return {
      accessToken,
      userId: connection.userId ?? "",
      username: connection.username,
    };
  } catch {
    return null;
  }
}

// ─── Token refresh ────────────────────────────────────────────────────────────

async function refreshXToken(
  connectionId: string,
  refreshToken: string,
): Promise<{ accessToken: string; userId: string; username: string | null } | null> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  if (!clientId) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    // If clientSecret is provided, use basic auth
    if (clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    }

    const res = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers,
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };
    if (!json.access_token) return null;

    const expiresAt = json.expires_in
      ? new Date(Date.now() + json.expires_in * 1000)
      : null;

    await prisma.xOAuthConnection.update({
      where: { id: connectionId },
      data: {
        encryptedAccessToken: encryptXToken(json.access_token),
        encryptedRefreshToken: json.refresh_token
          ? encryptXToken(json.refresh_token)
          : undefined,
        expiresAt,
      },
    });

    // Fetch user info to get username
    const userInfo = await fetchXUserInfo(json.access_token);

    return {
      accessToken: json.access_token,
      userId: userInfo?.id ?? "",
      username: userInfo?.username ?? null,
    };
  } catch {
    return null;
  }
}

// ─── User info ────────────────────────────────────────────────────────────────

export async function fetchXUserInfo(
  accessToken: string,
): Promise<{ id: string; username: string; name: string } | null> {
  try {
    const res = await fetch(`${X_API_BASE}/users/me?user.fields=username,name`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { id?: string; username?: string; name?: string };
    };
    if (!json.data?.id) return null;
    return {
      id: json.data.id,
      username: json.data.username ?? "",
      name: json.data.name ?? "",
    };
  } catch {
    return null;
  }
}

// ─── Connection status ────────────────────────────────────────────────────────

export async function getXConnectionStatus(): Promise<XConnectionStatus> {
  const oauthConfigured = !!(
    process.env.X_CLIENT_ID && process.env.X_REDIRECT_URI
  );

  const required = [...X_REQUIRED_SCOPES] as string[];

  if (!oauthConfigured) {
    return {
      connected: false,
      state: "not_connected",
      userId: null,
      username: null,
      scopes: [],
      missingScopes: required,
      canPublish: false,
      lastPublishAt: null,
      readiness: "CONFIG_MISSING",
      oauthConfigured,
    };
  }

  try {
    const connection = await prisma.xOAuthConnection.findFirst({
      where: { revokedAt: null },
      orderBy: { connectedAt: "desc" },
    });

    if (!connection) {
      return {
        connected: false,
        state: "not_connected",
        userId: null,
        username: null,
        scopes: [],
        missingScopes: required,
        canPublish: false,
        lastPublishAt: null,
        readiness: "NOT_CONNECTED",
        oauthConfigured,
      };
    }

    // Check expiry
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      if (!connection.encryptedRefreshToken) {
        return {
          connected: false,
          state: "expired",
          userId: connection.userId,
          username: connection.username,
          scopes: [],
          missingScopes: required,
          canPublish: false,
          lastPublishAt: null,
          readiness: "TOKEN_INVALID",
          oauthConfigured,
        };
      }
    }

    const scopesGranted = JSON.parse(connection.scopesJson || "[]") as string[];
    const missingScopes = required.filter((s) => !scopesGranted.includes(s));
    const canPublish =
      missingScopes.length === 0 &&
      scopesGranted.includes("tweet.write");

    const lastAttempt = await prisma.xPublishAttempt
      .findFirst({
        where: { status: "succeeded" },
        orderBy: { completedAt: "desc" },
        select: { completedAt: true },
      })
      .catch(() => null);

    return {
      connected: true,
      state: "oauth",
      userId: connection.userId,
      username: connection.username,
      scopes: scopesGranted,
      missingScopes,
      canPublish,
      lastPublishAt: lastAttempt?.completedAt?.toISOString() ?? null,
      readiness: canPublish ? "READY" : "MISSING_SCOPE",
      oauthConfigured,
    };
  } catch {
    return {
      connected: false,
      state: "not_connected",
      userId: null,
      username: null,
      scopes: [],
      missingScopes: required,
      canPublish: false,
      lastPublishAt: null,
      readiness: "API_ERROR",
      oauthConfigured,
    };
  }
}

// ─── OAuth code exchange ──────────────────────────────────────────────────────

export async function exchangeXCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scopes: string[];
} | null> {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const redirectUri = process.env.X_REDIRECT_URI;
  if (!clientId || !redirectUri) return null;

  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    if (clientSecret) {
      headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
    }

    const res = await fetch(X_TOKEN_URL, {
      method: "POST",
      headers,
      body: body.toString(),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    };
    if (!json.access_token) return null;

    const scopes = json.scope ? json.scope.split(" ") : [];

    return {
      accessToken: json.access_token,
      refreshToken: json.refresh_token ?? null,
      expiresIn: json.expires_in ?? null,
      scopes,
    };
  } catch {
    return null;
  }
}

// ─── Store connection ─────────────────────────────────────────────────────────

export async function storeXOAuthConnection(input: {
  userId: string;
  username: string | null;
  accessToken: string;
  refreshToken: string | null;
  scopes: string[];
  expiresIn: number | null;
  actorId?: string | null;
}): Promise<void> {
  const encryptedAccessToken = encryptXToken(input.accessToken);
  const encryptedRefreshToken = input.refreshToken
    ? encryptXToken(input.refreshToken)
    : null;
  const expiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000)
    : null;

  // Revoke any existing connections for this user
  await prisma.xOAuthConnection.updateMany({
    where: { userId: input.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  await prisma.xOAuthConnection.create({
    data: {
      userId: input.userId,
      username: input.username,
      encryptedAccessToken,
      encryptedRefreshToken,
      scopesJson: JSON.stringify(input.scopes),
      expiresAt,
      actorId: input.actorId ?? null,
    },
  });
}

// ─── Build auth URL ───────────────────────────────────────────────────────────

export function buildXAuthUrl(input: {
  state: string;
  codeChallenge: string;
}): string {
  const clientId = process.env.X_CLIENT_ID!;
  const redirectUri = process.env.X_REDIRECT_URI!;

  const url = new URL(X_AUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", X_OAUTH_SCOPES);
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}
