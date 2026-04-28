import type { NextApiRequest, NextApiResponse } from "next";

import { setInteractionState } from "@/lib/db/interactions";
import { getOrSetSessionId } from "@/lib/session";

import {
  rateLimit,
  RATE_LIMIT_CONFIGS,
  getRateLimitKey,
  createRateLimitHeaders,
} from "@/lib/server/rateLimit";

type Response =
  | {
      slug: string;
      likes: number;
      saves: number;
      userLiked: boolean;
      userSaved: boolean;
      _ts: number;
    }
  | { error: string };

function cleanSlug(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  const slug = cleanSlug(req.query.slug);
  if (!slug) {
    return res.status(400).json({ error: "ID_REQUIRED" });
  }

  const key = getRateLimitKey(req, "shorts_like");
  const rl = await rateLimit(key, RATE_LIMIT_CONFIGS.shortsInteractions);

  const headers = createRateLimitHeaders(rl);
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }

  if (!rl.ok) {
    return res.status(429).json({ error: "THROTTLED" });
  }

  const sessionId = getOrSetSessionId(req, res);
  const desired = req.method === "POST";

  const stats = await setInteractionState(slug, "like", sessionId, desired);

  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate",
  );

  return res.status(200).json({
    slug,
    likes: stats.likes,
    saves: stats.saves,
    userLiked: stats.userLiked,
    userSaved: stats.userSaved,
    _ts: Date.now(),
  });
}
