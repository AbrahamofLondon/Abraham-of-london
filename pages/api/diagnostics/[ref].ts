/* pages/api/diagnostics/[ref].ts */

import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { assertDiagnosticReportAccess } from "@/lib/server/diagnostics/report-engine";

type ResponseData =
  | { ok: true; item: any }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const diagnosticRef = String(req.query.ref || "").trim();
  if (!diagnosticRef) {
    return res.status(400).json({ ok: false, error: "REF_MISSING" });
  }

  try {
    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    const token =
      typeof req.query.token === "string"
        ? req.query.token.trim()
        : "";

    const sessionId = readAccessCookie(req);
    const ctx = sessionId ? await getSessionContext(sessionId) : null;
    const access = assertDiagnosticReportAccess({
      record: item,
      userId: ctx?.ok && ctx?.valid ? ctx.memberId : null,
      token,
      purpose: "diagnostic_report_access",
    });

    if (!access.allowed) {
      return res.status(access.status).json({ ok: false, error: access.error });
    }

    return res.status(200).json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}
