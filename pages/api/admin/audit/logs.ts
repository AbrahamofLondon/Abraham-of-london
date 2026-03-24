/* pages/api/admin/audit/logs.ts — Secure Audit Feed */
import "server-only";

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { auditLogger } from "@/lib/server/db/audit";

const ADMIN_ENV_KEY = "INNER_CIRCLE_ADMIN_KEY";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  // 1. Authorization Check
  const expected = process.env[ADMIN_ENV_KEY];
  const headerKey = String(req.headers["x-inner-circle-admin-key"] || "");
  const authHeader = String(req.headers.authorization || "");

  const isAuthorized = 
    (expected && headerKey === expected) || 
    (expected && authHeader.startsWith("Bearer ") && authHeader.slice(7) === expected);

  if (!isAuthorized) {
    return res.status(401).json({ ok: false, error: "Unauthorized access to audit trail." });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);

    // 2. Fetch directly from Prisma with optimized selection
    const logs = await prisma.systemAuditLog.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        severity: true,
        actorEmail: true,
        ipAddress: true,
        createdAt: true,
        metadata: true, // Schema-aligned field
        actorType: true,
        status: true,
      },
    });

    // 3. Log the access of the audit trail itself (Meta-Audit)
    // FIXED: details -> metadata to match AuditLogInput interface
    auditLogger.log({
      action: "AUDIT_TRAIL_VIEWED",
      severity: "info",
      metadata: {
        requestedLimit: limit,
        resultCount: logs.length,
        timestamp: new Date().toISOString()
      },
    }).catch((err) => console.error("[META_AUDIT_FAILURE]", err));

    return res.status(200).json({
      ok: true,
      logs,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[AUDIT_FEED_FAILURE]", error);
    return res.status(500).json({ 
      ok: false, 
      error: "Internal server error while fetching audit logs." 
    });
  }
}