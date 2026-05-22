/**
 * lib/outbound/core/outbound-audit.ts
 *
 * Unified outbound publishing audit.
 *
 * Wraps the three provider-specific audit helpers behind a shared event
 * vocabulary and metadata shape. Callers use the unified API; the router
 * dispatches to the appropriate provider audit helper.
 *
 * Shared invariants:
 *   - Audit failures NEVER block publishing (wraps *AuditSafe internally).
 *   - Token values are NEVER included in any audit event.
 *   - All events include: provider, requestId, actorId/hash, syncTargets.
 *   - Events are appended only — no update or delete.
 *
 * Provider-specific events remain in their own audit modules for
 * backward compatibility. This module adds the unified facade on top.
 */

import type { ProviderId } from "./outbound-provider-contract";
import { recordFacebookPublishingAuditSafe } from "@/lib/outbound/facebook-publishing-audit";
import { recordXPublishingAuditSafe } from "@/lib/outbound/x-publishing-audit";
import { recordLinkedInPublishingAuditSafe } from "@/lib/outbound/linkedin-publishing-audit";

// ─── Unified event vocabulary ─────────────────────────────────────────────────

/**
 * The 10 canonical outbound audit events.
 * Provider-specific suffixes are resolved at dispatch time.
 */
export type OutboundAuditEventKind =
  | "OAUTH_STARTED"       // OAuth flow initiated
  | "OAUTH_CONNECTED"     // OAuth callback completed, token stored
  | "OAUTH_FAILED"        // OAuth callback failed (denial, bad state, exchange error)
  | "PUBLISH_DRY_RUN"     // Gate passed, dryRun=true, no actual publish
  | "PUBLISH_BLOCKED"     // Gate rejected the asset
  | "PUBLISH_FAILED"      // Gate passed, API call failed
  | "POST_PUBLISHED"      // Successful publish
  | "TOKEN_INVALID"       // Token resolution failed (expired, revoked, decrypt failure)
  | "SYNCED_FROM_PRIMARY" // Secondary post triggered by a primary provider sync
  | "SYNC_FAILED";        // Secondary sync failed (primary already succeeded)

// ─── Unified audit input ──────────────────────────────────────────────────────

export type OutboundAuditInput = {
  provider: ProviderId;
  eventKind: OutboundAuditEventKind;
  requestId?: string | null;
  actorId?: string | null;
  actorEmailHash?: string | null;
  assetSlug?: string | null;
  assetType?: string | null;
  assetTitle?: string | null;
  /** Providers that were also posted to as part of a sync */
  syncTargets?: ProviderId[];
  blockers?: string[];
  blockerCount?: number;
  postId?: string | null;         // tweet ID, LinkedIn URN, Facebook post ID
  postUrl?: string | null;
  errorCode?: string | null;
  /** LinkedIn-specific: linked GMI report ID */
  linkedReportId?: string | null;
  /** LinkedIn-specific: claim risk level */
  claimRisk?: string | null;
  /** Facebook-specific: page ID */
  pageId?: string | null;
};

// ─── Provider event name mapping ─────────────────────────────────────────────

type FacebookAuditEventType = Parameters<typeof recordFacebookPublishingAuditSafe>[0]["eventType"];
type XAuditEventType = Parameters<typeof recordXPublishingAuditSafe>[0]["eventType"];
type LinkedInAuditEventType = Parameters<typeof recordLinkedInPublishingAuditSafe>[0]["eventType"];

function toFacebookEventType(kind: OutboundAuditEventKind): FacebookAuditEventType | null {
  const map: Partial<Record<OutboundAuditEventKind, FacebookAuditEventType>> = {
    OAUTH_CONNECTED: "FACEBOOK_OAUTH_CONNECTED",
    OAUTH_FAILED: "FACEBOOK_OAUTH_FAILED",
    PUBLISH_DRY_RUN: "FACEBOOK_PUBLISH_DRY_RUN",
    PUBLISH_BLOCKED: "FACEBOOK_PUBLISH_BLOCKED",
    PUBLISH_FAILED: "FACEBOOK_PUBLISH_FAILED",
    POST_PUBLISHED: "FACEBOOK_POST_PUBLISHED",
    TOKEN_INVALID: "FACEBOOK_TOKEN_INVALID",
    SYNCED_FROM_PRIMARY: "FACEBOOK_SYNCED_FROM_X",
  };
  return map[kind] ?? null;
}

