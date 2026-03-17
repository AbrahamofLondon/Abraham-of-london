/* pages/api/downloads/mdx.ts — RAW MDX GATE (FIXED) */
import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getTokenForensics } from "@/lib/premium/download-token";

// IMPORTANT: Use the SERVER compat module (Node runtime).
import { 
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
  watermarkId?: string | null;
  tokenId?: string | null;
  forensicFooter?: string | null;
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
  if (typeof doc?.body?.raw === "string") return doc.body.raw;
  if (typeof doc?.body === "string") return doc.body;
  if (typeof doc?.content === "string") return doc.content;
  return "";
}

function extractWatermarkFromDoc(doc: any): { 
  watermarkId?: string | null; 
  tokenId?: string | null;
  forensicFooter?: string | null;
} {
  // Check if doc has embedded watermark metadata
  const metadata = doc.metadata ?? doc.forensics ?? {};
  
  // Try to extract from various possible locations
  const watermarkId = 
    metadata.watermarkId ?? 
    doc.watermarkId ?? 
    null;
    
  const tokenId = 
    metadata.tokenId ?? 
    doc.tokenId ?? 
    null;
    
  const forensicFooter = 
    metadata.expectedFooter ?? 
    doc.footer ?? 
    null;

  // If we have token metadata, try to get forensics
  if (tokenId && !watermarkId) {
    try {
      const forensics = getTokenForensics(metadata);
      return {
        watermarkId: forensics.watermarkId,
        tokenId,
        forensicFooter: forensics.expectedFooter,
      };
    } catch {
      // Silently continue
    }
  }

  return { watermarkId, tokenId, forensicFooter };
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
    // ✅ FIXED: Removed second argument to match function signature
    // Lookup order: direct slug, then prefixed slug.
    const doc = 
      (await getDocumentBySlug(slug)) || 
      (await getDocumentBySlug(`downloads/${slug}`));

    if (!doc || isDraftContent(doc)) {
      return res.status(404).json({ ok: false, reason: "Not found" });
    }

    // Extract forensic data from document
    const { watermarkId, tokenId, forensicFooter } = extractWatermarkFromDoc(doc);

    const requiredTier = mapToAccessTier(
      doc.accessLevel ?? doc.tier ?? doc.classification ?? "member"
    );

    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Cookie");
    res.setHeader(
      "Cache-Control",
      requiredTier === "public"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate, private"
    );

    // Add forensic headers if available
    if (watermarkId) {
      res.setHeader("X-AOL-Watermark-Id", watermarkId);
    }
    if (tokenId) {
      res.setHeader("X-AOL-Token-Id", tokenId);
    }

    const mdx = rawMdxFromDoc(doc);
    if (!mdx) {
      return res.status(500).json({ 
        ok: false, 
        reason: "Invalid document format" 
      });
    }

    if (requiredTier === "public") {
      return res.status(200).json({
        ok: true,
        tier: "public",
        requiredTier,
        mdx,
        tierLabel: getTierLabel("public"),
        watermarkId,
        tokenId,
        forensicFooter,
      });
    }

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
      watermarkId,
      tokenId,
      forensicFooter,
    });
    
  } catch (err) {
    console.error("[API_DOWNLOADS_MDX_ERROR]", err);
    return res.status(500).json({ 
      ok: false, 
      reason: "Server error" 
    });
  }
}