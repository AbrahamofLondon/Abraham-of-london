/**
 * lib/outbound/x-publishing-audit.ts
 *
 * Audit event helpers for X (Twitter) outbound publishing.
 * Wraps logAuditEvent with X-specific context.
 * Never surfaces token values or credentials.
 */

import { logAuditEvent } from "@/lib/server/audit";

// ─── Event types ──────────────────────────────────────────────────────────────

export type XPublishingAuditEventType =
  | "X_OAUTH_STARTED"
  | "X_OAUTH_CONNECTED"
  | "X_OAUTH_FAILED"
  | "X_PUBLISH_DRY_RUN"
  | "X_POST_PUBLISHED"
  | "X_PUBLISH_BLOCKED"
  | "X_PUBLISH_FAILED"
  | "X_TOKEN_INVALID"
  | "X_SYNCED_FROM_FACEBOOK"
  | "X_SYNCED_FROM_X";

export type XPublishingAuditInput = {
  eventType: XPublishingAuditEventType;
  assetSlug?: string | null;
  assetType?: string | null;
  assetTitle?: string | null;
  tweetId?: string | null;
  syncedFrom?: "facebook" | "x" | null;
  blockerCount?: number;
  blockers?: readonly string[];
  dryRun?: boolean;
  requestId?: string | null;
  actorId?: string | null;
  actorEmailHash?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityFor(eventType: XPublishingAuditEventType) {
  if (eventType === "X_PUBLISH_BLOCKED") return "warn" as const;
  if (eventType === "X_PUBLISH_FAILED") return "warn" as const;
  if (eventType === "X_OAUTH_FAILED") return "warn" as const;
  if (eventType === "X_TOKEN_INVALID") return "warn" as const;
  return "low" as const;
}

function statusFor(eventType: XPublishingAuditEventType) {
  if (eventType === "X_PUBLISH_FAILED") return "failed" as const;
  if (eventType === "X_OAUTH_FAILED") return "failed" as const;
  if (eventType === "X_TOKEN_INVALID") return "failed" as const;
  return "success" as const;
}

// ─── Public helper ────────────────────────────────────────────────────────────

export async function recordXPublishingAuditSafe(
  input: XPublishingAuditInput,
): Promise<{ ok: boolean; warning?: string }> {
  try {
    await logAuditEvent({
      actorType: input.actorId ? "admin" : "system",
      actorId: input.actorId ?? undefined,
      action: input.eventType,
      resourceType: "admin",
      resourceId: input.assetSlug ?? undefined,
      resourceName: "X outbound publishing",
      status: statusFor(input.eventType),
      severity: severityFor(input.eventType),
      requestId: input.requestId ?? undefined,
      tags: ["x", "twitter", "outbound", "publishing"],
      metadata: {
        eventType: input.eventType,
        assetSlug: input.assetSlug ?? null,
        assetType: input.assetType ?? null,
        assetTitle: input.assetTitle ?? null,
        tweetId: input.tweetId ?? null,
        syncedFrom: input.syncedFrom ?? null,
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
        "X publishing action completed but audit event could not be recorded.",
    };
  }
}
