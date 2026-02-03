// pages/api/resources/mdx.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionTier } from "@/lib/server/auth/tokenStore.redis";
import { getAccessTokenFromReq } from "@/lib/server/auth/cookies";

// FIXED: Remove duplicate import
import { normalizeSlug, getDocumentBySlug } from "@/lib/content/server";

type Tier = "public" | "inner-circle" | "private";

type Ok = { ok: true; tier: Tier; mdx: string };
type Fail = { ok: false; reason: string };

const order: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  const n = String(v || "").toLowerCase().trim();
  if (n === "private" || n === "restricted") return "private";
  if (["inner-circle", "members", "member", "basic", "premium", "enterprise"].includes(n)) return "inner-circle";
  return "public";
}

function stripResourcesPrefix(slug: string) {
  return normalizeSlug(slug).replace(/^resources\//, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") return res.status(405).json({ ok: false, reason: "Method not allowed" });

  const slug = stripResourcesPrefix(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Missing slug" });

  const doc =
    (await getDocumentBySlug(slug, "resource")) ||
    (await getDocumentBySlug(`resources/${slug}`, "resource")) ||
    (await getDocumentBySlug(slug));

  if (!doc || (doc as any).draft) return res.status(404).json({ ok: false, reason: "Resource not found" });

  const requiredTier = asTier((doc as any).accessLevel ?? (doc as any).tier ?? (doc as any).access ?? "public");

  // Public? return raw MDX
  const rawMdx = (doc as any)?.body?.raw ?? "";
  if (requiredTier === "public") {
    return res.status(200).json({ ok: true, tier: "public", mdx: String(rawMdx || "") });
  }

  const token = getAccessTokenFromReq(req);
  if (!token) return res.status(401).json({ ok: false, reason: "Access required" });

  const sessionTier = asTier(await getSessionTier(token));
  if (order.indexOf(sessionTier) < order.indexOf(requiredTier)) {
    return res.status(403).json({ ok: false, reason: "Insufficient access" });
  }

  return res.status(200).json({ ok: true, tier: sessionTier, mdx: String(rawMdx || "") });
}

