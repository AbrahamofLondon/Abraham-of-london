// pages/api/premium/admin/verify-watermark.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PDFDocument } from "pdf-lib";

import { authOptions } from "@/lib/auth/options";
import {
  normalizeUserTier,
  hasAccess,
  type AccessTier,
} from "@/lib/access/tier-policy";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/security/audit";
import { limitIp, setRateLimitHeaders } from "@/lib/security/rate-limit";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { withCsrfProtection } from "@/lib/security/csrf";
import { logger } from "@/lib/logging";
import type { AoLClaims } from "@/types/auth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "25mb",
    },
  },
};

const REQUIRED_ADMIN_TIER: AccessTier = "architect";
const AUDIT_RESOURCE = "premium/admin/verify-watermark";

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,
  max: 5,
};

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier;
  };
};

type ExpectedMetadata = {
  visibleFooter?: string;
  overlayToken?: string;
  watermarkId?: string;
  traceId?: string;
  [key: string]: unknown;
};

function rawBufferContainsText(buffer: Buffer, text: string): boolean {
  if (!text) return false;

  try {
    return buffer.toString("latin1").includes(text);
  } catch {
    return false;
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const rateLimit = limitIp(req, "verify-watermark", RATE_LIMIT_CONFIG);
  setRateLimitHeaders(res, rateLimit);

  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: "Too many requests",
      code: "RATE_LIMITED",
      retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
    });
  }

  const session = (await getServerSession(
    req,
    res,
    authOptions,
  )) as SessionWithTier | null;

  if (!session?.user) {
    return res.status(401).json({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
  }

  const binding = await getCurrentAccessBinding(req, res);

  const sessionUser = session.user;
  const sessionAol = session.aol;

  const userTier = normalizeUserTier(
    sessionUser?.tier ??
      sessionAol?.tier ??
      "public",
  );

  if (!hasAccess(userTier, REQUIRED_ADMIN_TIER)) {
    await logAuditEvent({
      eventType: "ADMIN_ACCESS_DENIED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        attemptedTier: userTier,
        requiredTier: REQUIRED_ADMIN_TIER,
      },
    });

    return res.status(403).json({
      error: "Insufficient clearance",
      code: "INSUFFICIENT_TIER",
    });
  }

  const pdfBase64 =
    typeof req.body?.pdfBase64 === "string" ? req.body.pdfBase64.trim() : "";
  const tokenId =
    typeof req.body?.tokenId === "string" ? req.body.tokenId.trim() : "";

  if (!pdfBase64) {
    return res.status(400).json({
      error: "pdfBase64 is required",
      code: "MISSING_PDF",
    });
  }

  let pdfBuffer: Buffer;

  try {
    pdfBuffer = Buffer.from(pdfBase64, "base64");
  } catch {
    return res.status(400).json({
      error: "Invalid base64 payload",
      code: "INVALID_PDF_ENCODING",
    });
  }

  if (!pdfBuffer.length) {
    return res.status(400).json({
      error: "Decoded PDF payload is empty",
      code: "EMPTY_PDF",
    });
  }

  if (pdfBuffer.length > 50 * 1024 * 1024) {
    return res.status(400).json({
      error: "PDF size exceeds 50MB limit",
      code: "PDF_TOO_LARGE",
    });
  }

  try {
    logger.info("[VERIFY_WATERMARK] Starting verification", {
      userId: binding.userId,
      tokenId: tokenId ? `${tokenId.substring(0, 8)}...` : null,
      pdfSize: pdfBuffer.length,
    });

    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    let expected: ExpectedMetadata | null = null;

    if (tokenId) {
      const token = await prisma.premiumDownloadToken.findUnique({
        where: { tokenId },
        select: {
          metadata: true,
        },
      });

      if (token?.metadata && typeof token.metadata === "object") {
        expected = token.metadata as ExpectedMetadata;
      }
    }

    const metadata = {
      title: pdfDoc.getTitle() || null,
      author: pdfDoc.getAuthor() || null,
      subject: pdfDoc.getSubject() || null,
      keywords: pdfDoc.getKeywords() || null,
      producer: pdfDoc.getProducer() || null,
      creator: pdfDoc.getCreator() || null,
    };

    const expectedFooter = expected?.visibleFooter ?? null;
    const expectedOverlay = expected?.overlayToken ?? null;
    const expectedWatermarkId = expected?.watermarkId ?? null;
    const expectedTraceId = expected?.traceId ?? null;

    const footerRawMatch = expectedFooter
      ? rawBufferContainsText(pdfBuffer, expectedFooter)
      : null;

    const overlayRawMatch = expectedOverlay
      ? rawBufferContainsText(pdfBuffer, expectedOverlay)
      : null;

    const authorLooksCorrect = metadata.author === "Abraham of London";
    const producerLooksCorrect =
      metadata.producer === "Abraham of London Watermark Pipeline";

    await logAuditEvent({
      eventType: "WATERMARK_VERIFIED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        tokenId: tokenId ? `${tokenId.substring(0, 8)}...` : null,
        pageCount: pdfDoc.getPageCount(),
        checks: {
          footerMatch: footerRawMatch,
          overlayMatch: overlayRawMatch,
          authorCorrect: authorLooksCorrect,
          producerCorrect: producerLooksCorrect,
        },
      },
    });

    return res.status(200).json({
      success: true,
      metadata,
      pageCount: pdfDoc.getPageCount(),
      expected: {
        footer: expectedFooter,
        overlay: expectedOverlay,
        watermarkId: expectedWatermarkId,
        traceId: expectedTraceId,
      },
      checks: {
        footerRawMatch,
        overlayRawMatch,
        authorLooksCorrect,
        producerLooksCorrect,
      },
      note: "Raw text matching is heuristic only. Metadata verification is reliable. Full rendered-text extraction would require a dedicated parser layer.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[VERIFY_WATERMARK_ERROR]", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : "Unknown error",
      userId: binding.userId,
      tokenId: tokenId ? `${tokenId.substring(0, 8)}...` : null,
    });

    await logAuditEvent({
      eventType: "WATERMARK_VERIFICATION_FAILED",
      userId: binding.userId,
      sessionId: binding.sessionId,
      ip: req.socket.remoteAddress ?? null,
      userAgent: req.headers["user-agent"] ?? null,
      resource: AUDIT_RESOURCE,
      metadata: {
        tokenId: tokenId ? `${tokenId.substring(0, 8)}...` : null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return res.status(500).json({
      error: "Failed to verify PDF watermark",
      code: "VERIFICATION_FAILED",
    });
  }
}

export default withCsrfProtection(handler);