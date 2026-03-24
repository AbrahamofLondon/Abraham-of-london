/* pages/api/system/lock-status.ts — High-Speed Security State Read */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const lockConfig = await prisma.systemConfig.findUnique({
      where: { key: "GLOBAL_LOCKDOWN" },
      select: { value: true }
    });

    const isLocked = lockConfig?.value === "true";

    // Set short cache headers to prevent DB hammering while maintaining responsiveness
    res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");
    return res.status(200).json({ isLocked });
  } catch (error) {
    // In case of DB failure, we default to "Not Locked" to prevent total blackout,
    // or "Locked" if you prefer a "Fail-Closed" security posture.
    return res.status(200).json({ isLocked: false });
  }
}