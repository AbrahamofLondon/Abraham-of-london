// pages/api/resources/[slug].ts
// ✅ Redis session gating + ✅ server-side MDX compile (returns MDXRemote payload)
// Client NEVER compiles gated content.

import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
import { prepareMDX } from "@/lib/server/md-utils";

// FIXED: Import BOTH functions from contentlayer-helper (server-side)
import { normalizeSlug, getDocumentBySlug } from '@/lib/contentlayer-helper';

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type Fail = { ok: false; reason: string };

const order: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  const n = String(v || "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (
    n === "inner-circle" ||
    n === "members" ||
    n === "member" ||
    n === "basic" ||
    n === "premium" ||
    n === "enterprise"
  ) {
    return "inner-circle";
  }
  return "public";
}

function canAccess(sessionTier: Tier, requiredTier: Tier) {
  return order.indexOf(sessionTier) >= order.indexOf(requiredTier);
}

function stripResourcesPrefix(slug: string) {
  return normalizeSlug(slug).replace(/^resources\//, "");
}

function extractRawMdx(doc: any): string {
  // Prefer raw MDX (what serialize/prepareMDX expects)
  if (doc?.body?.raw && typeof doc.body.raw === "string") return doc.body.raw;
  if (typeof doc?.body === "string") return doc.body;
  if (typeof doc?.content === "string") return doc.content;
  return "";
}

async function findResourceDoc(slugPath: string) {
  // Your server compat uses doc.slug matching — but slug sources vary.
  // We try best-effort keys.
  const candidates = [
    slugPath,
    `resources/${slugPath}`,
  ];

  for (const c of candidates) {
    const doc =
      (await getDocumentBySlug(c, "resource")) ||
      (await getDocumentBySlug(c, "Resource")) ||
      (await getDocumentBySlug(c)); // last resort across all docs
    if (doc) return doc;
  }

  return null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const raw = String(req.query.slug || "");
  const slugPath = stripResourcesPrefix(raw);
  if (!slugPath) {
    return res.status(400).json({ ok: false, reason: "Missing slug" });
  }

  try {
    const doc: any = await findResourceDoc(slugPath);
    if (!doc || doc.draft) {
      return res.status(404).json({ ok: false, reason: "Not found" });
    }

    // Required tier (resource frontmatter)
    const requiredTier = asTier(doc.accessLevel ?? doc.tier ?? doc.access ?? "public");

    // Public resources: no session needed
    let sessionTier: Tier = "public";

    if (requiredTier !== "public") {
      const token = getAccessTokenFromReq(req);
      if (!token) return res.status(403).json({ ok: false, reason: "Access denied" });

      const t = await getSessionTier(token);
      if (!t) return res.status(403).json({ ok: false, reason: "Session expired" });

      sessionTier = asTier(t);
      if (!canAccess(sessionTier, requiredTier)) {
        return res.status(403).json({ ok: false, reason: "Insufficient access" });
      }
    }

    const rawMdx = extractRawMdx(doc);
    if (!rawMdx.trim()) {
      return res.status(500).json({ ok: false, reason: "Invalid document format" });
    }

    // Server-side compile
    const source = await prepareMDX(rawMdx);

    // prepareMDX in your system sometimes returns { source, toc, readingTime }.
    // Normalize to MDXRemoteSerializeResult if needed.
    const payload: MDXRemoteSerializeResult =
      (source as any)?.compiledSource
        ? (source as MDXRemoteSerializeResult)
        : (source as any)?.source;

    if (!payload?.compiledSource) {
      return res.status(500).json({ ok: false, reason: "MDX compilation failed" });
    }

    return res.status(200).json({
      ok: true,
      tier: sessionTier,
      requiredTier,
      source: payload,
    });
  } catch (e) {
    console.error("[api/resources/[slug]]", e);
    return res.status(500).json({ ok: false, reason: "Server error" });
  }
}