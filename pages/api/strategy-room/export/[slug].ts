/* pages/api/strategy-room/export/[slug].ts */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { prisma } from "@/lib/prisma";
import { generateDossierSignature, getWatermarkStyles } from "@/lib/intelligence/watermark-delegate";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;

  // 1. IDENTITY VERIFICATION: Level 4 Auth Check
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.aol.innerCircleAccess) {
    return res.status(403).json({ error: "Access Denied: Institutional Authorization Required." });
  }

  try {
    // 2. CONTENT RETRIEVAL: Fetching the Intelligence Brief
    const brief = await prisma.contentMetadata.findUnique({
      where: { slug: String(slug) }
    });

    if (!brief) return res.status(404).json({ error: "Intelligence Brief not found." });

    // 3. CRYPTOGRAPHIC SIGNING: Generate unique watermark for this Principal
    const { signature, timestamp } = generateDossierSignature(session.user.id, brief.id);
    const styles = getWatermarkStyles(signature);

    // 4. TRANSACTIONAL AUDIT: Record the export event
    await prisma.$transaction([
      prisma.downloadAuditEvent.create({
        data: {
          slug: brief.slug,
          memberId: session.user.id,
          contentType: brief.contentType,
          eventType: "EXPORT",
          fileHash: signature, // Using signature as the unique trace ID
          ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
          userAgent: req.headers["user-agent"],
        }
      }),
      prisma.contentMetadata.update({
        where: { id: brief.id },
        data: { totalPrints: { increment: 1 } }
      })
    ]);

    // 5. ASSEMBLE ENVELOPE: Returning content with Watermark Data
    // In a production environment, this would feed into a PDF generator.
    return res.status(200).json({
      ok: true,
      intel: {
        title: brief.title,
        content: brief.content, // Should be decrypted if stored encrypted
        classification: brief.classification,
      },
      security: {
        signature,
        watermark: styles.visibleFooter,
        timestamp,
        authorizedTo: session.user.name
      }
    });

  } catch (error) {
    console.error("[EXPORT_CRITICAL_FAILURE]:", error);
    return res.status(500).json({ error: "Internal assembly failure." });
  }
}