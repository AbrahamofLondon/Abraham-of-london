/* ./pages/api/inner-circle/retrieve/[briefId].ts — STREAMING WATERMARKED ASSET */
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PdfService } from '@/lib/server/services/pdf-service';
import { AuditService } from '@/lib/server/services/audit-service';
import { BRIEF_REGISTRY } from '@/lib/briefs/registry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();
  const { briefId } = req.query;

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'INNER_CIRCLE') {
    return res.status(403).json({ error: 'Clearance Denied' });
  }

  const asset = BRIEF_REGISTRY.find(b => b.id === briefId);
  if (!asset) return res.status(404).json({ error: 'Asset Not Found' });

  try {
    // 1. Fetch raw asset from Secure Storage (Cloudflare R2/S3)
    const response = await fetch(`${process.env.STORAGE_URL}/vault/${briefId}.pdf`);
    const pdfBuffer = await response.arrayBuffer();

    // 2. Inject User-Specific Watermark
    const watermarkedPdf = await PdfService.injectWatermark(
      Buffer.from(pdfBuffer), 
      session.user.email
    );

    // 3. Finalize Audit Record
    await AuditService.recordDownload({
      briefId: asset.id,
      memberId: session.user.id,
      email: session.user.email,
      ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || "0.0.0.0",
      success: true,
      latencyMs: Date.now() - startTime
    });

    // 4. Set headers for secure PDF transmission
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${asset.id}_SECURED.pdf"`);
    
    return res.send(Buffer.from(watermarkedPdf));

  } catch (error) {
    console.error("Retrieval Error:", error);
    return res.status(500).json({ error: 'Asset Transmission Failed' });
  }
}