/**
 * pages/api/admin/outbound/x/publish.ts
 *
 * POST — Publish a tweet to X (Twitter).
 *
 * Admin-only. Rate-limited (10/hr). Requires finalApproval: true.
 * dryRun: true validates gate without posting.
 * syncToFacebook: true also posts to Facebook after a successful tweet
 *   (uses the existing Facebook publish client).
 *
 * Full audit trail. Access token resolved server-side, never surfaced.
 */

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";
import { prisma } from "@/lib/prisma.server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import {
  getXAssetBySlug,
  buildCustomXAsset,
  adaptFacebookTextToTweet,
} from "@/lib/outbound/x-content-resolver";
import {
  getOutboundXAssetBySlug,
  getOutboundXPostAndAssetBySlug,
} from "@/lib/outbound/x-outbound-adapter";
import {
  isDuplicatePublish,
  claimPublishSlot,
  completePublishSlot,
  createLedgerEntry,
} from "@/lib/outbound/core/outbound-publish-ledger";
import { canPublishXPost } from "@/lib/outbound/x-publish-gate";
import { publishTweetToX } from "@/lib/outbound/x-publishing-client";
import { recordXPublishingAuditSafe } from "@/lib/outbound/x-publishing-audit";

// Optional sync: after a successful tweet, also post to Facebook
import { publishLinkPostToFacebook } from "@/lib/outbound/facebook-publishing-client";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requestId(): string {
  return `x_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function createAttempt(input: {
  assetType: string;
  assetSlug: string;
  assetTitle: string;
  status: string;
  requestId: string;
  dryRun: boolean;
  syncedFromFacebook?: boolean;
  actorId?: string | null;
  actorEmailHash?: string | null;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
}) {
  return prisma.xPublishAttempt.create({
    data: {
      assetType: input.assetType,
      assetSlug: input.assetSlug,
      assetTitle: input.assetTitle,
      status: input.status,
      requestId: input.requestId,
      dryRun: input.dryRun,
      syncedFromFacebook: input.syncedFromFacebook ?? false,
      actorId: input.actorId ?? null,
      actorEmailHash: input.actorEmailHash ?? null,
      errorCode: input.errorCode ?? null,
      errorMessageSafe: input.errorMessageSafe ?? null,
      completedAt: input.status === "pending" ? null : new Date(),
    },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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
  const actorEmailHash = hashEmail(guard.session?.user?.email);

  // ── Rate limit: 10 tweets per hour per admin ──────────────────────────────
  const rateLimitId = actorId ?? actorEmailHash ?? "anonymous";
  const rl = await checkRateLimit({
    scope: "X_OUTBOUND_PUBLISH",
    identifier: rateLimitId,
    limit: 10,
    windowSeconds: 3600,
  });
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: "Rate limit reached. Maximum 10 X publish attempts per hour.",
      resetAt: rl.resetAt,
      requestId: id,
    });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = req.body as {
    slug?: string;
    assetType?: string;
    customTitle?: string;
    customText?: string;
    customLink?: string;
    finalApproval?: boolean;
    dryRun?: boolean;
    syncToFacebook?: boolean;
    // For direct Facebook-text-to-tweet sync
    facebookText?: string;
    facebookLink?: string;
  };

  const { dryRun = false, finalApproval, syncToFacebook = false } = body;

  if (!dryRun && finalApproval !== true) {
    return res.status(400).json({
      ok: false,
      error: "finalApproval: true is required to publish. Set dryRun: true to validate without posting.",
      requestId: id,
    });
  }

  // ── Resolve asset ─────────────────────────────────────────────────────────
  let asset = null;
  // sourcePost is set for outbound-x draft assets so we can use their
  // idempotency key and scheduledFor in the publish ledger.
  let sourcePost: import("@/lib/outbound/outbound-content-loader").OutboundPost | null = null;

  if (body.facebookText) {
    // Sync mode: adapt Facebook post text to tweet format
    const tweetText = adaptFacebookTextToTweet(body.facebookText, body.facebookLink);
    asset = buildCustomXAsset({
      title: "Facebook sync",
      text: tweetText,
      link: body.facebookLink ?? null,
    });
  } else if (body.assetType === "custom") {
    if (!body.customTitle?.trim() || !body.customText?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Custom tweets require customTitle and customText.",
        requestId: id,
      });
    }
    asset = buildCustomXAsset({
      title: body.customTitle.trim(),
      text: body.customText.trim(),
      link: body.customLink?.trim() || null,
    });
  } else if (body.slug) {
    // Try outbound draft adapter first (preserves sourcePost for ledger use).
    const outboundMatch = getOutboundXPostAndAssetBySlug(body.slug);
    if (outboundMatch) {
      asset = outboundMatch.asset;
      sourcePost = outboundMatch.post;
    } else {
      asset = getXAssetBySlug(body.slug);
    }
    if (!asset) {
      return res.status(404).json({
        ok: false,
        error: "X asset was not found.",
        requestId: id,
      });
    }
  } else {
    return res.status(400).json({
      ok: false,
      error: "Missing required field: slug, facebookText, or assetType: custom.",
      requestId: id,
    });
  }

  // ── Idempotency check (outbound draft posts only) ──────────────────────────
  // Blog-series and custom assets don't carry a stable outboundItemId, so
  // idempotency is only enforced for content/outbound/x/* posts.
  if (sourcePost && !dryRun) {
    const existingPublish = await isDuplicatePublish(
      "x",
      sourcePost.id,
      sourcePost.scheduledFor,
    );
    if (existingPublish) {
      await createAttempt({
        assetType: asset.assetType,
        assetSlug: asset.slug,
        assetTitle: asset.title,
        status: "blocked",
        requestId: id,
        dryRun: false,
        actorId,
        actorEmailHash,
        errorCode: "X_DUPLICATE_PUBLISH",
        errorMessageSafe: `Post already published. Ledger ID: ${existingPublish.id}`,
      });
      return res.status(409).json({
        ok: false,
        error: "This post has already been published.",
        errorCode: "X_DUPLICATE_PUBLISH",
        ledgerId: existingPublish.id,
        providerPostUrl: existingPublish.providerPostUrl ?? null,
        requestId: id,
      });
    }
  }

  // ── Connection + gate ─────────────────────────────────────────────────────
  const connection = await getXConnectionStatus();
  const gate = canPublishXPost(asset, connection);

  if (!gate.allowed) {
    await createAttempt({
      assetType: asset.assetType,
      assetSlug: asset.slug,
      assetTitle: asset.title,
      status: "blocked",
      requestId: id,
      dryRun,
      actorId,
      actorEmailHash,
      errorCode: "X_PUBLISH_BLOCKED",
      errorMessageSafe: gate.blockers.join("; ").slice(0, 500),
    });
    await recordXPublishingAuditSafe({
      eventType: "X_PUBLISH_BLOCKED",
      assetSlug: asset.slug,
      assetType: asset.assetType,
      assetTitle: asset.title,
      blockerCount: gate.blockers.length,
      blockers: gate.blockers,
      dryRun,
      requestId: id,
      actorId,
      actorEmailHash,
    }).catch(() => null);

    return res.status(409).json({
      ok: false,
      error: "X publish gate blocked this tweet.",
      blockers: gate.blockers,
      warnings: gate.warnings,
      requestId: id,
    });
  }

  // ── Dry run ───────────────────────────────────────────────────────────────
  if (dryRun) {
    await createAttempt({
      assetType: asset.assetType,
      assetSlug: asset.slug,
      assetTitle: asset.title,
      status: "dry_run",
      requestId: id,
      dryRun: true,
      actorId,
      actorEmailHash,
    });
    // Write a DRY_RUN entry to the outbound ledger for outbound draft posts.
    if (sourcePost) {
      await createLedgerEntry({
        provider: "x",
        outboundItemId: sourcePost.id,
        campaign: sourcePost.campaign ?? null,
        assetSlug: asset.slug,
        sourcePath: sourcePost.sourcePath ?? null,
        scheduledFor: sourcePost.scheduledFor ?? null,
        actorId,
        actorEmailHash,
        status: "DRY_RUN",
        source: "manual",
      }).catch(() => null);
    }
    await recordXPublishingAuditSafe({
      eventType: "X_PUBLISH_DRY_RUN",
      assetSlug: asset.slug,
      assetType: asset.assetType,
      assetTitle: asset.title,
      dryRun: true,
      requestId: id,
      actorId,
      actorEmailHash,
    }).catch(() => null);

    return res.status(200).json({
      ok: true,
      dryRun: true,
      message: "Dry run passed. Gate cleared. No tweet was posted.",
      gate: { blockers: gate.blockers, warnings: gate.warnings },
      preview: { text: asset.text, link: asset.link },
      requestId: id,
    });
  }

  // ── Post tweet ────────────────────────────────────────────────────────────
  if (process.env.X_PUBLISHING_ENABLED !== "true") {
    await createAttempt({
      assetType: asset.assetType,
      assetSlug: asset.slug,
      assetTitle: asset.title,
      status: "blocked",
      requestId: id,
      dryRun: false,
      actorId,
      actorEmailHash,
      errorCode: "X_PUBLISHING_DISABLED",
      errorMessageSafe:
        "X publishing is blocked until X_PUBLISHING_ENABLED=true is configured.",
    });

    return res.status(423).json({
      ok: false,
      error: "X publishing is not enabled for live posting.",
      blockers: [
        "This channel is not ready for publishing. Complete configuration before connection or publishing is available.",
        "Set X_PUBLISHING_ENABLED=true only after OAuth, token storage, scopes, diagnostics, and final publish gating are verified.",
      ],
      requestId: id,
    });
  }

  const attempt = await createAttempt({
    assetType: asset.assetType,
    assetSlug: asset.slug,
    assetTitle: asset.title,
    status: "pending",
    requestId: id,
    dryRun: false,
    actorId,
    actorEmailHash,
  });

  // For outbound draft posts: atomically claim the publish slot in the ledger.
  // This is the race-condition-safe path that enforces idempotency via a unique
  // constraint on (idempotencyKey). Blog-series and custom assets skip this path.
  let ledgerEntryId: string | null = null;
  if (sourcePost) {
    const claim = await claimPublishSlot({
      provider: "x",
      outboundItemId: sourcePost.id,
      campaign: sourcePost.campaign ?? null,
      assetSlug: asset.slug,
      sourcePath: sourcePost.sourcePath ?? null,
      scheduledFor: sourcePost.scheduledFor ?? null,
      actorId,
      actorEmail: null,
      actorEmailHash,
      source: "manual",
    }).catch(() => null);

    if (claim && !claim.claimed) {
      await prisma.xPublishAttempt.update({
        where: { id: attempt.id },
        data: {
          status: "blocked",
          errorCode: "X_DUPLICATE_PUBLISH",
          errorMessageSafe: claim.reason ?? "Duplicate publish blocked by ledger.",
          completedAt: new Date(),
        },
      });
      return res.status(409).json({
        ok: false,
        error: claim.reason ?? "This post has already been published.",
        errorCode: "X_DUPLICATE_PUBLISH",
        requestId: id,
      });
    }
    ledgerEntryId = claim?.entry?.id ?? null;
  }

  const result = await publishTweetToX({ text: asset.text, dryRun: false });

  if (!result.ok) {
    await prisma.xPublishAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "failed",
        errorCode: result.errorCode ?? "X_POST_FAILED",
        errorMessageSafe: result.safeMessage ?? "X publishing failed.",
        completedAt: new Date(),
      },
    });
    if (ledgerEntryId) {
      await completePublishSlot(ledgerEntryId, "FAILED", {
        errorCode: result.errorCode ?? "X_POST_FAILED",
        safeMessage: result.safeMessage ?? "X publishing failed.",
      }).catch(() => null);
    }
    await recordXPublishingAuditSafe({
      eventType: "X_PUBLISH_FAILED",
      assetSlug: asset.slug,
      assetType: asset.assetType,
      assetTitle: asset.title,
      requestId: id,
      actorId,
      actorEmailHash,
    }).catch(() => null);

    return res.status(result.errorCode === "X_RATE_LIMITED" ? 429 : 400).json({
      ok: false,
      errorCode: result.errorCode,
      error: result.safeMessage,
      requestId: id,
    });
  }

  await prisma.xPublishAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "succeeded",
      tweetId: result.tweetId ?? null,
      tweetUrl: result.tweetUrl ?? null,
      completedAt: new Date(),
    },
  });
  if (ledgerEntryId) {
    await completePublishSlot(ledgerEntryId, "PUBLISHED", {
      providerPostId: result.tweetId ?? null,
      providerPostUrl: result.tweetUrl ?? null,
    }).catch(() => null);
  }
  await recordXPublishingAuditSafe({
    eventType: "X_POST_PUBLISHED",
    assetSlug: asset.slug,
    assetType: asset.assetType,
    assetTitle: asset.title,
    tweetId: result.tweetId ?? null,
    requestId: id,
    actorId,
    actorEmailHash,
  }).catch(() => null);

  // ── Optional Facebook sync ────────────────────────────────────────────────
  let facebookSync: { ok: boolean; postUrl?: string | null } | null = null;
  if (syncToFacebook) {
    const fbStatus = await getFacebookConnectionStatus();
    if (fbStatus.canPublish && process.env.FACEBOOK_PUBLISHING_ENABLED === "true") {
      const fbResult = await publishLinkPostToFacebook({
        message: asset.text,
        link: asset.link ?? undefined,
        dryRun: false,
      });
      facebookSync = { ok: fbResult.ok, postUrl: fbResult.postUrl };
    } else {
      facebookSync = { ok: false };
    }
  }

  return res.status(200).json({
    ok: true,
    message: "Tweet posted to X successfully.",
    tweetId: result.tweetId ?? null,
    tweetUrl: result.tweetUrl ?? null,
    facebookSync,
    requestId: id,
  });
}
