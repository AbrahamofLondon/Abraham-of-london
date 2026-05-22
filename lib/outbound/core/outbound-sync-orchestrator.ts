/**
 * lib/outbound/core/outbound-sync-orchestrator.ts
 *
 * Governed cross-provider sync for outbound publishing.
 *
 * Rules enforced:
 *   1. Primary-first: the primary provider must succeed before any sync.
 *   2. Sync failure does not fail the primary result.
 *   3. No circular posting: a sync target cannot be the same as the primary provider.
 *   4. No double-posting: each provider appears at most once in sync targets.
 *   5. dryRun propagates: if the primary request is a dry run, syncs are skipped.
 *   6. Admin preview per provider: canSyncTo() checks target connection readiness.
 *   7. All sync attempts are audited regardless of outcome.
 *
 * Sync adapters (Facebook ↔ X) live here as private functions.
 * LinkedIn currently has no sync capability.
 *
 * Server-only — uses provider publishing clients and audit helpers.
 */

import type { ProviderId, OutboundPublishResult, OutboundSyncOutcome } from "./outbound-provider-contract";
import type { OutboundPublishRequest } from "./outbound-provider-contract";
import { recordOutboundAudit } from "./outbound-audit";

// ─── Provider client imports ──────────────────────────────────────────────────

import { publishTweetToX } from "@/lib/outbound/x-publishing-client";
import { publishLinkPostToFacebook } from "@/lib/outbound/facebook-publishing-client";
import { adaptFacebookTextToTweet } from "@/lib/outbound/x-content-resolver";

// ─── Connection status imports ────────────────────────────────────────────────

import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";

// ─── Sync capability registry ─────────────────────────────────────────────────

/**
 * Valid sync paths between providers.
 * LinkedIn currently has no sync support.
 */
const SYNC_PATHS: Array<{ from: ProviderId; to: ProviderId }> = [
  { from: "facebook", to: "x" },
  { from: "x", to: "facebook" },
];

export function isSyncSupported(from: ProviderId, to: ProviderId): boolean {
  return SYNC_PATHS.some((p) => p.from === from && p.to === to);
}

/**
 * Validate and deduplicate sync targets for a given primary provider.
 * Removes: the primary provider itself, unsupported paths, and duplicates.
 */
export function normaliseSyncTargets(
  primary: ProviderId,
  requested: ProviderId[],
): ProviderId[] {
  const seen = new Set<ProviderId>();
  const result: ProviderId[] = [];
  for (const target of requested) {
    if (target === primary) continue; // no circular posting
    if (!isSyncSupported(primary, target)) continue;
    if (seen.has(target)) continue; // no double-posting
    seen.add(target);
    result.push(target);
  }
  return result;
}

// ─── Target readiness check ───────────────────────────────────────────────────

/**
 * Check whether a sync target provider is currently ready to receive a post.
 * Used to show per-provider sync availability in admin UI before publishing.
 */
export async function canSyncTo(target: ProviderId): Promise<boolean> {
  try {
    switch (target) {
      case "x": {
        const status = await getXConnectionStatus();
        return status.canPublish;
      }
      case "facebook": {
        const status = await getFacebookConnectionStatus();
        return status.canPublish;
      }
      case "linkedin":
        return false; // LinkedIn sync not supported
    }
  } catch {
    return false;
  }
}

// ─── Sync adapters ────────────────────────────────────────────────────────────

/**
 * Sync a Facebook post to X.
 * Adapts Facebook text to tweet format (first paragraph + URL, max 280 chars).
 */
async function syncFacebookToX(
  request: OutboundPublishRequest,
): Promise<OutboundSyncOutcome> {
  const { draft } = request;
  const tweetText = adaptFacebookTextToTweet(draft.text, draft.link);
  const result = await publishTweetToX({ text: tweetText, dryRun: false });

  await recordOutboundAudit({
    provider: "x",
    eventKind: result.ok ? "SYNCED_FROM_PRIMARY" : "SYNC_FAILED",
    requestId: request.requestId,
    actorId: request.actorId,
    actorEmailHash: request.actorEmailHash,
    assetSlug: draft.slug,
    assetType: draft.assetType,
    assetTitle: draft.title,
    postId: result.tweetId,
    postUrl: result.tweetUrl,
    errorCode: result.errorCode,
  }).catch(() => null); // audit failure never surfaces to caller

  return {
    provider: "x",
    ok: result.ok,
    postUrl: result.tweetUrl,
    errorCode: result.errorCode,
    safeMessage: result.safeMessage,
  };
}

/**
 * Sync an X post to Facebook.
 * Posts as a link post using the draft's text and link.
 */
