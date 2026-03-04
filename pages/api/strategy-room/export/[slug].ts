/* pages/api/strategy-room/export/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

// ✅ Pages API route must use pages-safe Prisma (NO server-only)
import { prisma } from "@/lib/prisma.pages";

// ✅ Premium watermark (brand-equity)
import {
  generateDossierSignature,
  getWatermarkPayload,
} from "@/lib/intelligence/watermark-delegate";

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  if (Array.isArray(xff) && xff[0]) return String(xff[0]).split(",")[0].trim();
  return String(req.socket.remoteAddress || "UNKNOWN");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  // 1) IDENTITY VERIFICATION
  const session = await getServerSession(req, res, authOptions);
  if (!session || !(session as any).aol?.innerCircleAccess) {
    return res.status(403).json({ error: "Access Denied: Institutional Authorization Required." });
  }

  const slugStr = String(slug || "").trim();
  if (!slugStr) return res.status(400).json({ error: "Missing slug." });

  try {
    // 2) CONTENT RETRIEVAL
    const brief = await prisma.contentMetadata.findUnique({
      where: { slug: slugStr },
    });

    if (!brief) return res.status(404).json({ error: "Intelligence Brief not found." });

    // 3) CRYPTOGRAPHIC SIGNING (premium forensic watermark)
    const memberId = String((session as any).user?.id || "UNKNOWN_MEMBER");
    const memberName = String((session as any).user?.name || "Principal");

    const sigObj = generateDossierSignature(memberId, String(brief.id), {
      brand: process.env.AOL_BRAND_NAME || "Abraham of London",
    });

    const classification =
      String((brief as any).classification || "PUBLIC").toUpperCase() === "PRIVATE"
        ? "PRINCIPAL"
        : "MEMBER";

    const watermark = getWatermarkPayload({
      signature: sigObj,
      classification: classification as any,
      context: { briefTitle: String(brief.title || ""), route: `/strategy-room/export/${brief.slug}` },
    });

    // 4) TRANSACTIONAL AUDIT
    const ip = getClientIp(req);
    const ua = String(req.headers["user-agent"] || "UNKNOWN");

    await prisma.$transaction([
      prisma.downloadAuditEvent.create({
        data: {
          slug: String(brief.slug),
          memberId,
          contentType: String((brief as any).contentType || "unknown"),
          eventType: "EXPORT",
          success: true,
          processedAt: new Date(),
          ipAddress: ip,
          userAgent: ua,

          // Primary trace marker
          fileHash: sigObj.sig,

          // Rich forensic payload
          metadata: {
            traceId: sigObj.traceId,
            issuedAt: sigObj.issuedAt,
            scheme: sigObj.scheme,
            issuer: sigObj.issuer,
            proof: sigObj.proof,
            watermark: watermark.visibleFooter,
          },
        } as any,
      }),
      prisma.contentMetadata.update({
        where: { id: String(brief.id) },
        data: { totalPrints: { increment: 1 } } as any,
      }),
    ]);

    // 5) RETURN ENVELOPE
    // (If you later wire PDF streaming here, pass `watermark` into generatePDF and return the file.)
    return res.status(200).json({
      ok: true,
      intel: {
        id: brief.id,
        slug: brief.slug,
        title: brief.title,
        content: (brief as any).content ?? null,
        classification: (brief as any).classification ?? null,
      },
      security: {
        sig: sigObj.sig,
        traceId: sigObj.traceId,
        issuedAt: sigObj.issuedAt,
        classification,
        authorizedTo: memberName,
        watermark,
      },
    });
  } catch (error) {
    console.error("[EXPORT_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Internal assembly failure." });
  }
}