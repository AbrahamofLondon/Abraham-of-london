// pages/api/downloads/[slug].ts — SECURE COMPILED MDX GATE
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { getSessionTier } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";
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

function getServerDownloadBySlug(slug: string): any | null {
  const normalized = slug.replace(/^\/+|\/+$/g, "");
  const allDocuments = getAllContentlayerDocs();
  const downloads = allDocuments.filter(
    (doc: any) => doc.type === "Download" || doc._raw?.sourceFileDir === "downloads"
  );
  
  for (const doc of downloads) {
    const docSlug = (doc.slug || "").replace(/^\/+|\/+$/g, "");
    const docHref = (doc.href || "").replace(/^\/+|\/+$/g, "").replace(/^downloads\//, "");
    const flattenedPath = (doc._raw?.flattenedPath || "").replace(/^downloads\//, "");
    
    if (docSlug === normalized || docHref === normalized || flattenedPath === normalized) {
      return doc;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = String(req.query.slug ?? "").replace(/^\/+|\/+$/g, "").replace(/^downloads\//, "");
  if (!slug) return res.status(400).json({ ok: false, reason: "Identification missing" });

  try {
    const doc = getServerDownloadBySlug(slug);
    if (!doc || doc.draft) return res.status(404).json({ ok: false, reason: "Not found" });

    const requiredTier = asTier(doc.accessLevel ?? "inner-circle");

    // Security Headers
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
      if (!t) return res.status(403).json({ ok: false, reason: "Session expired" });

      sessionTier = asTier(t);
      if (!canAccess(sessionTier, requiredTier)) {
        return res.status(403).json({ ok: false, reason: "Insufficient clearance" });
      }
    }

    const raw = doc?.body?.raw || doc?.body || doc?.content || "";
    const mdxResult = await prepareMDX(raw);

    const source: MDXRemoteSerializeResult = (mdxResult as any)?.compiledSource 
      ? (mdxResult as MDXRemoteSerializeResult) 
      : (mdxResult as any)?.source;

    return res.status(200).json({ ok: true, tier: sessionTier, requiredTier, source });
  } catch (err) {
    console.error("[API_DOWNLOADS_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Server internal failure" });
  }
}