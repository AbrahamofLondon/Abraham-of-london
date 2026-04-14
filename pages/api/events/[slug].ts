/* pages/api/events/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { gzipSync } from "zlib";

import { requiredTierFromDoc } from "@/lib/access/tiers";
import { normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import tiers from "@/lib/access/tiers";

function compress(content: string): string {
  return gzipSync(content).toString("base64");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const slug = normalizeSlug(String(req.query.slug || ""));
    if (!slug) {
      return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });
    }

    const { getServerEventBySlug } = await import("@/lib/content/server");
    const event = getServerEventBySlug(slug);

    if (!event || event.draftSafe) {
      return res.status(404).json({ ok: false, reason: "EVENT_NOT_FOUND" });
    }

    const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(event));
    const renderBody = getRenderableBody(event);

    if (!renderBody.code.trim()) {
      return res.status(500).json({ ok: false, reason: "BODY_UNAVAILABLE" });
    }

    if (requiredTier === "public") {
      return res.status(200).json({
        ok: true,
        tier: "public",
        requiredTier: "public",
        bodyCode: compress(renderBody.code),
        compressed: true,
        encoding: "gzip-base64",
      });
    }

    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });
    }

    const session = await verifySession(sessionId);
    if (!session || !session.valid) {
      return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
    }

    const userTier = tiers.normalizeUser(session.tier);
    if (!tiers.hasAccess(userTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    return res.status(200).json({
      ok: true,
      tier: userTier,
      requiredTier,
      bodyCode: compress(renderBody.code),
      compressed: true,
      encoding: "gzip-base64",
    });
  } catch (error) {
    console.error("[EVENT_API_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_SERVER_ERROR" });
  }
}