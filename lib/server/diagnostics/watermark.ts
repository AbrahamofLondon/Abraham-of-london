import "server-only";

// lib/server/diagnostics/watermark.ts
import crypto from "crypto";
import type { ReportWatermarkPayload } from "./types";

function wmSecret() {
  const s = process.env.DIAGNOSTIC_WATERMARK_SECRET;
  if (!s) throw new Error("DIAGNOSTIC_WATERMARK_SECRET missing");
  return s;
}

export function buildWatermarkToken(input: ReportWatermarkPayload) {
  const raw = JSON.stringify(input);
  const hash = crypto.createHmac("sha256", wmSecret()).update(raw).digest("hex");
  return hash.slice(0, 18).toUpperCase();
}

export function buildWatermarkLines(input: ReportWatermarkPayload) {
  const token = buildWatermarkToken(input);
  return [
    `CONFIDENTIAL REPORT`,
    `Ref ${input.diagnosticRef}`,
    `Version ${input.version}`,
    input.viewerEmail ? `Licensed to ${input.viewerEmail}` : `Licensed Internal Copy`,
    `WM ${token}`,
    `Generated ${input.generatedAtISO}`,
  ];
}
