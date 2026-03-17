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

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeRelativeOutputPath(input: string): string {
  return input.replace(/\\/g, "/").replace(/^\/+/, "");
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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

    const pdfId = safeString((pdf as { id?: unknown }).id, id);
    const sourcePathAbs = safeString((pdf as { sourcePathAbs?: unknown }).sourcePathAbs);
    const sourceKindRaw = safeString((pdf as { sourceKind?: unknown }).sourceKind, "mdx");
    const title = safeString((pdf as { title?: unknown }).title, pdfId);

    if (!sourcePathAbs) {
      return res.status(400).json({ error: "PDF source path is missing" });
    }

    const sourceKind: "mdx" | "md" | "html" =
      sourceKindRaw === "md" || sourceKindRaw === "html" ? sourceKindRaw : "mdx";

    const outputPathWeb = safeString((pdf as { outputPathWeb?: unknown }).outputPathWeb);
    const relativeOutputPath = normalizeRelativeOutputPath(
      outputPathWeb || `assets/downloads/${pdfId}.pdf`,
    );

    const outputPath = path.join(process.cwd(), "public", relativeOutputPath);
    const outputDir = path.dirname(outputPath);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await generator.generateFromSource({
      sourceAbsPath: sourcePathAbs,
      sourceKind,
      outputAbsPath: outputPath,
      quality: "premium",
      format: "A4",
      title,
    });

    const stats = fs.statSync(outputPath);
    const fileSizeInKB = `${(stats.size / 1024).toFixed(1)} KB`;

    return res.status(200).json({
      success: true,
      filename: path.basename(outputPath),
      fileUrl: `/${relativeOutputPath.replace(/^\/+/, "")}`,
      pdfId,
      generatedAt: new Date().toISOString(),
      fileSize: fileSizeInKB,
    });
  } catch (error: unknown) {
    console.error(`[PDF Generate] Error for ${id}:`, error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Generation failed",
    });
  }
}