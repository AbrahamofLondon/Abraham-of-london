/**
 * lib/outbound/linkedin-oauth.ts — LinkedIn OAuth 2.0 Service
 *
 * Handles the OAuth 2.0 Authorization Code flow for LinkedIn company page
 * publishing. Uses the official LinkedIn API only.
 *
 * Requires:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 *   LINKEDIN_REDIRECT_URI
 *   OAUTH_TOKEN_ENCRYPTION_KEY (already used by lib/integrations/encryption.ts)
 *
 * Tokens are encrypted at rest using AES-256-GCM.
 * Never expose tokens to the client or in logs.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import { encrypt, decrypt } from "@/lib/integrations/encryption";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_API_VERSION = "202412"; // Current LinkedIn API version

const REQUIRED_SCOPES = ["w_organization_social", "r_organization_social"];
const SCOPE_STRING = REQUIRED_SCOPES.join(" ");

const PROVIDER = "linkedin";
const ORGANISATION_ID = "115850136";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface LinkedInConnectionStatus {
  connected: boolean;
  organisationId: string | null;
  scopes: string[];
  expiresAt: string | null;
  publishingEnabled: boolean;
  message: string;
}

export interface LinkedInTokenInfo {
  id: string;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scopes: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getClientId(): string {
  const id = process.env.LINKEDIN_CLIENT_ID?.trim();
  if (!id) throw new Error("[LINKEDIN_OAUTH] Missing LINKEDIN_CLIENT_ID");
  return id;
}

function getClientSecret(): string {
  const secret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!secret) throw new Error("[LINKEDIN_OAUTH] Missing LINKEDIN_CLIENT_SECRET");
  return secret;
}

function getRedirectUri(): string {
  const uri = process.env.LINKEDIN_REDIRECT_URI?.trim();
  if (!uri) {
    // Default to local callback
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return `${baseUrl}/api/admin/outbound/linkedin/callback`;
  }
  return uri;
}

function getStateKey(): string {
  return "linkedin_oauth_state";
}

function generateStateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function getCsrfSecret(): string {
  return process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || "linkedin-csrf-fallback";
}

function signState(state: string): string {
  const hmac = crypto.createHmac("sha256", getCsrfSecret());
  hmac.update(state);
  return hmac.digest("hex");
}

function verifyState(state: string, signature: string): boolean {
  const expected = signState(state);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

// ─────────────────────────────────────────────────────────────────────────────
// OAuth URL Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the LinkedIn OAuth authorization URL.
 * Returns the URL and the state token (which must be stored for CSRF verification).
 */
