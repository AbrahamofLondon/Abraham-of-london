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

// NOTE: adjust imports if your server content module differs
import { normalizeSlug, getDocumentBySlug } from "@/lib/content/server";

type Ok = { ok: true; tier: AccessTier; mdx: string };
type Fail = { ok: false; reason: string };

function stripResourcesPrefix(slug: string): string {
  return normalizeSlug(slug).replace(/^resources\//, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const slug = stripResourcesPrefix(String(req.query.slug || ""));
  if (!slug) {
    return res.status(400).json({ ok: false, reason: "Missing slug" });
  }

  const doc =
    (await getDocumentBySlug(slug, "resource")) ||
    (await getDocumentBySlug(`resources/${slug}`, "resource")) ||
    (await getDocumentBySlug(slug));

  if (!doc || (doc as any).draft) {
    return res.status(404).json({ ok: false, reason: "Resource not found" });
  }

  const requiredTier = requiredTierFromDoc(doc);
  const rawMdx = String((doc as any)?.body?.raw ?? "");

  // Public: return immediately
  if (requiredTier === "public") {
    return res.status(200).json({ ok: true, tier: "public", mdx: rawMdx });
  }

  // Session token via SSOT cookie
  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    return res.status(401).json({ ok: false, reason: "Access required - please sign in" });
  }

  // Resolve user tier from DB session context (SSOT normalized)
  const ctx = await getSessionContext(sessionId);
  const userTier = normalizeUserTier(ctx.tier ?? ctx.member?.tier ?? "public");

  if (!hasAccess(userTier, requiredTier)) {
    return res.status(403).json({ ok: false, reason: "Insufficient access - requires higher clearance" });
  }

  return res.status(200).json({ ok: true, tier: userTier, mdx: rawMdx });
}