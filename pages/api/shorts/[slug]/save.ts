// pages/api/shorts/[slug]/save.ts
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
  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: "Use POST to save or DELETE to unsave",
    });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({
      error: "Invalid request",
      message: "Short slug is required",
    });
  }

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
      message: "Rate limit exceeded for save action",
    });
  }

  try {
    const isSaveAction = req.method === "POST";

    const likes = 25;
    const saves = isSaveAction ? 13 : 12;

    const response: SuccessResponse = {
      likes,
      saves,
      userLiked: false,
      userSaved: isSaveAction,
      message: isSaveAction
        ? "Short saved successfully"
        : "Save removed successfully",
    };

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error in save API:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process save action",
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