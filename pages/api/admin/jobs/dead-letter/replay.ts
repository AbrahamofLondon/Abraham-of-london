/* ============================================================================
   FILE: pages/api/admin/jobs/dead-letter/replay.ts
   PURPOSE:
   - Replay dead-letter jobs back into processing flows
   - Supports diagnostics report issuance and retention/revocation jobs
============================================================================ */

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";
import {
  getDeadLetterById,
  markDeadLetterReplayed,
} from "@/lib/server/jobs/dead-letter";
import { issueDiagnosticReportFromRecord } from "@/lib/server/diagnostics/report-issuer";
import { runDiagnosticsRetentionSweep } from "@/lib/server/diagnostics/retention";
import { processPendingDiagnosticReports } from "@/lib/server/diagnostics/jobs";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

const bodySchema = z.object({
  id: z.string().trim().min(1).max(128),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-dead-letter-replay" });
  if (!session) return;

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
  }

  const { id } = parsed.data;

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
