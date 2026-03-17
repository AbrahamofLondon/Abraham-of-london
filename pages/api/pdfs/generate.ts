// pages/api/pdfs/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import { generateBriefPDF } from "@/lib/inner-circle/exports.server";
import { logger } from "@/lib/logging";
import { getDownloadTokenByContentId } from "@/lib/premium/download-token";
import { getCurrentAccessBinding } from "@/lib/server/current-access-binding";
import { generateFingerprintProfile } from "@/lib/premium/fingerprint-profile";
import type { AccessTier } from "@/lib/access/tier-policy";
import type { AoLClaims } from "@/types/auth";

type SessionWithTier = Session & {
  aol?: AoLClaims;
  user?: Session["user"] & {
    id?: string;
    role?: string;
    tier?: AccessTier | string;
  };
};

type GeneratePdfBody = {
  pdfId?: unknown;
  tokenId?: unknown;
  includeWatermark?: unknown;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      error: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    const session = (await getServerSession(
      req,
      res,
      authOptions,
    )) as SessionWithTier | null;

    if (!session?.user) {
      return res.status(401).json({
        error: "Institutional Access Required",
      });
    }

    const body = (req.body ?? {}) as GeneratePdfBody;
    const pdfId = typeof body.pdfId === "string" ? body.pdfId.trim() : "";
    const tokenId = typeof body.tokenId === "string" ? body.tokenId.trim() : "";
    const includeWatermark =
      typeof body.includeWatermark === "boolean"
        ? body.includeWatermark
        : true;

    if (!pdfId) {
      return res.status(400).json({
        error: "Valid Asset ID Required",
      });
    }

    const binding = await getCurrentAccessBinding(req, res);

    let tokenData: Awaited<ReturnType<typeof getDownloadTokenByContentId>> | null =
      null;

    if (tokenId) {
      tokenData = await getDownloadTokenByContentId(pdfId);
      if (!tokenData) {
        logger.warn("[PDF_ENGINE] No valid token found for content", {
          pdfId,
          requestedTokenId: tokenId,
        });
      }
    }

    const userId = session.user.id ?? binding.userId ?? "unknown-user";
    const userTier = String(
      session.user.tier ?? session.aol?.tier ?? "RESTRICTED",
    );

    const fingerprint = await generateFingerprintProfile({
      contentId: pdfId,
      userId,
      sessionId: binding.sessionId,
      tier: userTier,
      issuedAt: new Date(),
    });

    const effectiveTokenId =
      tokenData?.tokenId ??
      (tokenId || undefined) ??
      binding.sessionId ??
      undefined;

    logger.info("[PDF_ENGINE] Generation started", {
      pdfId,
      userId,
      includeWatermark,
      tier: userTier,
      profileId: fingerprint.profileId,
    });

    const result = await generateBriefPDF(pdfId, {
      userId,
      sessionId: binding.sessionId ?? undefined,
      tokenId: effectiveTokenId,
      includeWatermark,
      watermarkId: includeWatermark ? fingerprint.profileId : undefined,
      expectedFooter: `Issued to: ${userId.substring(0, 8)} • ${userTier} • ${fingerprint.profileId.substring(0, 12)}`,
      classification: userTier,
      issuedTo: userId,
      issuedAt: new Date(),
      fingerprint: {
        profileId: fingerprint.profileId,
        stableHash: fingerprint.components.stableHash,
        contextualHash: fingerprint.components.contextualHash,
        fileBand: fingerprint.components.fileBand,
      },
    });

    if (result.success) {
      logger.info("[PDF_ENGINE] Successfully generated", {
        path: result.path,
        pdfId,
        userId,
        profileId: fingerprint.profileId,
      });

      return res.status(200).json({
        success: true,
        path: result.path,
        fingerprintProfileId: fingerprint.profileId,
        classification: userTier,
        timestamp: new Date().toISOString(),
      });
    }

    logger.error("[PDF_ENGINE] Generation failed", {
      pdfId,
      userId,
      error: result.error,
      profileId: fingerprint.profileId,
    });

    return res.status(500).json({
      error: result.error || "PDF generation failed",
      fingerprintProfileId: fingerprint.profileId,
    });
  } catch (error) {
    logger.error("[PDF_API_CRITICAL]", {
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: "Internal Pipeline Failure",
    });
  }
}