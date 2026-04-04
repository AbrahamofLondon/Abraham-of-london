/* pages/api/diagnostics/[ref].ts */

import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";

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

    const item = await getDiagnosticRecordByRef(diagnosticRef);
    if (!item) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    if (!isAdmin && item.actor.userId && item.actor.userId !== ctx.memberId) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    return res.status(200).json({ ok: true, item });
  } catch {
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}