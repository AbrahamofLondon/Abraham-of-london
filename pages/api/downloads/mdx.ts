/* pages/api/downloads/mdx.ts — RAW MDX GATE (REDIS SESSION) */
import type { NextApiRequest, NextApiResponse } from "next";

import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

// IMPORTANT: Use the SERVER compat module (Node runtime).
import { 
  toUiDoc,
  resolveDocDownloadUrl,
  getAccessLevel
} from '@/lib/contentlayer-helper';

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  mdx: string;
};

type Fail = {
  ok: false;
  reason: string;
};

const ORDER: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  const n = String(v ?? "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (n === "inner-circle" || n === "members" || n === "member") return "inner-circle";
  return "public";
}

function canAccess(sessionTier: Tier, requiredTier: Tier) {
  return ORDER.indexOf(sessionTier) >= ORDER.indexOf(requiredTier);
}

function stripDownloadsPrefix(input: string): string {
  return normalizeSlug(input).replace(/^downloads\//, "");
}

function rawMdxFromDoc(doc: any): string {
  // We want RAW MDX, not compiled code.
  if (typeof doc?.body?.raw === "string") return doc.body.raw;
  if (typeof doc?.body === "string") return doc.body;
  if (typeof doc?.content === "string") return doc.content;
  return "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = stripDownloadsPrefix(String(req.query.slug ?? ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  try {
    const doc = await getServerDownloadBySlug(slug);
    if (!doc || isDraftContent(doc)) return res.status(404).json({ ok: false, reason: "Not found" });

    const requiredTier = asTier(doc.accessLevel ?? "inner-circle");

    // Cache policy: never cache gated responses, and be conservative overall
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Cookie");
    res.setHeader(
      "Cache-Control",
      requiredTier === "public"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate, private"
    );

    const mdx = rawMdxFromDoc(doc);
    if (!mdx) return res.status(500).json({ ok: false, reason: "Invalid document format" });

    // Public: serve immediately
    if (requiredTier === "public") {
      return res.status(200).json({
        ok: true,
        tier: "public",
        requiredTier,
        mdx,
      });
    }

    // Protected: Redis session gating
    const token = getAccessTokenFromReq(req);
    if (!token) return res.status(401).json({ ok: false, reason: "Access required" });

    const sessionTier = asTier(await getSessionTier(token));
    if (sessionTier === "public") return res.status(401).json({ ok: false, reason: "Session expired" });

    if (!canAccess(sessionTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "Insufficient access" });
    }

    return res.status(200).json({
      ok: true,
      tier: sessionTier,
      requiredTier,
      mdx,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[API_DOWNLOADS_MDX_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Server error" });
  }
}
