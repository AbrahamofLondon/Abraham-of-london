import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import { getConnectionStatus } from "@/lib/outbound/linkedin-oauth";
import { getResolvedLinkedInOutboundBySlug } from "@/lib/outbound/linkedin-content-resolver";
import { canPublishLinkedInOutbound } from "@/lib/outbound/linkedin-publish-gate";
import { publishTextPostToLinkedIn } from "@/lib/outbound/linkedin-publishing-client";
import { recordLinkedInPublishingAuditSafe } from "@/lib/outbound/linkedin-publishing-audit";
import { checkRateLimit, rateLimitHeaders } from "@/lib/server/rate-limit";

function requestId(): string {
  return `ln_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashEmail(email?: string | null): string | null {
  if (!email) return null;
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

async function createAttempt(input: {
  outboundSlug: string;
  outboundTitle: string;
  status: "pending" | "succeeded" | "failed" | "blocked";
  requestId: string;
  actorId?: string | null;
  actorEmailHash?: string | null;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
}) {
  return prisma.linkedInPublishAttempt.create({
    data: {
      outboundSlug: input.outboundSlug,
      outboundTitle: input.outboundTitle,
      status: input.status,
      requestId: input.requestId,
      actorId: input.actorId ?? null,
      actorEmailHash: input.actorEmailHash ?? null,
      errorCode: input.errorCode ?? null,
      errorMessageSafe: input.errorMessageSafe ?? null,
      completedAt: input.status === "pending" ? null : new Date(),
    },
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const guard = await requireAdminApi(req, res);
  if (!guard) return;

  const id = requestId();
  const actorId = guard.session?.user?.id ?? null;
  const actorEmailHash = hashEmail(guard.session?.user?.email);
  const { slug, filename, confirm, dryRun } = req.body as {
    slug?: string;
    filename?: string;
    confirm?: boolean;
    dryRun?: boolean;
  };
  const outboundSlug = slug || filename?.replace(/\.mdx?$/i, "");

  if (!outboundSlug) {
    return res.status(400).json({ ok: false, error: "Missing required field: slug." });
  }
  if (confirm !== true) {
    return res.status(400).json({ ok: false, error: "Publish confirmation is required." });
  }

  // ── Rate limit (skip for dryRun) ────────────────────────────────────────────
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

  const asset = getResolvedLinkedInOutboundBySlug(outboundSlug);
  if (!asset) {
    return res.status(404).json({ ok: false, error: "LinkedIn outbound asset was not found." });
  }

  const connection = await getConnectionStatus();
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
    await createAttempt({
      outboundSlug: asset.slug,
      outboundTitle: asset.title,
      status: "blocked",
      requestId: id,
      actorId,
      actorEmailHash,
      errorCode: "LINKEDIN_PUBLISH_BLOCKED",
      errorMessageSafe: gate.blockers.join("; ").slice(0, 500),
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

  const attempt = await createAttempt({
    outboundSlug: asset.slug,
    outboundTitle: asset.title,
    status: "pending",
    requestId: id,
    actorId,
    actorEmailHash,
  });

  const result = await publishTextPostToLinkedIn({
    commentary: asset.body,
    ownerType: connection.selectedPublishingTarget.ownerType,
  });

  if (!result.ok) {
    await prisma.linkedInPublishAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "failed",
        errorCode: result.errorCode ?? "LINKEDIN_POST_FAILED",
        errorMessageSafe: result.safeMessage ?? "LinkedIn publishing failed.",
        completedAt: new Date(),
      },
    });
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

  await prisma.linkedInPublishAttempt.update({
    where: { id: attempt.id },
    data: {
      status: "succeeded",
      linkedInPostUrn: result.postUrn ?? null,
      linkedInUrl: result.postUrl ?? null,
      completedAt: new Date(),
    },
  });
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

  return res.status(200).json({
    ok: true,
    message: "Published to LinkedIn. Update MDX metadata manually; production server writeback is disabled.",
    postUrn: result.postUrn ?? null,
    postUrl: result.postUrl ?? null,
    manualMetadata: {
      status: "posted",
      postedAt: new Date().toISOString().slice(0, 10),
      linkedinUrl: result.postUrl ?? "",
    },
    requestId: id,
  });
}
