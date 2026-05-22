/**
 * lib/outbound/core/outbound-provider-contract.ts
 *
 * Shared contract types for all outbound publishing providers.
 * Facebook, X, and LinkedIn are all provider-specific adapters of these types.
 *
 * SECURITY INVARIANTS:
 * - Tokens are never included in any type here.
 * - Diagnostics never return token values.
 * - ProviderId is the canonical union — never use raw strings.
 */

// ─── Provider identity ────────────────────────────────────────────────────────

export type ProviderId = "facebook" | "x" | "linkedin";

// ─── Asset types ──────────────────────────────────────────────────────────────

export type OutboundAssetType =
  | "blog"        // blog post or blog series part
  | "editorial"   // editorial / essay
  | "gmi"         // Global Market Intelligence report
  | "enterprise"  // enterprise content
  | "custom";     // manually composed post

// ─── Connection readiness ─────────────────────────────────────────────────────

/**
 * Unified readiness vocabulary across all providers.
 * Each provider maps its own internal readiness to this set.
 */
export type OutboundReadiness =
  | "READY"              // connected, all scopes/permissions present, can publish
  | "NOT_CONNECTED"      // no token in DB, no env fallback
  | "MISSING_SCOPE"      // connected but missing required OAuth scope/permission
  | "TOKEN_INVALID"      // token present but cannot be used (expired, revoked, decryption failure)
  | "CONFIG_MISSING"     // required env vars absent (e.g. no encryption key, no client ID)
  | "PUBLISHING_DISABLED"// publishing explicitly disabled in env config
  | "API_ERROR";         // unexpected error from provider API during diagnostics

// ─── Provider diagnostics ─────────────────────────────────────────────────────

/**
 * Minimal safe representation of a provider connection status.
 * Never includes token values. Safe to serialise and send to admin UI.
 */
export type ProviderDiagnostics = {
  provider: ProviderId;
  connected: boolean;
  readiness: OutboundReadiness;
  /** Display name of the connected account or page */
  accountLabel: string | null;
  /** Scopes or permissions currently granted */
  grantedScopes: string[];
  /** Scopes or permissions required but absent */
  missingScopes: string[];
  /** ISO-8601 token expiry, if known */
  expiresAt: string | null;
  /** ISO-8601 timestamp of last successful publish attempt */
  lastPublishAt: string | null;
  /** Human-readable status summary */
  message: string;
  /** Optional structured warnings (e.g. env token in use, approaching rate limit) */
  warnings: string[];
};

// ─── Outbound draft ───────────────────────────────────────────────────────────

/**
 * A resolved, pre-validated content draft ready for gate evaluation.
 * Provider-specific fields (e.g. imagePath for Facebook) are in `meta`.
 */
export type OutboundDraft = {
  provider: ProviderId;
  assetType: OutboundAssetType;
  slug: string;
  title: string;
  /** Primary post text. For X this is the full tweet body (≤ 280 weighted chars). */
  text: string;
  /** Optional first-party link to include. Validated against provider allowlist. */
  link: string | null;
  /** Provider-specific metadata (image path, org URN, ownerType, etc.) */
  meta: Record<string, unknown>;
};

// ─── Publish request ──────────────────────────────────────────────────────────

/**
 * The governed publish request passed to a provider adapter.
 * Gate must pass before this is acted on.
 */
export type OutboundPublishRequest = {
  provider: ProviderId;
  draft: OutboundDraft;
  requestId: string;
  /** Actor performing the action — hashed before storage */
  actorId: string | null;
  actorEmailHash: string | null;
  /** If true: validate only, do not publish */
  dryRun: boolean;
  /** Must be true to proceed past gate to actual publish */
  finalApproval: boolean;
  /** Optional sync targets — publish to these providers after primary succeeds */
  syncTargets: ProviderId[];
};

// ─── Publish result ───────────────────────────────────────────────────────────

export type OutboundSyncOutcome = {
  provider: ProviderId;
  ok: boolean;
  postUrl?: string;
  errorCode?: string;
  safeMessage?: string;
};

export type OutboundPublishResult = {
  ok: boolean;
  provider: ProviderId;
  requestId: string;
  dryRun: boolean;
  /** The URL of the published post, if available */
  postUrl?: string;
  /** Provider-specific post identifier (tweet ID, post URN, etc.) */
  postId?: string;
  /** Gate blockers if the publish was not allowed */
  blockers?: string[];
  /** Gate warnings (non-blocking) */
  warnings?: string[];
  /** Error code if the publish failed */
  errorCode?: string;
  /** Safe error message — never includes token values */
  safeMessage?: string;
  /** Results of any sync targets */
  syncResults?: OutboundSyncOutcome[];
};

// ─── Gate result ──────────────────────────────────────────────────────────────

/**
 * Shared gate result shape. All three provider gates return this shape.
 */
export type OutboundGateResult = {
  allowed: boolean;
  blockers: string[];
  warnings: string[];
};

// ─── Provider adapter interface ───────────────────────────────────────────────

/**
 * Interface that each provider adapter must satisfy.
 * Adapters are not required to implement all methods — use partial adapters
 * where providers do not support a capability (e.g. LinkedIn has no sync).
 */
export interface OutboundProviderAdapter {
  readonly provider: ProviderId;

  /** Return current connection diagnostics (never includes token) */
  getDiagnostics(): Promise<ProviderDiagnostics>;

  /** Evaluate the gate for this draft */
  evaluateGate(draft: OutboundDraft): OutboundGateResult | Promise<OutboundGateResult>;

  /** Publish the draft (must not be called unless gate passed and finalApproval=true) */
  publish(request: OutboundPublishRequest): Promise<OutboundPublishResult>;
}
