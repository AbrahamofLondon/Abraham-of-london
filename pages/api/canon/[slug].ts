// pages/api/canon/[slug].ts — SECURE CANON PROXY (SSOT, slug-stable, public bypass)
import type { NextApiRequest, NextApiResponse } from "next";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";

import { getDocBySlug } from "@/lib/content/server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type ResponseData = {
  ok: boolean;
  reason?: string;
  tier?: AccessTier;
  requiredTier?: AccessTier;
  bodyCode?: string;
};

function canonBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const p = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length);
      s = s.replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  // strip repeatedly
  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content") || changed;
    changed = stripOnce("vault") || changed;
    changed = stripOnce("canon") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s;
}

function extractBodyCode(doc: any): string {
  return String(doc?.body?.code || doc?.bodyCode || "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const bare = canonBareSlug(req.query.slug);
  if (!bare) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  // ✅ SSOT lookup order (same as pages/canon/[slug].tsx)
  const doc: any =
    getDocBySlug(`canon/${bare}`) ||
    getDocBySlug(`content/canon/${bare}`) ||
    getDocBySlug(`vault/canon/${bare}`) ||
    getDocBySlug(bare);

  if (!doc || doc.draft) {
    return res.status(404).json({ ok: false, reason: "MANUSCRIPT_NOT_FOUND" });
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));

  // ✅ Public bypass (no session required)
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: extractBodyCode(doc),
    });
  }

  // ✅ Restricted: session gate
  const sessionId = getAccessCookie(req);
  if (!sessionId) return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });

  const session = await verifySession(sessionId);
  if (!session || !session.valid) return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });

  const userTier: AccessTier = tiers.normalizeUser(session.tier);

  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE", tier: userTier, requiredTier });
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: extractBodyCode(doc),
  });
}