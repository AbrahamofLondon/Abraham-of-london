/* pages/api/reports/mine.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getReportRequestsForUser } from "@/lib/reports/store";

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
    if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "inner-circle")) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    const rows = await getReportRequestsForUser({
      userId: ctx.memberId || null,
      userEmail: (ctx as any).email || null,
      limit: 50,
    });

    return res.status(200).json({
      ok: true,
      reports: rows,
    });
  } catch (error) {
    console.error("[REPORTS_MINE_API_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}