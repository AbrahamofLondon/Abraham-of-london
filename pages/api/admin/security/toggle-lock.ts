/* pages/api/admin/security/toggle-lock.ts — Global Lockdown Control */
// NOTE: prisma.systemConfig does not exist in the current schema (C2 debt).
// The lockdown state write is stubbed. The audit log write is preserved.
// Restore systemConfig upsert when the model is added to the schema.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

const ADMIN_ENV_KEY = "INNER_CIRCLE_ADMIN_KEY";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") return res.status(405).end();

  const expected = process.env[ADMIN_ENV_KEY];
  const headerKey = String(req.headers["x-inner-circle-admin-key"] || "");

  if (!expected || headerKey !== expected) {
    return res.status(401).json({ ok: false, error: "Clearance Denied." });
  }

  try {
    const { locked, reason } = req.body;

    // STUB: prisma.systemConfig does not exist in schema (C2 debt)
    // Lockdown state is not persisted until SystemConfig model is added.
    // Lock intent is recorded in the audit log below for traceability.

    await prisma.systemAuditLog.create({
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
          timestamp: new Date().toISOString(),
          note: "SystemConfig persistence stubbed — C2 schema debt",
        },
      },
    });

    return res.status(200).json({
      ok: true,
      locked,
      message: `Lockdown intent recorded. SystemConfig persistence pending schema extension.`,
    });
  } catch (error) {
    console.error("Lockdown Error:", error);
    return res.status(500).json({ ok: false, error: "State migration failed." });
  }
}