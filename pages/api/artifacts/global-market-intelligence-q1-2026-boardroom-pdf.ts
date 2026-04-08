// pages/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf.ts

import type { NextApiRequest, NextApiResponse } from "next";
import * as React from "react";
import { renderToStream } from "@react-pdf/renderer";

import GlobalMarketIntelligenceQ12026BoardroomPdf from "@/lib/pdf/artifacts/global-market-intelligence-q1-2026-boardroom";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const accessCookie = parseAccessCookie(req.cookies?.aol_access);

  if (!hasPremiumAccess(accessCookie)) {
    return res.status(403).json({
      ok: false,
      reason: "RESTRICTED",
      message: "This boardroom PDF is restricted to premium access tiers.",
    });
  }

  const stream = await renderToStream(
    React.createElement(GlobalMarketIntelligenceQ12026BoardroomPdf)
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    'inline; filename="global-market-intelligence-q1-2026-boardroom.pdf"'
  );

  stream.pipe(res);
}