/* pages/api/admin/diagnostics/summary.ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticSummary, getRecentDiagnosticRecords } from "@/lib/diagnostics/store";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx.ok || !ctx.valid) {
      return res.status(401).json({ ok: false, reason: "SESSION_INVALID" });
    }

    if (!tierAtLeast(ctx.tier, "restricted")) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    const [summary, recent] = await Promise.all([
      getDiagnosticSummary(),
      getRecentDiagnosticRecords(10),
    ]);

    return res.status(200).json({
      ok: true,
      summary,
      recent,
    });
  } catch (error) {
    console.error("[ADMIN_DIAGNOSTIC_SUMMARY_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}