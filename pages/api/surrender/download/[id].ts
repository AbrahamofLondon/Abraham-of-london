// pages/api/surrender/download/[id].ts — Tier-gated download redirect (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers from "@/lib/access/tiers";
import { getPDFById } from "@/lib/pdf/registry";

function normalizeId(input: unknown): string {
  const s = String(input ?? "").trim();
  if (!s || s.includes("..")) return "";
  return s.replace(/\\/g, "/").split("/").filter(Boolean).pop() || "";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");

  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = normalizeId(idParam);
  if (!id) return res.status(400).json({ ok: false, reason: "BAD_ID" });

  const pdf = getPDFById(id);
  if (!pdf) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

  const requiredTier = tiers.normalizeRequired((pdf as any).tier ?? "public");

  // Public is always public
  if (requiredTier === "public") {
    res.setHeader("Location", pdf.outputPath);
    return res.status(302).end();
  }

  const access = getInnerCircleAccess(req, requiredTier);
  if (!access?.hasAccess) {
    return res.status(401).json({ ok: false, reason: access?.reason || "REQUIRES_AUTH", requiredTier });
  }

  const userTier = tiers.normalizeUser((access as any)?.tier ?? "public");
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_TIER", requiredTier });
  }

  res.setHeader("Location", pdf.outputPath);
  return res.status(302).end();
}