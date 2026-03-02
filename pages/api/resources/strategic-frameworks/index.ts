// pages/api/resources/strategic-frameworks/index.ts — SSOT INDEX (LOCK-AWARE)
import type { NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { hasAccess, getTierLabel, normalizeUserTier } from "@/lib/access/tier-policy";

import { getUserTierFromReq } from "@/lib/resources/strategic-frameworks.access.server";
import { getServerAllFrameworks } from "@/lib/resources/strategic-frameworks.server";
import type { Framework } from "@/lib/resources/strategic-frameworks.static";

type Item = {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;
  accent: string;
  tag: string;
  canonRoot: string;
  audience: string[];
  requiredTier: AccessTier;
  requiredLabel: string;
  locked: boolean;
  href: string;
};

type Ok = { ok: true; userTier: AccessTier; items: Item[] };
type Err = { ok: false; reason: string };

function safeStr(x: unknown, fallback = ""): string {
  const s = String(x ?? "").trim();
  return s || fallback;
}

function safeArr(x: unknown): string[] {
  if (Array.isArray(x)) return x.map((v) => safeStr(v)).filter(Boolean);
  return [];
}

/**
 * Strategic Frameworks enforcement policy (deterministic):
 * - owner => owner
 * - architect/founder/board => architect
 * - legacy => legacy
 * - client => client
 * - inner-circle => inner-circle
 * - member => member
 * - else => public
 */
function requiredTierFromFramework(fw: Framework): AccessTier {
  const labels = (Array.isArray(fw?.tier) ? fw.tier : [String(fw?.tier ?? "")])
    .map((x) => safeStr(x).toLowerCase());

  const set = new Set(labels);

  if (set.has("owner")) return "owner";
  if (set.has("architect") || set.has("founder") || set.has("board")) return "architect";
  if (set.has("legacy")) return "legacy";
  if (set.has("client")) return "client";
  if (set.has("inner-circle") || set.has("inner circle")) return "inner-circle";
  if (set.has("member")) return "member";
  return "public";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  res.setHeader("Cache-Control", "private, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Cookie");

  // Ensure tier is normalized
  const userTier = normalizeUserTier(await getUserTierFromReq(req));
  const all = await getServerAllFrameworks();

  const items: Item[] = all.map((f) => {
    const reqTier = requiredTierFromFramework(f);
    const locked = reqTier !== "public" && !hasAccess(userTier, reqTier);

    // Do not assume these exist on the static type — but support them if present.
    const key = safeStr((f as any).key, f.slug);
    const accent = safeStr((f as any).accent, "gold");
    const tag = safeStr((f as any).tag, "Protocol");
    const canonRoot = safeStr((f as any).canonRoot, "The Canon");
    const audience = safeArr((f as any).audience);

    return {
      key,
      slug: f.slug,
      title: f.title,
      oneLiner: safeStr(f.oneLiner),
      accent,
      tag,
      canonRoot,
      audience,
      requiredTier: reqTier,
      requiredLabel: getTierLabel(reqTier),
      locked,
      href: `/resources/strategic-frameworks/${encodeURIComponent(f.slug)}`,
    };
  });

  return res.status(200).json({ ok: true, userTier, items });
}