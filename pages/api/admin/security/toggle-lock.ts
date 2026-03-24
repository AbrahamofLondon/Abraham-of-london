/* pages/api/admin/security/toggle-lock.ts — Global Lockdown Control */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

const ADMIN_ENV_KEY = "INNER_CIRCLE_ADMIN_KEY";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  // 1. Authority Check (Environment Key)
  const expected = process.env[ADMIN_ENV_KEY];
  const headerKey = String(req.headers["x-inner-circle-admin-key"] || "");

  if (!expected || headerKey !== expected) {
    return res.status(401).json({ ok: false, error: "Clearance Denied." });
  }

  try {
    const { locked, reason } = req.body;
    const lockValue = locked ? "true" : "false";

    // 2. Transactional Update: Set State + Log Event
    await prisma.$transaction([
      // Update the actual system state in SystemConfig
      prisma.systemConfig.upsert({
        where: { key: "GLOBAL_LOCKDOWN" },
        update: { 
          value: lockValue,
          description: reason || "Manual override" 
        },
        create: { 
          key: "GLOBAL_LOCKDOWN", 
          value: lockValue, 
          type: "boolean",
          description: reason || "Manual override"
        },
      }),
      // Create a persistent Audit Record
      prisma.systemAuditLog.create({
        data: {
          actorType: "system",
          action: locked ? "SYSTEM_LOCKED" : "SYSTEM_UNLOCKED",
          resourceType: "security",
          resourceId: "global_lock",
          status: "success",
          severity: "critical",
          category: "SYSTEM_OVERRIDE",
          metadata: { 
            locked, 
            reason: reason || "Manual override", 
            timestamp: new Date().toISOString() 
          },
        },
      })
    ]);

    return res.status(200).json({ 
      ok: true, 
      locked, 
      message: `System status successfully migrated to ${locked ? 'RESTRICTED' : 'OPERATIONAL'}.` 
    });
  } catch (error) {
    console.error("Lockdown Error:", error);
    return res.status(500).json({ ok: false, error: "State migration failed." });
  }
}