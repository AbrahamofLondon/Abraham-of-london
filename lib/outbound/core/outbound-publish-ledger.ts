/**
 * lib/outbound/core/outbound-publish-ledger.ts
 *
 * Durable publish ledger for outbound publishing across all providers.
 *
 * The ledger is the source of truth for publish state. Idempotency keys
 * (provider + outboundItemId + scheduledFor) prevent duplicate publishes.
 *
 * RACE CONDITION PROTECTION:
 * A unique constraint on idempotencyKey for non-terminal statuses
 * (IN_PROGRESS, PUBLISHED) ensures that only one publish path can claim
 * a slot. The claimPublishSlot() function atomically creates an IN_PROGRESS
 * row. If a concurrent process has already claimed the slot, the insert
 * fails and the caller knows to skip. After publishing, completePublishSlot()
 * updates the row to PUBLISHED or FAILED.
 *
 * This prevents:
 *  - Manual publish + scheduler racing on the same item
 *  - Two concurrent scheduler runs publishing the same item
 *  - Two manual publish attempts for the same item
 *
 * File writeback (frontmatter status: posted) is secondary — the ledger
 * is authoritative.
 *
 * Server-only. Uses Prisma.
 */

import { prisma } from "@/lib/prisma.server";
import type { OutboundProvider } from "./outbound-frontmatter";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LedgerStatus = "IN_PROGRESS" | "DRY_RUN" | "PUBLISHED" | "FAILED" | "BLOCKED" | "SKIPPED";

