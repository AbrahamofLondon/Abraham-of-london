/**
 * lib/integrations/index.ts
 * Unified integration service — the single entry point for all
 * OAuth-based behavioral data integrations.
 *
 * This is what the UI and the Pattern-Breaker Contract system call.
 * It routes to the correct provider implementation and normalizes results.
 */

import type { BehavioralDataSource } from "@/lib/alignment/enhanced-types";
import { storeUserTokens, getAccessToken, listUserIntegrations, removeIntegration, getIntegrationStatus } from "./token-store";
import { buildCalendarDataSource } from "./google-calendar-sync";
import { buildSlackDataSource } from "./slack-sync";
import {
  hydrateBehavioralSourcesFromSnapshots,
  loadLatestBehavioralSignalSnapshots,
  persistBehavioralSignalSnapshots,
} from "@/lib/behavioral/behavioral-signal-snapshot-store";
import type { ProviderType } from "./token-store";
export type {
  BehavioralEvidenceContract,
  BehavioralEvidenceProvider,
  BehavioralEvidenceSource,
  CommitmentVerificationStatus,
} from "./behavioral-evidence-contract";

export type { ProviderType } from "./token-store";

const SNAPSHOT_FALLBACK_MAX_AGE_MINUTES = 24 * 60;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Get the OAuth redirect URL for a given provider.
 * The UI should redirect the user to this URL to start the OAuth flow.
 */
export function getOAuthRedirectUrl(provider: ProviderType): string {
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  switch (provider) {
    case "google":
      return `${baseUrl}/api/integrations/google/connect`;
    case "slack":
      return `${baseUrl}/api/integrations/slack/connect`;
    default:
      throw new Error(`OAuth not implemented for provider: ${provider}`);
  }
}

/**
 * Initiate an OAuth connection by redirecting to the provider.
 * Call this from the UI when a user clicks "Connect".
 */
export function initiateOAuth(provider: ProviderType): void {
  const url = getOAuthRedirectUrl(provider);
  window.location.href = url;
}

/**
 * Fetch behavioral data signals for a user across all connected providers.
 * This is the main data source for verifyWithBehavioralData.
 *
 * Returns an array of BehavioralDataSource objects, one per connected provider.
 * Only returns providers with status "active".
 */
export async function fetchUserBehavioralData(
  userId: string,
): Promise<BehavioralDataSource[]> {
  try {
    const sources = (await Promise.all([
      buildCalendarDataSource(userId),
      buildSlackDataSource(userId),
    ])).filter(Boolean) as BehavioralDataSource[];

    if (sources.length > 0) {
      void persistBehavioralSignalSnapshots({
        userId,
        sources,
      }).catch((error) => {
        console.warn("[behavioral] snapshot persistence failed", {
          userIdPresent: Boolean(userId),
          sourceCount: sources.length,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      });

      return sources;
    }
  } catch (error) {
    console.warn("[behavioral] live fetch failed; attempting snapshot fallback", {
      userIdPresent: Boolean(userId),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  try {
    const snapshots = await loadLatestBehavioralSignalSnapshots({
      userId,
      maxAgeMinutes: SNAPSHOT_FALLBACK_MAX_AGE_MINUTES,
    });
    if (snapshots.length > 0) {
      return hydrateBehavioralSourcesFromSnapshots(userId, snapshots);
    }
  } catch (error) {
    console.warn("[behavioral] snapshot fallback failed", {
      userIdPresent: Boolean(userId),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
  }

  console.warn("[behavioral] no live or snapshot evidence available", {
    userIdPresent: Boolean(userId),
  });
  return [];
}

/**
 * Get the connection status for all integrations for a user.
 * Used by the Settings > Integrations UI to show connection state.
 */
export async function getIntegrationsStatus(userId: string) {
  const integrations = await listUserIntegrations(userId);
  return integrations;
}

/**
 * Disconnect an integration (remove stored tokens).
 */
export async function disconnectIntegration(
  userId: string,
  provider: ProviderType,
): Promise<void> {
  await removeIntegration(userId, provider);
}

/**
 * Handle the OAuth callback from a provider.
 * This is called by the callback API routes after the user authorizes.
 */
export async function handleOAuthCallback(input: {
  userId: string;
  provider: ProviderType;
  code: string;
  redirectUri: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const tokens = await exchangeCodeForTokens(input.provider, input.code, input.redirectUri);

    await storeUserTokens({
      userId: input.userId,
      provider: input.provider,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      scopes: tokens.scopes,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "OAuth callback failed",
    };
  }
}

// ─── Internal: Token Exchange ─────────────────────────────────────────────────

async function exchangeCodeForTokens(
  provider: ProviderType,
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scopes: string }> {
  switch (provider) {
    case "google":
      return exchangeGoogleCode(code, redirectUri);
    case "slack":
      return exchangeSlackCode(code, redirectUri);
    default:
      throw new Error(`Token exchange not implemented for provider: ${provider}`);
  }
}

async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scopes: string }> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Google token exchange failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    scopes: data.scope || "",
  };
}

async function exchangeSlackCode(
  code: string,
  redirectUri: string,
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number; scopes: string }> {
  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID || "",
      client_secret: process.env.SLACK_CLIENT_SECRET || "",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Slack token exchange failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    scopes: data.scope?.join(" ") || "",
  };
}
