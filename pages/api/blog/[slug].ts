/* pages/api/blog/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { gzipSync } from "zlib";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

import { getPublishedPosts } from "@/lib/content/server";
import { normalizeSlug } from "@/lib/content/shared";
import { getRenderableBody } from "@/lib/content/render-body";

type ResponseData = {
  ok: boolean;
  reason?: string;
  tier?: AccessTier;
  requiredTier?: AccessTier;
  bodyCode?: string;
  compressed?: boolean;
  encoding?: "gzip-base64";
};

function compress(content: string): string {
  return gzipSync(content).toString("base64");
}

function toBareBlogSlug(input: string) {
  const n = normalizeSlug(input || "");
  return n
    .replace(/^blog\//i, "")
    .replace(/^posts\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const slugParam = String(req.query.slug || "");
  if (!slugParam) {
    return res.status(400).json({ ok: false, reason: "SLUG_MISSING" });
  }

  const bare = toBareBlogSlug(slugParam);
  const wantBlog = `blog/${bare}`;
  const wantPosts = `posts/${bare}`;

  const posts = getPublishedPosts() || [];
  const doc =
    posts.find((p: any) => normalizeSlug(p.slug || "") === wantBlog) ||
    posts.find((p: any) => normalizeSlug(p._raw?.flattenedPath || "") === wantBlog) ||
    posts.find((p: any) => normalizeSlug(p.slug || "") === wantPosts) ||
    posts.find((p: any) => normalizeSlug(p._raw?.flattenedPath || "") === wantPosts);

  if (!doc || doc?.draft) {
    return res.status(404).json({ ok: false, reason: "ESSAY_NOT_FOUND" });
  }

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  const renderBody = getRenderableBody(doc);

  if (!renderBody.code.trim()) {
    return res.status(500).json({ ok: false, reason: "BODY_UNAVAILABLE" });
  }

  if (requiredTier === "public") {
    return res.status(200).json({
      ok: true,
      tier: "public",
      requiredTier: "public",
      bodyCode: compress(renderBody.code),
      compressed: true,
      encoding: "gzip-base64",
    });
  }

  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({ ok: false, reason: "CLEARANCE_REQUIRED" });
  }

  const ctx = await getSessionContext(sessionId);
  const sessionTierRaw = ctx?.tier ?? null;

  if (!ctx?.ok || !ctx?.valid || !sessionTierRaw) {
    return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
  }

  const userTier: AccessTier = normalizeUserTier(sessionTierRaw);

  if (!hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "INSUFFICIENT_CLEARANCE",
      tier: userTier,
      requiredTier,
    });
  }

  return res.status(200).json({
    ok: true,
    tier: userTier,
    requiredTier,
    bodyCode: compress(renderBody.code),
    compressed: true,
    encoding: "gzip-base64",
  });
}