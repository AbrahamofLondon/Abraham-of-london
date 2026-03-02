/* pages/api/downloads/mdx.ts — RAW MDX GATE (SSOT ALIGNED) */
import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

// IMPORTANT: Use the SERVER compat module (Node runtime).
import { 
  toUiDoc,
  resolveDocDownloadUrl,
  getAccessLevel,
  normalizeSlug,
  getDocumentBySlug,
  isDraftContent,
} from "@/lib/content/server";

import type { AccessTier } from "@/lib/access/tier-policy";
import { 
  normalizeRequiredTier, 
  normalizeUserTier, 
  hasAccess,
  getTierLabel,
} from "@/lib/access/tier-policy";

type Ok = {
  ok: true;
  tier: AccessTier;
  requiredTier: AccessTier;
  mdx: string;
  tierLabel?: string;
};

type Fail = {
  ok: false;
  reason: string;
  requiredTier?: AccessTier;
};

/**
 * Map any input to SSOT AccessTier
 */
function mapToAccessTier(v: unknown): AccessTier {
  return normalizeRequiredTier(v);
}

function stripDownloadsPrefix(input: string): string {
  return normalizeSlug(input).replace(/^downloads\//, "");
}

function rawMdxFromDoc(doc: any): string {
  // We want RAW MDX, not compiled code.
  if (typeof doc?.body?.raw === "string") return doc.body.raw;
  if (typeof doc?.body === "string") return doc.body;
  if (typeof doc?.content === "string") return doc.content;
  return "";
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = stripDownloadsPrefix(String(req.query.slug ?? ""));
  if (!slug) {
    return res.status(400).json({ ok: false, reason: "Missing slug" });
  }

  try {
    // Try multiple lookup strategies
    const doc = 
      (await getDocumentBySlug(slug, "download")) ||
      (await getDocumentBySlug(`downloads/${slug}`, "download")) ||
      (await getDocumentBySlug(slug));

    if (!doc || isDraftContent(doc)) {
      return res.status(404).json({ ok: false, reason: "Not found" });
    }

    // Determine required tier using SSOT
    const requiredTier = mapToAccessTier(
      doc.accessLevel ?? doc.tier ?? doc.classification ?? "member"
    );

    // Cache policy
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Cookie");
    res.setHeader(
      "Cache-Control",
      requiredTier === "public"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate, private"
    );

    const mdx = rawMdxFromDoc(doc);
    if (!mdx) {
      return res.status(500).json({ 
        ok: false, 
        reason: "Invalid document format" 
      });
    }

    // Public: serve immediately
    if (requiredTier === "public") {
      return res.status(200).json({
        ok: true,
        tier: "public",
        requiredTier,
        mdx,
        tierLabel: getTierLabel("public"),
      });
    }

    // Protected: Redis session gating
    const token = getAccessTokenFromReq(req);
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        reason: "Access required",
        requiredTier,
      });
    }

    const sessionTierRaw = await getSessionTier(token);
    if (!sessionTierRaw) {
      return res.status(401).json({ 
        ok: false, 
        reason: "Session expired",
        requiredTier,
      });
    }

    const sessionTier = normalizeUserTier(sessionTierRaw);
    
    if (!hasAccess(sessionTier, requiredTier)) {
      return res.status(403).json({ 
        ok: false, 
        reason: `Insufficient access - requires ${getTierLabel(requiredTier)}`,
        requiredTier,
      });
    }

    return res.status(200).json({
      ok: true,
      tier: sessionTier,
      requiredTier,
      mdx,
      tierLabel: getTierLabel(sessionTier),
    });
    
  } catch (err) {
    console.error("[API_DOWNLOADS_MDX_ERROR]", err);
    return res.status(500).json({ 
      ok: false, 
      reason: "Server error" 
    });
  }
}