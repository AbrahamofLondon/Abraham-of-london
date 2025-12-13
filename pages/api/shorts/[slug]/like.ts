// pages/api/shorts/[slug]/like.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { toggleInteraction } from "@/lib/db/interactions";

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
  details?: string;
}

function getSlug(req: NextApiRequest): string | null {
  const raw = req.query.slug;
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string" || !s.trim()) return null;
  return s.trim();
}

function appendSetCookie(res: NextApiResponse, cookie: string) {
  const prev = res.getHeader("Set-Cookie");
  if (!prev) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  const next = Array.isArray(prev) ? [...prev, cookie] : [String(prev), cookie];
  res.setHeader("Set-Cookie", next);
}

function getOrCreateSessionId(req: NextApiRequest, res: NextApiResponse): string {
  const existing = req.cookies?.aofl_session;
  if (existing) return existing;

  const sessionId = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
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

  appendSetCookie(res, cookie);
  return sessionId;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  // Allow preflight (helps in odd deployment/proxy situations)
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST,DELETE,OPTIONS");
    return res.status(204).end();
  }

  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", "POST,DELETE,OPTIONS");
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
      message: "Use POST to like or DELETE to unlike",
    });
  }

  const slug = getSlug(req);
  if (!slug) {
    return res.status(400).json({
      error: "Invalid request",
      message: "Short slug is required",
    });
  }

  // Rate limit first (cheap reject), then session
  const rl = await checkRateLimit(req, res, RATE_LIMIT_CONFIGS.SHORTS_INTERACTIONS);
  if (!rl.allowed) {
    if (rl.headers) Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(429).json({
      error: "Too Many Requests",
      message: "Rate limit exceeded for like action",
    });
  }

  const sessionId = getOrCreateSessionId(req, res);

  try {
    const stats = await toggleInteraction(slug, "like", sessionId);

    if (rl.headers) Object.entries(rl.headers).forEach(([k, v]) => res.setHeader(k, v));

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    const message = stats.userLiked ? "Short liked successfully" : "Like removed successfully";

    return res.status(200).json({
      likes: stats.likes,
      saves: stats.saves,
      userLiked: stats.userLiked,
      userSaved: stats.userSaved,
      message,
    });
  } catch (error: any) {
    console.error("Error in like API:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Failed to process like action",
      details: process.env.NODE_ENV === "production" ? undefined : String(error?.message || error),
    });
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: "1kb" },
  },
};