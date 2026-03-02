/* pages/api/downloads/[slug].ts — SECURE PRE-COMPILED GATE (SSOT ALIGNED) */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getAllContentlayerDocs } from "@/lib/content/real";

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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

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

    // Determine required tier using SSOT
    const requiredTier = mapToAccessTier(
      doc.accessLevel ?? doc.tier ?? doc.classification ?? "member"
    );

    // 1. Authorization Protocol
    let sessionTier: AccessTier = "public";
    
    if (requiredTier !== "public") {
      const token = getAccessTokenFromReq(req);
      if (!token) {
        return res.status(401).json({ 
          ok: false, 
          reason: "Authentication required",
          requiredTier,
        });
      }

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

    // 3. Return Pre-compiled Payload
    return res.status(200).json({ 
      ok: true, 
      tier: sessionTier, 
      requiredTier,
      bodyCode: doc.body?.code ?? "",
      tierLabel: getTierLabel(sessionTier),
    });
    
  } catch (err) {
    console.error("[API_DOWNLOADS_ERROR]", err);
    return res.status(500).json({ 
      ok: false, 
      reason: "Internal system error" 
    });
  }
}