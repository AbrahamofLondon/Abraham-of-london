/* pages/api/system/lock-status.ts — Security State Read
 *
 * Reads lock state from the canonical audit log. The most recent
 * SYSTEM_LOCKED or SYSTEM_UNLOCKED event on resourceId="global_lock"
 * is the authoritative source of truth. No separate model is required.
 *
 * This endpoint is called by proxy.ts checkGlobalLock() on every request
 * (with a 15s in-memory cache in the proxy). It must stay fast and fail-open.
 */
import type { NextApiRequest, NextApiResponse } from "next";

type LockStatusResponse = {
  isLocked: boolean;
  available: boolean;
  lockedAt?: string | null;
  reason?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LockStatusResponse>,
) {
  if (req.method !== "GET") return res.status(405).end();

  // Short TTL — proxy caches for 15s; allow CDN/edge to cache for 1s max.
  res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");

  try {
    const { prisma } = await import("@/lib/prisma.server");

    const lastEvent = await prisma.systemAuditLog.findFirst({
      where: {
        action: { in: ["SYSTEM_LOCKED", "SYSTEM_UNLOCKED"] },
        resourceId: "global_lock",
      },
      orderBy: { createdAt: "desc" },
      select: { action: true, createdAt: true },
    });

    const isLocked = lastEvent?.action === "SYSTEM_LOCKED";

    return res.status(200).json({
      isLocked,
      available: true,
      lockedAt: isLocked ? lastEvent?.createdAt?.toISOString() ?? null : null,
    });
  } catch {
    // Fail-open: if the DB is unreachable the lock must not block all traffic.
    return res.status(200).json({
      isLocked: false,
      available: false,
      reason: "Lock state temporarily unavailable — failing open.",
    });
  }
}
