/* pages/api/downloads/[slug].ts — SECURE PRE-COMPILED GATE (SSOT ALIGNED) */
import type { NextApiRequest, NextApiResponse } from "next";

// ✅ FIXED: Standardized to Redis to match mdx.ts and ensure session consistency
import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getAllContentlayerDocs } from "@/lib/content/real";
import { getTokenForensics } from "@/lib/premium/download-token";

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
  bodyCode: string;
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

  // Sanitize slug and remove download prefix for lookup
  const slug = String(req.query.slug ?? "")
    .replace(/^\/+|\/+$/g, "")
    .replace(/^downloads\//, "");
  
  try {
    const allDocs = getAllContentlayerDocs();
    const doc = allDocs.find((d: any) => 
      d.slug?.endsWith(slug) || d._raw?.flattenedPath?.endsWith(slug)
    );

    if (!doc || doc.draft) {
      return res.status(404).json({ ok: false, reason: "Manuscript not found" });
    }

    // Extract forensic data from document
    const { watermarkId, tokenId, forensicFooter } = extractWatermarkFromDoc(doc);

    // Determine required tier using Single Source of Truth
    const requiredTier = mapToAccessTier(
      doc.accessLevel ?? doc.tier ?? doc.classification ?? "member"
    );

    // 1. Authorization Protocol
    let sessionTier: AccessTier = "public";
    let token = null;
    
    if (requiredTier !== "public") {
      token = getAccessTokenFromReq(req);
      if (!token) {
        return res.status(401).json({ 
          ok: false, 
          reason: "Authentication required",
          requiredTier,
        });
      }

      // Consistent with Redis session management
      const t = await getSessionTier(token);
      if (!t) {
        return res.status(401).json({ 
          ok: false, 
          reason: "Session expired",
          requiredTier,
        });
      }

      sessionTier = normalizeUserTier(t);
      
      if (!hasAccess(sessionTier, requiredTier)) {
        return res.status(403).json({ 
          ok: false, 
          reason: `Insufficient clearance - requires ${getTierLabel(requiredTier)} access`,
          requiredTier,
        });
      }
    }

    // 2. Tactical Headers
    res.setHeader("Vary", "Cookie");
    res.setHeader("Cache-Control", requiredTier === "public" 
      ? "public, s-maxage=3600, stale-while-revalidate=600" 
      : "no-store, private, max-age=0"
    );

    // Add forensic headers if available
    if (watermarkId) {
      res.setHeader("X-AOL-Watermark-Id", watermarkId);
    }
    if (tokenId) {
      res.setHeader("X-AOL-Token-Id", tokenId);
    }

    // 3. Return Pre-compiled Payload with forensic data
    return res.status(200).json({ 
      ok: true, 
      tier: sessionTier, 
      requiredTier,
      bodyCode: doc.body?.code ?? "",
      tierLabel: getTierLabel(sessionTier),
      watermarkId,
      tokenId,
      forensicFooter,
    });
    
  } catch (err) {
    console.error("[API_DOWNLOADS_ERROR]", err);
    return res.status(500).json({ 
      ok: false, 
      reason: "Internal system error" 
    });
  }
}