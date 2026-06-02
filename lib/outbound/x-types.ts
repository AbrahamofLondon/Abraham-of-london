/**
 * lib/outbound/x-types.ts
 *
 * Shared type definitions for X (Twitter) outbound publishing.
 * Twitter API v2 — POST /2/tweets.
 */

export type XAssetType = "blog" | "editorial" | "gmi" | "custom" | "outbound";

export type XConnectionState =
  | "not_connected"
  | "oauth"          // OAuth 2.0 PKCE connection stored in DB
  | "expired"        // refresh token has expired
  | "revoked"        // connection was revoked
  | "invalid";

export type XPublishReadiness =
  | "READY"
  | "READY_TO_CONNECT"
  | "NOT_CONNECTED"
  | "MISSING_SCOPE"
  | "TOKEN_INVALID"
  | "CONFIG_MISSING"
  | "API_ERROR"
  | "CREDIT_BLOCKED";
  // CREDIT_BLOCKED: OAuth + tweet.write are fine but the X developer account
  // has no API credits (HTTP 402). Dry-run and manual reconciliation remain
  // available; live publish is disabled until credits are restored.

export type XConnectionStatus = {
  connected: boolean;
  state: XConnectionState;
  userId: string | null;
  username: string | null;          // @handle
  scopes: string[];
  missingScopes: string[];
  canPublish: boolean;
  lastPublishAt: string | null;
  readiness: XPublishReadiness;
  oauthConfigured: boolean;
  publishingEnabled: boolean;
  missingEnv: string[];
  requestedScopes: string[];
};

export type XPublishGateResult = {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
};

export type XPublishedAsset = {
  assetType: XAssetType;
  slug: string;
  title: string;
  text: string;             // tweet text — max 280 chars
  link: string | null;      // included in tweet text, not separate
};

export type XPublishClientResult = {
  ok: boolean;
  status: "succeeded" | "failed";
  tweetId?: string;
  tweetUrl?: string;
  errorCode?: string;
  safeMessage?: string;
};

// Required Twitter API v2 scopes
export const X_REQUIRED_SCOPES = [
  "tweet.read",
  "tweet.write",
  "users.read",
  "offline.access",
] as const;

export type XRequiredScope = (typeof X_REQUIRED_SCOPES)[number];

// X OAuth 2.0 PKCE endpoints
export const X_AUTH_URL = "https://x.com/i/oauth2/authorize";
export const X_TOKEN_URL = "https://api.x.com/2/oauth2/token";
export const X_REVOKE_URL = "https://api.x.com/2/oauth2/revoke";
export const X_API_BASE = "https://api.x.com/2";

// Character limits
export const X_TWEET_MAX_CHARS = 280;
// Twitter wraps all URLs to t.co (23 chars). We reserve space accordingly.
export const X_TWEET_URL_LENGTH = 23;

// Allowed link domains for X posts
export const X_ALLOWED_LINK_PREFIXES = [
  "https://abrahamoflondon.com",
  "https://www.abrahamoflondon.com",
] as const;
