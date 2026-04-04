/* pages/api/diagnostics/report/unlock.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";

type ResponseData =
  | { ok: true; unlocked: boolean; href: string }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    const diagnosticRef = String(req.body?.diagnosticRef || "").trim();
    if (!diagnosticRef) {
      return res.status(400).json({ ok: false, error: "REF_MISSING" });
    }

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    if (item.actor.userId && item.actor.userId !== ctx.memberId) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    return res.status(200).json({
      ok: true,
      unlocked: true,
      href: `/inner-circle/reports/${encodeURIComponent(diagnosticRef)}`,
    });
  } catch (error) {
    console.error("[diagnostics/report/unlock]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}