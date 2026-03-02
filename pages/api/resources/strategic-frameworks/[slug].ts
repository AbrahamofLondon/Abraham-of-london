/* pages/api/resources/strategic-frameworks/[slug].ts — CANONICAL ALIAS (SSOT, LOCKSTEP CONTRACT)
   PURPOSE:
   - Backward compatible endpoint for older clients
   - Stable payload contract:
     { ok, slug, requiredTier, requiredLabel, framework? }
*/
import type { NextApiRequest, NextApiResponse } from "next";

import tiers from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

import { getFrameworkBySlug, type Framework } from "@/lib/resources/strategic-frameworks";
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

type Ok = {
  ok: true;
  slug: string;
  requiredTier: AccessTier;
  requiredLabel: string;
  framework: Framework;
};

type Err = {
  ok: false;
  reason: string;
  requiredTier?: AccessTier;
  requiredLabel?: string;
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

/**
 * Strategic Frameworks enforcement policy (deterministic):
 * Founder/Board => architect
 * Inner Circle => inner-circle
 * Member => member
 * else => public
 */
function requiredTierFromFramework(framework: Framework): AccessTier {
  const labels = (framework?.tier ?? []).map((x) => String(x ?? "").toLowerCase().trim());
  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

function toFrameworkPayload(framework: Framework): Framework {
  // If you later need redaction even for authorized users, do it here.
  return framework;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");

  const slug = normalizeParamSlug(req.query.slug);
  if (!slug) return res.status(400).json({ ok: false, reason: "BAD_SLUG" });

  const framework = getFrameworkBySlug(slug);
  if (!framework) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

  const requiredTier = tiers.normalizeRequired(requiredTierFromFramework(framework));
  const requiredLabel = tiers.getLabel(requiredTier);

  // Public: serve without auth
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      slug,
      requiredTier,
      requiredLabel,
      framework: toFrameworkPayload(framework),
    });
  }

  // Restricted: enforce access
  const access = await getInnerCircleAccess(req, { requireAuth: true }).catch(() => null);

  if (!access?.hasAccess) {
    return res.status(401).json({
      ok: false,
      reason: access?.reason || "REQUIRES_AUTH",
      requiredTier,
      requiredLabel,
    });
  }

  const userTier = tiers.normalizeUser((access as any)?.tier ?? "public");
  if (!tiers.hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "INSUFFICIENT_TIER",
      requiredTier,
      requiredLabel,
    });
  }

  return res.status(200).json({
    ok: true,
    slug,
    requiredTier,
    requiredLabel,
    framework: toFrameworkPayload(framework),
  });
}