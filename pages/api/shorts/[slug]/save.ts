// pages/api/shorts/[slug]/save.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { toggleInteraction } from "@/lib/db/interactions";
import { getOrSetSessionId, getSlugParam } from "@/lib/session";

interface SuccessResponse {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
  message: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

/**
 * THE BOOKMARK MUTATION ENGINE - Unified Production Version
 * Hardened for atomic "Save" toggling and persistent session integrity.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // 1. Preflight & Method Authority
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST,DELETE,OPTIONS");
    return res.status(204).end();
  }

  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", "POST,DELETE,OPTIONS");
    return res.status(405).json({
      error: "Method Restriction",
      message: "System requires POST to save or DELETE to unsave.",
    });
  }

  // 2. Slug Integrity Check
  const slug = getSlugParam(req);
  if (!slug) {
    return res.status(400).json({
      error: "Request Malformed",
      message: "Identifier (slug) is required for bookmarking.",
    });
  }

  // 3. Institutional Rate Limiting
  try {
    const rl = await checkRateLimit(req, res, RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS);
    
    if (rl.headers) {
      Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));
    }

    if (!rl.allowed) {
      return res.status(429).json({
        error: "Throttling Active",
        message: "Interaction limit reached. Please wait.",
      });
    }
  } catch (rlError) {
    console.warn("[System Warning] Rate limiting subsystem silent.");
  }

  // 4. Session Authority
  // Utilizes a unified session handler to ensure cookie consistency.
  const sessionId = getOrSetSessionId(req, res);

  try {
    // 5. Atomic Interaction Toggle
    // Specifically targets the "save" interaction type for this endpoint.
    const stats = await toggleInteraction(slug, "save", sessionId);

    // 6. Cache Policy: Invalidate to ensure immediate UI feedback
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const message = stats.userSaved ? "Short bookmarked." : "Bookmark removed.";

    return res.status(200).json({
      likes: stats.likes || 0,
      saves: stats.saves || 0,
      userLiked: !!stats.userLiked,
      userSaved: !!stats.userSaved,
      message,
    });

  } catch (error: any) {
    console.error(`[System Exception] Bookmark failure for ${slug}:`, error);
    
    return res.status(500).json({
      error: "Vault Write Failure",
      message: "Failed to record bookmark. Please try again shortly.",
    });
  }
}

export const config = {
  api: { 
    bodyParser: { sizeLimit: "1kb" }, 
  },
};
