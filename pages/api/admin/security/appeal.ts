/* pages/api/admin/security/appeal.ts — Clearance Request Handler */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  const { reason, attemptedPath, requiredTier } = req.body;

  try {
    // 1. Lockdown Integrity Check
    // If the system is locked, we do not process appeals to prevent DB/Log spam during a crisis.
    const lockConfig = await prisma.systemConfig.findUnique({
      where: { key: "GLOBAL_LOCKDOWN" },
      select: { value: true }
    });

    if (lockConfig?.value === "true") {
      return res.status(503).json({ 
        ok: false, 
        message: "System is in restricted mode. Appeals are temporarily suspended." 
      });
    }

    // 2. Transmit Appeal to Audit Feed
    await auditLogger.log({
      action: "CLEARANCE_UPGRADE_REQUEST",
      severity: "warning", 
      actorId: session?.user?.id || "ANONYMOUS",
      actorEmail: session?.user?.email || "unknown",
      resourceId: attemptedPath || "ROOT_SECTOR",
      status: "pending",
      category: "SECURITY",
      subCategory: "ACCESS_CONTROL",
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "0.0.0.0",
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        reason: reason?.substring(0, 500), // Protect against payload size attacks
        requiredTier,
        userTier: (session as any)?.aol?.tier || "public",
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({ 
      ok: true, 
      message: "Appeal transmitted to Directorate Oversight." 
    });
  } catch (error) {
    console.error("[APPEAL_SUBMISSION_ERROR]", error);
    return res.status(500).json({ ok: false, message: "Transmission failed." });
  }
}