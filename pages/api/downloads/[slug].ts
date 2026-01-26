/* pages/api/downloads/[slug].ts — COMPILED MDX GATE (POSTGRES SESSION) */
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

// Use server-side content functions from real.ts instead of individual server modules
import { getAllContentlayerDocs } from "@/lib/content/real";
import { prepareMDX } from "@/lib/server/md-utils";

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type Fail = { ok: false; reason: string };

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

function normalizeSlug(slug: string): string {
  return slug.replace(/^\/+|\/+$/g, "").trim();
}

function stripDownloadsPrefix(input: string): string {
  return normalizeSlug(input).replace(/^downloads\//, "");
}

function rawMdxFromDoc(doc: any): string {
  if (typeof doc?.body?.raw === "string") return doc.body.raw;
  if (typeof doc?.body === "string") return doc.body;
  if (typeof doc?.content === "string") return doc.content;
  return "";
}

function isDraftContent(doc: any): boolean {
  return doc?.draft === true;
}

// Local function to get download by slug (replaces getServerDownloadBySlug)
function getServerDownloadBySlug(slug: string): any | null {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const allDocs = getAllContentlayerDocs();
  const downloads = allDocs.filter(
    (doc: any) => doc.type === "Download" || doc._raw?.sourceFileDir === "downloads"
  );
  
  for (const doc of downloads) {
    const docSlug = doc.slug || "";
    const docHref = doc.href || "";
    const flattenedPath = doc._raw?.flattenedPath || "";
    
    const compareSlug = (s: string) => s.replace(/^\/+|\/+$/g, "");
    
    if (
      compareSlug(docSlug) === normalized ||
      compareSlug(docHref.replace(/^\//, "")) === normalized ||
      compareSlug(flattenedPath) === normalized
    ) {
      return doc;
    }
  }
  
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = stripDownloadsPrefix(String(req.query.slug ?? ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  try {
    const doc = getServerDownloadBySlug(slug);
    if (!doc || isDraftContent(doc)) return res.status(404).json({ ok: false, reason: "Not found" });

    const requiredTier = asTier(doc.accessLevel ?? "inner-circle");

    // Cache policy: never cache gated responses
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Cookie");
    res.setHeader(
      "Cache-Control",
      requiredTier === "public"
        ? "public, s-maxage=300, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate, private"
    );

    let sessionTier: Tier = "public";

    if (requiredTier !== "public") {
      const token = getAccessTokenFromReq(req);
      if (!token) return res.status(403).json({ ok: false, reason: "Access denied" });

      const t = await getSessionTier(token);
      if (!t) return res.status(403).json({ ok: false, reason: "Access denied" });

      sessionTier = asTier(t);

      if (!canAccess(sessionTier, requiredTier)) {
        return res.status(403).json({ ok: false, reason: "Access denied" });
      }
    }

    const raw = rawMdxFromDoc(doc);
    if (!raw) return res.status(500).json({ ok: false, reason: "Invalid document format" });

    // prepareMDX must return an MDXRemoteSerializeResult (or an object containing it).
    const mdxResult = await prepareMDX(raw);

    // Support either shape: direct result OR { source }
    const source: MDXRemoteSerializeResult =
      (mdxResult as any)?.compiledSource
        ? (mdxResult as MDXRemoteSerializeResult)
        : (mdxResult as any)?.source;

    if (!source?.compiledSource) {
      return res.status(500).json({ ok: false, reason: "MDX compilation failed" });
    }

    return res.status(200).json({
      ok: true,
      tier: sessionTier,
      requiredTier,
      source,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[API_DOWNLOADS_SLUG_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Server error" });
  }
}