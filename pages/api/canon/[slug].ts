// pages/api/canon/[slug].ts — HARDENED (Secure Decryption Bridge)
import type { NextApiRequest, NextApiResponse } from "next";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import { verifySession } from "@/lib/server/auth/tokenStore.postgres";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { normalizeSlug, getServerCanonBySlug } from "@/lib/content/server";
import { prepareMDX } from "@/lib/server/md-utils";

type Tier = "public" | "inner-circle" | "private";

type Ok = {
  ok: true;
  tier: Tier;
  requiredTier: Tier;
  source: MDXRemoteSerializeResult;
};

type Fail = { ok: false; reason: string; code: string };

const TIER_ORDER: Tier[] = ["public", "inner-circle", "private"];

function asTier(v: unknown): Tier {
  if (v === "private") return "private";
  if (v === "inner-circle") return "inner-circle";
  return "public";
}

function hasClearance(userTier: Tier, requiredTier: Tier): boolean {
  return TIER_ORDER.indexOf(userTier) >= TIER_ORDER.indexOf(requiredTier);
}

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse<Ok | Fail>
) {
  // 1. Method Restriction
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ 
      ok: false, 
      reason: "METHOD_NOT_SUPPORTED", 
      code: "ERR_HTTP_405" 
    });
  }

  // 2. Identification & Normalization
  const rawSlug = String(req.query.slug || "");
  const slug = normalizeSlug(rawSlug);
  
  if (!slug || slug === "undefined") {
    return res.status(400).json({ 
      ok: false, 
      reason: "IDENTIFICATION_MISSING", 
      code: "ERR_SLUG_REQUIRED" 
    });
  }

  // 3. Manuscript Retrieval
  // Attempt to fetch from Contentlayer/Server store
  const doc: any = await getServerCanonBySlug(slug);
  
  if (!doc || doc.draft) {
    console.warn(`[SECURITY_ALERT] Attempted access to non-existent or draft brief: ${slug}`);
    return res.status(404).json({ 
      ok: false, 
      reason: "MANUSCRIPT_NOT_FOUND", 
      code: "ERR_DOC_404" 
    });
  }

  const requiredTier = asTier(doc.accessLevel);
  let userTier: Tier = "public";

  // 4. Authorization Protocol (Clearance Verification)
  if (requiredTier !== "public") {
    const sessionId = getAccessCookie(req);
    
    if (!sessionId) {
      return res.status(401).json({ 
        ok: false, 
        reason: "CLEARANCE_REQUIRED", 
        code: "AUTH_REQUIRED" 
      });
    }

    // Database check against Postgres token store
    const session = await verifySession(sessionId);
    
    if (!session || !session.valid) {
      return res.status(401).json({ 
        ok: false, 
        reason: "SESSION_EXPIRED_OR_REVOKED", 
        code: "AUTH_SESSION_INVALID" 
      });
    }

    userTier = asTier(session.tier);

    if (!hasClearance(userTier, requiredTier)) {
      return res.status(403).json({ 
        ok: false, 
        reason: "INSUFFICIENT_INSTITUTIONAL_TIER", 
        code: "AUTH_FORBIDDEN" 
      });
    }
  }

  // 5. Secure Serialization
  // The raw markdown never leaves the server. Only the serialized MDX source is transmitted.
  try {
    const rawMdx = String(doc?.body?.raw || doc?.content || "");
    
    if (!rawMdx || rawMdx.trim() === "") {
        throw new Error("EMPTY_PAYLOAD");
    }

    const source = await prepareMDX(rawMdx);

    // Institutional Success Response
    return res.status(200).json({
      ok: true,
      tier: userTier,
      requiredTier,
      source,
    });

  } catch (err) {
    console.error(`[DECRYPTION_FAILED] Slug: ${slug}`, err);
    return res.status(500).json({ 
      ok: false, 
      reason: "ENCRYPTION_LAYER_FAILURE", 
      code: "INTERNAL_SERVER_ERROR" 
    });
  }
}