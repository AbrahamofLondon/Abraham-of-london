/* pages/api/inner-circle/generate-link.ts — ENTERPRISE ASSET RETRIEVAL (SSOT) */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import {
  DownloadContentType,
  DownloadDeliveryMode,
  DownloadEventType,
} from "@prisma/client";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getBriefById, getBriefAccessDecision } from "@/lib/briefs/registry";
import { AuditService } from "@/lib/server/services/audit-service";
import { prisma } from "@/lib/server/prisma";

type Ok = {
  ok: true;
  downloadUrl: string;
  issuedAt: string;
  expiresInSeconds: number;
};

type Fail = {
  ok: false;
  error: string;
  requiredTier?: AccessTier;
};

function getClientIp(req: NextApiRequest): string {
  const xff = String(req.headers["x-forwarded-for"] || "");
  const ip = xff.split(",")[0]?.trim();
  return ip || req.socket.remoteAddress || "unknown";
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${name}`);
  return String(v).trim();
}

function signParams(params: Record<string, string>, secret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");

  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>,
) {
  const startTime = Date.now();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const briefId = String(req.body?.briefId || "").trim();
  if (!briefId) {
    return res.status(400).json({ ok: false, error: "briefId required" });
  }

  const brief = getBriefById(briefId);
  if (!brief) {
    return res.status(404).json({ ok: false, error: "Asset not found in registry" });
  }

  const sessionId = readAccessCookie(req);
  const ip = getClientIp(req);
  const userAgent = String(req.headers["user-agent"] || "unknown");
  const requestId = String(req.headers["x-request-id"] || "").trim() || undefined;

  if (!sessionId) {
    try {
      await AuditService.recordSecurityEvent({
        event: "LOGIN_FAILURE",
        action: "unauthorized_access_attempt",
        severity: "error",
        details: { briefId, note: "missing_session_cookie", ip },
      });
    } catch {
      // ignore audit failure
    }

    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const ctx = await getSessionContext(sessionId);
  const memberId = String(ctx.memberId || "").trim();
  const memberEmail = String(ctx.email || "").trim();
  const userTier: AccessTier = normalizeUserTier(ctx.tier || "public");

  const decision = getBriefAccessDecision(brief, userTier);
  if (!decision.ok) {
    try {
      await AuditService.recordSecurityEvent({
        event: "UNAUTHORIZED_ACCESS",
        action: "insufficient_clearance_attempt",
        severity: "warn",
        memberId: memberId || undefined,
        ip,
        userAgent,
        details: {
          briefId,
          userTier,
          requiredTier: decision.requiredTier,
          reason: decision.reason,
        },
      });
    } catch {
      // ignore audit failure
    }

    return res.status(403).json({
      ok: false,
      error: "Insufficient clearance",
      requiredTier: decision.requiredTier,
    });
  }

  const content = await prisma.contentMetadata.findUnique({
    where: { slug: brief.id },
    select: {
      id: true,
      slug: true,
      title: true,
      contentType: true,
    },
  });

  const ORIGIN_BASE =
    process.env.INNER_CIRCLE_CDN_BASE?.trim() || "https://cdn.intelligence.aol";
  const SIGNING_SECRET = requireEnv("INNER_CIRCLE_LINK_HMAC_SECRET");

  const expires = String(Math.floor(Date.now() / 1000) + 60);
  const params = {
    aid: brief.id,
    exp: expires,
    tier: userTier,
    mid: memberId || "unknown",
  };

  const sig = signParams(params, SIGNING_SECRET);

  const signedUrl =
    `${ORIGIN_BASE}/vault/v1/${encodeURIComponent(brief.id)}.pdf` +
    `?aid=${encodeURIComponent(params.aid)}` +
    `&exp=${encodeURIComponent(params.exp)}` +
    `&tier=${encodeURIComponent(params.tier)}` +
    `&mid=${encodeURIComponent(params.mid)}` +
    `&sig=${encodeURIComponent(sig)}`;

  try {
    await AuditService.recordDownload({
      slug: brief.id,
      title: content?.title ?? brief.title ?? brief.id,
      contentType: DownloadContentType.PDF,
      eventType: DownloadEventType.PREVIEW,
      deliveryMode: DownloadDeliveryMode.SECURE_LINK,

      contentId: content?.id,
      memberId: memberId || undefined,
      email: memberEmail || undefined,

      ip,
      userAgent,
      requestId,
      sessionId,

      success: true,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      metadata: {
        route: "pages/api/inner-circle/generate-link",
        signedUrlIssued: true,
        expiresInSeconds: 60,
      },
    });

    if (content?.slug) {
      await AuditService.incrementAssetMetrics(content.slug);
    }
  } catch (e) {
    console.error("[AUDIT_FAILURE]", e);
  }

  return res.status(200).json({
    ok: true,
    downloadUrl: signedUrl,
    issuedAt: new Date().toISOString(),
    expiresInSeconds: 60,
  });
}