// pages/api/pdfs/generate-all.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getAllPDFs } from "@/lib/pdf/registry.static";
import { SecurePuppeteerPDFGenerator } from "@/scripts/pdf/secure-puppeteer-generator";
import path from "path";
import fs from "fs";

type ResultRow =
  | { id: string; success: true; outputPath: string }
  | { id: string; success: false; error: string };

const generator = new SecurePuppeteerPDFGenerator({
  timeout: 90_000,
  maxRetries: 2,
});

// Small helper: concurrency pool
async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.min(8, concurrency || 2));
  const results: R[] = new Array(items.length);

  let nextIndex = 0;

  async function runner() {
    while (true) {
      const i = nextIndex++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runner());
  await Promise.all(runners);
  return results;
}

function safeMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message || "Error";
  return String(err);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  try {
    const all = getAllPDFs();

    // “pending” definition: not exists, not error, not generating (tolerate undefined fields)
    const pending = all.filter((pdf: any) => {
      const exists = Boolean(pdf?.exists);
      const hasError = Boolean(pdf?.error);
      const isGenerating = Boolean(pdf?.isGenerating);
      return !exists && !hasError && !isGenerating;
    });

    if (pending.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        results: [],
        message: "No pending PDFs to generate",
        generatedAt: new Date().toISOString(),
      });
    }

    const outputDir = path.join(process.cwd(), "public", "assets", "downloads");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const concurrency = Number(process.env.PDF_BATCH_CONCURRENCY || 2);

    const results = await runPool<any, ResultRow>(pending, concurrency, async (pdf) => {
      const id = String(pdf?.id || "");
      if (!id) return { id: "unknown", success: false, error: "Missing pdf.id" };

      // Validate required generator inputs
      const sourceAbsPath = pdf?.sourcePathAbs;
      const sourceKind = pdf?.sourceKind;

      if (!sourceAbsPath || typeof sourceAbsPath !== "string") {
        return { id, success: false, error: "Missing sourcePathAbs in registry entry" };
      }

      if (sourceKind !== "mdx" && sourceKind !== "md" && sourceKind !== "html") {
        return { id, success: false, error: `Invalid sourceKind: ${String(sourceKind)}` };
      }

      const outputPath = path.join(outputDir, `${id}.pdf`);

      try {
        await generator.generateFromSource({
          sourceAbsPath,
          sourceKind,
          outputAbsPath: outputPath,
          quality: "premium",
          format: "A4",
          title: String(pdf?.title || id),
        });

        return { id, success: true, outputPath: `/assets/downloads/${id}.pdf` };
      } catch (err) {
        return { id, success: false, error: safeMessage(err) };
      }
    });

    const succeeded = results.filter((r) => r.success).length;

    return res.status(200).json({
      success: true,
      count: succeeded,
      total: pending.length,
      results,
      message: `Generated ${succeeded} of ${pending.length} PDFs`,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[PDF Generate All] Error:", error);
    return res.status(500).json({
      success: false,
      error: safeMessage(error) || "Batch generation failed",
      generatedAt: new Date().toISOString(),
    });
  }
}