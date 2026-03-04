// pages/api/shorts/[slug]/telemetry.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { isRateLimited, RATE_LIMIT_CONFIGS } from "@/lib/server/rateLimit";
import { prisma } from "@/lib/prisma.pages";
import { getOrSetSessionId } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "READ_ONLY" });

  const slug = String(req.query.slug || "").trim();
  if (!slug) return res.status(400).json({ error: "ID_REQUIRED" });

  const sessionId = getOrSetSessionId(req, res);

  const rl = await isRateLimited(`telemetry:${sessionId}`, "telemetry", 100);
  if (rl.limited) return res.status(429).json({ error: "THROTTLED" });

  try {
    const [stats, userState] = await Promise.all([
      prisma.shortInteraction.groupBy({
        by: ["action"],
        where: { shortSlug: slug },
        _count: { action: true } as any, // supports both prisma shapes
      }) as any,
      prisma.shortInteraction.findMany({
        where: { shortSlug: slug, sessionId },
        select: { action: true },
      }),
    ]);

    const getCount = (action: "like" | "save") => {
      const row = (stats as any[]).find((s) => s.action === action);
      const c = row?._count;
      if (typeof c === "number") return c;
      if (c && typeof c === "object" && typeof c.action === "number") return c.action;
      return 0;
    };

    const likes = getCount("like");
    const saves = getCount("save");
    const userLiked = userState.some((u) => u.action === "like");
    const userSaved = userState.some((u) => u.action === "save");

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

    return res.status(200).json({
      slug,
      likes,
      saves,
      userLiked,
      userSaved,
      _ts: Date.now(),
    });
  } catch (error) {
    console.error(`[TELEMETRY_FAILURE] ${slug}:`, error);
    return res.status(200).json({ slug, likes: 0, saves: 0, userLiked: false, userSaved: false });
  }
}