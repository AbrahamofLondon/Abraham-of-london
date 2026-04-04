/* ============================================================================
   FILE: pages/api/admin/jobs/dead-letter/replay.ts
   PURPOSE:
   - Replay dead-letter jobs back into processing flows
   - Supports diagnostics report issuance and retention/revocation jobs
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getDeadLetterById,
  markDeadLetterReplayed,
} from "@/lib/server/jobs/dead-letter";
import { issueDiagnosticReportFromRecord } from "@/lib/server/diagnostics/report-issuer";
import { runDiagnosticsRetentionSweep } from "@/lib/server/diagnostics/retention";
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

  const { id } = req.body || {};
  if (!id || typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "ID_REQUIRED" });
  }

  const item = await getDeadLetterById(id);
  if (!item) {
    return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  }

  try {
    if (item.jobType === "diagnostic.report.issue") {
      const payload = (item.payloadJson || {}) as any;
      await issueDiagnosticReportFromRecord({
        diagnosticId: String(payload.diagnosticId),
        requestedBy: session.user?.email || "admin-replay",
      });
    } else if (item.jobType === "diagnostic.retention.run") {
      await runDiagnosticsRetentionSweep();
    } else if (item.jobType === "diagnostic.jobs.process") {
      await processPendingDiagnosticReports();
    } else {
      return res.status(400).json({ ok: false, error: "UNSUPPORTED_JOB_TYPE" });
    }

    await markDeadLetterReplayed(id, `Replayed by ${session.user?.email || "admin"}`);

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: error?.message || "REPLAY_FAILED",
    });
  }
}