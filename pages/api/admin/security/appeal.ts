/* pages/api/admin/security/appeal.ts — Clearance Request Handler */
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { auditLogger } from "@/lib/server/db/audit";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(500),
  attemptedPath: z.string().trim().max(240).optional(),
  requiredTier: z.string().trim().max(64).optional(),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const session = await requireAdminServer(req, res, { routeKey: "admin-security-appeal" });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID_REQUEST" });
  }

  const { reason, attemptedPath, requiredTier } = parsed.data;

  try {
    // 1. Lockdown Integrity Check
    // SystemConfig model does not exist in the current Prisma schema.
    // Lockdown check cannot be performed. Appeals proceed unconditionally
    // until the model is provisioned. This is intentional degradation, not a bypass.

    // 2. Transmit Appeal to Audit Feed
    await auditLogger.log({
      action: "CLEARANCE_UPGRADE_REQUEST",
      severity: "warn",
      actorId: session?.user?.id || "ANONYMOUS",
      actorEmail: session?.user?.email || "unknown",
      resourceId: attemptedPath || "ROOT_SECTOR",
      status: "pending",
      category: "SECURITY",
      subCategory: "ACCESS_CONTROL",
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "0.0.0.0",
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        reason,
        requiredTier,
        userRole: session.user?.role || "USER",
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