async function syncXToFacebook(
  request: OutboundPublishRequest,
): Promise<OutboundSyncOutcome> {
  const { draft } = request;
  const result = await publishLinkPostToFacebook({
    message: draft.text,
    link: draft.link,
    // imagePath not available on X posts
  });

  await recordOutboundAudit({
    provider: "facebook",
    eventKind: result.ok ? "SYNCED_FROM_PRIMARY" : "SYNC_FAILED",
    requestId: request.requestId,
    actorId: request.actorId,
    actorEmailHash: request.actorEmailHash,
    assetSlug: draft.slug,
    assetType: draft.assetType,
    assetTitle: draft.title,
    postId: result.postId,
    postUrl: result.postUrl,
    errorCode: result.errorCode,
  }).catch(() => null);

  return {
    provider: "facebook",
    ok: result.ok,
    postUrl: result.postUrl,
    errorCode: result.errorCode,
    safeMessage: result.safeMessage,
  };
}

// ─── Dispatch table ───────────────────────────────────────────────────────────

type SyncAdapter = (request: OutboundPublishRequest) => Promise<OutboundSyncOutcome>;

const SYNC_ADAPTERS: Partial<Record<`${ProviderId}→${ProviderId}`, SyncAdapter>> = {
  "facebook→x": syncFacebookToX,
  "x→facebook": syncXToFacebook,
};

function getSyncAdapter(from: ProviderId, to: ProviderId): SyncAdapter | null {
  return SYNC_ADAPTERS[`${from}→${to}`] ?? null;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Execute all sync targets for a completed primary publish.
 *
 * Called ONLY after the primary provider has returned ok=true.
 * Each sync runs independently — one failure does not block the others.
 * dryRun requests skip all syncs.
 *
 * Returns a list of sync outcomes (one per target).
 */
export async function executeSyncTargets(
  request: OutboundPublishRequest,
  primaryResult: OutboundPublishResult,
): Promise<OutboundSyncOutcome[]> {
  // dryRun: never sync
  if (request.dryRun) return [];

  // Primary must have succeeded
  if (!primaryResult.ok) return [];

  const normalisedTargets = normaliseSyncTargets(
    request.provider,
    request.syncTargets,
  );

  if (normalisedTargets.length === 0) return [];

  const outcomes = await Promise.allSettled(
    normalisedTargets.map(async (target): Promise<OutboundSyncOutcome> => {
      const adapter = getSyncAdapter(request.provider, target);
      if (!adapter) {
        return {
          provider: target,
          ok: false,
          errorCode: "SYNC_NOT_SUPPORTED",
          safeMessage: `Sync from ${request.provider} to ${target} is not supported.`,
        };
      }

      // Check target readiness before attempting
      const ready = await canSyncTo(target);
      if (!ready) {
        await recordOutboundAudit({
          provider: target,
          eventKind: "SYNC_FAILED",
          requestId: request.requestId,
          actorId: request.actorId,
          actorEmailHash: request.actorEmailHash,
          assetSlug: request.draft.slug,
          assetType: request.draft.assetType,
          assetTitle: request.draft.title,
          errorCode: "SYNC_TARGET_NOT_READY",
        }).catch(() => null);

        return {
          provider: target,
          ok: false,
          errorCode: "SYNC_TARGET_NOT_READY",
          safeMessage: `${target} is not connected or cannot publish.`,
        };
      }

      return adapter(request);
    }),
  );

  return outcomes.map((result, i): OutboundSyncOutcome => {
    if (result.status === "fulfilled") return result.value;
    // Settled rejection — treat as failed sync
    return {
      provider: normalisedTargets[i]!,
      ok: false,
      errorCode: "SYNC_UNEXPECTED_ERROR",
      safeMessage: "Sync encountered an unexpected error.",
    };
  });
}

// ─── Admin preview helper ─────────────────────────────────────────────────────

export type SyncTargetStatus = {
  provider: ProviderId;
  supported: boolean;
  ready: boolean;
  label: string;
};

/**
 * Returns the sync status for each potential target of a given primary provider.
 * Used in admin UI to show which sync options are available before publishing.
 */
export async function getSyncTargetStatuses(
  primary: ProviderId,
): Promise<SyncTargetStatus[]> {
  const candidates = SYNC_PATHS.filter((p) => p.from === primary).map((p) => p.to);

  return Promise.all(
    candidates.map(async (target): Promise<SyncTargetStatus> => {
      const ready = await canSyncTo(target).catch(() => false);
      return {
        provider: target,
        supported: true,
        ready,
        label: target === "x" ? "X (Twitter)" : target === "facebook" ? "Facebook" : "LinkedIn",
      };
    }),
  );
}
