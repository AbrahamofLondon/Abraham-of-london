/**
 * pages/api/admin/outbound/linkedin/publish.ts
 *
 * POST — Publish a LinkedIn outbound post.
 *
 * Hardening applied (2026-05-22):
 *  - Priority 2: Rate limit only applied for live publishes (dryRun skips quota)
 *  - Priority 1: Durable publish ledger (OutboundPublishLedger) prevents duplicates
 *  - Priority 1: Idempotency check before live publish
 *  - Priority 1: forceRepublish requires OWNER role and is audited
 *  - Priority 1: File writeback (status: posted) attempted but not depended on
 *  - Priority 5: Token expiry detection before publish attempt
 *
 * Admin-only. Rate-limited. Audited.
 */

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi, requireTierApi } from "@/lib/access/server";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";
import { prisma } from "@/lib/prisma.server";
import { getConnectionStatus } from "@/lib/outbound/linkedin-oauth";
import { getResolvedLinkedInOutboundBySlug } from "@/lib/outbound/linkedin-content-resolver";
import { canPublishLinkedInOutbound } from "@/lib/outbound/linkedin-publish-gate";
import { publishTextPostToLinkedIn } from "@/lib/outbound/linkedin-publishing-client";
import { recordLinkedInPublishingAuditSafe } from "@/lib/outbound/linkedin-publishing-audit";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";
import {
  createLedgerEntry,
  claimPublishSlot,
  completePublishSlot,
  getItemPublishStatus,
} from "@/lib/outbound/core/outbound-publish-ledger";
import { markPostAsPosted } from "@/lib/outbound/linkedin-utils";

