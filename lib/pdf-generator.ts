import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { getPDFById } from "./pdf/registry";
import { registerPDFFonts } from "./pdf/font-registry";
import { generateDossierSignature, getWatermarkPayload } from "./intelligence/watermark-delegate";

/**
 * INSTITUTIONAL PDF ORCHESTRATOR (v2.8)
 * - Scans content directories and outputs to public/downloads/
 * - Registers fonts on the same renderer instance
 * - Injects brand-equity watermark payload (footer + overlay + metadata)
 * - Cache invalidates on MDX/template/font/watermark logic changes (fingerprinted)
 */
export async function generatePDF(
  id: string,
  force: boolean = false,
  contentOverride?: string
): Promise<{ success: boolean; path?: string; error?: string; cached?: boolean }> {
  const registryConfig = getPDFById(id);

  const config: any = registryConfig || {
    id,
    title: id.replace(/-/g, " ").toUpperCase(),
    outputPath: `/downloads/briefs/${id}.pdf`,
    category: "General",
    date: new Date().toISOString(),
  };

  try {
    // 1) Locate MDX source (if not overridden)
    const sourceFolders = ["briefs", "vault", "blog", "lexicon", "strategy", "resources"];
    let mdxPath = "";

    for (const folder of sourceFolders) {
      const checkPath = path.join(process.cwd(), "content", folder, `${id}.mdx`);
      if (fs.existsSync(checkPath)) {
        mdxPath = checkPath;
        break;
      }
    }

    const outputPath = path.join(process.cwd(), "public", String(config.outputPath).replace(/^\//, ""));

    if (!mdxPath && !contentOverride) {
      return { success: false, error: `Source not found in: ${sourceFolders.join(", ")}` };
    }

    // 2) Load content
    let contentBody: string;
    if (contentOverride) {
      contentBody = contentOverride;
    } else {
      const fileContent = fs.readFileSync(mdxPath, "utf8");
      const { content } = matter(fileContent);
      contentBody = content;
    }

    // 3) Compute a deterministic build fingerprint (cache correctness)
    // If template/fonts/watermark logic changes, we should not reuse an old PDF.
    const templatePath = path.join(process.cwd(), "lib", "pdf-templates", "BriefDocument.tsx");
    const fontRegistryPath = path.join(process.cwd(), "lib", "pdf", "font-registry.ts");
    const watermarkPath = path.join(process.cwd(), "lib", "intelligence", "watermark-delegate.ts");

    const fingerprintParts: string[] = [
      "AOL_PDF_V2_8",
      `id=${String(id)}`,
      `out=${String(config.outputPath)}`,
      `mdx=${mdxPath || "override"}`,
      `tmpl=${fs.existsSync(templatePath) ? fs.statSync(templatePath).mtimeMs : 0}`,
      `fonts=${fs.existsSync(fontRegistryPath) ? fs.statSync(fontRegistryPath).mtimeMs : 0}`,
      `wm=${fs.existsSync(watermarkPath) ? fs.statSync(watermarkPath).mtimeMs : 0}`,
    ];

    // If contentOverride exists, include a small hash so cache doesn't lie.
    if (contentOverride) {
      const h = crypto.createHash("sha256").update(contentBody).digest("hex").slice(0, 12);
      fingerprintParts.push(`overrideHash=${h}`);
    }

    const fingerprint = crypto.createHash("sha256").update(fingerprintParts.join("|")).digest("hex").slice(0, 16);

    // Store fingerprint alongside PDF to validate cache
    const fingerprintPath = `${outputPath}.fingerprint`;

    // 4) Cache check (only if file exists and fingerprint matches)
    if (!force && fs.existsSync(outputPath) && fs.existsSync(fingerprintPath)) {
      const existing = fs.readFileSync(fingerprintPath, "utf8").trim();
      if (existing === fingerprint) {
        return { success: true, path: config.outputPath, cached: true };
      }
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 5) Import ONE renderer instance
    const React = await import("react");
    const ReactPDF = await import("@react-pdf/renderer");

    // 6) Register fonts on THIS SAME instance (DATA URL method)
    registerPDFFonts(ReactPDF.Font);

    // 7) Build watermark payload (brand-equity signature)
    // Member identity may not be available at batch-gen time. Use a deterministic non-PII issuer key.
    // In “user-bound” generation (download pipeline), pass a real memberId instead.
    const issuerMemberId = String(process.env.AOL_WATERMARK_ISSUER_MEMBERID || "SYSTEM");
    const signature = generateDossierSignature(issuerMemberId, String(id), {
      brand: String(process.env.AOL_BRAND_NAME || "Abraham of London"),
    });

    const classification =
      String((config.tier ?? config.accessLevel ?? "public"))
        .trim()
        .toLowerCase() === "public"
        ? "PUBLIC"
        : "MEMBER";

    const watermark = getWatermarkPayload({
      signature,
      classification: classification as any,
      context: { briefTitle: String(config.title || id), route: String(config.outputPath || "") },
    });

    // 8) Import template after fonts are registered
    const { BriefDocument } = await import("./pdf-templates/BriefDocument");

    const pdfElement = React.createElement(BriefDocument as any, {
      config,
      content: contentBody.trim(),
      watermark, // ✅ inject watermark payload
    });

    const renderToFile =
      (ReactPDF as any).renderToFile ??
      (ReactPDF as any).default?.renderToFile ??
      null;

    if (typeof renderToFile !== "function") {
      throw new Error("renderToFile not available from @react-pdf/renderer in this build.");
    }

    await renderToFile(pdfElement as any, outputPath);

    // 9) Write fingerprint (cache truth)
    fs.writeFileSync(fingerprintPath, fingerprint, "utf8");

    return { success: true, path: config.outputPath, cached: false };
  } catch (error: any) {
    console.error(`[PDF_GEN_ERROR]: ${id}`, error);
    return { success: false, error: error?.message || String(error) };
  }
}