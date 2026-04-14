/* lib/intelligence/forensic-mapping.ts — V1.0 (INSTITUTIONAL TRACE) */
import crypto from "crypto";
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
  // 1. Create a unique Trace ID for this specific download event
  const traceId = `TRC-${context.sessionId.slice(0, 8)}-${config.id.slice(0, 4)}`.toUpperCase();

  // 2. Generate a "Verification Signature" 
  // In a production environment, this would use a private key. 
  // Here we use a high-entropy hash of the transmission metadata.
  const signatureData = `${context.userId}|${config.id}|${context.sessionId}|${new Date().toISOString()}`;
  const sig = crypto
    .createHash("sha256")
    .update(signatureData)
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();

  return {
    visibleFooter: `TRACE ${traceId} // VERIFY ${sig}`,
    overlayToken: sig,
    overlayHints: {
      rotationDeg: -28,
      opacity: 0.06,
      fontSize: 10,
      letterSpacing: 1.6,
    },
    metadata: {
      aol: {
        traceId: traceId,   // Displayed as "Transmission"
        sig: sig,
        tier: context.userTier,
        origin: context.ipAddress || "INTERNAL",
        documentId: config.id,
        timestamp: new Date().toISOString(),
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
