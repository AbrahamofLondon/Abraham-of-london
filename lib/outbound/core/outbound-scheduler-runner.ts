/**
 * lib/outbound/core/outbound-scheduler-runner.ts
 *
 * Governed outbound scheduler runner.
 *
 * Loads due outbound items across providers, checks eligibility,
 * and publishes eligible items (or validates in dry-run mode).
 *
 * Core principle:
 * The scheduler never auto-approves. It never changes approvalStatus.
 * It never publishes items that don't pass all 11 gates.
 *
 * Server-only.
 */

import { prisma } from "@/lib/prisma.server";
import { logAuditEvent } from "@/lib/server/audit";
import type { ProviderId, OutboundReadiness, OutboundGateResult } from "./outbound-provider-contract";
import { getOutboundPostsDue, getOutboundPostsByProvider, type OutboundPost } from "../outbound-content-loader";
import { isOutboundItemEligibleForScheduling } from "./outbound-scheduler-eligibility";
import { acquireSchedulerLock, releaseSchedulerLock, generateRunKey } from "./outbound-scheduler-lock";
import { createLedgerEntry, claimPublishSlot, completePublishSlot } from "./outbound-publish-ledger";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulerRunnerInput = {
  /** If true, validate only — no actual publishing. */
  dryRun: boolean;
  /** Optional: restrict to a specific provider. */
  provider?: ProviderId;
  /** Optional: restrict to a specific campaign. */
  campaign?: string;
  /** Override current time (for testing). Defaults to now. */
  now?: string;
  /** Source identifier for audit trail. */
  source: "api" | "cron" | "manual";
  /** Actor info (null for cron/system). */
  actorId?: string | null;
  actorEmail?: string | null;
  actorEmailHash?: string | null;
};

export type SchedulerItemResult = {
  provider: ProviderId;
  slug: string;
  title: string;
  status: "published" | "skipped" | "failed" | "blocked";
  reason?: string;
  errorCode?: string;
  postUrl?: string;
};

export type SchedulerRunnerSummary = {
  ok: boolean;
  dryRun: boolean;
  runKey: string;
  source: string;
  scanned: number;
  eligible: number;
  published: number;
  skipped: number;
  failed: number;
  results: SchedulerItemResult[];
  message: string;
};

// ─── Provider readiness map ───────────────────────────────────────────────────

/**
 * Get readiness for a provider.
 * In a full implementation, this would call each provider's diagnostics.
 * For now, we check the env flag and connection status.
 */
async function getProviderReadiness(provider: ProviderId): Promise<{
  readiness: OutboundReadiness;
  tokenValid: boolean;
}> {
  try {
    switch (provider) {
      case "linkedin": {
        const { getConnectionStatus } = await import("@/lib/outbound/linkedin-oauth");
        const status = await getConnectionStatus();
        if (!status.connected) return { readiness: "NOT_CONNECTED", tokenValid: false };
        if (status.expiresAt && new Date(status.expiresAt) < new Date()) {
          return { readiness: "TOKEN_INVALID", tokenValid: false };
        }
        if (status.selectedPublishingTarget.status !== "ready") {
          return { readiness: "MISSING_SCOPE", tokenValid: true };
        }
        if (!status.publishingEnabled) return { readiness: "PUBLISHING_DISABLED", tokenValid: true };
        return { readiness: "READY", tokenValid: true };
      }
      case "facebook": {
        const { getFacebookConnectionStatus } = await import("@/lib/outbound/facebook-oauth");
        const status = await getFacebookConnectionStatus();
        if (!status.canPublish) return { readiness: "NOT_CONNECTED", tokenValid: false };
        return { readiness: "READY", tokenValid: true };
      }
      case "x": {
        const { getXConnectionStatus } = await import("@/lib/outbound/x-oauth");
        const status = await getXConnectionStatus();
        if (!status.canPublish) return { readiness: "NOT_CONNECTED", tokenValid: false };
        return { readiness: "READY", tokenValid: true };
      }
    }
  } catch {
    return { readiness: "API_ERROR", tokenValid: false };
  }
}

