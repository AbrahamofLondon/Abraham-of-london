// pages/api/downloads/[slug].ts — SECURE PRE-COMPILED GATE
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { getAllContentlayerDocs } from "@/lib/content/real";

type Tier = "public" | "inner-circle" | "private";
const ORDER: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  const n = String(v ?? "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (n === "inner-circle" || n === "members") return "inner-circle";
  return "public";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = String(req.query.slug ?? "").replace(/^\/+|\/+$/g, "").replace(/^downloads\//, "");
  
  try {
    const allDocs = getAllContentlayerDocs();
    const doc = allDocs.find((d: any) => 
      d.slug?.endsWith(slug) || d._raw?.flattenedPath?.endsWith(slug)
    );

    if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "Manuscript not found" });

    const requiredTier = asTier(doc.accessLevel ?? "inner-circle");

    // 1. Authorization Protocol
    let sessionTier: Tier = "public";
    if (requiredTier !== "public") {
      const token = getAccessTokenFromReq(req);
      if (!token) return res.status(403).json({ ok: false, reason: "Authentication required" });

      const t = await getSessionTier(token);
      if (!t) return res.status(403).json({ ok: false, reason: "Session expired" });

      sessionTier = asTier(t);
      if (ORDER.indexOf(sessionTier) < ORDER.indexOf(requiredTier)) {
        return res.status(403).json({ ok: false, reason: "Insufficient clearance" });
      }
    }

    // 2. Tactical Headers
    res.setHeader("Vary", "Cookie");
    res.setHeader("Cache-Control", requiredTier === "public" 
      ? "public, s-maxage=3600" 
      : "no-store, private"
    );

    // 3. Return Pre-compiled Payload (Eliminating Runtime Serialization)
    return res.status(200).json({ 
      ok: true, 
      tier: sessionTier, 
      bodyCode: doc.body.code // ✅ Static compiled JS from Contentlayer2
    });
  } catch (err) {
    return res.status(500).json({ ok: false, reason: "Internal system error" });
  }
}