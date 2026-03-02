// pages/api/resources/[slug].ts — UNLOCK RESOURCE PAYLOAD (SERVER-GATED)
import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";

import { getDocumentBySlug } from "@/lib/content/server";

type Ok = { 
  ok: true; 
  requiredTier: string; 
  tier: string; 
  bodyCode: string; // ✅ Pre-compiled MDX code, not source
};

type Err = { 
  ok: false; 
  reason: string; 
  requiredTier?: string;
};

function normalizeParamSlug(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!s || s.includes("..") || s.includes("//")) return "";
  // Return the full slug path, not just the last segment
  return s;
}

function stripResourcesPrefix(slug: string): string {
  return slug.replace(/^resources\//, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const raw = String(req.query.slug || "");
  const slugPath = normalizeParamSlug(raw);
  if (!slugPath) return res.status(400).json({ ok: false, reason: "BAD_SLUG" });

  const cleanSlug = stripResourcesPrefix(slugPath);
  
  // Try both with and without resources/ prefix
  const doc = await getDocumentBySlug(`resources/${cleanSlug}`) || 
              await getDocumentBySlug(cleanSlug);

  if (!doc || (doc as any).draft) {
    return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
  }

  // ✅ Use SSOT tier normalization
  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  // ✅ Public resources: return pre-compiled code immediately
  if (isPublic) {
    const bodyCode = (doc as any).body?.code || (doc as any).bodyCode || "";
    return res.status(200).json({ 
      ok: true, 
      requiredTier, 
      tier: "public", 
      bodyCode 
    });
  }

  // ✅ Restricted resources: require authentication
  const auth = await getInnerCircleAccess(req);
  if (!auth?.hasAccess) {
    return res.status(401).json({ 
      ok: false, 
      reason: auth?.reason || "REQUIRES_AUTH", 
      requiredTier 
    });
  }

  const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ 
      ok: false, 
      reason: "INSUFFICIENT_TIER", 
      requiredTier 
    });
  }

  // ✅ Return pre-compiled code for authorized users
  const bodyCode = (doc as any).body?.code || (doc as any).bodyCode || "";
  
  return res.status(200).json({ 
    ok: true, 
    requiredTier, 
    tier: userTier, 
    bodyCode 
  });
}