// netlify/functions_src/functions/diagnostic-report-id.tsx
//
// Renders the paid diagnostic report for a given record id. Validates
// NextAuth session ownership + report payment status, then streams the
// PDF back as base64.
//
// Extracted from pages/api/diagnostics/report/[id].ts so that the
// @react-pdf/renderer toolchain is packaged into this isolated function
// rather than the main Next server handler.
//
// Called as: GET /.netlify/functions/diagnostic-report-id?id=<recordId>
//
// IMPORTANT: NextAuth session cookies are JWE-encrypted (the default in
// next-auth v4 when using `session.strategy: "jwt"` without a custom
// decode override). We must use `next-auth/jwt`'s `decode()` to read
// them — raw `jsonwebtoken.verify` would fail because JWE ≠ JWS.

import type { Handler } from "@netlify/functions";
import * as React from "react";
import { decode } from "next-auth/jwt";

function parseCookies(
  cookieHeader: string | string[] | undefined,
): Record<string, string> {
  const header = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader || "";
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const k = trimmed.slice(0, eq);
    const v = decodeURIComponent(trimmed.slice(eq + 1));
    out[k] = v;
  }
  return out;
}

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return jsonResponse(405, { ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const id = (event.queryStringParameters?.id || "").trim();
    if (!id) {
      return jsonResponse(400, { ok: false, reason: "ID_REQUIRED" });
    }

    // --- Session validation via NextAuth JWE cookie -----------------------
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("[DIAGNOSTIC_REPORT_ID] NEXTAUTH_SECRET missing");
      return jsonResponse(500, { ok: false, reason: "SERVER_MISCONFIGURED" });
    }

    const cookies = parseCookies(event.headers?.cookie);
    // NextAuth uses a __Secure- prefix on the cookie name when the site
    // is served over HTTPS (which production is). Fall back to the
    // non-prefixed name for local/dev.
    const rawToken =
      cookies["__Secure-next-auth.session-token"] ||
      cookies["next-auth.session-token"] ||
      null;

    const session = rawToken
      ? await decode({ token: rawToken, secret }).catch(() => null)
      : null;
    const sessionEmail =
      (session as any)?.email || (session as any)?.user?.email || null;

    // --- Record lookup + ownership/payment checks (lazy Prisma) -----------
    const { getDiagnosticRecordById, markDiagnosticReportGenerated } =
      await import("../../../lib/diagnostics/store");

    const record = await getDiagnosticRecordById(id);
    if (!record) {
      return jsonResponse(404, { ok: false, reason: "NOT_FOUND" });
    }

    if (record.userEmail && sessionEmail && record.userEmail !== sessionEmail) {
      return jsonResponse(403, { ok: false, reason: "OWNERSHIP_MISMATCH" });
    }

    if (!["paid", "generated"].includes(String(record.reportStatus || ""))) {
      return jsonResponse(402, { ok: false, reason: "REPORT_NOT_PAID" });
    }

    // --- PDF render -------------------------------------------------------
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: DiagnosticReportDocument } = await import(
      "../../../lib/diagnostics/pdf/DiagnosticReportDocument"
    );

    const buffer = await renderToBuffer(
      React.createElement(DiagnosticReportDocument as any, {
        record: record as any,
      }),
    );

    await markDiagnosticReportGenerated(record.id);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${record.diagnosticType}-${record.id}.pdf"`,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[DIAGNOSTIC_REPORT_ID_GENERATION_ERROR]", error);
    return jsonResponse(500, { ok: false, reason: "SERVER_ERROR" });
  }
};
