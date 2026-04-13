/* lib/intelligence/forensic-mapping.ts — V1.0 (INSTITUTIONAL TRACE) */
import { createHash } from "crypto";
import type { WatermarkPayload } from "./watermark-delegate";
import type { PDFRegistryEntry } from "../pdf/registry.static";

export interface ForensicContext {
  userId: string;
  userTier: string;
  sessionId: string;
  ipAddress?: string;
}

/**
 * Generates a deterministic but secure Trace ID and Digital Signature 
 * for a specific document transmission.
 */
export function generateForensicPayload(
  config: PDFRegistryEntry,
  context: ForensicContext
): WatermarkPayload {
  const traceId = `TRC-${context.sessionId.slice(0, 8)}-${config.id.slice(0, 4)}`.toUpperCase();
  const signatureData = `${context.userId}|${config.id}|${context.sessionId}|${new Date().toISOString()}`;
  const sig = createHash("sha256")
    .update(signatureData)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
  const origin = context.ipAddress || "INTERNAL";

  return {
    visibleFooter: `PROPRIETARY INTELLIGENCE // TRACE ${traceId} // SIG ${sig} // ${String(config.id).toUpperCase()}`,
    overlayToken: sig,
    overlayHints: {
      rotationDeg: -35,
      opacity: 0.08,
      fontSize: 34,
      letterSpacing: 1.2,
    },
    metadata: {
      aol: {
        traceId,
        sig,
        tier: context.userTier,
        origin,
        documentId: config.id,
        sessionId: context.sessionId,
      },
      identity: {
        subject: context.userId,
      }
    }
  };
}

/**
 * Helper to generate the QR code content for the cover page.
 * Points to a verification URL on your domain.
 */
export function getVerificationUrl(traceId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://abraham.london";
  return `${baseUrl}/v/${traceId}`;
}
