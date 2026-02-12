// pages/api/pdfs/generate-all.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getAllPDFs } from "@/lib/pdf/registry.static";
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

  try {
    const allPDFs = getAllPDFs();
    const pending = allPDFs.filter(pdf => !pdf.exists && !pdf.error && !pdf.isGenerating);

    if (pending.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        message: "No pending PDFs to generate",
      });
    }

    // Optional: limit concurrency to avoid overwhelming the system
    const results = [];
    for (const pdf of pending) {
      try {
        const outputDir = path.join(process.cwd(), "public", "assets", "downloads");
        const outputPath = path.join(outputDir, `${pdf.id}.pdf`);

        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        await generator.generateFromSource({
          sourceAbsPath: pdf.sourcePathAbs,
          sourceKind: pdf.sourceKind as "mdx" | "md" | "html",
          outputAbsPath: outputPath,
          quality: "premium",
          format: "A4",
          title: pdf.title,
        });

        results.push({ id: pdf.id, success: true });
      } catch (err: any) {
        results.push({ id: pdf.id, success: false, error: err.message });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    return res.status(200).json({
      success: true,
      count: succeeded,
      total: pending.length,
      results,
      message: `Generated ${succeeded} of ${pending.length} PDFs`,
    });
  } catch (error: any) {
    console.error("[PDF Generate All] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Batch generation failed",
    });
  }
}