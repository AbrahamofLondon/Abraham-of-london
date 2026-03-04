// pages/api/shorts/[slug]/like.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getClientIp, rateLimit } from "@/lib/server/rateLimit";
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
      message: "System requires POST to like or DELETE to unlike.",
    });
  }

  const slug = getSlugParam(req);
  if (!slug) {
    return res.status(400).json({
      error: "Request Malformed",
      message: "Identifier (slug) is required for interaction.",
    });
  }

  const ip = getClientIp(req);
  const rl = rateLimit({ key: `shorts_like:${ip}`, limit: 30, windowMs: 60_000 });

  res.setHeader("X-RateLimit-Limit", "30");
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(rl.resetAt));

  if (!rl.ok) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Interaction limit reached. Please wait.",
    });
  }

  const sessionId = getOrSetSessionId(req, res);

  try {
    // POST likes, DELETE unlikes — toggleInteraction already toggles.
    // If you want strict POST=ensure-like and DELETE=ensure-unlike, say so and I’ll harden it.
    const stats = await toggleInteraction(slug, "like", sessionId);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const message = stats.userLiked ? "Interaction recorded." : "Interaction removed.";

    return res.status(200).json({
      likes: stats.likes || 0,
      saves: stats.saves || 0,
      userLiked: !!stats.userLiked,
      userSaved: !!stats.userSaved,
      message,
    });
  } catch (error: any) {
    console.error(`[System Exception] Interaction failure for ${slug}:`, error);
    return res.status(500).json({
      error: "Vault Write Failure",
      message: "Failed to record interaction. Please try again shortly.",
    });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1kb" },
  },
};