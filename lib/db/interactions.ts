// pages/api/shorts/[slug]/interactions.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
} from "@/lib/rate-limit";

interface SuccessResponse {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: "Use GET to retrieve interaction stats",
    });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Short slug is required",
    });
  }

  // Rate limit
  const { allowed, headers } = await checkRateLimit(
    req,
    res,
    RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS
  );

  if (headers) {
    for (const [k, v] of Object.entries(headers)) {
      res.setHeader(k, v);
    }
  }

  if (!allowed) {
    return res.status(429).json({
      error: "Too many requests",
      message: "Rate limit exceeded for interactions endpoint",
    });
  }

  try {
    // For now, baseline numbers; client + localStorage manage perceived state.
    // When you wire Postgres, swap this for real counts + per-session flags.
    const likes = 25;
    const saves = 12;

    // Server doesn't know user state yet; the hook overrides using localStorage.
    return res.status(200).json({
      likes,
      saves,
      userLiked: false,
      userSaved: false,
    });
  } catch (error) {
    console.error("Error in interactions API:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to load interactions",
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};