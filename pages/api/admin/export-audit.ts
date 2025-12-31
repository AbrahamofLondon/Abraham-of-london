/* pages/api/admin/export-audit.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireAdmin, requireRateLimit } from "@/lib/server/guards";
import { validateDateRange } from "@/lib/server/validation";
import { jsonErr } from "@/lib/server/http";

/**
 * INSTITUTIONAL AUDIT EXPORT
 * Outcome: Generates a CSV-ready JSON payload of system events.
 * Security: Triple-gated via Admin Key, Rate Limiter, and Date Constraints.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. GATEKEEPING: Method Verification
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return jsonErr(res, 405, "METHOD_NOT_ALLOWED", "Use GET for exports.");
  }

  // 2. GATEKEEPING: Rate Limiting (10 exports per hour per admin)
  const rl = await requireRateLimit(req, res, "admin-export", "global", 10);
  if (!rl.ok) return;

  // 3. GATEKEEPING: Administrative Authorization
  const auth = await requireAdmin(req, res);
  if (!auth.ok) return;

  // 4. PARAMETER NORMALIZATION
  const { since, until } = req.query;
  const startDate = since ? new Date(since as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default 7 days
  const endDate = until ? new Date(until as string) : new Date();

  // 5. DATA INTEGRITY: Date Range Check (Max 31 days per export)
  const rangeCheck = validateDateRange({ since: startDate, until: endDate, maxDays: 31 });
  if (!rangeCheck.ok) {
    return jsonErr(res, 400, "INVALID_RANGE", rangeCheck.message);
  }

  try {
    // 6. INSTITUTIONAL DATA EXTRACTION
    const logs = await prisma.systemAuditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        actorType: true,
        actorEmail: true,
        action: true,
        resourceType: true,
        status: true,
        ipAddress: true,
        requestId: true,
        newValue: true, // Contains the JSON 'details'
      },
    });

    // 7. PRINCIPLED RESPONSE
    return res.status(200).json({
      ok: true,
      meta: {
        count: logs.length,
        range: { start: startDate.toISOString(), end: endDate.toISOString() },
        exportedBy: auth.admin.method,
      },
      data: logs,
    });

  } catch (error) {
    console.error("[CRITICAL_EXPORT_FAILURE]", error);
    return jsonErr(res, 500, "INTERNAL_ERROR", "Could not compile institutional logs.");
  }
}
