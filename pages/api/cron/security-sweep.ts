/* pages/api/cron/security-sweep.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { executeSecuritySweep } from "@/lib/security/watchdog-delegate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CRITICAL: Verify Cron Secret to prevent public triggering
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  try {
    const report = await executeSecuritySweep();
    return res.status(200).json({ ok: true, report });
  } catch (error) {
    console.error("[WATCHDOG_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Watchdog failed to complete sweep." });
  }
}