function requestId(): string {
  return `ln_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const originCheck = verifyAdminMutationOrigin(req);
  if (!originCheck.ok) {
    return res.status(403).json({ ok: false, error: originCheck.reason });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const id = requestId();
  const actorId = guard.session?.user?.id ?? null;
  const actorEmail = guard.session?.user?.email ?? null;
  const actorEmailHash = hashEmail(actorEmail);
  const { slug, filename, confirm, dryRun, forceRepublish, forceRepublishNote } = req.body as {
    slug?: string;
    filename?: string;
    confirm?: boolean;
    dryRun?: boolean;
    forceRepublish?: boolean;
    forceRepublishNote?: string;
  };
  const outboundSlug = slug || filename?.replace(/\.mdx?$/i, "");

  if (!outboundSlug) {
    return res.status(400).json({ ok: false, error: "Missing required field: slug." });
  }
  if (confirm !== true) {
    return res.status(400).json({ ok: false, error: "Publish confirmation is required." });
  }

  // ── Resolve asset ────────────────────────────────────────────────────────────
  const asset = getResolvedLinkedInOutboundBySlug(outboundSlug);
  if (!asset) {
    return res.status(404).json({ ok: false, error: "LinkedIn outbound asset was not found." });
  }

  // ── Atomic claim — race-safe slot reservation (skip for dryRun) ────────────
  let claimedSlot: Awaited<ReturnType<typeof claimPublishSlot>> | null = null;

  if (!dryRun) {
    claimedSlot = await claimPublishSlot({
      provider: "linkedin",
      outboundItemId: asset.slug,
      campaign: asset.item.campaign ?? null,
      assetSlug: asset.slug,
      sourcePath: asset.filename,
      scheduledFor: asset.item.date ?? null,
      actorId,
      actorEmail,
      actorEmailHash,
      source: "manual",
    });

    if (!claimedSlot.claimed) {
      // Slot was not claimed — either already published or in-flight
      const existing = claimedSlot.entry;

      // If forceRepublish is requested, require OWNER tier
      if (forceRepublish === true) {
        const ownerGuard = await requireTierApi(req, res, "owner");
        if (!ownerGuard) return; // 403 if not owner

        // Log the force republish in the ledger
        await createLedgerEntry({
          provider: "linkedin",
          outboundItemId: asset.slug,
          campaign: asset.item.campaign ?? null,
          assetSlug: asset.slug,
          sourcePath: asset.filename,
          scheduledFor: asset.item.date ?? null,
          actorId,
          actorEmail,
          actorEmailHash,
          status: "SKIPPED",
          safeMessage: `Force republish of previously published item (existing ledger ID: ${existing?.id ?? "unknown"}). ${forceRepublishNote ?? ""}`,
          forceRepublish: true,
          forceRepublishActorId: actorId,
          forceRepublishNote: forceRepublishNote ?? null,
        });

        await recordLinkedInPublishingAuditSafe({
          eventType: "LINKEDIN_PUBLISH_GATE_RUN",
          outboundSlug: asset.slug,
          linkedReportId: asset.item.linkedReportId,
          claimRisk: asset.item.claimRisk,
          blockerCount: 0,
          requestId: id,
          actorId,
          actorEmailHash,
        });
      } else {
        const isPublished = existing?.status === "PUBLISHED";
        return res.status(409).json({
          ok: false,
          error: isPublished
            ? "This post has already been published. Use forceRepublish=true with owner privileges to republish."
            : `Publish slot is already claimed (status: ${existing?.status ?? "unknown"}). Another publish may be in progress.`,
          existingPublish: existing
            ? {
                id: existing.id,
                status: existing.status,
                providerPostId: existing.providerPostId,
                providerPostUrl: existing.providerPostUrl,
                publishedAt: existing.completedAt,
              }
            : null,
          requestId: id,
        });
      }
    }
  }

  // ── Connection status ────────────────────────────────────────────────────────
  const connection = await getConnectionStatus();

  // ── Token expiry check (Priority 5) ──────────────────────────────────────────
  if (!dryRun && connection.expiresAt) {
    const expiresAt = new Date(connection.expiresAt);
    if (expiresAt < new Date()) {
      await createLedgerEntry({
        provider: "linkedin",
        outboundItemId: asset.slug,
        campaign: asset.item.campaign ?? null,
        assetSlug: asset.slug,
        sourcePath: asset.filename,
        scheduledFor: asset.item.date ?? null,
        actorId,
        actorEmail,
        actorEmailHash,
        status: "BLOCKED",
        errorCode: "LINKEDIN_TOKEN_EXPIRED",
        safeMessage: "LinkedIn access token has expired. Reconnect LinkedIn to publish.",
      });
      return res.status(401).json({
        ok: false,
        error: "LinkedIn access token has expired. Reconnect LinkedIn to publish.",
        requestId: id,
      });
    }
  }

  // ── Rate limit — ONLY for live publishes (Priority 2 fix) ────────────────────
  if (!dryRun) {
    const rateKey = actorId ?? (req.headers["x-forwarded-for"] as string ?? "unknown");
    const rate = await checkRateLimit({
      scope: "LINKEDIN_OUTBOUND_PUBLISH",
      identifier: rateKey,
      limit: 10,
      windowSeconds: 3600,
    });
    if (!rate.allowed) {
      res.setHeader("Retry-After", "3600");
      Object.entries(rateLimitHeaders(rate)).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(429).json({
        ok: false,
        error: "LinkedIn publish rate limit reached. Try again in an hour.",
        requestId: id,
      });
    }
  }

  // ── Gate evaluation ──────────────────────────────────────────────────────────
  const gate = canPublishLinkedInOutbound(asset.item, { connection });
  await recordLinkedInPublishingAuditSafe({
    eventType: "LINKEDIN_PUBLISH_GATE_RUN",
    outboundSlug: asset.slug,
    linkedReportId: asset.item.linkedReportId,
    claimRisk: asset.item.claimRisk,
    blockerCount: gate.blockers.length,
    blockers: gate.blockers,
    requestId: id,
    actorId,
    actorEmailHash,
  });

  if (!gate.allowed) {
    await createLedgerEntry({
      provider: "linkedin",
      outboundItemId: asset.slug,
      campaign: asset.item.campaign ?? null,
      assetSlug: asset.slug,
      sourcePath: asset.filename,
      scheduledFor: asset.item.date ?? null,
      actorId,
      actorEmail,
      actorEmailHash,
      status: "BLOCKED",
      errorCode: "LINKEDIN_PUBLISH_BLOCKED",
      safeMessage: gate.blockers.join("; ").slice(0, 500),
    });
    await recordLinkedInPublishingAuditSafe({
      eventType: "LINKEDIN_PUBLISH_BLOCKED",
      outboundSlug: asset.slug,
      linkedReportId: asset.item.linkedReportId,
      claimRisk: asset.item.claimRisk,
      blockerCount: gate.blockers.length,
      blockers: gate.blockers,
      requestId: id,
      actorId,
      actorEmailHash,
    });
    return res.status(409).json({
      ok: false,
      error: "LinkedIn publish gate blocked this asset.",
      blockers: gate.blockers,
      warnings: gate.warnings,
      requestId: id,
    });
  }

  // ── dryRun — gate passed, no actual publish ──────────────────────────────────
  if (dryRun) {
    await createLedgerEntry({
      provider: "linkedin",
      outboundItemId: asset.slug,
      campaign: asset.item.campaign ?? null,
      assetSlug: asset.slug,
      sourcePath: asset.filename,
      scheduledFor: asset.item.date ?? null,
      actorId,
      actorEmail,
      actorEmailHash,
      status: "DRY_RUN",
    });
    await recordLinkedInPublishingAuditSafe({
      eventType: "LINKEDIN_PUBLISH_GATE_RUN",
      outboundSlug: asset.slug,
      linkedReportId: asset.item.linkedReportId,
      claimRisk: asset.item.claimRisk,
      blockerCount: 0,
      requestId: id,
      actorId,
      actorEmailHash,
    });
    return res.status(200).json({
      ok: true,
      dryRun: true,
      requestId: id,
      message: "Gate passed. Dry-run complete — no post was published.",
      warnings: gate.warnings,
    });
  }

  // ── Live publish ─────────────────────────────────────────────────────────────
  const result = await publishTextPostToLinkedIn({
    commentary: asset.body,
    ownerType: connection.selectedPublishingTarget.ownerType,
  });

  if (!result.ok) {
    // Complete the claimed slot as FAILED
    if (claimedSlot?.entry?.id) {
      await completePublishSlot(claimedSlot.entry.id, "FAILED", {
        errorCode: result.errorCode ?? "LINKEDIN_POST_FAILED",
        safeMessage: result.safeMessage ?? "LinkedIn publishing failed.",
      });
    }
    await recordLinkedInPublishingAuditSafe({
      eventType: "LINKEDIN_POST_FAILED",
      outboundSlug: asset.slug,
      linkedReportId: asset.item.linkedReportId,
      claimRisk: asset.item.claimRisk,
      requestId: id,
      actorId,
      actorEmailHash,
    });
    return res.status(result.errorCode === "LINKEDIN_RATE_LIMITED" ? 429 : 400).json({
      ok: false,
      errorCode: result.errorCode,
      error: result.safeMessage,
      requestId: id,
    });
  }

  // ── Success — complete the claimed slot as PUBLISHED ─────────────────────────
  if (claimedSlot?.entry?.id) {
    await completePublishSlot(claimedSlot.entry.id, "PUBLISHED", {
      providerPostId: result.postUrn ?? null,
      providerPostUrl: result.postUrl ?? null,
    });
  }

  await recordLinkedInPublishingAuditSafe({
    eventType: "LINKEDIN_POST_PUBLISHED",
    outboundSlug: asset.slug,
    linkedReportId: asset.item.linkedReportId,
    claimRisk: asset.item.claimRisk,
    postUrn: result.postUrn ?? null,
    requestId: id,
    actorId,
    actorEmailHash,
  });

  // ── File writeback (best-effort — ledger is source of truth) ─────────────────
  let fileWritebackOk = false;
  try {
    const writebackResult = markPostAsPosted(
      asset.filename,
      result.postUrl ?? `https://www.linkedin.com/feed/update/${result.postUrn ?? ""}`,
      new Date().toISOString(),
    );
    fileWritebackOk = writebackResult.ok;
  } catch {
    // File writeback failure is non-fatal — ledger has the record
  }

  return res.status(200).json({
    ok: true,
    message: fileWritebackOk
      ? "Published to LinkedIn and file marked as posted."
      : "Published to LinkedIn. File writeback unavailable; ledger has the record.",
    postUrn: result.postUrn ?? null,
    postUrl: result.postUrl ?? null,
    fileWritebackOk,
    requestId: id,
  });
}