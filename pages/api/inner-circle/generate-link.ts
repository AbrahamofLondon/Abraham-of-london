/* pages/api/inner-circle/generate-link.ts — ENTERPRISE ASSET RETRIEVAL (SSOT) */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getBriefById, getBriefAccessDecision } from "@/lib/briefs/registry";
import { AuditService } from "@/lib/server/services/audit-service";

type Ok = { ok: true; downloadUrl: string; issuedAt: string; expiresInSeconds: number };
type Fail = { ok: false; error: string; requiredTier?: AccessTier };

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

/**
 * HMAC signed URL params (tamper-evident).
 * You MUST validate this signature at the CDN/origin if you actually enforce it.
 * If you don't have a validating edge, consider returning a Netlify function URL instead.
 */
function signParams(params: Record<string, string>, secret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHmac("sha256", secret).update(canonical).digest("hex");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  const startTime = Date.now();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const briefId = String(req.body?.briefId || "").trim();
  if (!briefId) return res.status(400).json({ ok: false, error: "briefId required" });

  // 1) Resolve brief
  const brief = getBriefById(briefId);
  if (!brief) return res.status(404).json({ ok: false, error: "Asset not found in registry" });

  // 2) Resolve user tier from SSOT cookie -> DB session
  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    // best-effort audit
    try {
      await AuditService.recordSecurityEvent({
        action: "unauthorized_access_attempt",
        actorId: "unknown",
        actorEmail: "unknown",
        severity: "high",
        metadata: { briefId, note: "missing_session_cookie" },
      });
    } catch {}
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const ctx = await getSessionContext(sessionId);
  const userTier: AccessTier = normalizeUserTier(ctx.tier ?? ctx.member?.tier ?? "public");

  // 3) Gate using registry decision (single source)
  const decision = getBriefAccessDecision(brief, userTier);
  if (!decision.ok) {
    try {
      await AuditService.recordSecurityEvent({
        action: "unauthorized_access_attempt",
        actorId: String(ctx.member?.id ?? ctx.member?.memberId ?? "unknown"),
        actorEmail: String(ctx.member?.email ?? "unknown"),
        severity: "high",
        metadata: { briefId, userTier, requiredTier: decision.requiredTier, reason: decision.reason },
      });
    } catch {}
    return res.status(403).json({ ok: false, error: "Insufficient clearance", requiredTier: decision.requiredTier });
  }

  // 4) Construct signed delivery URL (60s expiry)
  // Configure your delivery origin (CDN/origin endpoint that checks sig/exp)
  const ORIGIN_BASE = process.env.INNER_CIRCLE_CDN_BASE?.trim() || "https://cdn.intelligence.aol";
  const SIGNING_SECRET = requireEnv("INNER_CIRCLE_LINK_HMAC_SECRET");

  const expires = String(Math.floor(Date.now() / 1000) + 60);
  const aid = brief.id;

  const params = {
    aid,
    exp: expires,
    // include tier + member to make signatures user-specific (optional)
    tier: userTier,
    mid: String(ctx.member?.id ?? ctx.member?.memberId ?? "unknown"),
  };

  const sig = signParams(params, SIGNING_SECRET);

  const signedUrl =
    `${ORIGIN_BASE}/vault/v1/${encodeURIComponent(brief.id)}.pdf` +
    `?aid=${encodeURIComponent(params.aid)}` +
    `&exp=${encodeURIComponent(params.exp)}` +
    `&tier=${encodeURIComponent(params.tier)}` +
    `&mid=${encodeURIComponent(params.mid)}` +
    `&sig=${encodeURIComponent(sig)}`;

  // 5) Audit download issuance (best-effort)
  try {
    await AuditService.recordDownload({
      briefId: brief.id,
      memberId: String(ctx.member?.id ?? ctx.member?.memberId ?? "unknown"),
      email: String(ctx.member?.email ?? "unknown"),
      ip: getClientIp(req),
      userAgent: String(req.headers["user-agent"] || "unknown"),
      success: true,
      latencyMs: Date.now() - startTime,
    });
    await AuditService.incrementAssetMetrics(brief.id);
  } catch {}

  return res.status(200).json({
    ok: true,
    downloadUrl: signedUrl,
    issuedAt: new Date().toISOString(),
    expiresInSeconds: 60,
  });
}