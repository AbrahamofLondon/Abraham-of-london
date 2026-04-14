/* pages/api/diagnostics/list.ts */

import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { listDiagnosticRecords } from "@/lib/server/diagnostics/store";

type ApiRow = {
  diagnosticRef: string;
  submittedAt: string;
  kind: string;
  title: string;
  status: string;
  reportStatus: string;
  pct: number;
  severity: string;
  band: string;
  respondentName: string | null;
  organisation: string | null;
};

type ResponseData =
  | { ok: true; items: ApiRow[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    const tier = String(ctx.tier || "public");
    const isAdmin = tierAtLeast(tier, "private");

    const records = await listDiagnosticRecords({
      userId: isAdmin ? null : ctx.memberId || null,
      limit: 100,
    });

    return res.status(200).json({
      ok: true,
      items: records.map((r) => ({
        diagnosticRef: r.diagnosticRef,
        submittedAt: r.createdAt,
        kind: r.kind,
        title: r.title,
        status: r.status,
        reportStatus: r.reportStatus,
        pct: r.summary.pct,
        severity: r.summary.severity,
        band: r.summary.band,
        respondentName: r.respondent.name || null,
        organisation: r.respondent.organisation || null,
      })),
    });
  } catch {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}