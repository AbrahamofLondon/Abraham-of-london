/* lib/downloads/audit.ts — INSTITUTIONAL DOWNLOAD AUDIT SINK */

import fs from "fs";
import path from "path";

export type AuditEventType =
  | "TOKEN_ISSUED"
  | "TOKEN_VERIFIED"
  | "TOKEN_REJECTED"
  | "TOKEN_EXHAUSTED"
  | "DOWNLOAD_GRANTED"
  | "DOWNLOAD_DENIED"
  | "DOWNLOAD_NOT_FOUND"
  | "URL_RESOLVE_FAILED"
  | "PREMIUM_DOWNLOAD"
  | "PREMIUM_STREAM"
  | "ACCESS_DENIED"
  | "INSUFFICIENT_TIER";

export type AuditEvent = {
  eventType: AuditEventType;
  slug: string;
  requiredTier: string;
  userTier: string;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  tokenExp?: number;
  downloadUrl?: string;
  nonce?: string;
  note?: string;
  ts?: string;
  tokenId?: string;
  watermarkId?: string;
};

const outDir = path.join(process.cwd(), ".reports");
const outFile = path.join(outDir, "download-audit.jsonl");

function safeLine(event: AuditEvent): string {
  return JSON.stringify({
    ...event,
    ts: event.ts || new Date().toISOString(),
  }) + "\n";
}

function ensureAuditDir(): void {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
}

export async function logDownloadEvent(event: AuditEvent): Promise<void> {
  if (typeof window !== "undefined") return;

  try {
    ensureAuditDir();
    fs.appendFileSync(outFile, safeLine(event), { encoding: "utf8" });

    if (process.env.NODE_ENV === "production") {
      console.log(
        `[DOWNLOAD_AUDIT][${event.eventType}] slug=${event.slug} userTier=${event.userTier} required=${event.requiredTier} ip=${event.ip}`,
      );
    }
  } catch (err) {
    console.warn("[DOWNLOAD_AUDIT_FAILURE]", err);
  }
}

export default {
  logDownloadEvent,
};