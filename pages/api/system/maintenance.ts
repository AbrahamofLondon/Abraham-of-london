/* pages/api/system/maintenance.ts — AUTOMATED LOG RETENTION & OPTIMIZATION */
import type { NextApiRequest, NextApiResponse } from "next";
import { auditLogger } from "@/lib/audit/audit-logger";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Security check: Only allow requests with a Secret Cron Key
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return res.status(401).json({ error: "Unauthorized maintenance request" });
  }

  try {
    const logger = await auditLogger.ensureInitialized();
    
    // 2. Execute Cleanup (Default: Prune non-critical logs older than 90 days)
    const prunedCount = await logger.cleanupOldLogs(90);

    // 3. Log the maintenance event itself
    await logger.log({
      action: "SYSTEM_MAINTENANCE_CLEANUP",
      category: "system",
      severity: "info",
      metadata: {
        prunedRows: prunedCount,
        retentionPolicy: "90_DAYS",
        status: "OPTIMIZED"
      }
    });

    return res.status(200).json({ 
      success: true, 
      message: `System optimized. ${prunedCount} stale logs removed.` 
    });

  } catch (error) {
    console.error("Maintenance Failure:", error);
    return res.status(500).json({ error: "Maintenance cycle failed" });
  }
}