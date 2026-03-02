// pages/api/blog/[slug].ts — SECURE ESSAY PROXY (SSOT, Postgres sessions, public bypass)
import type { NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier, hasAccess, requiredTierFromDoc } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

import { getPublishedPosts } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";

type ResponseData = {
  ok: boolean;
  reason?: string;
  tier?: AccessTier;
  requiredTier?: AccessTier;
  bodyCode?: string;
};

function toBareBlogSlug(input: string) {
  const n = normalizeSlug(input || "");
  return n
    .replace(/^blog\//i, "")
    .replace(/^\/blog\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function extractCode(doc: any): string {
  return String(
    doc?.body?.code ||
      doc?.bodyCode ||
      doc?.content ||
      doc?.mdx ||
      doc?.body?.raw ||
      (typeof doc?.body === "string" ? doc.body : "") ||
      ""
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const slugParam = String(req.query.slug || "");
  if (!slugParam) return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });

  const bare = toBareBlogSlug(slugParam);
  const want = `blog/${bare}`;

  const posts = getPublishedPosts() || [];
  const doc =
    posts.find((p: any) => normalizeSlug(p.slug || "") === want) ||
    posts.find((p: any) => normalizeSlug(p._raw?.flattenedPath || "") === want);

  if (!doc || doc?.draft) {
    return res.status(404).json({ ok: false, reason: "ESSAY_NOT_FOUND" });
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));

  // ✅ Public bypass — NEVER require session
  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: extractCode(doc),
    });
  }

  // ✅ Session gate only for restricted content
  const sessionId = readAccessCookie(req);
  if (!sessionId) return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });

  const ctx = await getSessionContext(sessionId);
  const sessionTierRaw = ctx?.tier ?? ctx?.member?.tier ?? null;
  if (!sessionTierRaw) return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });

  const userTier: AccessTier = normalizeUserTier(sessionTierRaw);

  if (!hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE", tier: userTier, requiredTier });
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: extractCode(doc),
  });
}