/**
 * lib/outbound/core/outbound-readiness-resolver.ts
 *
 * Canonical provider readiness resolver.
 *
 * Derives outbound provider states from live system evidence:
 *   env vars, OAuth records, token state, scopes, ledger errors.
 *
 * Dashboard must render resolver output only — no hardcoded statuses in JSX.
 *
 * Status priority (first matched wins):
 *   DISABLED > CONFIG_REQUIRED > OAUTH_REQUIRED > TOKEN_EXPIRED
 *   > BUSINESS_VERIFICATION_FAILED > SCOPE_REQUIRED > CREDIT_BLOCKED
 *   > PUBLISH_BLOCKED > READY
 */

import type { ProviderId } from "./outbound-provider-contract";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import { getConnectionStatus, getLinkedInOAuthSmokeDiagnostics } from "@/lib/outbound/linkedin-oauth";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";
import {
  findLatestLiveXPublishAttempt,
  isActiveXCreditBlockerAttempt,
} from "@/lib/outbound/x-credit-blocker";
import { prisma } from "@/lib/prisma.server";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolvedStatus =
  | "DISABLED"
  | "CONFIG_REQUIRED"
  | "OAUTH_REQUIRED"
  | "TOKEN_EXPIRED"
  | "BUSINESS_VERIFICATION_FAILED"
  | "SCOPE_REQUIRED"
  | "CREDIT_BLOCKED"
  | "PUBLISH_BLOCKED"
  | "READY";

