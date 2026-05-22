/**
 * pages/api/admin/outbound/linkedin/diagnostics.ts
 *
 * GET /api/admin/outbound/linkedin/diagnostics
 *
 * Returns LinkedIn connection readiness aligned with the ProviderDiagnostics contract.
 * Never returns token values.
 *
 * Readiness states:
 *   READY              — connected, all scopes present, can publish
 *   NOT_CONNECTED      — no token in DB
 *   MISSING_SCOPE      — connected but missing required OAuth scope
 *   TOKEN_EXPIRED      — token present but expired
 *   TOKEN_INVALID      — token present but cannot be used
 *   CONFIG_MISSING     — required env vars absent
 *   PUBLISHING_DISABLED— publishing explicitly disabled in env config
 *   API_ERROR          — unexpected error from provider API
 *
 * Admin-only.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { getConnectionStatus } from "@/lib/outbound/linkedin-oauth";
import { getLinkedInAppProfileDiagnostics } from "@/lib/integrations/linkedin/linkedin-app-profile";
import { getFailureSummary } from "@/lib/outbound/core/outbound-publish-ledger";
import type { OutboundReadiness } from "@/lib/outbound/core/outbound-provider-contract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  try {
    const status = await getConnectionStatus();
    const appDiagnostics = getLinkedInAppProfileDiagnostics();
    const failureSummary = await getFailureSummary("linkedin", 24);

    // ── Determine readiness ──────────────────────────────────────────────────
    let readiness: OutboundReadiness = "NOT_CONNECTED";
    const warnings: string[] = [];

    if (!appDiagnostics.activeProfileValid) {
      readiness = "CONFIG_MISSING";
      warnings.push(`Active profile "${appDiagnostics.activeProfile}" is not fully configured.`);
    } else if (status.connected && status.status === "active") {
      if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
        readiness = "TOKEN_EXPIRED";
        warnings.push("Access token has expired. Reconnect LinkedIn.");
      } else if (status.selectedPublishingTarget.status === "required_scope_missing") {
        readiness = "MISSING_SCOPE";
        warnings.push(`Missing required scope: ${status.selectedPublishingTarget.requiredScope}.`);
      } else if (status.selectedPublishingTarget.status === "ready") {
        readiness = status.publishingEnabled ? "READY" : "PUBLISHING_DISABLED";
        if (!status.publishingEnabled) {
          warnings.push("LinkedIn publishing is disabled via LINKEDIN_PUBLISHING_ENABLED env var.");
        }
      } else {
        readiness = "NOT_CONNECTED";
        warnings.push(`Publishing target status: ${status.selectedPublishingTarget.status}.`);
      }
    } else if (status.status === "expired") {
      readiness = "TOKEN_EXPIRED";
      warnings.push("Access token has expired. Reconnect LinkedIn.");
    } else if (status.status === "revoked" || status.status === "invalid") {
      readiness = "TOKEN_INVALID";
      warnings.push(`Connection status is "${status.status}". Reconnect LinkedIn.`);
    }

    // ── Build response ───────────────────────────────────────────────────────
    return res.status(200).json({
      ok: true,
      provider: "linkedin",
      connected: status.connected,
      readiness,
      activeProfile: status.activeProfileKey,
      accountLabel: status.ownerName ?? status.displayName,
      pageName: status.ownerType === "organization" ? status.ownerName : null,
      memberName: status.displayName,
      ownerType: status.ownerType,
      ownerUrn: status.ownerUrn, // safe — URN, not token
      organisationId: status.organisationId,

      // Scopes
      grantedScopes: status.scopes,
      missingScopes: status.selectedPublishingTarget.status === "required_scope_missing"
        ? [status.selectedPublishingTarget.requiredScope]
        : [],

      // Capabilities
      canPublishText: readiness === "READY",
      canPublishOrganisation: status.ownerType === "organization" && readiness === "READY",

      // Token lifecycle (safe — no token values)
      tokenExpiresAt: status.expiresAt,
      tokenRefreshAvailable: false, // LinkedIn does not currently support refresh

      // Publishing target
      publishingTarget: {
        ownerType: status.selectedPublishingTarget.ownerType,
        ownerName: status.selectedPublishingTarget.ownerName,
        status: status.selectedPublishingTarget.status,
        isDefault: status.selectedPublishingTarget.isDefaultPublishingTarget,
      },

      // Profiles
      profiles: {
        legacy: {
          configured: appDiagnostics.profiles.legacy.configured,
          connected: status.profiles.legacy.connected,
          status: status.profiles.legacy.status,
          scopes: status.profiles.legacy.scopes,
          missingRequiredScopes: status.profiles.legacy.missingRequiredScopes,
          intendedUse: appDiagnostics.profiles.legacy.intendedUse,
        },
        community: {
          configured: appDiagnostics.profiles.community.configured,
          connected: status.profiles.community.connected,
          status: status.profiles.community.status,
          scopes: status.profiles.community.scopes,
          missingRequiredScopes: status.profiles.community.missingRequiredScopes,
          intendedUse: appDiagnostics.profiles.community.intendedUse,
        },
      },

      // Publishing state
      publishingEnabled: status.publishingEnabled,

      // Failure visibility (Priority 7)
      recentFailures: {
        lastFailure: failureSummary.lastFailure
          ? {
              id: failureSummary.lastFailure.id,
              assetSlug: failureSummary.lastFailure.assetSlug,
              errorCode: failureSummary.lastFailure.errorCode,
              safeMessage: failureSummary.lastFailure.safeMessage,
              createdAt: failureSummary.lastFailure.createdAt,
            }
          : null,
        failureCount24h: failureSummary.failureCount,
        lastSuccess: failureSummary.lastSuccess
          ? {
              id: failureSummary.lastSuccess.id,
              assetSlug: failureSummary.lastSuccess.assetSlug,
              providerPostUrl: failureSummary.lastSuccess.providerPostUrl,
              createdAt: failureSummary.lastSuccess.createdAt,
            }
          : null,
        lastDryRun: failureSummary.lastDryRun
          ? {
              id: failureSummary.lastDryRun.id,
              assetSlug: failureSummary.lastDryRun.assetSlug,
              createdAt: failureSummary.lastDryRun.createdAt,
            }
          : null,
        recentBlockedReasons: failureSummary.recentBlockedReasons,
      },

      // Warnings
      warnings,

      // Status message
      message: status.message,
    });
  } catch (error) {
    console.error("[LINKEDIN_DIAGNOSTICS] Error:", error);
    return res.status(500).json({
      ok: false,
      provider: "linkedin",
      connected: false,
      readiness: "API_ERROR" as OutboundReadiness,
      message: "Error checking LinkedIn connection status.",
      warnings: ["Diagnostics endpoint encountered an unexpected error."],
    });
  }
}