// pages/api/downloads/resolve/[slug].ts — canonical unlock endpoint for Downloads (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";
import { allDownloads } from "@/lib/contentlayer";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

function normalizeSlugParam(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Vary", "Cookie");

  const slug = normalizeSlugParam(req.query.slug);
  if (!slug) return res.status(400).json({ ok: false, reason: "BAD_SLUG" });

  const doc = (allDownloads as any[]).find((d: any) => String(d?.slugSafe || d?.slug || "").replace(/^\/+/, "") === slug);
  if (!doc || doc?.draftSafe) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

  const required = tiers.normalizeRequired(requiredTierFromDoc(doc));
  if (required === "public") {
    return res.status(200).json({ ok: true, requiredTier: required, bodyCode: doc.body?.code || doc.bodyCode || "" });
  }

  const access = await getInnerCircleAccess(req);
  if (!access?.hasAccess) {
    return res.status(401).json({ ok: false, reason: access?.reason || "REQUIRES_AUTH", requiredTier: required });
  }

  const userTier = tiers.normalizeUser((access as any)?.tier ?? "public");
  if (!tiers.hasAccess(userTier, required)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_TIER", requiredTier: required });
  }

  return res.status(200).json({ ok: true, requiredTier: required, bodyCode: doc.body?.code || doc.bodyCode || "" });
}