/* pages/api/admin/security/appeal.ts — Clearance Request Handler */
import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { auditLogger } from "@/lib/server/db/audit";

const bodySchema = z.object({
  reason: z.string().trim().min(1).max(500),
  attemptedPath: z.string().trim().max(240).optional(),
  requiredTier: z.string().trim().max(64).optional(),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  // Any authenticated user may submit a clearance appeal — not just admins.
  // The Directorate reviews and resolves via UpgradeTerminal (/admin/command-centre).
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ ok: false, message: "AUTHENTICATION_REQUIRED" });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, message: "INVALID_REQUEST" });
  }

  const { reason, attemptedPath, requiredTier } = parsed.data;

  try {
    await auditLogger.log({
      action: "CLEARANCE_UPGRADE_REQUEST",
      severity: "warn",
      actorId: (session.user as any)?.id || "ANONYMOUS",
      actorEmail: session.user?.email || "unknown",
      resourceId: attemptedPath || "ROOT_SECTOR",
      status: "pending",
      category: "SECURITY",
      subCategory: "ACCESS_CONTROL",
      ipAddress: req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "0.0.0.0",
      userAgent: req.headers["user-agent"] || null,
      metadata: {
        reason,
        requiredTier,
        userRole: (session.user as any)?.role || "USER",
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      ok: true,
      message: "Appeal transmitted to Directorate Oversight.",
    });
  } catch (error) {
    console.error("[APPEAL_SUBMISSION_ERROR]", error);
    return res.status(500).json({ ok: false, message: "Transmission failed." });
  }
}
