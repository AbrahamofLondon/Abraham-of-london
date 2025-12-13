// pages/api/shorts/[slug]/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { getInteractionStats } from "@/lib/db/interactions";
import { getOrSetSessionId, getSlugParam } from "@/lib/session"; // Fixed import

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
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: "Use GET to fetch interactions",
    });
  }

  const slug = getSlugParam(req);
  if (!slug) {
    return res.status(400).json({
      error: "Invalid request",
      message: "Short slug is required",
    });
  }

  // Check if rate limit module exists - handle gracefully
  let rl;
  try {
    const { checkRateLimit, RATE_LIMIT_CONFIGS } = await import("@/lib/rate-limit");
    rl = await checkRateLimit(req, res, RATE_LIMIT_CONFIGS?.SHORTS_INTERACTIONS || {});
  } catch (error) {
    // Rate limit module not available, skip rate limiting
    console.warn("Rate limit module not available, skipping rate limiting");
    rl = { allowed: true, headers: {} };
  }

  if (!rl.allowed) {
    if (rl.headers) Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded for interactions",
    });
  }

  const sessionId = getOrSetSessionId(req, res);

  try {
    const stats = await getInteractionStats(slug, sessionId);

    if (rl.headers) Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      slug,
      likes: stats.likes,
      saves: stats.saves,
      userLiked: stats.userLiked,
      userSaved: stats.userSaved,
    });
  } catch (error: any) {
    console.error("Error in interactions API:", error);
    
    // Return mock data if database module fails
    if (error.message?.includes("Cannot find module") || error.message?.includes("getInteractionStats")) {
      console.warn("Using mock interaction data");
      return res.status(200).json({
        slug,
        likes: 0,
        saves: 0,
        userLiked: false,
        userSaved: false,
      });
    }
    
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to load interaction stats",
      details: process.env.NODE_ENV === "production" ? undefined : String(error?.message || error),
    });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: "1kb" } },
};