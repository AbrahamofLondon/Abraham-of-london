/* pages/api/diagnostics/report/signed-url.ts */
import type { NextApiRequest, NextApiResponse } from "next";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { getDiagnosticRecordByRef } from "@/lib/server/diagnostics/store";
import { canUnlockReport } from "@/lib/server/diagnostics/report-engine";
import { getArchivedDiagnosticPdfSignedUrl } from "@/lib/server/diagnostics/report-archive";
import { getDiagnosticStorageAdapter } from "@/lib/server/diagnostics/storage";

type ResponseData =
  | {
      ok: true;
      url: string;
      expiresInSeconds: number;
      version: string;
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
    const ref = String(req.query.ref || "").trim();
    const version = typeof req.query.version === "string" ? req.query.version.trim() : "";

    if (!ref) {
      return res.status(400).json({ ok: false, error: "REF_MISSING" });
    }

    const storage = getDiagnosticStorageAdapter();
    if (storage.provider !== "s3") {
      return res.status(400).json({ ok: false, error: "SIGNED_URLS_NOT_ENABLED" });
    }

    const sessionId = readAccessCookie(req);
    if (!sessionId) {
      return res.status(401).json({ ok: false, error: "AUTH_REQUIRED" });
    }

    const ctx = await getSessionContext(sessionId);
    if (!ctx?.ok || !ctx?.valid) {
      return res.status(401).json({ ok: false, error: "SESSION_INVALID" });
    }

    const item = await getDiagnosticRecordByRef(ref);
    if (!item) {
      return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    }

    const isAdmin = tierAtLeast(String(ctx.tier || "public"), "private");
    if (!isAdmin && item.actor.userId && item.actor.userId !== ctx.memberId) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    const unlocked = canUnlockReport({
      record: item,
      userTier: String(ctx.tier || "public"),
      isAdmin,
    });

    if (!unlocked) {
      return res.status(403).json({ ok: false, error: "REPORT_LOCKED" });
    }

    const signed = await getArchivedDiagnosticPdfSignedUrl({
      diagnosticRef: ref,
      version: version || null,
    });

    if (!signed) {
      return res.status(404).json({ ok: false, error: "ARCHIVE_NOT_FOUND" });
    }

    return res.status(200).json({
      ok: true,
      url: signed.url,
      expiresInSeconds: signed.expiresInSeconds,
      version: signed.artifact.version,
    });
  } catch (error) {
    console.error("[diagnostics/report/signed-url]", error);
    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}