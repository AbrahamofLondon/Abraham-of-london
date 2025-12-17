// pages/api/shorts/[slug]/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { getInteractionStats } from "@/lib/db/interactions";
import { getOrSetSessionId, getSlugParam } from "@/lib/session";

interface SuccessResponse {
  slug: string;
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

/**
 * THE INTERACTION TELEMETRY ENGINE - Unified Production Version
 * Hardened for high-concurrency engagement tracking and session-bound metrics.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // 1. Method Authority (Only GET permitted for state retrieval)
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method Restriction",
      message: "System requires GET for telemetry retrieval.",
    });
  }

  // 2. Slug Integrity Check
  const slug = getSlugParam(req);
  if (!slug) {
    return res.status(400).json({
      error: "Request Malformed",
      message: "Identifier (slug) is required for vault lookup.",
    });
  }

  // 3. Institutional Rate Limiting
  // Prevents metric manipulation and ensures system availability.
  try {
    const rl = await checkRateLimit(req, res, RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS);
    
    if (rl.headers) {
      Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));
    }

    if (!rl.allowed) {
      return res.status(429).json({
        error: "Throttling Active",
        message: "Telemetry request limit exceeded.",
      });
    }
  } catch (rlError) {
    // Fail open for rate limiting to ensure UX isn't broken by middleware noise
    console.warn("[System Warning] Rate limiting subsystem silent.");
  }

  // 4. Session Authority
  // Identifies the unique builder without requiring an account (Privacy-Safe).
  const sessionId = getOrSetSessionId(req, res);

  try {
    // 5. Persistent Data Retrieval
    // Interface with SQLite/Postgres to fetch aggregate and user-specific states.
    const stats = await getInteractionStats(slug, sessionId);

    // 6. Cache Policy: Fail-Closed for real-time accuracy
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      slug,
      likes: stats.likes || 0,
      saves: stats.saves || 0,
      userLiked: !!stats.userLiked,
      userSaved: !!stats.userSaved,
    });

  } catch (error: any) {
    console.error(`[System Exception] Telemetry failure for ${slug}:`, error);
    
    // Recovery Logic: Return baseline zero-state instead of crashing the UI
    return res.status(200).json({
      slug,
      likes: 0,
      saves: 0,
      userLiked: false,
      userSaved: false,
    });
  }
}

export const config = {
  api: { 
    bodyParser: { sizeLimit: "1kb" }, // Strict limit for minimal GET payload
  },
};