/* ============================================================================
   FILE: pages/api/admin/diagnostics/jobs/process.ts
   PURPOSE:
   - Admin-triggerable processing endpoint for pending diagnostic reports
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processPendingDiagnosticReports } from "@/lib/server/diagnostics/jobs";

function isAdmin(session: any) {
  const email = String(session?.user?.email || "").toLowerCase();
  return [
    "info@abrahamoflondon.org",
    "seunadaramola@gmail.com",
    "abrahamadaramola@outlook.com",
  ].includes(email);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !isAdmin(session)) {
    return res.status(403).json({ ok: false, error: "FORBIDDEN" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

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