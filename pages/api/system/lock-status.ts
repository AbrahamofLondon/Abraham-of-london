/* pages/api/system/lock-status.ts — Security State Read */
import type { NextApiRequest, NextApiResponse } from "next";

type LockStatusResponse = {
  isLocked: boolean | null;
  available: boolean;
  reason?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<LockStatusResponse>) {
  if (req.method !== "GET") return res.status(405).end();

  // SystemConfig model does not exist in the current Prisma schema.
  // Lockdown state cannot be read. The response explicitly signals this
  // so consumers can distinguish "unlocked" from "status unavailable."
  res.setHeader("Cache-Control", "s-maxage=1, stale-while-revalidate=5");
  return res.status(200).json({
    isLocked: null,
    available: false,
    reason: "SystemConfig model not provisioned. Lockdown state cannot be determined.",
  });
}
