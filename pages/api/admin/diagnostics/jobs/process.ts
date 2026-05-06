/* ============================================================================
   FILE: pages/api/admin/diagnostics/jobs/process.ts
   PURPOSE:
   - Admin-triggerable processing endpoint for pending diagnostic reports
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { processPendingDiagnosticReports } from "@/lib/server/diagnostics/jobs";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-diagnostics-jobs-process" });
  if (!session) return;

  try {
    const result = await processPendingDiagnosticReports();
    return res.status(200).json({ ok: true, ...result });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "PROCESS_FAILED",
    });
  }
}
