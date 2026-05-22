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
import { prisma } from "@/lib/prisma.server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import {
  getXAssetBySlug,
  buildCustomXAsset,
  adaptFacebookTextToTweet,
} from "@/lib/outbound/x-content-resolver";
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
    asset = getXAssetBySlug(body.slug);
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
    if (fbStatus.canPublish) {
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
