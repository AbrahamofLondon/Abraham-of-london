// pages/api/resources/mdx.ts — SSOT gated MDX endpoint (Pages Router)
import type { NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  requiredTierFromDoc,
  hasAccess,
} from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { normalizeSlug } from "@/lib/content/shared";

type Ok = { ok: true; tier: AccessTier; mdx: string };
type Fail = { ok: false; reason: string };

function stripResourcesPrefix(slug: string): string {
  return normalizeSlug(slug).replace(/^resources\//, "");
}

function normalizePathish(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function isResourceDoc(doc: any): boolean {
  if (!doc) return false;

  const docKind = String(doc?.docKind || "").toLowerCase();
  if (docKind === "resource") return true;

  const kind = String(doc?.kind || doc?.type || "").toLowerCase();
  if (kind === "resource") return true;

  const fp = String(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "").toLowerCase();
  return fp.startsWith("resources/") || fp.startsWith("content/resources/");
}

async function findResourceDoc(slug: string): Promise<any | null> {
  const { getDocumentBySlug, getAllContentlayerDocs } = await import(
    "@/lib/content/server"
  );

  const tries = [
    slug,
    `resources/${slug}`,
    `content/resources/${slug}`,
    slug.replace(/^resources\//, ""),
  ].map(normalizePathish);

  for (const candidate of tries) {
    const doc = getDocumentBySlug(candidate);
    if (doc && isResourceDoc(doc)) return doc;
  }

  const all = getAllContentlayerDocs?.() || [];
  const wanted = tries.map((t) => t.toLowerCase());

  return (
    all.find((doc: any) => {
      if (!isResourceDoc(doc)) return false;

      const a = normalizePathish(doc?.slug).toLowerCase();
      const b = normalizePathish(doc?._raw?.flattenedPath).toLowerCase();
      const c = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();

      return wanted.includes(a) || wanted.includes(b) || wanted.includes(c);
    }) || null
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = stripResourcesPrefix(String(req.query.slug || ""));
  if (!slug) {
    return res.status(400).json({ ok: false, reason: "Missing slug" });
  }

  const doc = await findResourceDoc(slug);

  if (!doc || (doc as any).draft) {
    return res.status(404).json({ ok: false, reason: "Resource not found" });
  }

  const requiredTier = requiredTierFromDoc(doc);
  const rawMdx = String((doc as any)?.body?.raw ?? "");

  if (requiredTier === "public") {
    return res.status(200).json({ ok: true, tier: "public", mdx: rawMdx });
  }

  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    return res
      .status(401)
      .json({ ok: false, reason: "Access required - please sign in" });
  }

  const ctx = await getSessionContext(sessionId);
  const userTier = normalizeUserTier(ctx.tier ?? "public");

  if (!hasAccess(userTier, requiredTier)) {
    return res.status(403).json({
      ok: false,
      reason: "Insufficient access - requires higher clearance",
    });
  }

  return res.status(200).json({ ok: true, tier: userTier, mdx: rawMdx });
}