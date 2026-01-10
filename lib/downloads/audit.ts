// lib/downloads/audit.ts
import fs from "node:fs";
import path from "node:path";

type AuditEventType =
  | "DOWNLOAD_DENIED"
  | "LINK_ISSUED"
  | "TOKEN_REJECTED"
  | "DOWNLOAD_GRANTED";

export type AuditEvent = {
  eventType: AuditEventType;
  slug: string;
  requiredTier: string;
  userTier: string;
  ip: string | null;
  userAgent: string | null;
  referrer: string | null;
  tokenExp?: number;
  note?: string;
  ts?: string;
};

const outDir = path.join(process.cwd(), ".reports");
const outFile = path.join(outDir, "download-audit.jsonl");

export async function logDownloadEvent(e: AuditEvent): Promise<void> {
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const row = JSON.stringify({ ...e, ts: new Date().toISOString() }) + "\n";
    fs.appendFileSync(outFile, row, { encoding: "utf8" });
  } catch {
    // Soft-fail: auditing must never break the site.
  }
}


