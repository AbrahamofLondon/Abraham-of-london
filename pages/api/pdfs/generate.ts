// pages/api/pdfs/generate.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { generateBriefPDF } from "@/lib/inner-circle/exports.server";
import { logger } from "@/lib/logging";

/**
 * INSTITUTIONAL PDF GENERATION ENDPOINT
 * Standardized bridge between Dashboard UI and React-PDF Engine.
 */
export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Session Validation
    const session = await getServerSession(req, res, {});
    if (!session) {
      return res.status(401).json({ error: "Institutional Access Required" });
    }

    // 2. Argument Validation
    const { pdfId } = req.body;
    if (!pdfId || typeof pdfId !== 'string') {
      return res.status(400).json({ error: "Valid Asset ID Required" });
    }

    // 3. Trigger Generation Service
    logger.info(`[PDF_ENGINE] Generation started for ID: ${pdfId}`);
    const result = await generateBriefPDF(pdfId);

    if (result.success) {
      logger.info(`[PDF_ENGINE] Successfully generated: ${result.path}`);
      return res.status(200).json({
        success: true,
        path: result.path,
        timestamp: new Date().toISOString()
      });
    }

    // 4. Detailed Error Reporting
    logger.error(`[PDF_ENGINE] Generation failed: ${result.error}`);
    return res.status(500).json({ error: result.error });

  } catch (error: any) {
    logger.error(`[PDF_API_CRITICAL] ${error.message}`);
    return res.status(500).json({ error: "Internal Pipeline Failure" });
  }
}