/**
 * pages/api/admin/outbound/facebook/publish.ts
 *
 * POST — Publish a Facebook Page post.
 *
 * Admin-only. Rate-limited. Requires explicit finalApproval: true.
 * dryRun: true validates the gate and returns a preview without posting.
 *
 * Audit trail recorded for every gate run, block, publish, and failure.
 * The access token is resolved server-side and never surfaced in any response.
 */

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { verifyAdminMutationOrigin } from "@/lib/api/admin-mutation-guard";
import { prisma } from "@/lib/prisma.server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getFacebookConnectionStatus } from "@/lib/outbound/facebook-oauth";
import {
  getFacebookAssetBySlug,
  buildCustomFacebookAsset,
} from "@/lib/outbound/facebook-content-resolver";
import { canPublishFacebookPost } from "@/lib/outbound/facebook-publish-gate";
import { publishLinkPostToFacebook } from "@/lib/outbound/facebook-publishing-client";
import { recordFacebookPublishingAuditSafe } from "@/lib/outbound/facebook-publishing-audit";

// Optional sync: after a successful Facebook post, also post to X
import { publishTweetToX } from "@/lib/outbound/x-publishing-client";
import { getXConnectionStatus } from "@/lib/outbound/x-oauth";
import { adaptFacebookTextToTweet } from "@/lib/outbound/x-content-resolver";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requestId(): string {
  return `fb_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function createAttempt(input: {
  assetType: string;
  assetSlug: string;
  assetTitle: string;
  status: "pending" | "succeeded" | "failed" | "blocked" | "dry_run";
  requestId: string;
  dryRun: boolean;
  actorId?: string | null;
  actorEmailHash?: string | null;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
}) {
  return prisma.facebookPublishAttempt.create({
    data: {
      assetType: input.assetType,
      assetSlug: input.assetSlug,
      assetTitle: input.assetTitle,
      status: input.status,
      requestId: input.requestId,
      dryRun: input.dryRun,
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

  // ── Rate limit: 5 publishes per hour per admin ────────────────────────────
  const rateLimitId = actorId ?? actorEmailHash ?? "anonymous";
  const rl = await checkRateLimit({
    scope: "FACEBOOK_OUTBOUND_PUBLISH",
    identifier: rateLimitId,
    limit: 5,
    windowSeconds: 3600,
  });
  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: "Rate limit reached. Maximum 5 Facebook publish attempts per hour.",
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
    customImagePath?: string;
    finalApproval?: boolean;
    dryRun?: boolean;
    syncToX?: boolean;  // also post to X after successful Facebook post
  };

  const { slug, dryRun = false, finalApproval, syncToX = false } = body;

  if (!dryRun && finalApproval !== true) {
    return res.status(400).json({
      ok: false,
      error: "finalApproval: true is required to publish. Set dryRun: true to validate without publishing.",
      requestId: id,
    });
  }

  // ── Resolve asset ─────────────────────────────────────────────────────────
  let asset = null;

  if (body.assetType === "custom") {
    if (!body.customTitle?.trim() || !body.customText?.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Custom posts require customTitle and customText.",
        requestId: id,
      });
    }
    asset = buildCustomFacebookAsset({
      title: body.customTitle.trim(),
      text: body.customText.trim(),
      link: body.customLink?.trim() || null,
      imagePath: body.customImagePath?.trim() || null,
    });
  } else if (slug) {
    asset = getFacebookAssetBySlug(slug);
    if (!asset) {
      return res.status(404).json({
        ok: false,
        error: "Facebook asset was not found.",
        requestId: id,
      });
    }
  } else {
    return res.status(400).json({
      ok: false,
      error: "Missing required field: slug (or assetType: custom with customTitle/customText).",
      requestId: id,
    });
  }

  // ── Connection status ─────────────────────────────────────────────────────
  const connection = await getFacebookConnectionStatus();

  // ── Publish gate ──────────────────────────────────────────────────────────
  const gate = canPublishFacebookPost(asset, connection);

  await recordFacebookPublishingAuditSafe({
    eventType: "FACEBOOK_PUBLISH_BLOCKED",
    assetSlug: asset.slug,
    assetType: asset.assetType,
    assetTitle: asset.title,
    pageId: connection.pageId,
    blockerCount: gate.blockers.length,
    blockers: gate.blockers,
    dryRun,
    requestId: id,
    actorId,
    actorEmailHash,
  }).catch(() => null);

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
      errorCode: "FB_PUBLISH_BLOCKED",
      errorMessageSafe: gate.blockers.join("; ").slice(0, 500),
    });

    return res.status(409).json({
      ok: false,
      error: "Facebook publish gate blocked this post.",
      blockers: gate.blockers,
      warnings: gate.warnings,
      requestId: id,
    });
  }

  // ── Dry run: validate only ────────────────────────────────────────────────
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
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_PUBLISH_DRY_RUN",
      assetSlug: asset.slug,
      assetType: asset.assetType,
      assetTitle: asset.title,
      pageId: connection.pageId,
      dryRun: true,
      requestId: id,
      actorId,
      actorEmailHash,
    }).catch(() => null);

    return res.status(200).json({
      ok: true,
      dryRun: true,
      message: "Dry run passed. Gate cleared. No post was published.",
      gate: { blockers: gate.blockers, warnings: gate.warnings },
      preview: {
        text: asset.text,
        link: asset.link,
        imagePath: asset.imagePath,
      },
      requestId: id,
    });
  }

  // ── Live publish ──────────────────────────────────────────────────────────
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

  const result = await publishLinkPostToFacebook({
    message: asset.text,
    link: asset.link ?? undefined,
    dryRun: false,
  });

  if (!result.ok) {
    await prisma.facebookPublishAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "failed",
        errorCode: result.errorCode ?? "FB_POST_FAILED",
        errorMessageSafe: result.safeMessage ?? "Facebook publishing failed.",
        completedAt: new Date(),
      },
    });
    await recordFacebookPublishingAuditSafe({
      eventType: "FACEBOOK_PUBLISH_FAILED",
      assetSlug: asset.slug,
      assetType: asset.assetType,
      assetTitle: asset.title,
      pageId: connection.pageId,
      dryRun: false,
      requestId: id,
      actorId,
      actorEmailHash,
    }).catch(() => null);

    return res.status(result.errorCode === "FB_RATE_LIMITED" ? 429 : 400).json({
      ok: false,
      errorCode: result.errorCode,
      error: result.safeMessage,
      requestId: id,
    });
  }

  await prisma.facebookPublishAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "succeeded",
      facebookPostId: result.postId ?? null,
      facebookPostUrl: result.postUrl ?? null,
      completedAt: new Date(),
    },
  });
  await recordFacebookPublishingAuditSafe({
    eventType: "FACEBOOK_POST_PUBLISHED",
    assetSlug: asset.slug,
    assetType: asset.assetType,
    assetTitle: asset.title,
    pageId: connection.pageId,
    facebookPostId: result.postId ?? null,
    dryRun: false,
    requestId: id,
    actorId,
    actorEmailHash,
  }).catch(() => null);

  // ── Optional X sync ───────────────────────────────────────────────────────
  let xSync: { ok: boolean; tweetUrl?: string | null } | null = null;
  if (syncToX) {
    const xStatus = await getXConnectionStatus();
    if (xStatus.canPublish) {
      const tweetText = adaptFacebookTextToTweet(asset.text, asset.link);
      const xResult = await publishTweetToX({ text: tweetText, dryRun: false });
      xSync = { ok: xResult.ok, tweetUrl: xResult.tweetUrl };
    } else {
      xSync = { ok: false };
    }
  }

  return res.status(200).json({
    ok: true,
    message: "Published to Facebook Page successfully.",
    postId: result.postId ?? null,
    postUrl: result.postUrl ?? null,
    xSync,
    requestId: id,
  });
}
