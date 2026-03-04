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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
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

  const slug = getSlugParam(req);
  if (!slug) {
    return res.status(400).json({
      error: "Request Malformed",
      message: "Identifier (slug) is required for bookmarking.",
    });
  }

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
  } catch {
    console.warn("[System Warning] Rate limiting subsystem silent.");
  }

  const sessionId = getOrSetSessionId(req, res);

  try {
    const stats = await toggleInteraction(slug, "save", sessionId);

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