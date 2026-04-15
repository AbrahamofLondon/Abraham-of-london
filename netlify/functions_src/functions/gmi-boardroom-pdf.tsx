// netlify/functions_src/functions/gmi-boardroom-pdf.tsx
//
// Renders the Global Market Intelligence Q1 2026 boardroom PDF artifact.
// Access is gated by a custom `aol_access` cookie (tier/role allowlist).
// No NextAuth, no Prisma — pure cookie check + @react-pdf render.
//
// Extracted from pages/api/artifacts/global-market-intelligence-q1-2026-
// boardroom-pdf.ts so that the GMI boardroom PDF template (one of the
// heaviest `lib/pdf/artifacts/*` modules) and `@react-pdf/renderer` are
// packaged into this isolated function rather than the main Next server
// handler.
//
// Called as: GET /.netlify/functions/gmi-boardroom-pdf

import type { Handler } from "@netlify/functions";
import * as React from "react";

type AccessPayload = {
  tier?: string;
  accessTier?: string;
  role?: string;
  roles?: string[];
};

function safeJsonParse(value: string): AccessPayload | null {
  try {
    return JSON.parse(value) as AccessPayload;
  } catch {
    return null;
  }
}

function tryDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function tryDecodeBase64(value: string): string | null {
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function parseAccessCookie(raw: string | undefined): AccessPayload | null {
  if (!raw) return null;

  const direct = safeJsonParse(raw);
  if (direct) return direct;

  const decoded = tryDecodeURIComponent(raw);
  const decodedJson = safeJsonParse(decoded);
  if (decodedJson) return decodedJson;

  const b64 = tryDecodeBase64(raw);
  if (b64) {
    const b64Json = safeJsonParse(b64);
    if (b64Json) return b64Json;
  }

  const decodedB64 = tryDecodeBase64(decoded);
  if (decodedB64) {
    const decodedB64Json = safeJsonParse(decodedB64);
    if (decodedB64Json) return decodedB64Json;
  }

  return null;
}

function hasPremiumAccess(payload: AccessPayload | null): boolean {
  if (!payload) return false;

  const tier = String(payload.tier || payload.accessTier || "").toLowerCase();
  const role = String(payload.role || "").toLowerCase();
  const roles = Array.isArray(payload.roles)
    ? payload.roles.map((r) => String(r).toLowerCase())
    : [];

  const allowedTiers = new Set(["architect", "sovereign", "admin"]);
  const allowedRoles = new Set(["admin", "owner", "founder"]);

  return (
    allowedTiers.has(tier) ||
    allowedRoles.has(role) ||
    roles.some((r) => allowedRoles.has(r))
  );
}

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
    out[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return out;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "METHOD_NOT_ALLOWED" }),
    };
  }

  const cookies = parseCookies(event.headers?.cookie);
  const accessCookie = parseAccessCookie(cookies.aol_access);

  if (!hasPremiumAccess(accessCookie)) {
    return {
      statusCode: 403,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        reason: "RESTRICTED",
        message: "This boardroom PDF is restricted to premium access tiers.",
      }),
    };
  }

  try {
    // `renderToBuffer` produces a Node Buffer directly, which the function
    // response can base64-encode in one step. The original route used
    // `renderToStream` + `stream.pipe(res)` — not possible in a Netlify
    // function response envelope.
    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { default: GlobalMarketIntelligenceQ12026BoardroomPdf } = await import(
      "../../../lib/pdf/artifacts/global-market-intelligence-q1-2026-boardroom"
    );

    const buffer = await renderToBuffer(
      React.createElement(GlobalMarketIntelligenceQ12026BoardroomPdf as any),
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="global-market-intelligence-q1-2026-boardroom.pdf"',
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error("[GMI_BOARDROOM_PDF_ERROR]", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, reason: "PDF_GENERATION_FAILED" }),
    };
  }
};