function toXEventType(kind: OutboundAuditEventKind): XAuditEventType | null {
  const map: Partial<Record<OutboundAuditEventKind, XAuditEventType>> = {
    OAUTH_STARTED: "X_OAUTH_STARTED",
    OAUTH_CONNECTED: "X_OAUTH_CONNECTED",
    OAUTH_FAILED: "X_OAUTH_FAILED",
    PUBLISH_DRY_RUN: "X_PUBLISH_DRY_RUN",
    PUBLISH_BLOCKED: "X_PUBLISH_BLOCKED",
    PUBLISH_FAILED: "X_PUBLISH_FAILED",
    POST_PUBLISHED: "X_POST_PUBLISHED",
    TOKEN_INVALID: "X_TOKEN_INVALID",
    SYNCED_FROM_PRIMARY: "X_SYNCED_FROM_FACEBOOK",
  };
  return map[kind] ?? null;
}

function toLinkedInEventType(kind: OutboundAuditEventKind): LinkedInAuditEventType | null {
  const map: Partial<Record<OutboundAuditEventKind, LinkedInAuditEventType>> = {
    OAUTH_CONNECTED: "LINKEDIN_OAUTH_CONNECTED",
    OAUTH_FAILED: "LINKEDIN_OAUTH_REVOKED", // closest available
    PUBLISH_BLOCKED: "LINKEDIN_PUBLISH_BLOCKED",
    PUBLISH_FAILED: "LINKEDIN_POST_FAILED",
    POST_PUBLISHED: "LINKEDIN_POST_PUBLISHED",
  };
  return map[kind] ?? null;
}

// ─── Unified record function ──────────────────────────────────────────────────

/**
 * Record an outbound publishing audit event.
 *
 * Routes to the provider-specific audit helper based on `input.provider`.
 * Returns { ok: boolean; warning?: string }. Failures are soft — they never
 * block the publish operation itself.
 */
export async function recordOutboundAudit(
  input: OutboundAuditInput,
): Promise<{ ok: boolean; warning?: string }> {
  try {
    switch (input.provider) {
      case "facebook": {
        const eventType = toFacebookEventType(input.eventKind);
        if (!eventType) {
          return { ok: true }; // Event not mapped for this provider — silently skip
        }
        return recordFacebookPublishingAuditSafe({
          eventType,
          assetSlug: input.assetSlug ?? null,
          assetType: input.assetType ?? null,
          assetTitle: input.assetTitle ?? null,
          pageId: input.pageId ?? null,
          postId: input.postId ?? null,
          postUrl: input.postUrl ?? null,
          requestId: input.requestId ?? null,
          actorId: input.actorId ?? null,
          actorEmailHash: input.actorEmailHash ?? null,
          blockers: input.blockers ?? [],
          blockerCount: input.blockerCount ?? (input.blockers?.length ?? 0),
          errorCode: input.errorCode ?? null,
          syncTargets: input.syncTargets?.map(String),
        });
      }

      case "x": {
        const eventType = toXEventType(input.eventKind);
        if (!eventType) {
          return { ok: true };
        }
        return recordXPublishingAuditSafe({
          eventType,
          assetSlug: input.assetSlug ?? null,
          assetType: input.assetType ?? null,
          assetTitle: input.assetTitle ?? null,
          tweetId: input.postId ?? null,
          tweetUrl: input.postUrl ?? null,
          requestId: input.requestId ?? null,
          actorId: input.actorId ?? null,
          actorEmailHash: input.actorEmailHash ?? null,
          blockers: input.blockers ?? [],
          blockerCount: input.blockerCount ?? (input.blockers?.length ?? 0),
          errorCode: input.errorCode ?? null,
          syncTargets: input.syncTargets?.map(String),
        });
      }

      case "linkedin": {
        const eventType = toLinkedInEventType(input.eventKind);
        if (!eventType) {
          return { ok: true };
        }
        return recordLinkedInPublishingAuditSafe({
          eventType,
          outboundSlug: input.assetSlug ?? null,
          linkedReportId: input.linkedReportId ?? null,
          claimRisk: input.claimRisk ?? null,
          blockerCount: input.blockerCount ?? (input.blockers?.length ?? 0),
          blockers: input.blockers ?? [],
          postUrn: input.postId ?? null,
          requestId: input.requestId ?? null,
          actorId: input.actorId ?? null,
          actorEmailHash: input.actorEmailHash ?? null,
        });
      }
    }
  } catch {
    return {
      ok: false,
      warning: `Audit event ${input.eventKind} for ${input.provider} could not be recorded.`,
    };
  }
}

// ─── Batch audit ──────────────────────────────────────────────────────────────

/**
 * Record multiple audit events in parallel.
 * All results are collected — failures do not abort the batch.
 */
export async function recordOutboundAuditBatch(
  events: OutboundAuditInput[],
): Promise<Array<{ ok: boolean; warning?: string }>> {
  return Promise.all(events.map((e) => recordOutboundAudit(e)));
}
