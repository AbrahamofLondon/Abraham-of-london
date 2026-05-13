/**
 * lib/integrations/token-store.ts
 * Server-side OAuth token persistence with encryption at rest.
 * All tokens are encrypted via AES-256-GCM before storage.
 */

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "./encryption";
import { fromNowSeconds, isExpired } from "@/utils/dates";

export type ProviderType = "google" | "slack" | "jira" | "linear" | "github" | "notion";

export interface StoredToken {
  id: string;
  userId: string;
  provider: ProviderType;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: Date;
  scopes: string;
  status: string;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoreTokenInput {
  userId: string;
  provider: ProviderType;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn: number; // seconds from now
  scopes?: string;
}

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn: number;
}

/**
 * Store OAuth tokens for a user, encrypted at rest.
 * Uses upsert so re-connecting updates rather than duplicates.
 */
export async function storeUserTokens(input: StoreTokenInput): Promise<StoredToken> {
  const encryptedAccess = encrypt(input.accessToken);
  const encryptedRefresh = input.refreshToken ? encrypt(input.refreshToken) : null;

  const record = await prisma.userIntegration.upsert({
    where: {
      userId_provider: {
        userId: input.userId,
        provider: input.provider,
      },
    },
    create: {
      userId: input.userId,
      provider: input.provider,
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry: fromNowSeconds(input.expiresIn),
      scopes: input.scopes || "",
      status: "active",
      lastSyncAt: new Date(),
    },
    update: {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      tokenExpiry: fromNowSeconds(input.expiresIn),
      scopes: input.scopes || "",
      status: "active",
      lastSyncAt: new Date(),
    },
  });

  return {
    ...record,
    provider: record.provider as ProviderType,
    accessToken: input.accessToken, // return decrypted for immediate use
    refreshToken: input.refreshToken || null,
  };
}

/**
 * Retrieve a decrypted access token for a user + provider.
 * Returns null if no active token exists.
 * Automatically attempts refresh if token is expired.
 */
export async function getAccessToken(
  userId: string,
  provider: ProviderType,
): Promise<string | null> {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: { userId, provider },
    },
  });

  if (!integration) return null;
  if (integration.status !== "active") return null;

  // Check if token is expired and attempt refresh
  if (isExpired(integration.tokenExpiry)) {
    return refreshAndGetToken(userId, provider, integration);
  }

  try {
    return decrypt(integration.accessToken);
  } catch {
    // If decryption fails, mark as error and return null
    await prisma.userIntegration.update({
      where: { id: integration.id },
      data: { status: "error" },
    });
    return null;
  }
}

/**
 * Get the full integration record (without decrypted tokens) for management UI.
 */
export async function getIntegrationStatus(
  userId: string,
  provider: ProviderType,
): Promise<{
  connected: boolean;
  status: string;
  scopes: string;
  lastSyncAt: Date | null;
  tokenExpiry: Date | null;
  connectedAt: Date;
} | null> {
  const integration = await prisma.userIntegration.findUnique({
    where: {
      userId_provider: { userId, provider },
    },
  });

  if (!integration) return null;

  return {
    connected: integration.status === "active",
    status: integration.status,
    scopes: integration.scopes,
    lastSyncAt: integration.lastSyncAt,
    tokenExpiry: integration.tokenExpiry,
    connectedAt: integration.createdAt,
  };
}

/**
 * List all active integrations for a user.
 */
export async function listUserIntegrations(userId: string): Promise<
  Array<{
    provider: ProviderType;
    status: string;
    scopes: string;
    lastSyncAt: Date | null;
  }>
> {
  const integrations = await prisma.userIntegration.findMany({
    where: { userId },
    select: {
      provider: true,
      status: true,
      scopes: true,
      lastSyncAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return integrations as Array<{
    provider: ProviderType;
    status: string;
    scopes: string;
    lastSyncAt: Date | null;
  }>;
}

/**
 * Remove an integration (disconnect).
 */
export async function removeIntegration(
  userId: string,
  provider: ProviderType,
): Promise<void> {
  await prisma.userIntegration.deleteMany({
    where: { userId, provider },
  });
}

/**
 * Update the last sync timestamp for an integration.
 */
export async function touchIntegrationSync(
  userId: string,
  provider: ProviderType,
): Promise<void> {
  await prisma.userIntegration.updateMany({
    where: { userId, provider, status: "active" },
    data: { lastSyncAt: new Date() },
  });
}

/**
 * Mark an integration as expired (e.g., refresh failed).
 */
export async function expireIntegration(
  userId: string,
  provider: ProviderType,
): Promise<void> {
  await prisma.userIntegration.updateMany({
    where: { userId, provider },
    data: { status: "expired" },
  });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function refreshAndGetToken(
  userId: string,
  provider: ProviderType,
  integration: any,
): Promise<string | null> {
  try {
    const refreshToken = integration.refreshToken
      ? decrypt(integration.refreshToken)
      : null;

    if (!refreshToken) {
      await expireIntegration(userId, provider);
      return null;
    }

    const result = await attemptTokenRefresh(provider, refreshToken);

    // Store the new tokens
    await storeUserTokens({
      userId,
      provider,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? refreshToken,
      expiresIn: result.expiresIn,
      scopes: integration.scopes,
    });

    return result.accessToken;
  } catch {
    await expireIntegration(userId, provider);
    return null;
  }
}

async function attemptTokenRefresh(
  provider: ProviderType,
  refreshToken: string,
): Promise<TokenRefreshResult> {
  switch (provider) {
    case "google":
      return refreshGoogleToken(refreshToken);
    case "slack":
      return refreshSlackToken(refreshToken);
    default:
      throw new Error(`Token refresh not implemented for provider: ${provider}`);
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResult> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Google token refresh failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null, // Google may return a new refresh token
    expiresIn: data.expires_in || 3600,
  };
}

async function refreshSlackToken(refreshToken: string): Promise<TokenRefreshResult> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID || "",
      client_secret: process.env.SLACK_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Slack token refresh failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack token refresh error: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    expiresIn: data.expires_in || 3600,
  };
}
