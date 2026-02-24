// pages/api/books/[slug].ts — SECURE VAULT PROXY
import type { NextApiRequest, NextApiResponse } from "next";

// Institutional Security & Content Helpers
import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerBookBySlug } from "@/lib/content/server";

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  bodyCode: string; // ✅ Delivering the pre-compiled Contentlayer code
};

type Fail = { ok: false; reason: string };

const TIER_ORDER: Tier[] = ["public", "inner-circle", "private"];

/**
 * Institutional Clearance Logic
 * Higher indices in TIER_ORDER represent higher clearance.
 */
function hasClearance(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  // 1. Protocol Validation
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  // 2. Resource Identification
  const slug = normalizeSlug(String(req.query.slug || ""));
  if (!slug) return res.status(400).json({ ok: false, reason: "Slug missing" });

  // 3. Document Retrieval (Server-side bypass of build-time caches)
  const book = await getServerBookBySlug(slug);
  if (!book || (book as any).draft) {
    return res.status(404).json({ ok: false, reason: "Volume not found" });
  }

  const requiredTier = (book.accessLevel || "public") as Tier;
  let userTier: Tier = "public";

  // 4. Institutional Security Gate
  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    
    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "Access denied. Identification required." });
    }

    // Direct check against Postgres Token Store
    const session = await verifySession(sessionId);
    if (!session || !session.valid) {
      return res.status(401).json({ ok: false, reason: "Session expired or invalid." });
    }

    userTier = session.tier as Tier;
    if (!hasClearance(userTier, requiredTier)) {
      return res.status(403).json({ ok: false, reason: "Insufficient clearance for this intelligence brief." });
    }
  }

  // 5. Payload Delivery
  // Since we are using next-contentlayer2, the content is already compiled.
  // We simply serve the bodyCode which SafeMDXRenderer will reify on the client.
  try {
    const bodyCode = book.body.code;

    if (!bodyCode) {
      throw new Error("Compiled content missing from vault asset.");
    }

    return res.status(200).json({
      ok: true,
      tier: userTier,
      requiredTier,
      bodyCode, // ✅ No more next-mdx-remote serialization
    });
  } catch (error) {
    console.error(`[VAULT_PROXY_FAILED] Slug: ${slug}`, error);
    return res.status(500).json({ ok: false, reason: "Failed to retrieve pre-compiled intelligence payload." });
  }
}