export type ReadinessEvidence = {
  /** The resolved status */
  status: ResolvedStatus;
  /** Human-readable summary */
  summary: string;
  /** Ordered list of evidence items that led to this status */
  evidence: string[];
  /** Next action for the admin */
  nextAction: string;
  /** Whether publishing is possible right now */
  canPublish: boolean;
  /** Whether publishing is enabled in env config */
  publishingEnabled: boolean;
  /** Whether OAuth is configured (env vars present) */
  oauthConfigured: boolean;
  /** Whether a token is stored */
  tokenPresent: boolean;
  /** Whether the token is expired */
  tokenExpired: boolean | null;
  /** Granted scopes */
  grantedScopes: string[];
  /** Missing required scopes */
  missingScopes: string[];
  /** Provider-specific metadata */
  providerMeta: Record<string, unknown>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hasAnyEnv(names: string[]): boolean {
  return names.some((n) => {
    const v = process.env[n];
    return typeof v === "string" && v.trim().length > 0;
  });
}

// ─── X Readiness ──────────────────────────────────────────────────────────────

export async function resolveXReadiness(): Promise<ReadinessEvidence> {
  const evidence: string[] = [];
  const publishingEnabled = process.env.X_PUBLISHING_ENABLED === "true";

  // 1. DISABLED
  if (!publishingEnabled) {
    return {
      status: "DISABLED",
      summary: "X publishing is disabled via X_PUBLISHING_ENABLED env var.",
      evidence: ["X_PUBLISHING_ENABLED is not set to true"],
      nextAction: "Set X_PUBLISHING_ENABLED=true to enable X publishing.",
      canPublish: false,
      publishingEnabled: false,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 2. CONFIG_REQUIRED
  const oauthConfigured = hasAnyEnv(["X_CLIENT_ID"]);
  if (!oauthConfigured) {
    return {
      status: "CONFIG_REQUIRED",
      summary: "X OAuth credentials are not configured.",
      evidence: ["Missing X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI"],
      nextAction: "Set X_CLIENT_ID, X_CLIENT_SECRET, X_REDIRECT_URI, and X_TOKEN_ENCRYPTION_KEY.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 3. Get live connection status
  const status = await getXConnectionStatus();
  const tokenPresent = status.connected && status.state !== "not_connected";

  // 4. OAUTH_REQUIRED
  if (!tokenPresent) {
    return {
      status: "OAUTH_REQUIRED",
      summary: "X OAuth flow has not been completed.",
      evidence: ["No X OAuth connection record found in database"],
      nextAction: "Connect X account via OAuth at /admin/outbound/x.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: status.missingScopes,
      providerMeta: {},
    };
  }

  // 5. TOKEN_EXPIRED
  if (status.state === "expired" || status.readiness === "TOKEN_INVALID") {
    return {
      status: "TOKEN_EXPIRED",
      summary: "X access token has expired or is invalid.",
      evidence: [`Token state: ${status.state}`],
      nextAction: "Reconnect X account via OAuth at /admin/outbound/x.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: true,
      grantedScopes: status.scopes,
      missingScopes: status.missingScopes,
      providerMeta: {},
    };
  }

  // 6. SCOPE_REQUIRED
  if (!status.scopes.includes("tweet.write")) {
    return {
      status: "SCOPE_REQUIRED",
      summary: "X OAuth token is missing required scope: tweet.write.",
      evidence: [`Granted scopes: ${status.scopes.join(", ")}`, "Missing: tweet.write"],
      nextAction: "Reconnect X with tweet.write scope included.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: ["tweet.write"],
      providerMeta: {},
    };
  }

  // 7. CREDIT_BLOCKED
  const recentAttempts = await prisma.xPublishAttempt
    .findMany({
      where: { dryRun: false, status: { in: ["failed", "succeeded", "blocked"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { errorCode: true, status: true, dryRun: true, createdAt: true },
    })
    .catch(() => []);
  const creditBlocked = isActiveXCreditBlockerAttempt(
    findLatestLiveXPublishAttempt(recentAttempts),
  );

  if (creditBlocked) {
    return {
      status: "CREDIT_BLOCKED",
      summary: "X API credits exhausted. OAuth and scopes are valid — this is a billing issue.",
      evidence: [
        "OAuth connected and tweet.write scope granted",
        "Latest live publish returned HTTP 402 / X_CREDIT_BLOCKED",
      ],
      nextAction: "Add X API credits or verify billing for this developer app.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: [],
      providerMeta: { creditBlocked: true },
    };
  }

  // 8. READY
  return {
    status: "READY",
    summary: "X publishing is ready.",
    evidence: [
      "OAuth configured and connected",
      "tweet.write scope granted",
      "No active credit blocker",
    ],
    nextAction: "Run dry-run on a selected approved post.",
    canPublish: status.canPublish,
    publishingEnabled: true,
    oauthConfigured: true,
    tokenPresent: true,
    tokenExpired: false,
    grantedScopes: status.scopes,
    missingScopes: [],
    providerMeta: {},
  };
}

// ─── LinkedIn Readiness ────────────────────────────────────────────────────────

export async function resolveLinkedInReadiness(): Promise<ReadinessEvidence> {
  const evidence: string[] = [];
  const publishingEnabled = process.env.LINKEDIN_PUBLISHING_ENABLED === "true";

  // 1. DISABLED
  if (!publishingEnabled) {
    return {
      status: "DISABLED",
      summary: "LinkedIn publishing is disabled via LINKEDIN_PUBLISHING_ENABLED env var.",
      evidence: ["LINKEDIN_PUBLISHING_ENABLED is not set to true"],
      nextAction: "Set LINKEDIN_PUBLISHING_ENABLED=true to enable LinkedIn publishing.",
      canPublish: false,
      publishingEnabled: false,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 2. CONFIG_REQUIRED
  const smoke = await getLinkedInOAuthSmokeDiagnostics();
  const oauthConfigured = smoke.configured;

  if (!oauthConfigured) {
    return {
      status: "CONFIG_REQUIRED",
      summary: "LinkedIn OAuth credentials are not fully configured.",
      evidence: smoke.missingEnv.length > 0
        ? [`Missing env vars: ${smoke.missingEnv.join(", ")}`]
        : ["LinkedIn app profile is incomplete"],
      nextAction: "Set LINKEDIN_LEGACY_CLIENT_ID, LINKEDIN_LEGACY_CLIENT_SECRET, LINKEDIN_LEGACY_REDIRECT_URI, and LINKEDIN_TOKEN_ENCRYPTION_KEY.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: smoke.requestedScopes,
      providerMeta: {},
    };
  }

  // 3. Get live connection status
  const status = await getConnectionStatus();
  const tokenPresent = status.connected && status.status !== "not_connected";

  // 4. OAUTH_REQUIRED
  if (!tokenPresent) {
    return {
      status: "OAUTH_REQUIRED",
      summary: "LinkedIn OAuth flow has not been completed.",
      evidence: ["No LinkedIn OAuth connection record found in database"],
      nextAction: "Connect LinkedIn via /admin/outbound/linkedin.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: smoke.requestedScopes,
      providerMeta: {},
    };
  }

  // 5. TOKEN_EXPIRED
  if (status.status === "expired" || smoke.tokenExpired === true) {
    return {
      status: "TOKEN_EXPIRED",
      summary: "LinkedIn access token has expired.",
      evidence: [`Token status: ${status.status}`],
      nextAction: "Reconnect LinkedIn via /admin/outbound/linkedin.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: true,
      grantedScopes: status.scopes,
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 6. BUSINESS_VERIFICATION_FAILED
  // LinkedIn requires the developer app to be verified for organisation access.
  // This is detected when the token is valid but the org publishing target
  // reports a non-ready status that isn't scope-related.
  const targetStatus = status.selectedPublishingTarget?.status;
  const isOrgTarget = status.selectedPublishingTarget?.ownerType === "organization";
  const hasOrgScope = status.scopes.includes("w_organization_social");
  const orgUrnConfigured = smoke.organizationUrnConfigured;

  if (isOrgTarget && hasOrgScope && orgUrnConfigured && targetStatus !== "ready") {
    return {
      status: "BUSINESS_VERIFICATION_FAILED",
      summary: "LinkedIn organisation publishing requires verified legal organisation identity.",
      evidence: [
        "OAuth connected and w_organization_social scope granted",
        `Publishing target status: ${targetStatus}`,
        "LinkedIn must approve the developer app for organisation access",
      ],
      nextAction: "Verify Abraham of London legal entity with LinkedIn and request organisation access approval.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: [],
      providerMeta: { targetStatus, orgUrnConfigured },
    };
  }

  // 7. SCOPE_REQUIRED
  const missingOrgScope = isOrgTarget && !hasOrgScope;
  if (missingOrgScope) {
    return {
      status: "SCOPE_REQUIRED",
      summary: "LinkedIn OAuth token is missing required scope: w_organization_social.",
      evidence: [
        `Granted scopes: ${status.scopes.join(", ")}`,
        "Missing: w_organization_social",
      ],
      nextAction: "Reconnect LinkedIn with w_organization_social scope included.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: ["w_organization_social"],
      providerMeta: {},
    };
  }

  // 8. ORG_URN_MISSING (sub-type of PUBLISH_BLOCKED)
  if (isOrgTarget && !orgUrnConfigured) {
    return {
      status: "PUBLISH_BLOCKED",
      summary: "LinkedIn organization URN is not configured.",
      evidence: ["LINKEDIN_ORGANIZATION_URN is not set"],
      nextAction: "Set LINKEDIN_ORGANIZATION_URN=urn:li:organization:<id>.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: [],
      providerMeta: { orgUrnConfigured: false },
    };
  }

  // 9. READY
  if (targetStatus === "ready") {
    return {
      status: "READY",
      summary: "LinkedIn publishing is ready.",
      evidence: [
        "OAuth configured and connected",
        "w_organization_social scope granted",
        "Organization URN configured",
        "Publishing target ready",
      ],
      nextAction: "Run dry-run on a selected LinkedIn campaign post.",
      canPublish: true,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.scopes,
      missingScopes: [],
      providerMeta: { targetStatus, orgUrnConfigured },
    };
  }

  // Fallback: PUBLISH_BLOCKED
  return {
    status: "PUBLISH_BLOCKED",
    summary: `LinkedIn publishing is blocked (target status: ${targetStatus}).`,
    evidence: [`Publishing target status: ${targetStatus}`],
    nextAction: "Check LinkedIn connection diagnostics at /admin/outbound/linkedin.",
    canPublish: false,
    publishingEnabled: true,
    oauthConfigured: true,
    tokenPresent: true,
    tokenExpired: false,
    grantedScopes: status.scopes,
    missingScopes: [],
    providerMeta: { targetStatus },
  };
}

// ─── Facebook Readiness ────────────────────────────────────────────────────────

export async function resolveFacebookReadiness(): Promise<ReadinessEvidence> {
  const evidence: string[] = [];
  const publishingEnabled = process.env.FACEBOOK_PUBLISHING_ENABLED === "true";

  // 1. DISABLED
  if (!publishingEnabled) {
    return {
      status: "DISABLED",
      summary: "Facebook publishing is disabled via FACEBOOK_PUBLISHING_ENABLED env var.",
      evidence: ["FACEBOOK_PUBLISHING_ENABLED is not set to true"],
      nextAction: "Set FACEBOOK_PUBLISHING_ENABLED=true to enable Facebook publishing.",
      canPublish: false,
      publishingEnabled: false,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 2. CONFIG_REQUIRED
  const oauthConfigured = hasAnyEnv(["FACEBOOK_APP_ID"]);
  const pageIdPresent = hasAnyEnv(["FACEBOOK_PAGE_ID"]);

  if (!oauthConfigured || !pageIdPresent) {
    const missing: string[] = [];
    if (!oauthConfigured) missing.push("FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI");
    if (!pageIdPresent) missing.push("FACEBOOK_PAGE_ID");
    return {
      status: "CONFIG_REQUIRED",
      summary: "Facebook app/page credentials are not fully configured.",
      evidence: missing.map((m) => `Missing: ${m}`),
      nextAction: "Set FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_REDIRECT_URI, and FACEBOOK_PAGE_ID.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: false,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: [],
      providerMeta: {},
    };
  }

  // 3. Get live connection status
  const status = await getFacebookConnectionStatus();
  const tokenPresent = status.connected || status.state === "env_token";

  // 4. OAUTH_REQUIRED
  if (!tokenPresent) {
    return {
      status: "OAUTH_REQUIRED",
      summary: "Facebook OAuth flow has not been completed.",
      evidence: ["No Facebook OAuth connection or env token found"],
      nextAction: "Connect Facebook Page via OAuth at /admin/outbound/facebook.",
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: false,
      tokenExpired: null,
      grantedScopes: [],
      missingScopes: status.requiredPermissions,
      providerMeta: {},
    };
  }

  // 5. SCOPE_REQUIRED
  if (status.missingPermissions.length > 0) {
    return {
      status: "SCOPE_REQUIRED",
      summary: "Facebook token is missing required permissions.",
      evidence: [
        `Granted permissions: ${status.grantedPermissions.join(", ")}`,
        `Missing: ${status.missingPermissions.join(", ")}`,
      ],
      nextAction: `Grant missing permissions: ${status.missingPermissions.join(", ")}.`,
      canPublish: false,
      publishingEnabled: true,
      oauthConfigured: true,
      tokenPresent: true,
      tokenExpired: false,
      grantedScopes: status.grantedPermissions,
      missingScopes: status.missingPermissions,
      providerMeta: {},
    };
  }

  // 6. READY
  return {
    status: "READY",
    summary: "Facebook publishing is ready.",
    evidence: [
      "Facebook app configured",
      "Page token present",
      "Required permissions granted",
    ],
    nextAction: "Run dry-run on a selected approved post.",
    canPublish: status.canPublish,
    publishingEnabled: true,
    oauthConfigured: true,
    tokenPresent: true,
    tokenExpired: false,
    grantedScopes: status.grantedPermissions,
    missingScopes: [],
    providerMeta: {},
  };
}

// ─── Unified resolver ──────────────────────────────────────────────────────────

export async function resolveOutboundProviderReadiness(
  provider: ProviderId,
): Promise<ReadinessEvidence> {
  switch (provider) {
    case "x":
      return resolveXReadiness();
    case "linkedin":
      return resolveLinkedInReadiness();
    case "facebook":
      return resolveFacebookReadiness();
  }
}
