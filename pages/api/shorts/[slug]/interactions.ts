// pages/api/shorts/[slug]/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";
import { getInteractionStats } from "@/lib/db/interactions";

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

function getOrCreateSessionId(
  req: NextApiRequest,
  res: NextApiResponse
): string {
  const existing = req.cookies?.aofl_session;
  if (existing) return existing;

  const sessionId = `sess_${Math.random()
    .toString(36)
    .slice(2)}_${Date.now().toString(36)}`;

  const oneYear = 60 * 60 * 24 * 365;

  const cookie = [
    `aofl_session=${sessionId}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${oneYear}`,
    process.env.NODE_ENV === "production" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");

  res.setHeader("Set-Cookie", cookie);

  return sessionId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: "Use GET to fetch interactions",
    });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Short slug is required",
    });
  }

  const sessionId = getOrCreateSessionId(req, res);

  // Rate limit by IP (from checkRateLimit)
  const rl = await checkRateLimit(
    req,
    res,
    RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS
  );
  if (!rl.allowed) {
    if (rl.headers) {
      Object.entries(rl.headers).forEach(([k, v]) =>
        res.setHeader(k, v)
      );
    }
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded for interactions",
    });
  }

  try {
    const stats = await getInteractionStats(slug, sessionId);

    if (rl.headers) {
      Object.entries(rl.headers).forEach(([k, v]) =>
        res.setHeader(k, v)
      );
    }

    // Prevent caching
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json({
      slug,
      likes: stats.likes,
      saves: stats.saves,
      userLiked: stats.userLiked,
      userSaved: stats.userSaved,
    });
  } catch (error) {
    console.error("Error in interactions API:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to load interaction stats",
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1kb",
    },
  },
};