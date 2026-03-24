// pages/api/surrender/download/[id].ts — Tier-gated download redirect (SSOT)
import type { NextApiRequest, NextApiResponse } from "next";

import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import tiers from "@/lib/access/tiers";
import { getPDFById } from "@/lib/pdf/registry";

type OkRedirect = void;
type ErrResponse = {
  ok: false;
  reason: string;
  requiredTier?: string;
};

function normalizeId(input: unknown): string {
  const s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/");

  if (!s || s.includes("..")) return "";
  return s.split("/").filter(Boolean).pop() || "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrResponse | OkRedirect>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      reason: "METHOD_NOT_ALLOWED",
    });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");

  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const id = normalizeId(idParam);

  if (!id) {
    return res.status(400).json({
      ok: false,
      reason: "BAD_ID",
    });
  }

  const pdf = getPDFById(id);
  if (!pdf) {
    return res.status(404).json({
      ok: false,
      reason: "NOT_FOUND",
    });
  }

  const requiredTier = tiers.normalizeRequired((pdf as any)?.tier ?? "public");

  if (requiredTier === "public") {
    res.setHeader("Location", String((pdf as any).outputPath || ""));
    return res.status(302).end();
  }

  const access = await getInnerCircleAccess(req, requiredTier);

  if (!access?.hasAccess) {
    return res.status(401).json({
      ok: false,
      reason: access?.reason || "REQUIRES_AUTH",
      requiredTier,
    });
  }

  const userTier = tiers.normalizeUser((access as any)?.tier ?? "public");

  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "INSUFFICIENT_TIER",
      requiredTier,
    });
  }

  res.setHeader("Location", String((pdf as any).outputPath || ""));
  return res.status(302).end();
}