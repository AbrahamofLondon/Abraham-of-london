// lib/downloads/audit.ts — INSTITUTIONAL DOWNLOAD AUDITING
import fs from "fs";
import path from "path";

/**
 * AuditEventType: Expanded to match all states in the [token].ts handler
 */

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
  downloadUrl?: string; // Track the destination for granted downloads
  nonce?: string;      // Track the specific token instance
  note?: string;
  ts?: string;
  // Add missing fields used in [token].ts
  tokenId?: string;     // Track the token identifier
  watermarkId?: string; // Track watermark for premium content
};

const outDir = path.join(process.cwd(), ".reports");
const outFile = path.join(outDir, "download-audit.jsonl");

/**
 * logDownloadEvent: Records transmission attempts to a JSONL log for security review.
 * Designed with a "Soft-Fail" protocol to ensure UX is never interrupted by IO errors.
 */
export async function logDownloadEvent(e: AuditEvent): Promise<void> {
  // Ensure we are in a Node environment with filesystem access
  if (typeof window !== "undefined") return;

  try {
    const payload = {
      ...e,
      ts: e.ts || new Date().toISOString(),
    };

    const row = JSON.stringify(payload) + "\n";

    // Standard local logging
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    
    fs.appendFileSync(outFile, row, { encoding: "utf8" });

    // Console-log for Vercel/Cloud observability (Optional but recommended)
    if (process.env.NODE_ENV === "production") {
      console.log(`[AUDIT][${payload.eventType}] ${payload.slug} | Tier: ${payload.userTier} | IP: ${payload.ip}`);
    }
    
  } catch (err) {
    // Soft-fail: Auditing is secondary to site availability.
    console.warn("[AUDIT_FAILURE] Could not write to audit log:", err);
  }
}