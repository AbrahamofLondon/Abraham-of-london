/* pages/api/admin/diagnostics/records.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { listDiagnosticRecords } from "@/lib/server/diagnostics/store";

type ResponseData =
  | {
      ok: true;
      items: any[];
    }
  | {
      ok: false;
      error: string;
    };

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
    if (!sessionId) return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    if (!tierAtLeast(String(ctx.tier || "public"), "private")) {
      return res.status(403).json({ ok: false, error: "INSUFFICIENT_CLEARANCE" });
    }

    const limit = Math.max(1, Math.min(250, Number(req.query.limit || 100)));
    const records = await listDiagnosticRecords();

    const items = records
      .slice()
      .sort((a: any, b: any) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .slice(0, limit)
      .map((d: any) => ({
        diagnosticRef: d.diagnosticRef,
        title: d.title || "Diagnostic",
        organisation: d.organisation || null,
        respondentName: d.respondentName || null,
        pct: d.summary?.pct ?? 0,
        band: d.summary?.band ?? "watch",
        reportStatus: d.report?.archivedArtifactId ? "archived" : d.report ? "generated" : "pending",
        version: d.report?.version || null,
        submittedAt: d.submittedAt || null,
      }));

    return res.status(200).json({ ok: true, items });
  } catch (error) {
    console.error("[admin/diagnostics/records]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}