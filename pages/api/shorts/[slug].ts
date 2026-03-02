// pages/api/shorts/[slug].ts — UNLOCK SHORT (COMPILED MDX CODE)
// Returns compiled bodyCode ONLY if caller has access.

import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import { getDocBySlug } from "@/lib/content/unified-router";

type Ok = {
  ok: true;
  requiredTier: string;
  tier: string;
  bodyCode: string;
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
  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

function getBodyCode(doc: any): string {
  return String(doc?.body?.code || doc?.bodyCode || "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0");

  const slug = normalizeParamSlug(req.query.slug);
  if (!slug) return res.status(400).json({ ok: false, reason: "BAD_SLUG" });

  const doc = getDocBySlug(`shorts/${slug}`) || getDocBySlug(slug);
  if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  if (isPublic) {
    const bodyCode = getBodyCode(doc);
    if (!bodyCode) return res.status(200).json({ ok: false, reason: "NO_BODY_CODE", requiredTier });
    return res.status(200).json({ ok: true, requiredTier, tier: "public", bodyCode });
  }

  const auth = await getInnerCircleAccess(req);
  if (!auth?.hasAccess) {
    return res.status(401).json({ ok: false, reason: auth?.reason || "REQUIRES_AUTH", requiredTier });
  }

  const userTier = tiers.normalizeUser((auth as any)?.tier ?? "public");
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_TIER", requiredTier });
  }

  const bodyCode = getBodyCode(doc);
  if (!bodyCode) return res.status(200).json({ ok: false, reason: "NO_BODY_CODE", requiredTier });

  return res.status(200).json({
    ok: true,
    requiredTier,
    tier: userTier,
    bodyCode,
  });
}