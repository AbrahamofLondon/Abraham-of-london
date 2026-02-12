// pages/api/pdfs/[id]/generate.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getPDFById } from "@/lib/pdf/registry.static";
import { SecurePuppeteerPDFGenerator } from "@/scripts/pdf/secure-puppeteer-generator";
import path from "path";
import fs from "fs";

const generator = new SecurePuppeteerPDFGenerator({
  timeout: 90_000,
  maxRetries: 2,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing PDF ID" });
  }

  try {
    const pdf = getPDFById(id);
    if (!pdf) {
      return res.status(404).json({ error: "PDF not found" });
    }

    // Check tier/access – if you have access control
    // const userTier = (session.user as any)?.tier;
    // if (pdf.tier && userTier !== pdf.tier) {
    //   return res.status(403).json({ error: "Insufficient clearance" });
    // }

    // Determine output path – use the same logic as your registry
    const outputDir = path.join(process.cwd(), "public", "assets", "downloads");
    const outputPath = path.join(outputDir, `${pdf.id}.pdf`);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate the PDF
    await generator.generateFromSource({
      sourceAbsPath: pdf.sourcePathAbs,
      sourceKind: pdf.sourceKind as "mdx" | "md" | "html",
      outputAbsPath: outputPath,
      quality: "premium", // or derive from request/user
      format: "A4",
      title: pdf.title,
    });

    // After successful generation, update registry entry if needed
    // (Your registry is static; this is just for response)
    const stats = fs.statSync(outputPath);
    const fileSizeInKB = (stats.size / 1024).toFixed(1) + " KB";

    return res.status(200).json({
      success: true,
      filename: `${pdf.id}.pdf`,
      fileUrl: `/assets/downloads/${pdf.id}.pdf`,
      pdfId: pdf.id,
      generatedAt: new Date().toISOString(),
      fileSize: fileSizeInKB,
    });
  } catch (error: any) {
    console.error(`[PDF Generate] Error for ${id}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || "Generation failed",
    });
  }
}