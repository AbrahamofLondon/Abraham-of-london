/* scripts/pdf/intelligent-generator.server.ts - INSTITUTIONAL SAFE-GUARD v2.2 */
if (typeof window !== "undefined") {
  throw new Error("intelligent-generator is server-only and must never be imported in the browser bundle.");
}

import fs from "fs";
import path from "path";
import crypto from "crypto";

// Registry & Config Imports
import { getAllPDFs, getPDFById } from "@/scripts/pdf-registry";

/* -------------------------------------------------------------------------- */
/* TYPES & DEFAULTS                                                           */
/* -------------------------------------------------------------------------- */

type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

export type SyncResult = {
  id: string;
  success: boolean;
  outputPath?: string;
  filename?: string;
  timeMs?: number;
  error?: string;
  action?: "copied" | "skipped" | "generated" | "missing-source" | "placeholder" | "healed";
  sourcePath?: string;
  sourceKind?: SourceKind;
  md5?: string;
  fileSize?: number;
};

export type GeneratorOptions = {
  libPdfDir?: string;
  contentDownloadsDir?: string;
  publicDownloadsDir?: string;
  allowDelete?: boolean;
  dryRun?: boolean;
  forceRefresh?: boolean; // Re-sync even if MD5 matches (for "Basic" -> "Premium" upgrade)
  batchSize?: number;      // Memory-safe processing for large portfolios
  createPlaceholders?: boolean;
};

function projectRoot() { return path.resolve(process.cwd()); }

function defaultOptions(): Required<GeneratorOptions> {
  return {
    libPdfDir: path.join(projectRoot(), "lib", "pdf"),
    contentDownloadsDir: path.join(projectRoot(), "content", "downloads"),
    publicDownloadsDir: path.join(projectRoot(), "public", "assets", "downloads"),
    allowDelete: false,
    dryRun: false,
    forceRefresh: false, 
    batchSize: 10,
    createPlaceholders: true,
  };
}

/* -------------------------------------------------------------------------- */
/* ATOMIC OPERATIONS (Anti-Deletion Guard)                                    */
/* -------------------------------------------------------------------------- */

/**
 * ATOMIC SWAP: Prevents the "Deleted but not replaced" issue.
 * Never deletes the target unless the new content is successfully verified in a temp file.
 */
function atomicReplace(source: string, target: string): boolean {
  const tempPath = `${target}.tmp_${Date.now()}`;
  try {
    ensureDir(path.dirname(target));
    
    // 1. Copy to temp
    fs.copyFileSync(source, tempPath);
    
    // 2. Verification
    const stats = fs.statSync(tempPath);
    if (stats.size > 0) {
      // 3. Atomic Rename (Swap)
      fs.renameSync(tempPath, target);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Atomic replace failed for ${target}:`, err);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* UTILITIES                                                                  */
/* -------------------------------------------------------------------------- */

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

function sanitizePdfText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2190-\u2199]/g, "->")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x00-\x7F]/g, "");
}

/* -------------------------------------------------------------------------- */
/* PLACEHOLDER GENERATION                                                     */
/* -------------------------------------------------------------------------- */

async function createPlaceholderPDF(id: string, title: string, description: string, outputPath: string): Promise<boolean> {
  try {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const cleanTitle = sanitizePdfText(title);
    const cleanDesc = sanitizePdfText(description);

    page.drawText('PROVISIONAL TRANSMISSION', { x: 50, y: 800, size: 10, font: fontBold, color: rgb(0.7, 0.5, 0.2) });
    page.drawText(cleanTitle.toUpperCase(), { x: 50, y: 750, size: 24, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    
    const descLines = cleanDesc.match(/.{1,70}(\s|$)/g) || [cleanDesc];
    descLines.slice(0, 5).forEach((line, i) => {
      page.drawText(line.trim(), { x: 50, y: 710 - (i * 15), size: 11, font, color: rgb(0.4, 0.4, 0.4) });
    });

    const pdfBytes = await doc.save();
    
    const tempPath = `${outputPath}.plh.tmp`;
    ensureDir(path.dirname(outputPath));
    fs.writeFileSync(tempPath, pdfBytes);
    fs.renameSync(tempPath, outputPath);
    
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
      await createPlaceholderPDF(cfg.id, cfg.title, cfg.description, targetDisk);
      return { id, success: true, action: "placeholder", timeMs: Date.now() - start };
    }
    return { id, success: false, action: "missing-source", error: "No source found" };
  }

  const sMd5 = md5File(source);
  const tMd5 = md5File(targetDisk);

  if (!opts.forceRefresh && fileExists(targetDisk) && sMd5 === tMd5) {
    return { id, success: true, action: "skipped", timeMs: Date.now() - start };
  }

  if (!opts.dryRun) {
    const success = atomicReplace(source, targetDisk);
    if (!success) return { id, success: false, error: "Atomic swap failed" };
  }

  return { id, success: true, action: "copied", timeMs: Date.now() - start, md5: sMd5 || undefined };
}

/* -------------------------------------------------------------------------- */
/* PUBLIC API WITH BATCHING                                                   */
/* -------------------------------------------------------------------------- */

export async function generateMissingPdfs(options?: GeneratorOptions): Promise<SyncResult[]> {
  const opts = { ...defaultOptions(), ...(options || {}) };
  const all = getAllPDFs();
  const results: SyncResult[] = [];

  const queue = all.filter(cfg => {
    const diskPath = path.join(opts.publicDownloadsDir, path.basename(cfg.outputPath));
    const stats = statSafe(diskPath);
    const isMissing = !stats;
    const isCorrupt = stats && stats.size < 100;
    return isMissing || isCorrupt || opts.forceRefresh;
  });

  console.log(`🚀 SYNC INITIATED: ${queue.length} files to process (Force: ${opts.forceRefresh})`);

  for (let i = 0; i < queue.length; i += opts.batchSize) {
    const batch = queue.slice(i, i + opts.batchSize);
    const batchResults = await Promise.all(batch.map(cfg => syncOne(cfg.id, opts)));
    results.push(...batchResults);
    console.log(`✅ Batch ${Math.floor(i / opts.batchSize) + 1} complete (${results.length}/${queue.length})`);
  }

  return results;
}

export async function generateOnePdfById(id: string, options?: GeneratorOptions): Promise<SyncResult> {
  return syncOne(id, options);
}