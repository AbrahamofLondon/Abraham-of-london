import "server-only";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { getGeneratedPDFs } from "@/lib/pdf/pdf-registry.generated"; // Use the generated source of truth
import { SecurePuppeteerPDFGenerator } from "@/scripts/pdf/secure-puppeteer-generator";
import { prisma } from "@/lib/prisma"; // Institutional singleton
import path from "path";
import fs from "fs";

/**
 * INSTITUTIONAL BATCH GENERATOR
 * Forced to Node.js runtime to support Puppeteer and Filesystem operations.
 */
export const config = {
  maxDuration: 300, // Extend timeout for large portfolio batches
  api: {
    responseLimit: false,
  },
};

type ResultRow =
  | { id: string; success: true; outputPath: string }
  | { id: string; success: false; error: string };

const generator = new SecurePuppeteerPDFGenerator({
  timeout: 120_000, // Increased for heavy institutional briefs
  maxRetries: 3,
});

/**
 * CONCURRENCY POOL: Prevents CPU/RAM exhaustion during 718-asset generation.
 */
async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const limit = Math.max(1, Math.min(4, concurrency || 2)); // Safer limit for Windows environments
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
  if (err instanceof Error) return err.message;
  return String(err);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  // 1. Session & Role Validation
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return res.status(401).json({ success: false, error: "Unauthorized: Admin access required." });
  }

  try {
    // 2. Load Portfolio from Generated Registry
    const all = getGeneratedPDFs();
    
    // Filter for assets requiring generation (Missing physical file)
    const pending = all.filter((pdf) => !pdf.exists && pdf.format === "PDF");

    if (pending.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: all.length,
        message: "Portfolio synchronization complete. No pending generations.",
        generatedAt: new Date().toISOString(),
      });
    }

    // 3. Environment Preparation
    const outputDir = path.join(process.cwd(), "public", "assets", "downloads");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const concurrency = Number(process.env.PDF_BATCH_CONCURRENCY || 2);
    console.log(`🏛️ [BATCH_GEN]: Processing ${pending.length} assets with concurrency ${concurrency}`);

    // 4. Execution Loop
    const results = await runPool<any, ResultRow>(pending, concurrency, async (pdf) => {
      const id = String(pdf.id);
      
      // Resolve source path: Checking for associated MDX in the content vault
      const sourceAbsPath = path.join(process.cwd(), "content", "briefs", `${id}.mdx`);
      const outputPath = path.join(process.cwd(), "public", pdf.outputPath);

      try {
        // Ensure source exists before calling Puppeteer
        if (!fs.existsSync(sourceAbsPath)) {
          return { id, success: false, error: `Source MDX not found for ${id}` };
        }

        await generator.generateFromSource({
          sourceAbsPath,
          sourceKind: "mdx",
          outputAbsPath: outputPath,
          quality: "premium",
          format: "A4",
          title: pdf.title,
        });

        // 5. Telemetry: Update engagement metrics in Neon DB
        await prisma.contentMetadata.update({
          where: { slug: id },
          data: { updatedAt: new Date() }
        }).catch(() => null); // Silent fail for telemetry to not block generation

        return { id, success: true, outputPath: pdf.outputPath };
      } catch (err) {
        console.error(`❌ [GEN_FAILED] ${id}:`, err);
        return { id, success: false, error: safeMessage(err) };
      }
    });

    const succeeded = results.filter((r) => r.success).length;

    return res.status(200).json({
      success: true,
      count: succeeded,
      total: pending.length,
      results,
      message: `Successfully synchronized ${succeeded} of ${pending.length} pending assets.`,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("🏛️ [CRITICAL_GEN_ERROR]:", error);
    return res.status(500).json({
      success: false,
      error: safeMessage(error) || "Institutional batch generation failed.",
      generatedAt: new Date().toISOString(),
    });
  }
}