export function buildAuthorizationUrl(): { url: string; state: string } {
  const clientId = getClientId();
  const redirectUri = getRedirectUri();
  const state = generateStateToken();
  const signature = signState(state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state: `${state}.${signature}`,
    scope: SCOPE_STRING,
  });

  return {
    url: `${LINKEDIN_AUTH_URL}?${params.toString()}`,
    state,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Exchange
// ─────────────────────────────────────────────────────────────────────────────

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

/**
 * Exchange an authorization code for an access token.
 * Stores the encrypted token in the database.
 */
export async function exchangeCodeForToken(
  code: string,
  connectedBy?: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  try {
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const redirectUri = getRedirectUri();

    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[LINKEDIN_OAUTH] Token exchange failed:", tokenResponse.status, errorBody);
      return { ok: false, error: `Token exchange failed: ${tokenResponse.status}` };
    }

    const data = (await tokenResponse.json()) as LinkedInTokenResponse;

    if (!data.access_token) {
      return { ok: false, error: "No access token returned by LinkedIn" };
    }

    // Encrypt tokens
    const accessTokenEncrypted = encrypt(data.access_token);
    const refreshTokenEncrypted = data.refresh_token ? encrypt(data.refresh_token) : null;

    // Calculate expiry
    const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    const refreshTokenExpiresAt = data.refresh_token_expires_in
      ? new Date(Date.now() + data.refresh_token_expires_in * 1000)
      : null;

    // Upsert the token record
    await prisma.integrationToken.upsert({
      where: {
        integration_token_provider_org: {
          provider: PROVIDER,
          organisationId: ORGANISATION_ID,
        },
      },
      create: {
        provider: PROVIDER,
        organisationId: ORGANISATION_ID,
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes: data.scope || SCOPE_STRING,
        connectedBy: connectedBy || null,
        connectedAt: new Date(),
        lastUsedAt: new Date(),
        status: "active",
      },
      update: {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes: data.scope || SCOPE_STRING,
        connectedBy: connectedBy || undefined,
        lastUsedAt: new Date(),
        status: "active",
      },
    });

    console.log(
      `[LINKEDIN_OAUTH] Token stored successfully. Expires at ${accessTokenExpiresAt.toISOString()}`,
    );

    return { ok: true, message: "LinkedIn account connected successfully." };
  } catch (error) {
    console.error("[LINKEDIN_OAUTH] Token exchange error:", error);
    return { ok: false, error: "Failed to exchange authorization code for token." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Retrieval
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the decrypted access token for LinkedIn.
 * Returns null if no token exists or token is expired/revoked.
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const record = await prisma.integrationToken.findUnique({
      where: {
        integration_token_provider_org: {
          provider: PROVIDER,
          organisationId: ORGANISATION_ID,
        },
      },
    });

    if (!record) return null;
    if (record.status !== "active") return null;

    // Check if expired
    if (record.accessTokenExpiresAt && record.accessTokenExpiresAt < new Date()) {
      // Try to refresh
      const refreshed = await refreshAccessToken(record);
      if (!refreshed) {
        await prisma.integrationToken.update({
          where: { id: record.id },
          data: { status: "expired" },
        });
        return null;
      }
      return refreshed;
    }

    // Update last used
    await prisma.integrationToken.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
    });

    return decrypt(record.accessTokenEncrypted);
  } catch (error) {
    console.error("[LINKEDIN_OAUTH] Error getting access token:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Token Refresh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Refresh the access token using the refresh token.
 * Returns the new decrypted access token, or null if refresh failed.
 */
async function refreshAccessToken(
  record: any,
): Promise<string | null> {
  if (!record.refreshTokenEncrypted) {
    console.warn("[LINKEDIN_OAUTH] No refresh token available. Manual reconnect required.");
    return null;
  }

  try {
    const clientId = getClientId();
    const clientSecret = getClientSecret();
    const refreshToken = decrypt(record.refreshTokenEncrypted);

    const tokenResponse = await fetch(LINKEDIN_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error("[LINKEDIN_OAUTH] Token refresh failed:", tokenResponse.status, errorBody);
      return null;
    }

    const data = (await tokenResponse.json()) as LinkedInTokenResponse;

    if (!data.access_token) {
      return null;
    }

    // Encrypt new tokens
    const accessTokenEncrypted = encrypt(data.access_token);
    const refreshTokenEncrypted = data.refresh_token
      ? encrypt(data.refresh_token)
      : record.refreshTokenEncrypted;

    const accessTokenExpiresAt = new Date(Date.now() + data.expires_in * 1000);
    const refreshTokenExpiresAt = data.refresh_token_expires_in
      ? new Date(Date.now() + data.refresh_token_expires_in * 1000)
      : record.refreshTokenExpiresAt;

    await prisma.integrationToken.update({
      where: { id: record.id },
      data: {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        scopes: data.scope || record.scopes,
        lastUsedAt: new Date(),
        status: "active",
      },
    });

    console.log("[LINKEDIN_OAUTH] Token refreshed successfully.");

    return data.access_token;
  } catch (error) {
    console.error("[LINKEDIN_OAUTH] Token refresh error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connection Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current LinkedIn connection status.
 * Never returns token values.
 */
export async function getConnectionStatus(): Promise<LinkedInConnectionStatus> {
  try {
    const record = await prisma.integrationToken.findUnique({
      where: {
        integration_token_provider_org: {
          provider: PROVIDER,
          organisationId: ORGANISATION_ID,
        },
      },
    });

    if (!record) {
      return {
        connected: false,
        organisationId: ORGANISATION_ID,
        scopes: [],
        expiresAt: null,
        publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
        message: "Not connected to LinkedIn. Use the Connect button to authorize.",
      };
    }

    if (record.status !== "active") {
      return {
        connected: false,
        organisationId: ORGANISATION_ID,
        scopes: record.scopes.split(" ").filter(Boolean),
        expiresAt: record.accessTokenExpiresAt?.toISOString() || null,
        publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
        message: `LinkedIn connection is ${record.status}. Reconnect required.`,
      };
    }

    const isExpired = record.accessTokenExpiresAt && record.accessTokenExpiresAt < new Date();
    const expiresSoon =
      record.accessTokenExpiresAt &&
      record.accessTokenExpiresAt.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

    let message: string;
    if (isExpired) {
      message = "Token expired. Attempting auto-refresh...";
    } else if (expiresSoon) {
      message = `Token expires ${record.accessTokenExpiresAt?.toLocaleDateString()}. Will auto-refresh.`;
    } else {
      message = "Connected to LinkedIn. Ready to publish.";
    }

    return {
      connected: true,
      organisationId: ORGANISATION_ID,
      scopes: record.scopes.split(" ").filter(Boolean),
      expiresAt: record.accessTokenExpiresAt?.toISOString() || null,
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      message,
    };
  } catch (error) {
    console.error("[LINKEDIN_OAUTH] Error getting connection status:", error);
    return {
      connected: false,
      organisationId: ORGANISATION_ID,
      scopes: [],
      expiresAt: null,
      publishingEnabled: process.env.LINKEDIN_PUBLISHING_ENABLED === "true",
      message: "Error checking connection status.",
    };
  }
}

/**
 * Disconnect the LinkedIn integration.
 */
export async function disconnectIntegration(): Promise<void> {
  try {
    await prisma.integrationToken.updateMany({
      where: {
        provider: PROVIDER,
        organisationId: ORGANISATION_ID,
      },
      data: {
        status: "disconnected",
      },
    });
    console.log("[LINKEDIN_OAUTH] Integration disconnected.");
  } catch (error) {
    console.error("[LINKEDIN_OAUTH] Error disconnecting:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LinkedIn API Publishing
// ─────────────────────────────────────────────────────────────────────────────

export interface PublishResult {
  ok: boolean;
  error?: string;
  errorCode?: string;
  linkedinPostId?: string;
  linkedinPostUrl?: string;
}

/**
 * Publish a post to LinkedIn via the official Posts API.
 */
export async function publishToLinkedIn(
  commentary: string,
  articleUrl?: string,
  articleTitle?: string,
  articleDescription?: string,
): Promise<PublishResult> {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      error: "LinkedIn is not connected or token is expired. Reconnect via the dashboard.",
      errorCode: "LINKEDIN_NOT_CONNECTED",
    };
  }

  if (process.env.LINKEDIN_PUBLISHING_ENABLED !== "true") {
    return {
      ok: false,
      error: "LinkedIn publishing is disabled. Set LINKEDIN_PUBLISHING_ENABLED=true to enable.",
      errorCode: "LINKEDIN_PUBLISHING_DISABLED",
    };
  }

  // Verify scopes
  const record = await prisma.integrationToken.findUnique({
    where: {
      integration_token_provider_org: {
        provider: PROVIDER,
        organisationId: ORGANISATION_ID,
      },
    },
  });

  if (record) {
    const scopes = record.scopes.split(" ");
    if (!scopes.includes("w_organization_social")) {
      return {
        ok: false,
        error: "Missing required scope: w_organization_social. Reconnect with the correct permissions.",
        errorCode: "LINKEDIN_SCOPE_MISSING",
      };
    }
  }

  const authorUrn = `urn:li:organization:${ORGANISATION_ID}`;

  // Build the post body
  const postBody: Record<string, any> = {
    author: authorUrn,
    commentary,
    visibility: "PUBLIC",
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };

  // Add article content if provided
  if (articleUrl) {
    postBody.content = {
      article: {
        source: articleUrl,
        title: articleTitle || "",
        description: articleDescription || "",
      },
    };
  }

  try {
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": LINKEDIN_API_VERSION,
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postBody),
    });

    // Handle rate limiting
    if (response.status === 429) {
      return {
        ok: false,
        error: "LinkedIn rate limit exceeded. Wait before publishing again.",
        errorCode: "LINKEDIN_RATE_LIMITED",
      };
    }

    // Handle auth errors
    if (response.status === 401) {
      return {
        ok: false,
        error: "LinkedIn token is invalid or expired. Reconnect via the dashboard.",
        errorCode: "LINKEDIN_TOKEN_EXPIRED",
      };
    }

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[LINKEDIN_PUBLISH] API error:", response.status, errorBody);
      return {
        ok: false,
        error: `LinkedIn API error: ${response.status}. ${errorBody.slice(0, 200)}`,
        errorCode: "LINKEDIN_POST_FAILED",
      };
    }

    // Extract post ID from response headers
    const locationHeader = response.headers.get("x-restli-id") || response.headers.get("location") || "";
    const linkedinPostId = locationHeader.split(":").pop() || locationHeader.split("/").pop() || "";
    const linkedinPostUrl = linkedinPostId
      ? `https://www.linkedin.com/company/${ORGANISATION_ID}/posts/${linkedinPostId}`
      : "";

    console.log(
      `[LINKEDIN_PUBLISH] Post published successfully. ID: ${linkedinPostId}`,
    );

    return {
      ok: true,
      linkedinPostId,
      linkedinPostUrl,
    };
  } catch (error) {
    console.error("[LINKEDIN_PUBLISH] Network error:", error);
    return {
      ok: false,
      error: "Network error while publishing to LinkedIn.",
      errorCode: "LINKEDIN_POST_FAILED",
    };
  }
}
