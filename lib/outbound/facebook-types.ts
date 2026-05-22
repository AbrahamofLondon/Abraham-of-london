/**
 * lib/outbound/facebook-types.ts
 *
 * Shared type definitions for Facebook outbound publishing.
 */

export type FacebookAssetType = "blog" | "editorial" | "gmi" | "custom";

export type FacebookConnectionState =
  | "not_connected"
  | "env_token"    // long-lived token from env var (MVP / pre-OAuth)
  | "oauth"        // full OAuth connection stored in DB
  | "expired"
  | "revoked"
  | "invalid";

export type FacebookPublishReadiness =
  | "READY"
  | "NOT_CONNECTED"
  | "MISSING_PERMISSION"
  | "TOKEN_INVALID"
  | "CONFIG_MISSING"
  | "API_ERROR";

export type FacebookConnectionStatus = {
  connected: boolean;
  state: FacebookConnectionState;
  pageId: string | null;
  pageName: string | null;
  requiredPermissions: string[];
  grantedPermissions: string[];
  missingPermissions: string[];
  canPublish: boolean;
  crossPostToXAssumed: boolean | "unknown";
  lastPublishAt: string | null;
  readiness: FacebookPublishReadiness;
  oauthConfigured: boolean;
  envTokenPresent: boolean;
  warning?: string;
};

export type FacebookPublishGateResult = {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
};

export type FacebookPublishedAsset = {
  assetType: FacebookAssetType;
  slug: string;
  title: string;
  text: string;
  link: string | null;
  imagePath: string | null;
};

export type FacebookPublishClientResult = {
  ok: boolean;
  status: "succeeded" | "failed";
  postId?: string;
  postUrl?: string;
  errorCode?: string;
  safeMessage?: string;
};

// Required Meta Graph API permissions for Page publishing
export const FACEBOOK_REQUIRED_PERMISSIONS = [
  "pages_manage_posts",
  "pages_read_engagement",
] as const;

export type FacebookRequiredPermission =
  (typeof FACEBOOK_REQUIRED_PERMISSIONS)[number];

// Allowed asset domains for link validation
export const FACEBOOK_ALLOWED_LINK_PREFIXES = [
  "https://abrahamoflondon.com",
  "https://www.abrahamoflondon.com",
] as const;

// Allowed image path prefixes
export const FACEBOOK_ALLOWED_IMAGE_PREFIXES = [
  "/assets/images/blog",
  "/assets/images/blog-series",
  "/assets/images/editorial",
  "/assets/images/downloads",
] as const;
