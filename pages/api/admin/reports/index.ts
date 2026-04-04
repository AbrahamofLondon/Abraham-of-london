/* pages/api/admin/reports/index.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getRecentReportRequests } from "@/lib/reports/store";
import { getRecentDiagnosticRecords } from "@/lib/diagnostics/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });

    const ctx = await getSessionContext(sessionId);
    if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "sovereign")) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    const reports = await getRecentReportRequests(100);
    const diagnostics = await getRecentDiagnosticRecords(100);

    return res.status(200).json({
      ok: true,
      reports,
      telemetry: {
        diagnosticsLast100: diagnostics.length,
        reportsLast100: reports.length,
        paid: reports.filter((r) => r.status === "paid").length,
        queued: reports.filter((r) => r.status === "queued").length,
        inProgress: reports.filter((r) => r.status === "in_progress").length,
        delivered: reports.filter((r) => r.status === "delivered").length,
      },
    });
  } catch (error) {
    console.error("[ADMIN_REPORT_QUEUE_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}