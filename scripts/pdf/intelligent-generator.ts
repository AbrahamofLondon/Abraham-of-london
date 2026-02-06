/* scripts/pdf/intelligent-generator.ts - INSTITUTIONAL SAFE-GUARD VERSION 2.0 */
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Import from legacy barrel file (client-safe)
import { 
  getAllPDFItems as getAllPDFs, 
  getPDFById, 
  PDFItem as PDFConfig, 
  PDFTier, 
  PDFType 
} from "@/scripts/pdf-registry";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

export type SyncResult = {
  id: string;
  success: boolean;
  outputPath?: string;
  filename?: string;
  timeMs?: number;
  error?: string;
  action?: "copied" | "skipped" | "generated" | "missing-source" | "placeholder" | "scanned";
  sourcePath?: string;
  sourceKind?: SourceKind;
  md5?: string;
  fileSize?: number;
};

export type GeneratorOptions = {
  libPdfDir?: string;
  contentDownloadsDir?: string;
  publicDownloadsDir?: string;
  enableContentScan?: boolean;
  generateRegistryFromScan?: boolean;
  contentSubDir?: string;
  allowDelete?: boolean;
  dryRun?: boolean;
  enforceRegistryFilenames?: boolean;
  createPlaceholders?: boolean;
  useUniversalConverter?: boolean;
  quality?: "premium" | "enterprise" | "draft";
};

/* -------------------------------------------------------------------------- */
/* UTILITIES & SANITIZATION                                                   */
/* -------------------------------------------------------------------------- */

function projectRoot() { return path.resolve(process.cwd()); }

function defaultOptions(): Required<GeneratorOptions> {
  return {
    libPdfDir: path.join(projectRoot(), "lib", "pdf"),
    contentDownloadsDir: path.join(projectRoot(), "content", "downloads"),
    publicDownloadsDir: path.join(projectRoot(), "public", "assets", "downloads"),
    enableContentScan: true,
    generateRegistryFromScan: true,
    contentSubDir: "content-downloads",
    allowDelete: false,
    dryRun: false,
    enforceRegistryFilenames: true,
    createPlaceholders: true,
    useUniversalConverter: true,
    quality: "premium",
  };
}

/**
 * STRATEGIC FIX: Character Sanitization
 * Replaces WinAnsi-incompatible characters (like →) with safe equivalents.
 */
function sanitizePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2190-\u2199]/g, "->") // Replace arrows with safe ASCII
    .replace(/[\u2013\u2014]/g, "-")    // En/Em dashes to hyphens
    .replace(/[\u2018\u2019]/g, "'")    // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')    // Smart double quotes
    .replace(/[\u2022]/g, "*")          // Bullets to asterisks
    .replace(/[^\x00-\x7F]/g, "");      // Final fallback: Strip non-ASCII
}

function fileExists(p: string) {
  try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}

function ensureDir(p: string) { if (!fileExists(p)) fs.mkdirSync(p, { recursive: true }); }

function statSafe(p: string): fs.Stats | null {
  try { return fs.statSync(p); } catch { return null; }
}

function md5File(p: string): string | null {
  try {
    const b = fs.readFileSync(p);
    return crypto.createHash("md5").update(b).digest("hex");
  } catch { return null; }
}

/* -------------------------------------------------------------------------- */
/* CORE: PLACEHOLDER GENERATION                                               */
/* -------------------------------------------------------------------------- */

async function createPlaceholderPDF(id: string, title: string, description: string, outputPath: string): Promise<boolean> {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    // Apply sanitization to inputs
    const cleanTitle = sanitizePdfText(title);
    const cleanDesc = sanitizePdfText(description);

    page.drawText('PROVISIONAL TRANSMISSION', { x: 50, y: 800, size: 10, font: fontBold, color: rgb(0.7, 0.5, 0.2) });
    page.drawText(cleanTitle.toUpperCase(), { x: 50, y: 750, size: 24, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    
    const descLines = cleanDesc.match(/.{1,70}(\s|$)/g) || [cleanDesc];
    descLines.slice(0, 5).forEach((line, i) => {
      page.drawText(line.trim(), { x: 50, y: 710 - (i * 15), size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    });

    page.drawText(`ASSET_ID: ${id}`, { x: 50, y: 100, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    page.drawText(`GEN_DATE: ${new Date().toISOString()}`, { x: 50, y: 85, size: 8, font, color: rgb(0.6, 0.6, 0.6) });
    page.drawText('ABRAHAM OF LONDON INSTITUTIONAL ASSET', { x: 350, y: 85, size: 8, fontBold, color: rgb(0.1, 0.1, 0.1) });

    const pdfBytes = await doc.save();
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(outputPath, pdfBytes);
    return true;
  } catch (error) {
    console.error(`❌ Placeholder failure for ${id}:`, error);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* CORE: SYNC LOGIC                                                           */
/* -------------------------------------------------------------------------- */

function pickCandidateSourceFile(opts: Required<GeneratorOptions>, registryOutputPath: string): string | null {
  const base = path.basename(registryOutputPath);
  const c1 = path.join(opts.libPdfDir, base);
  if (fileExists(c1)) return c1;
  
  const all = (function walk(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(full)); else out.push(full);
    });
    return out;
  })(opts.contentDownloadsDir);

  return all.find((p) => path.basename(p) === base) || null;
}

export async function syncOne(id: string, options?: GeneratorOptions): Promise<SyncResult> {
  const opts = { ...defaultOptions(), ...(options || {}) };
  const start = Date.now();
  const cfg = getPDFById(id);

  if (!cfg) return { id, success: false, error: "Unknown Institutional ID" };

  const targetDisk = path.join(opts.publicDownloadsDir, path.basename(cfg.outputPath));
  const source = pickCandidateSourceFile(opts, cfg.outputPath);

  if (!source) {
    if (opts.createPlaceholders) {
      const pSuccess = await createPlaceholderPDF(cfg.id, cfg.title, cfg.description, targetDisk);
      if (pSuccess) return { id, success: true, action: "placeholder", timeMs: Date.now() - start };
    }
    return { id, success: false, action: "missing-source", error: "No source manuscript found" };
  }

  const sMd5 = md5File(source);
  const tMd5 = md5File(targetDisk);

  if (fileExists(targetDisk) && sMd5 === tMd5) {
    return { id, success: true, action: "skipped", timeMs: Date.now() - start, md5: tMd5 || undefined };
  }

  if (!opts.dryRun) {
    ensureDir(path.dirname(targetDisk));
    if (fileExists(targetDisk) && !opts.allowDelete) {
      fs.copyFileSync(targetDisk, `${targetDisk}.${Date.now()}.bak`);
    }
    fs.copyFileSync(source, targetDisk);
  }

  return { id, success: true, action: "copied", timeMs: Date.now() - start, md5: sMd5 || undefined };
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export async function generateOnePdfById(id: string, options?: GeneratorOptions): Promise<SyncResult> {
  return syncOne(id, options);
}

export async function generateMissingPdfs(options?: GeneratorOptions): Promise<SyncResult[]> {
  const opts = { ...defaultOptions(), ...(options || {}) };
  const all = getAllPDFs();
  const results: SyncResult[] = [];

  for (const cfg of all) {
    const disk = path.join(opts.publicDownloadsDir, path.basename(cfg.outputPath));
    if (!fileExists(disk) || !cfg.exists) {
      results.push(await syncOne(cfg.id, opts));
    }
  }

  console.log(`📊 TRANSMISSION SUMMARY: Success=${results.filter(r => r.success).length}, Failed=${results.filter(r => !r.success).length}`);
  return results;
}