export type OutboundPublishLedgerEntry = {
  id: string;
  provider: string;
  outboundItemId: string;
  campaign: string | null;
  assetSlug: string;
  sourcePath: string | null;
  scheduledFor: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorEmailHash: string | null;
  status: LedgerStatus;
  providerPostId: string | null;
  providerPostUrl: string | null;
  idempotencyKey: string;
  syncTargetsJson: string | null;
  errorCode: string | null;
  safeMessage: string | null;
  forceRepublish: boolean;
  forceRepublishActorId: string | null;
  forceRepublishNote: string | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type CreateLedgerInput = {
  provider: OutboundProvider;
  outboundItemId: string;
  campaign?: string | null;
  assetSlug: string;
  sourcePath?: string | null;
  scheduledFor?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorEmailHash?: string | null;
  status?: LedgerStatus; // Optional — claimPublishSlot ignores it (always IN_PROGRESS), createLedgerEntry requires it
  providerPostId?: string | null;
  providerPostUrl?: string | null;
  syncTargets?: string[];
  errorCode?: string | null;
  safeMessage?: string | null;
  forceRepublish?: boolean;
  forceRepublishActorId?: string | null;
  forceRepublishNote?: string | null;
  source?: string; // "manual" | "scheduler"
};

// ─── Idempotency key builder ──────────────────────────────────────────────────

/**
 * Build a stable idempotency key from provider + outboundItemId + scheduledFor.
 */
export function buildIdempotencyKey(
  provider: string,
  outboundItemId: string,
  scheduledFor: string | null,
): string {
  return `${provider}:${outboundItemId}:${scheduledFor ?? "unscheduled"}`;
}

// ─── Ledger operations ────────────────────────────────────────────────────────

/**
 * Check if a successful PUBLISHED row already exists for the given idempotency key.
 * Returns the existing entry if found, null otherwise.
 */
export async function findPublishedByIdempotencyKey(
  idempotencyKey: string,
): Promise<OutboundPublishLedgerEntry | null> {
  try {
    const row = await prisma.outboundPublishLedger.findFirst({
      where: {
        idempotencyKey,
        status: "PUBLISHED",
      },
      orderBy: { createdAt: "desc" },
    });
    return row as OutboundPublishLedgerEntry | null;
  } catch {
    return null;
  }
}

/**
 * Check if a publish would be a duplicate.
 * Returns the existing PUBLISHED entry if one exists, null otherwise.
 */
export async function isDuplicatePublish(
  provider: OutboundProvider,
  outboundItemId: string,
  scheduledFor: string | null,
): Promise<OutboundPublishLedgerEntry | null> {
  const key = buildIdempotencyKey(provider, outboundItemId, scheduledFor);
  return findPublishedByIdempotencyKey(key);
}

/**
 * ATOMIC CLAIM: Try to claim a publish slot for the given idempotency key.
 *
 * This is the race-condition-safe entry point for publishing.
 * It atomically creates an IN_PROGRESS row. The unique constraint on
 * (idempotencyKey) for non-terminal statuses ensures only one caller
 * can claim the slot.
 *
 * Returns the claimed ledger entry if successful, or the existing
 * PUBLISHED entry if the item was already published.
 *
 * Throws if the slot is already claimed by another in-flight publish.
 */
export async function claimPublishSlot(
  input: CreateLedgerInput,
): Promise<{ claimed: boolean; entry: OutboundPublishLedgerEntry; reason?: string }> {
  const idempotencyKey = buildIdempotencyKey(
    input.provider,
    input.outboundItemId,
    input.scheduledFor ?? null,
  );

  // First, check if already published (optimistic check)
  const existing = await findPublishedByIdempotencyKey(idempotencyKey);
  if (existing) {
    return {
      claimed: false,
      entry: existing,
      reason: `Item already published (ledger ID: ${existing.id}).`,
    };
  }

  // Try to atomically claim the slot with IN_PROGRESS status.
  // The unique constraint on idempotencyKey prevents concurrent claims.
  try {
    const row = await prisma.outboundPublishLedger.create({
      data: {
        provider: input.provider,
        outboundItemId: input.outboundItemId,
        campaign: input.campaign ?? null,
        assetSlug: input.assetSlug,
        sourcePath: input.sourcePath ?? null,
        scheduledFor: input.scheduledFor ?? null,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorEmailHash: input.actorEmailHash ?? null,
        status: "IN_PROGRESS",
        providerPostId: null,
        providerPostUrl: null,
        idempotencyKey,
        syncTargetsJson: input.syncTargets ? JSON.stringify(input.syncTargets) : null,
        errorCode: null,
        safeMessage: null,
        forceRepublish: input.forceRepublish ?? false,
        forceRepublishActorId: input.forceRepublishActorId ?? null,
        forceRepublishNote: input.forceRepublishNote ?? null,
        source: input.source ?? "manual",
        completedAt: null,
      },
    });

    return { claimed: true, entry: row as unknown as OutboundPublishLedgerEntry };
  } catch (err: any) {
    // Unique constraint violation — another process claimed this slot
    if (err?.code === "P2002" || err?.message?.includes("Unique constraint")) {
      // Fetch the existing claim to inform the caller
      const existingClaim = await prisma.outboundPublishLedger.findFirst({
        where: { idempotencyKey },
        orderBy: { createdAt: "desc" },
      });

      if (existingClaim) {
        const status = existingClaim.status;
        if (status === "PUBLISHED") {
          return {
            claimed: false,
            entry: existingClaim as unknown as OutboundPublishLedgerEntry,
            reason: `Item already published (ledger ID: ${existingClaim.id}).`,
          };
        }
        return {
          claimed: false,
          entry: existingClaim as unknown as OutboundPublishLedgerEntry,
          reason: `Publish slot is already claimed by another process (status: ${status}, ledger ID: ${existingClaim.id}).`,
        };
      }

      return {
        claimed: false,
        entry: null as unknown as OutboundPublishLedgerEntry,
        reason: "Publish slot is already claimed by another process.",
      };
    }

    // Re-throw unexpected errors
    throw err;
  }
}

/**
 * Complete a claimed publish slot by updating its status.
 * Called after the actual publish attempt completes.
 */
export async function completePublishSlot(
  ledgerId: string,
  status: "PUBLISHED" | "FAILED",
  update: {
    providerPostId?: string | null;
    providerPostUrl?: string | null;
    errorCode?: string | null;
    safeMessage?: string | null;
  },
): Promise<OutboundPublishLedgerEntry> {
  const row = await prisma.outboundPublishLedger.update({
    where: { id: ledgerId },
    data: {
      status,
      providerPostId: update.providerPostId ?? null,
      providerPostUrl: update.providerPostUrl ?? null,
      errorCode: update.errorCode ?? null,
      safeMessage: update.safeMessage ?? null,
      completedAt: new Date(),
    },
  });
  return row as unknown as OutboundPublishLedgerEntry;
}

/**
 * Create a ledger entry (non-claimed path).
 * Used for DRY_RUN, BLOCKED, SKIPPED statuses that don't need race protection.
 */
export async function createLedgerEntry(
  input: CreateLedgerInput,
): Promise<OutboundPublishLedgerEntry> {
  const status = input.status;
  if (!status) {
    throw new Error("createLedgerEntry requires a status. Use claimPublishSlot for race-safe publishing.");
  }

  const idempotencyKey = buildIdempotencyKey(
    input.provider,
    input.outboundItemId,
    input.scheduledFor ?? null,
  );

  const row = await prisma.outboundPublishLedger.create({
    data: {
      provider: input.provider,
      outboundItemId: input.outboundItemId,
      campaign: input.campaign ?? null,
      assetSlug: input.assetSlug,
      sourcePath: input.sourcePath ?? null,
      scheduledFor: input.scheduledFor ?? null,
      actorId: input.actorId ?? null,
      actorEmail: input.actorEmail ?? null,
      actorEmailHash: input.actorEmailHash ?? null,
      status,
      providerPostId: input.providerPostId ?? null,
      providerPostUrl: input.providerPostUrl ?? null,
      idempotencyKey,
      syncTargetsJson: input.syncTargets ? JSON.stringify(input.syncTargets) : null,
      errorCode: input.errorCode ?? null,
      safeMessage: input.safeMessage ?? null,
      forceRepublish: input.forceRepublish ?? false,
      forceRepublishActorId: input.forceRepublishActorId ?? null,
      forceRepublishNote: input.forceRepublishNote ?? null,
      source: input.source ?? "manual",
      completedAt: status === "DRY_RUN" ? null : new Date(),
    },
  });

  return row as unknown as OutboundPublishLedgerEntry;
}

/**
 * Get recent ledger entries for a provider, ordered by creation time descending.
 */
export async function getRecentLedgerEntries(
  provider: OutboundProvider,
  limit = 20,
): Promise<OutboundPublishLedgerEntry[]> {
  const rows = await prisma.outboundPublishLedger.findMany({
    where: { provider },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows as unknown as OutboundPublishLedgerEntry[];
}

/**
 * Get failure summary for a provider in the last N hours.
 */
export async function getFailureSummary(
  provider: OutboundProvider,
  hours = 24,
): Promise<{
  failureCount: number;
  lastFailure: OutboundPublishLedgerEntry | null;
  lastSuccess: OutboundPublishLedgerEntry | null;
  lastDryRun: OutboundPublishLedgerEntry | null;
  recentBlockedReasons: string[];
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const [failures, lastFailure, lastSuccess, lastDryRun, blocked] =
    await Promise.all([
      prisma.outboundPublishLedger.count({
        where: {
          provider,
          status: "FAILED",
          createdAt: { gte: since },
        },
      }),
      prisma.outboundPublishLedger.findFirst({
        where: { provider, status: "FAILED" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outboundPublishLedger.findFirst({
        where: { provider, status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outboundPublishLedger.findFirst({
        where: { provider, status: "DRY_RUN" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.outboundPublishLedger.findMany({
        where: {
          provider,
          status: "BLOCKED",
          createdAt: { gte: since },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { safeMessage: true },
      }),
    ]);

  return {
    failureCount: failures,
    lastFailure: lastFailure as OutboundPublishLedgerEntry | null,
    lastSuccess: lastSuccess as OutboundPublishLedgerEntry | null,
    lastDryRun: lastDryRun as OutboundPublishLedgerEntry | null,
    recentBlockedReasons: blocked
      .map((b) => b.safeMessage)
      .filter((m): m is string => m !== null),
  };
}

/**
 * Get the publish status for a specific outbound item from the ledger.
 * Returns the most recent entry, or null if none exists.
 */
export async function getItemPublishStatus(
  provider: OutboundProvider,
  outboundItemId: string,
): Promise<OutboundPublishLedgerEntry | null> {
  const row = await prisma.outboundPublishLedger.findFirst({
    where: {
      provider,
      outboundItemId,
    },
    orderBy: { createdAt: "desc" },
  });
  return row as OutboundPublishLedgerEntry | null;
}
