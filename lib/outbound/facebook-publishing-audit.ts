/**
 * lib/outbound/facebook-publishing-audit.ts
 *
 * Audit event helpers for Facebook outbound publishing.
 * Wraps logAuditEvent with Facebook-specific context.
 * Never surfaces token values or raw credentials.
 */

import { logAuditEvent } from "@/lib/server/audit";

// ─── Event types ──────────────────────────────────────────────────────────────

export type FacebookPublishingAuditEventType =
  | "FACEBOOK_OAUTH_STARTED"
  | "FACEBOOK_OAUTH_CONNECTED"
  | "FACEBOOK_OAUTH_FAILED"
  | "FACEBOOK_PUBLISH_DRY_RUN"
  | "FACEBOOK_POST_PUBLISHED"
  | "FACEBOOK_PUBLISH_BLOCKED"
  | "FACEBOOK_PUBLISH_FAILED"
  | "FACEBOOK_TOKEN_INVALID";

export type FacebookPublishingAuditInput = {
  eventType: FacebookPublishingAuditEventType;
  assetSlug?: string | null;
  assetType?: string | null;
  assetTitle?: string | null;
  pageId?: string | null;
  facebookPostId?: string | null;
  blockerCount?: number;
  blockers?: readonly string[];
  dryRun?: boolean;
  requestId?: string | null;
  actorId?: string | null;
  actorEmailHash?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityFor(eventType: FacebookPublishingAuditEventType) {
  if (eventType === "FACEBOOK_PUBLISH_BLOCKED") return "warn" as const;
  if (eventType === "FACEBOOK_PUBLISH_FAILED") return "warn" as const;
  if (eventType === "FACEBOOK_OAUTH_FAILED") return "warn" as const;
  if (eventType === "FACEBOOK_TOKEN_INVALID") return "warn" as const;
  return "low" as const;
}

function statusFor(eventType: FacebookPublishingAuditEventType) {
  if (eventType === "FACEBOOK_PUBLISH_FAILED") return "failed" as const;
  if (eventType === "FACEBOOK_OAUTH_FAILED") return "failed" as const;
  if (eventType === "FACEBOOK_TOKEN_INVALID") return "failed" as const;
  return "success" as const;
}

// ─── Public helper ────────────────────────────────────────────────────────────

export async function recordFacebookPublishingAuditSafe(
  input: FacebookPublishingAuditInput,
): Promise<{ ok: boolean; warning?: string }> {
  try {
    await logAuditEvent({
      actorType: input.actorId ? "admin" : "system",
      actorId: input.actorId ?? undefined,
      action: input.eventType,
      resourceType: "admin",
      resourceId: input.assetSlug ?? undefined,
      resourceName: "Facebook outbound publishing",
      status: statusFor(input.eventType),
      severity: severityFor(input.eventType),
      requestId: input.requestId ?? undefined,
      tags: ["facebook", "outbound", "publishing"],
      metadata: {
        eventType: input.eventType,
        assetSlug: input.assetSlug ?? null,
        assetType: input.assetType ?? null,
        assetTitle: input.assetTitle ?? null,
        pageId: input.pageId ?? null,
        facebookPostId: input.facebookPostId ?? null,
        blockerCount: input.blockerCount ?? 0,
        blockers: (input.blockers ?? []).slice(0, 20),
        dryRun: input.dryRun ?? false,
        timestamp: new Date().toISOString(),
        requestId: input.requestId ?? null,
        actorEmailHash: input.actorEmailHash ?? null,
      },
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      warning:
        "Facebook publishing action completed but audit event could not be recorded.",
    };
  }
}
