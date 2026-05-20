import { logAuditEvent } from "@/lib/server/audit";

export type LinkedInPublishingAuditEventType =
  | "LINKEDIN_OAUTH_CONNECTED"
  | "LINKEDIN_OAUTH_REVOKED"
  | "LINKEDIN_PUBLISH_GATE_RUN"
  | "LINKEDIN_PUBLISH_BLOCKED"
  | "LINKEDIN_POST_PUBLISHED"
  | "LINKEDIN_POST_FAILED";

export type LinkedInPublishingAuditInput = {
  eventType: LinkedInPublishingAuditEventType;
  outboundSlug?: string | null;
  linkedReportId?: string | null;
  claimRisk?: string | null;
  blockerCount?: number;
  blockers?: readonly string[];
  postUrn?: string | null;
  requestId?: string | null;
  actorId?: string | null;
  actorEmailHash?: string | null;
};

export async function recordLinkedInPublishingAuditSafe(
  input: LinkedInPublishingAuditInput,
): Promise<{ ok: boolean; warning?: string }> {
  try {
    await logAuditEvent({
      actorType: input.actorId ? "admin" : "system",
      actorId: input.actorId ?? undefined,
      action: input.eventType,
      resourceType: "admin",
      resourceId: input.outboundSlug ?? undefined,
      resourceName: "LinkedIn outbound publishing",
      status: input.eventType === "LINKEDIN_POST_FAILED" ? "failed" : "success",
      severity: input.eventType === "LINKEDIN_PUBLISH_BLOCKED" ? "warn" : "low",
      requestId: input.requestId ?? undefined,
      tags: ["linkedin", "outbound", "publishing"],
      metadata: {
        eventType: input.eventType,
        outboundSlug: input.outboundSlug ?? null,
        linkedReportId: input.linkedReportId ?? null,
        claimRisk: input.claimRisk ?? null,
        blockerCount: input.blockerCount ?? 0,
        blockers: (input.blockers ?? []).slice(0, 20),
        postUrn: input.postUrn ?? null,
        timestamp: new Date().toISOString(),
        requestId: input.requestId ?? null,
        actorEmailHash: input.actorEmailHash ?? null,
      },
    });
    return { ok: true };
  } catch {
    return {
      ok: false,
      warning: "LinkedIn publishing action completed but audit event could not be recorded.",
    };
  }
}