/**
 * Evaluate the provider-specific gate for an item.
 */
async function evaluateProviderGate(
  provider: ProviderId,
  item: OutboundPost,
): Promise<OutboundGateResult> {
  try {
    switch (provider) {
      case "linkedin": {
        const { canPublishLinkedInOutbound } = await import("@/lib/outbound/linkedin-publish-gate");
        const { getConnectionStatus } = await import("@/lib/outbound/linkedin-oauth");
        const connection = await getConnectionStatus();
        return canPublishLinkedInOutbound(
          {
            title: item.sourceSeries ?? item.slug,
            status: item.status,
            draft: item.status === "draft",
            published: item.status === "published" || item.status === "ready",
            body: item.text,
            filename: item.filename,
            linkedReportId: null,
            claimRisk: "LOW",
          },
          { connection },
        );
      }
      case "facebook": {
        const { canPublishFacebookPost } = await import("@/lib/outbound/facebook-publish-gate");
        const { getFacebookConnectionStatus } = await import("@/lib/outbound/facebook-oauth");
        const fbConnection = await getFacebookConnectionStatus();
        return canPublishFacebookPost(
          {
            assetType: "editorial",
            slug: item.slug,
            title: item.sourceSeries ?? item.slug,
            text: item.text,
            link: item.link,
            imagePath: item.imagePath,
          },
          fbConnection,
        );
      }
      case "x": {
        const { canPublishXPost } = await import("@/lib/outbound/x-publish-gate");
        const { getXConnectionStatus } = await import("@/lib/outbound/x-oauth");
        const xConnection = await getXConnectionStatus();
        return canPublishXPost(
          {
            assetType: "editorial",
            slug: item.slug,
            title: item.sourceSeries ?? item.slug,
            text: item.text,
            link: item.link,
          },
          xConnection,
        );
      }
    }
  } catch {
    return { allowed: false, blockers: ["Gate evaluation failed."], warnings: [] };
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

/**
 * Run the outbound scheduler.
 *
 * Scans all due items, checks eligibility, and publishes eligible items
 * (or validates in dry-run mode).
 *
 * Returns a summary of what happened.
 */
export async function runOutboundScheduler(
  input: SchedulerRunnerInput,
): Promise<SchedulerRunnerSummary> {
  const runKey = generateRunKey();
  const now = input.now ?? new Date().toISOString();
  const schedulerEnabled = process.env.OUTBOUND_SCHEDULER_ENABLED === "true";
  const globalPauseActive = process.env.OUTBOUND_SCHEDULER_PAUSED === "true";
  const results: SchedulerItemResult[] = [];

  // ── Record run start ──────────────────────────────────────────────────────
  const runRecord = await prisma.schedulerRun.create({
    data: {
      runKey,
      source: input.source,
      dryRun: input.dryRun,
      provider: input.provider ?? null,
      campaign: input.campaign ?? null,
      status: "started",
      startedAt: new Date(),
    },
  });

  await logAuditEvent({
    actorType: input.source === "cron" ? "system" : "admin",
    actorId: input.actorId ?? undefined,
    action: "OUTBOUND_SCHEDULER_STARTED",
    resourceType: "admin",
    resourceId: runKey,
    resourceName: "Outbound scheduler run",
    status: "success",
    severity: "low",
    tags: ["outbound", "scheduler", input.source],
    metadata: {
      runKey,
      dryRun: input.dryRun,
      provider: input.provider ?? "all",
      campaign: input.campaign ?? "all",
      schedulerEnabled,
      globalPauseActive,
    },
  });

  try {
    // ── Load items ──────────────────────────────────────────────────────────
    const providers: ProviderId[] = input.provider
      ? [input.provider]
      : ["linkedin", "facebook", "x"];

    const allItems: Array<{ provider: ProviderId; item: OutboundPost }> = [];

    for (const provider of providers) {
      // Use getOutboundPostsDue for scheduler-eligible items (status=scheduled, approved, due)
      const duePosts = getOutboundPostsDue(provider, now);
      for (const item of duePosts) {
        // Apply campaign filter if specified
        if (input.campaign && item.campaign !== input.campaign) continue;
        allItems.push({ provider, item });
      }
    }

    const scanned = allItems.length;

    // ── Process each item ───────────────────────────────────────────────────
    for (const { provider, item } of allItems) {
      const { readiness, tokenValid } = await getProviderReadiness(provider);
      const gateResult = await evaluateProviderGate(provider, item);

      const eligibility = await isOutboundItemEligibleForScheduling({
        item,
        providerReadiness: readiness,
        schedulerEnabled,
        globalPauseActive,
        now,
        gateResult,
        tokenValid,
      });

      if (!eligibility.eligible) {
        results.push({
          provider,
          slug: item.slug,
          title: item.sourceSeries ?? item.slug,
          status: "skipped",
          reason: eligibility.blockers.join("; "),
        });
        continue;
      }

      // ── Dry run — validate only ───────────────────────────────────────────
      if (input.dryRun) {
        await createLedgerEntry({
          provider,
          outboundItemId: item.id,
          campaign: item.campaign ?? undefined,
          assetSlug: item.slug,
          sourcePath: item.filename,
          scheduledFor: item.scheduledFor ?? undefined,
          actorId: input.actorId ?? null,
          actorEmail: input.actorEmail ?? null,
          actorEmailHash: input.actorEmailHash ?? null,
          status: "DRY_RUN",
          source: input.source,
        });

        results.push({
          provider,
          slug: item.slug,
          title: item.sourceSeries ?? item.slug,
          status: "published", // dry-run "success"
          reason: "Dry-run — gate passed, no post published.",
        });
        continue;
      }

      // ── Live publish ──────────────────────────────────────────────────────
      // Atomically claim the publish slot to prevent races with manual publish
      // or another scheduler run.
      const claimedSlot = await claimPublishSlot({
        provider,
        outboundItemId: item.id,
        campaign: item.campaign ?? undefined,
        assetSlug: item.slug,
        sourcePath: item.filename,
        scheduledFor: item.scheduledFor ?? undefined,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorEmailHash: input.actorEmailHash ?? null,
        source: input.source,
      });

      if (!claimedSlot.claimed) {
        // Slot already taken — skip
        results.push({
          provider,
          slug: item.slug,
          title: item.sourceSeries ?? item.slug,
          status: "skipped",
          reason: claimedSlot.reason ?? "Publish slot already claimed.",
        });
        continue;
      }

      try {
        let publishResult: { ok: boolean; postUrl?: string; errorCode?: string; safeMessage?: string };

        switch (provider) {
          case "linkedin": {
            const { publishTextPostToLinkedIn } = await import("@/lib/outbound/linkedin-publishing-client");
            const { getConnectionStatus } = await import("@/lib/outbound/linkedin-oauth");
            const connection = await getConnectionStatus();
            publishResult = await publishTextPostToLinkedIn({
              commentary: item.text,
              ownerType: connection.selectedPublishingTarget.ownerType,
            });
            break;
          }
          case "facebook": {
            const { publishLinkPostToFacebook } = await import("@/lib/outbound/facebook-publishing-client");
            publishResult = await publishLinkPostToFacebook({
              message: item.text,
              link: item.link ?? undefined,
            });
            break;
          }
          case "x": {
            const { publishTweetToX } = await import("@/lib/outbound/x-publishing-client");
            publishResult = await publishTweetToX({ text: item.text, dryRun: false });
            break;
          }
        }

        if (publishResult.ok) {
          await completePublishSlot(claimedSlot.entry.id, "PUBLISHED", {
            providerPostId: publishResult.postUrl ?? undefined,
            providerPostUrl: publishResult.postUrl ?? undefined,
          });

          results.push({
            provider,
            slug: item.slug,
            title: item.sourceSeries ?? item.slug,
            status: "published",
            postUrl: publishResult.postUrl,
          });
        } else {
          await completePublishSlot(claimedSlot.entry.id, "FAILED", {
            errorCode: publishResult.errorCode ?? "SCHEDULER_PUBLISH_FAILED",
            safeMessage: publishResult.safeMessage ?? "Publishing failed.",
          });

          results.push({
            provider,
            slug: item.slug,
            title: item.sourceSeries ?? item.slug,
            status: "failed",
            reason: publishResult.safeMessage,
            errorCode: publishResult.errorCode,
          });
        }
      } catch (err) {
        const safeMsg = err instanceof Error ? err.message : "Unknown publish error";
        await completePublishSlot(claimedSlot.entry.id, "FAILED", {
          errorCode: "SCHEDULER_PUBLISH_EXCEPTION",
          safeMessage: safeMsg.slice(0, 500),
        });

        results.push({
          provider,
          slug: item.slug,
          title: item.sourceSeries ?? item.slug,
          status: "failed",
          reason: safeMsg.slice(0, 500),
          errorCode: "SCHEDULER_PUBLISH_EXCEPTION",
        });
      }
    }

    // ── Compile summary ────────────────────────────────────────────────────
    const published = results.filter((r) => r.status === "published").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const failed = results.filter((r) => r.status === "failed").length;

    const summary: SchedulerRunnerSummary = {
      ok: failed === 0,
      dryRun: input.dryRun,
      runKey,
      source: input.source,
      scanned,
      eligible: results.length,
      published,
      skipped,
      failed,
      results,
      message: input.dryRun
        ? `Dry-run complete. Scanned ${scanned}, ${results.length} eligible, ${published} would publish.`
        : `Scheduler run complete. Published ${published}, skipped ${skipped}, failed ${failed}.`,
    };

    // ── Update run record ───────────────────────────────────────────────────
    await prisma.schedulerRun.update({
      where: { id: runRecord.id },
      data: {
        status: failed > 0 ? "failed" : "completed",
        scannedCount: scanned,
        eligibleCount: results.length,
        publishedCount: published,
        skippedCount: skipped,
        failedCount: failed,
        summary: JSON.stringify(summary),
        completedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorType: input.source === "cron" ? "system" : "admin",
      actorId: input.actorId ?? undefined,
      action: failed > 0 ? "OUTBOUND_SCHEDULER_FAILED" : "OUTBOUND_SCHEDULER_COMPLETED",
      resourceType: "admin",
      resourceId: runKey,
      resourceName: "Outbound scheduler run",
      status: failed > 0 ? "failed" : "success",
      severity: failed > 0 ? "warn" : "low",
      tags: ["outbound", "scheduler", input.source],
      metadata: {
        runKey,
        dryRun: input.dryRun,
        scanned,
        published,
        skipped,
        failed,
      },
    });

    return summary;
  } catch (err) {
    // ── Fatal error ─────────────────────────────────────────────────────────
    const errorMessage = err instanceof Error ? err.message : "Unknown scheduler error";

    await prisma.schedulerRun.update({
      where: { id: runRecord.id },
      data: {
        status: "failed",
        errorMessage: errorMessage.slice(0, 1000),
        completedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorType: input.source === "cron" ? "system" : "admin",
      actorId: input.actorId ?? undefined,
      action: "OUTBOUND_SCHEDULER_FAILED",
      resourceType: "admin",
      resourceId: runKey,
      resourceName: "Outbound scheduler run",
      status: "failed",
      severity: "error",
      tags: ["outbound", "scheduler", input.source],
      metadata: { runKey, error: errorMessage.slice(0, 1000) },
    });

    return {
      ok: false,
      dryRun: input.dryRun,
      runKey,
      source: input.source,
      scanned: 0,
      eligible: 0,
      published: 0,
      skipped: 0,
      failed: 0,
      results: [],
      message: `Scheduler run failed: ${errorMessage}`,
    };
  }
}
