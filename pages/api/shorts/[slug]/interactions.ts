/* pages/api/shorts/[slug]/interactions.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { isRateLimited, RATE_LIMIT_CONFIGS } from "@/lib/server/rateLimit";
import prisma from "@/lib/prisma";
import { getOrSetSessionId } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "READ_ONLY" });

  const slug = String(req.query.slug || "").trim();
  if (!slug) return res.status(400).json({ error: "ID_REQUIRED" });

  const sessionId = getOrSetSessionId(req, res);

  // 1. Defensive Boundary: Throttling per unique session
  const rl = await isRateLimitedWithWindow(sessionId, "telemetry", 100, 60000);
  if (rl.limited) return res.status(429).json({ error: "THROTTLED" });

  try {
    // 2. High-Efficiency Concurrent Query
    const [stats, userState] = await Promise.all([
      prisma.shortInteraction.groupBy({
        by: ['action'],
        where: { shortSlug: slug },
        _count: true,
      }),
      prisma.shortInteraction.findMany({
        where: { shortSlug: slug, sessionId: sessionId },
        select: { action: true }
      })
    ]);

    // 3. Data Transformation with Default Fallbacks
    const likes = stats.find(s => s.action === 'like')?._count || 0;
    const saves = stats.find(s => s.action === 'save')?._count || 0;
    const userLiked = userState.some(u => u.action === 'like');
    const userSaved = userState.some(u => u.action === 'save');

    // 4. Cache Policy: Institutional Accuracy
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res.status(200).json({ 
      slug, 
      likes, 
      saves, 
      userLiked, 
      userSaved,
      _ts: Date.now() 
    });

  } catch (error) {
    console.error(`[TELEMETRY_FAILURE] ${slug}:`, error);
    // 5. Resilience: Return zero-state to keep UI functional
    return res.status(200).json({ slug, likes: 0, saves: 0, userLiked: false, userSaved: false });
  }
}
