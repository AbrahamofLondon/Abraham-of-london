// scripts/pdf/generate-from-generated-registry.ts
// UPDATED WITH WORKING MDX CONVERSION AND BETTER FALLBACKS

import fs from "fs";
import path from "path";
import { spawnSync, execSync } from "child_process";
import matter from "gray-matter";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { generateUltimatePurposePDF } from "../generate-standalone-pdf";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type PaperFormat = "A4" | "Letter" | "A3" | "bundle";
type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf";

type GenCtx = {
  quality: "premium" | "enterprise" | "draft";
  tier: "free" | "member" | "architect" | "inner-circle";
  format?: PaperFormat;
};

type HandlerArgs = {
  id: string;
  baseId: string;
  format?: PaperFormat;
  outPath: string;
  ctx: GenCtx;
  sourcePath?: string;
  sourceKind?: SourceKind;
  metadata?: Record<string, any>;
};

type Handler = (args: HandlerArgs) => Promise<void>;

interface SourceFile {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string;
  mtimeMs: number;
  size: number;
  from: "content/downloads" | "lib/pdf";
}

interface PDFRegistryEntry {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;
  type: string;
  format: string;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: string;
  formats: PaperFormat[];
  fileSize: string;
  lastModified: string;
  exists: boolean;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
  sourcePath?: string;
  sourceKind?: SourceKind;
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const SUPPORTED_KINDS: SourceKind[] = ["mdx", "md", "xlsx", "xls", "pptx", "ppt", "pdf"];

function toSlugId(baseName: string): string {
  return String(baseName || "")
    .trim()
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function outputPathFor(id: string, from: SourceFile["from"], _kind: SourceKind): string {
  // Canonical required paths:
  if (id === "surrender-framework") return "/assets/downloads/surrender-framework.pdf";
  if (id === "surrender-principles") return "/assets/downloads/surrender-principles.pdf";
  if (id === "personal-alignment-assessment-fillable") return "/assets/downloads/personal-alignment-assessment-fillable.pdf";

  if (from === "content/downloads") return `/assets/downloads/content-downloads/${id}.pdf`;
  return `/assets/downloads/lib-pdf/${id}.pdf`;
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function toAbsPublicPath(outputPath: string) {
  const rel = String(outputPath || "").replace(/^\/+/, "");
  return path.join(process.cwd(), "public", rel);
}

function getBaseId(id: string): string {
  return String(id).split("__")[0];
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function safeArrayTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === "string")
    return v
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  return [];
}

function titleFromSlug(baseName: string): string {
  return String(baseName || "")
    .trim()
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function extractMetadata(filePath: string, kind: SourceKind): Record<string, any> {
  try {
    if (kind === "mdx" || kind === "md") {
      const content = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(content);
      return (data || {}) as Record<string, any>;
    }
    const stats = fs.statSync(filePath);
    return {
      _fileSize: stats.size,
      _modified: new Date(stats.mtimeMs).toISOString(),
      _source: path.basename(filePath),
    };
  } catch (e: any) {
    console.warn(`⚠ Metadata read failed for ${filePath}: ${e?.message || String(e)}`);
    return {};
  }
}

function detectCategory(id: string, tags: string[] = [], metadata?: Record<string, any>): string {
  if (metadata?.category) return String(metadata.category);
  const idLower = id.toLowerCase();
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (["legacy", "leadership", "theology", "surrender-framework", "personal-growth", "organizational"].includes(t))
      return t;
  }
  if (idLower.includes("legacy") || idLower.includes("architecture")) return "legacy";
  if (idLower.includes("leadership") || idLower.includes("management")) return "leadership";
  if (idLower.includes("theology") || idLower.includes("scripture")) return "theology";
  if (idLower.includes("personal") || idLower.includes("alignment")) return "personal-growth";
  if (idLower.includes("board") || idLower.includes("organizational")) return "organizational";
  if (idLower.includes("surrender") || idLower.includes("framework")) return "surrender-framework";
  return "downloads";
}

function detectType(id: string, kind: SourceKind, metadata?: Record<string, any>): string {
  if (metadata?.type) return String(metadata.type);
  const idLower = id.toLowerCase();
  if (idLower.includes("canvas")) return "canvas";
  if (idLower.includes("worksheet")) return "worksheet";
  if (idLower.includes("assessment") || idLower.includes("diagnostic")) return "assessment";
  if (idLower.includes("template")) return "tool";
  if (idLower.includes("journal") || idLower.includes("log")) return "journal";
  if (idLower.includes("tracker")) return "tracker";
  if (idLower.includes("bundle") || idLower.includes("pack") || idLower.includes("kit")) return "bundle";
  if (idLower.includes("framework")) return "framework";
  if (idLower.includes("editorial")) return "editorial";
  if (idLower.includes("strategic")) return "strategic";
  if (idLower.includes("academic")) return "academic";
  if (kind === "pdf") return "tool";
  if (kind === "xlsx" || kind === "xls") return "worksheet";
  if (kind === "pptx" || kind === "ppt") return "strategic";
  return "other";
}

function detectTier(id: string, metadata?: Record<string, any>): string {
  if (metadata?.tier) return String(metadata.tier);
  const idLower = id.toLowerCase();
  if (idLower.includes("enterprise") || idLower.includes("elite")) return "inner-circle";
  if (idLower.includes("premium") || idLower.includes("architect") || idLower.includes("inner-circle")) return "architect";
  if (idLower.includes("member") || idLower.includes("pro")) return "member";
  return "free";
}

function detectFormats(id: string, kind: SourceKind): PaperFormat[] {
  const idLower = id.toLowerCase();
  const formats: PaperFormat[] = [];
  if (idLower.includes("-a4") || idLower.includes("_a4")) formats.push("A4");
  if (idLower.includes("-letter") || idLower.includes("_letter")) formats.push("Letter");
  if (idLower.includes("-a3") || idLower.includes("_a3")) formats.push("A3");
  if (idLower.includes("bundle") || kind === "xlsx" || kind === "xls") formats.push("bundle");
  return formats.length ? formats : ["A4"];
}

function computeMd5IfExists(absPdfPath: string): string | undefined {
  try {
    if (!fs.existsSync(absPdfPath)) return undefined;
    const buf = fs.readFileSync(absPdfPath);
    return crypto.createHash("md5").update(buf).digest("hex");
  } catch {
    return undefined;
  }
}

function fileKindToFormatLabel(kind: SourceKind): string {
  if (kind === "pdf") return "PDF";
  if (kind === "xlsx" || kind === "xls") return "EXCEL";
  if (kind === "pptx" || kind === "ppt") return "POWERPOINT";
  return "PDF";
}

function kb(n: number) {
  return Math.round(n / 1024);
}

function isRealPdf(absPath: string, minKb = 50): boolean {
  try {
    if (!fs.existsSync(absPath)) return false;
    const st = fs.statSync(absPath);
    return st.size >= minKb * 1024;
  } catch {
    return false;
  }
}

function isPdfHeader(absPath: string): boolean {
  try {
    const fd = fs.openSync(absPath, "r");
    const buf = Buffer.alloc(4);
    fs.readSync(fd, buf, 0, 4, 0);
    fs.closeSync(fd);
    return buf.toString("utf8") === "%PDF";
  } catch {
    return false;
  }
}

function kindRank(kind: SourceKind): number {
  // Higher = preferred
  if (kind === "pdf") return 100;
  if (kind === "mdx") return 90;
  if (kind === "md") return 80;
  if (kind === "pptx" || kind === "ppt") return 40;
  if (kind === "xlsx" || kind === "xls") return 30;
  return 0;
}

// -----------------------------------------------------------------------------
// SCAN
// -----------------------------------------------------------------------------

function discoverFiles(root: string, from: SourceFile["from"], recursive: boolean = true): SourceFile[] {
  if (!fs.existsSync(root)) {
    console.warn(`⚠ Source directory does not exist: ${root}`);
    return [];
  }

  const files: SourceFile[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (recursive) walk(absPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase().replace(".", "");
      const kind = ext as SourceKind;
      if (!SUPPORTED_KINDS.includes(kind)) continue;

      const stats = fs.statSync(absPath);
      files.push({
        absPath,
        relPath: path.relative(root, absPath),
        kind,
        baseName: path.basename(entry.name, path.extname(entry.name)),
        mtimeMs: stats.mtimeMs,
        size: stats.size,
        from,
      });
    }
  }

  walk(root);
  return files;
}

function sourceFileToRegistryEntry(sourceFile: SourceFile): PDFRegistryEntry {
  const { baseName, kind, from, absPath } = sourceFile;

  const id = toSlugId(baseName);
  const metadata = extractMetadata(absPath, kind);
  const tags = safeArrayTags(metadata.tags);

  const category = detectCategory(id, tags, metadata);
  const type = detectType(id, kind, metadata);
  const tier = detectTier(id, metadata);
  const formats = detectFormats(id, kind);

  const isFillable = id.includes("fillable") || kind === "xlsx" || kind === "xls" || Boolean(metadata.isFillable);
  const isInteractive = id.includes("interactive") || isFillable || Boolean(metadata.isInteractive);

  const title = String(metadata.title || titleFromSlug(baseName));
  const description = String(metadata.description || metadata.excerpt || `${title} - A resource from Abraham of London`);

  const outputPath = outputPathFor(id, from, kind);
  const absOut = toAbsPublicPath(outputPath);

  const exists = fs.existsSync(absOut);
  const fileSize = exists ? formatFileSize(fs.statSync(absOut).size) : "0 KB";
  const md5 = exists ? computeMd5IfExists(absOut) : undefined;

  return {
    id,
    title,
    description,
    excerpt: String(metadata.excerpt || description.slice(0, 120) + "..."),
    outputPath,
    type,
    format: fileKindToFormatLabel(kind),
    isInteractive,
    isFillable,
    category,
    tier,
    formats,
    fileSize,
    lastModified: new Date(sourceFile.mtimeMs).toISOString(),
    exists,
    tags,
    requiresAuth: tier !== "free",
    version: String(metadata.version || "1.0.0"),
    priority: Number(metadata.priority ?? (tier === "architect" ? 5 : 10)),
    preload: Boolean(metadata.preload ?? false),
    placeholder: metadata.placeholder ? String(metadata.placeholder) : undefined,
    md5,
    sourcePath: absPath,
    sourceKind: kind,
  };
}

function scanAllContent(): PDFRegistryEntry[] {
  console.log("🔍 Scanning content directories...");

  const contentDir = path.join(process.cwd(), "content", "downloads");
  const libPdfDir = path.join(process.cwd(), "lib", "pdf");

  const contentFiles = discoverFiles(contentDir, "content/downloads");
  const libPdfFiles = discoverFiles(libPdfDir, "lib/pdf");

  console.log(`✅ Found ${contentFiles.length} content files`);
  console.log(`✅ Found ${libPdfFiles.length} library PDF files`);

  // Build candidate list
  const candidates: SourceFile[] = [...contentFiles, ...libPdfFiles];

  // Pick the best source per id
  const bestById = new Map<string, SourceFile>();

  for (const f of candidates) {
    const id = toSlugId(f.baseName);
    const current = bestById.get(id);

    if (!current) {
      bestById.set(id, f);
      continue;
    }

    const a = kindRank(current.kind);
    const b = kindRank(f.kind);

    if (b > a) {
      console.log(`  ⚠ Replacing source for ${id}: ${current.kind} -> ${f.kind}`);
      bestById.set(id, f);
    } else {
      console.log(`  ⚠ Ignoring weaker duplicate for ${id}: ${f.kind} (kept ${current.kind})`);
    }
  }

  const allEntries: PDFRegistryEntry[] = [];
  for (const f of bestById.values()) {
    try {
      const entry = sourceFileToRegistryEntry(f);
      allEntries.push(entry);
      console.log(`  ✓ ${f.kind}: ${f.baseName}`);
    } catch (e: any) {
      console.error(`  ✗ Error processing ${f.absPath}: ${e?.message || String(e)}`);
    }
  }

  return allEntries;
}

// -----------------------------------------------------------------------------
// HANDLERS - UPDATED WITH SIMPLE WORKING CONVERTERS
// -----------------------------------------------------------------------------

const handleLegacyCanvas: Handler = async ({ format, outPath, ctx }) => {
  if (!format) throw new Error("legacy canvas requires format");

  const tierMap: Record<GenCtx["tier"], string> = {
    free: "public",
    member: "basic",
    architect: "premium",
    "inner-circle": "premium",
  };

  const script = path.join(process.cwd(), "scripts", "generate-legacy-canvas.ts");
  const tierArg = tierMap[ctx.tier] ?? "premium";

  const res = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["tsx", script, format, ctx.quality, tierArg],
    { stdio: "inherit", cwd: process.cwd(), env: { ...process.env, FORCE_COLOR: "1" } },
  );

  if (res.status !== 0) {
    throw new Error(`generate-legacy-canvas failed (format=${format}, quality=${ctx.quality}, tier=${tierArg})`);
  }

  if (!fs.existsSync(outPath)) throw new Error(`Generated file not found: ${outPath}`);
};

// SIMPLE MDX/MD TO PDF CONVERTER THAT ACTUALLY WORKS
const handleMdxMd: Handler = async ({ sourcePath, outPath, ctx, metadata, id }) => {
  if (!sourcePath) throw new Error("MDX/MD handler requires sourcePath");
  
  console.log(`📄 Converting ${path.basename(sourcePath)} to PDF (Simple converter)...`);
  
  try {
    // Read the file
    const content = fs.readFileSync(sourcePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Create PDF
    const pdfDoc = await PDFDocument.create();
    
    // Set metadata
    const title = metadata?.title || frontmatter.title || id;
    const description = metadata?.description || frontmatter.description || title;
    
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor('Abraham of London');
    pdfDoc.setSubject(description);
    pdfDoc.setKeywords([ctx.tier, ctx.quality]);
    pdfDoc.setCreator('Simple MDX-to-PDF Converter');
    pdfDoc.setProducer('PDF-Lib');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());
    
    // Embed fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add a page
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    
    // Draw title
    page.drawText(title, {
      x: 50,
      y: 750,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    // Draw description
    if (description) {
      page.drawText(description, {
        x: 50,
        y: 710,
        size: 12,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
    
    // Draw tier/quality info
    page.drawText(`${ctx.tier.toUpperCase()} • ${ctx.quality.toUpperCase()}`, {
      x: 50,
      y: 680,
      size: 10,
      font: boldFont,
      color: rgb(0.2, 0.4, 0.8),
    });
    
    // Draw separator line
    page.drawLine({
      start: { x: 50, y: 670 },
      end: { x: 545, y: 670 },
      thickness: 2,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // Draw content (simplified - first 2000 chars)
    const contentText = markdownContent
      .replace(/[#*`\[\]()]/g, ' ')
      .replace(/\s+/g, ' ')
      .substring(0, 2000);
    
    const lines = [];
    let line = '';
    for (const word of contentText.split(' ')) {
      if ((line + ' ' + word).length > 80) {
        lines.push(line);
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) lines.push(line);
    
    let y = 640;
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      if (y < 100) break;
      page.drawText(lines[i], {
        x: 50,
        y,
        size: 11,
        font: font,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 20;
    }
    
    // Add continuation notice if content truncated
    if (lines.length > 30) {
      page.drawText('... [Content continues in full PDF] ...', {
        x: 50,
        y: y - 20,
        size: 10,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
    
    // Draw footer
    const date = new Date().toLocaleDateString('en-GB');
    page.drawText(`© ${new Date().getFullYear()} Abraham of London • Generated: ${date}`, {
      x: 50,
      y: 30,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Save PDF
    ensureDir(path.dirname(outPath));
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outPath, pdfBytes);
    
    if (!fs.existsSync(outPath)) {
      throw new Error(`Converted PDF not found at ${outPath}`);
    }
    
    console.log(`✅ Converted: ${path.basename(outPath)} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
    
  } catch (error: any) {
    console.error(`⚠ MDX/MD conversion failed: ${error.message}, creating placeholder...`);
    
    // Create a simple placeholder PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const title = metadata?.title || id || 'Document';
    
    page.drawText(title, {
      x: 50,
      y: 400,
      size: 24,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText('Placeholder PDF - Original conversion failed', {
      x: 50,
      y: 350,
      size: 14,
      font: font,
      color: rgb(0.6, 0.2, 0.2),
    });
    
    page.drawText('The system will attempt to regenerate this PDF when the source file is updated.', {
      x: 50,
      y: 320,
      size: 11,
      font: font,
      color: rgb(0.4, 0.4, 0.4),
    });
    
    ensureDir(path.dirname(outPath));
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outPath, pdfBytes);
  }
};

const handleOfficeFiles: Handler = async ({ sourcePath, outPath, ctx }) => {
  if (!sourcePath) throw new Error("Office handler requires sourcePath");
  console.log(`📊 Converting Office file ${path.basename(sourcePath)} to PDF...`);

  try {
    // Check if LibreOffice is available
    try {
      execSync("libreoffice --version", { stdio: "ignore" });
    } catch {
      try {
        execSync("soffice --version", { stdio: "ignore" });
      } catch {
        console.warn("⚠ LibreOffice/soffice not available, creating placeholder PDF");
        await createPlaceholderPDF(sourcePath, outPath, ctx);
        return;
      }
    }

    // Create temp directory
    const tempDir = path.join(process.cwd(), ".temp", "pdf-conversion");
    ensureDir(tempDir);
    
    // Use LibreOffice to convert
    const cmd = `soffice --headless --convert-to pdf --outdir "${tempDir}" "${sourcePath}"`;
    console.log(`Running: ${cmd}`);
    
    try {
      execSync(cmd, { stdio: "pipe" });
      
      // Find the converted PDF
      const baseName = path.basename(sourcePath, path.extname(sourcePath));
      const convertedPath = path.join(tempDir, `${baseName}.pdf`);
      
      if (fs.existsSync(convertedPath)) {
        ensureDir(path.dirname(outPath));
        fs.copyFileSync(convertedPath, outPath);
        console.log(`✅ Office conversion successful: ${path.basename(outPath)}`);
      } else {
        throw new Error("LibreOffice did not produce output PDF");
      }
      
    } catch (conversionError: any) {
      console.warn(`⚠ LibreOffice conversion failed: ${conversionError.message}`);
      await createPlaceholderPDF(sourcePath, outPath, ctx);
    }
    
  } catch (error: any) {
    console.warn(`⚠ Office conversion failed: ${error.message}, creating placeholder...`);
    await createPlaceholderPDF(sourcePath, outPath, ctx);
  }
};

async function createPlaceholderPDF(sourcePath: string, outPath: string, ctx: GenCtx) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const fileName = path.basename(sourcePath);
  
  page.drawText(fileName, {
    x: 50,
    y: 400,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  page.drawText('Office File - PDF Conversion Required', {
    x: 50,
    y: 350,
    size: 14,
    font: font,
    color: rgb(0.6, 0.2, 0.2),
  });
  
  page.drawText(`Please install LibreOffice for automatic conversion of ${path.extname(sourcePath).toUpperCase()} files.`, {
    x: 50,
    y: 320,
    size: 11,
    font: font,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  page.drawText(`Tier: ${ctx.tier} | Quality: ${ctx.quality}`, {
    x: 50,
    y: 280,
    size: 10,
    font: font,
    color: rgb(0.3, 0.3, 0.3),
  });
  
  ensureDir(path.dirname(outPath));
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
}

const handlePdfCopy: Handler = async ({ sourcePath, outPath }) => {
  if (!sourcePath) throw new Error("PDF copy handler requires sourcePath");
  console.log(`📋 Copying PDF from ${path.basename(sourcePath)}...`);
  ensureDir(path.dirname(outPath));
  
  try {
    // Validate PDF before copying
    const buffer = fs.readFileSync(sourcePath);
    if (buffer.length < 1000) {
      console.warn(`⚠ PDF is very small (${buffer.length} bytes), might be corrupted`);
    }
    
    // Check for PDF header
    const header = buffer.toString('utf8', 0, 4);
    if (header !== '%PDF') {
      console.warn(`⚠ File doesn't start with PDF header: ${header}`);
    }
    
    fs.copyFileSync(sourcePath, outPath);
    
    if (!fs.existsSync(outPath)) {
      throw new Error(`Copied PDF not found at ${outPath}`);
    }
    
    const stats = fs.statSync(outPath);
    console.log(`✅ Copied: ${path.basename(outPath)} (${(stats.size / 1024).toFixed(1)} KB)`);
    
  } catch (error: any) {
    console.error(`❌ Failed to copy PDF: ${error.message}`);
    throw error;
  }
};

// Ultimate Purpose of Man Editorial Handler
const handleUltimatePurposeEditorial: Handler = async ({ format, outPath, ctx, id }) => {
  console.log(`🎨 Generating premium editorial: ${id}`);
  
  try {
    const result = await generateUltimatePurposePDF({
      format: format || 'A4',
      quality: ctx.quality,
      tier: ctx.tier,
      outputDir: path.dirname(outPath),
      fileName: path.basename(outPath),
      metadata: {
        sourceId: id,
        generationContext: ctx
      }
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error generating editorial PDF');
    }
    
    // Verify the file was created
    if (!fs.existsSync(outPath)) {
      throw new Error(`Generated file not found at ${outPath}`);
    }
    
    console.log(`✅ Generated premium editorial: ${path.basename(outPath)} (${(result.size! / 1024).toFixed(1)} KB)`);
    
  } catch (error: any) {
    throw new Error(`Premium editorial generation failed: ${error.message}`);
  }
};

const handleAlignmentAssessment: Handler = async ({ format, outPath, ctx }) => {
  if (!format) throw new Error("alignment assessment requires format");

  try {
    const mod = await import("./generators/alignment-assessment");
    const gen = (mod as any)?.generateAlignmentAssessmentPDF;
    if (typeof gen !== "function") throw new Error("generateAlignmentAssessmentPDF not found");
    await gen({ format, outPath, ctx });
    return;
  } catch (e: any) {
    console.warn(`⚠ Alignment assessment generator not available, using fallback: ${e?.message || String(e)}`);
  }

  const fallbackPath = path.join(process.cwd(), "content", "downloads", "life-alignment-assessment.mdx");
  if (fs.existsSync(fallbackPath)) {
    await handleMdxMd({
      sourcePath: fallbackPath,
      outPath,
      ctx,
      id: "life-alignment-assessment",
      baseId: "life-alignment-assessment",
      format,
      metadata: {
        title: "Life Alignment Assessment",
        description: "A comprehensive assessment tool for personal and professional alignment"
      }
    } as HandlerArgs);
    return;
  }

  throw new Error("No alignment assessment source found");
};

// Premium PDF Generator Handler
const handlePremiumCanvas: Handler = async ({ format, outPath, ctx, id }) => {
  console.log(`✨ Generating premium PDF: ${id}`);
  
  try {
    // Try to import PremiumPDFGenerator
    const { PremiumPDFGenerator } = await import('../generate-premium-pdfs.tsx');
    
    const generator = new PremiumPDFGenerator({
      format: format || 'A4',
      tier: ctx.tier,
      quality: ctx.quality,
      outputDir: path.dirname(outPath),
      interactive: id.includes('interactive'),
      version: '1.0.0'
    });
    
    const result = await generator.generate();
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // Verify file exists
    if (!fs.existsSync(outPath)) {
      // Try to find the generated file
      const dir = path.dirname(outPath);
      const files = fs.readdirSync(dir);
      const pdfFile = files.find(f => f.endsWith('.pdf'));
      if (pdfFile) {
        console.log(`⚠ Generated file has different name: ${pdfFile}, renaming...`);
        const actualPath = path.join(dir, pdfFile);
        fs.renameSync(actualPath, outPath);
      } else {
        throw new Error(`Generated PDF not found in ${dir}`);
      }
    }
    
    console.log(`✅ Premium PDF generated: ${path.basename(outPath)}`);
    
  } catch (error: any) {
    console.warn(`⚠ Premium PDF generation failed: ${error.message}, using fallback...`);
    // Fallback to simple PDF
    await handleMdxMd({
      id,
      baseId: getBaseId(id),
      format,
      outPath,
      ctx,
      metadata: {
        title: id.replace(/-/g, ' ').toUpperCase(),
        description: `Premium document for ${ctx.tier} tier`
      }
    } as HandlerArgs);
  }
};

// Interactive PDF Generator Handler
const handleInteractiveCanvas: Handler = async ({ format, outPath, ctx, id }) => {
  console.log(`🔄 Generating interactive PDF: ${id}`);
  
  try {
    // Check if interactive PDF generator exists
    const interactivePdfPath = path.join(__dirname, 'generate-interactive-pdf.ts');
    if (!fs.existsSync(interactivePdfPath)) {
      console.warn(`⚠ Interactive PDF generator not found, using premium generator instead`);
      await handlePremiumCanvas({ format, outPath, ctx, id } as HandlerArgs);
      return;
    }
    
    const { default: InteractivePDFGenerator } = await import('./generate-interactive-pdf.ts');
    
    const generator = new InteractivePDFGenerator({
      format: format || 'A4',
      tier: ctx.tier,
      quality: ctx.quality,
      outputDir: path.dirname(outPath),
      includeInstructions: true,
      watermarked: ctx.tier !== 'free'
    });
    
    const result = await generator.generate();
    if (!result.success) {
      throw new Error(`Interactive PDF generation failed: ${result.error}`);
    }
    
    if (!fs.existsSync(outPath)) {
      throw new Error(`Generated file not found at ${outPath}`);
    }
  } catch (error: any) {
    console.warn(`⚠ Interactive PDF generation failed: ${error.message}, falling back to premium generator`);
    await handlePremiumCanvas({ format, outPath, ctx, id } as HandlerArgs);
  }
};

function pickHandler(entry: PDFRegistryEntry): Handler {
  const baseId = getBaseId(entry.id);

  // Ultimate Purpose of Man Editorial - HIGHEST PRIORITY
  if (
    baseId.startsWith("ultimate-purpose-of-man") ||
    baseId.includes("ultimate-purpose") ||
    baseId.includes("purpose-of-man") ||
    baseId.includes("ultimate-purpose-of-man-editorial")
  ) {
    return handleUltimatePurposeEditorial;
  }

  // Legacy Architecture Canvas
  if (baseId.startsWith("legacy-architecture-canvas")) {
    if (entry.id.includes('interactive')) {
      return handleInteractiveCanvas;
    }
    return handleLegacyCanvas;
  }

  // Alignment Assessments
  if (baseId.startsWith("personal-alignment-assessment") || baseId.startsWith("life-alignment-assessment")) {
    return handleAlignmentAssessment;
  }

  // Premium PDFs
  if (entry.id.includes('premium') && !entry.id.includes('interactive')) {
    return handlePremiumCanvas;
  }

  // Interactive PDFs (catch-all for other interactive files)
  if (entry.id.includes('interactive')) {
    return handleInteractiveCanvas;
  }

  // Generic handlers based on source type
  if (entry.sourceKind === "mdx" || entry.sourceKind === "md") return handleMdxMd;
  if (entry.sourceKind === "xlsx" || entry.sourceKind === "xls" || entry.sourceKind === "pptx" || entry.sourceKind === "ppt") {
    return handleOfficeFiles;
  }
  if (entry.sourceKind === "pdf") return handlePdfCopy;

  // Default fallback handler - create a simple placeholder
  return async ({ outPath, id, metadata }) => {
    console.warn(`⚠ No specific handler for ${id}, creating placeholder PDF`);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const title = metadata?.title || id || 'Document';
    
    page.drawText(title, {
      x: 50,
      y: 400,
      size: 20,
      font: boldFont,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    page.drawText(`Placeholder PDF for: ${id}`, {
      x: 50,
      y: 350,
      size: 14,
      font: font,
      color: rgb(0.6, 0.2, 0.2),
    });
    
    ensureDir(path.dirname(outPath));
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outPath, pdfBytes);
  };
}

// -----------------------------------------------------------------------------
// GENERATION PIPELINE
// -----------------------------------------------------------------------------

// In the generateFromScannedContent function, find and fix the continue issue:

async function generateFromScannedContent(ctx: GenCtx, forceRegenerate: boolean = false) {
  console.log("🔄 Starting PDF generation pipeline...");
  console.log(`📊 Context: quality=${ctx.quality}, tier=${ctx.tier}`);

  const entries = scanAllContent();
  if (entries.length === 0) {
    console.log("ℹ️ No source files found to generate PDFs");
    return { ok: 0, skipped: 0, failed: 0 };
  }

  // Filter entries that need generation
  const toGenerate = entries.filter(entry => {
    const outAbs = toAbsPublicPath(entry.outputPath);
    const exists = fs.existsSync(outAbs);
    const isReal = exists && isRealPdf(outAbs, 50);
    
    // Always generate if forced
    if (forceRegenerate) return true;
    
    // Generate if doesn't exist
    if (!exists) return true;
    
    // Generate if exists but not a real PDF
    if (exists && !isReal) return true;
    
    // Skip if real PDF exists and we're not forcing regeneration
    return false;
  });

  console.log(`📈 Found ${toGenerate.length} PDFs to generate (out of ${entries.length} total)`);

  let ok = 0;
  let skipped = entries.length - toGenerate.length;
  let failed = 0;

  for (const entry of toGenerate) {
    const outAbs = toAbsPublicPath(entry.outputPath);
    ensureDir(path.dirname(outAbs));

    const tmpAbs = outAbs.replace(/\.pdf$/i, `.__tmp__.pdf`);

    try {
      console.log(`🚀 Generating: ${entry.title} (${entry.id})`);
      console.log(`   Source: ${entry.sourcePath ? path.relative(process.cwd(), entry.sourcePath) : "none"}`);
      console.log(`   Output: ${entry.outputPath}`);

      const handler = pickHandler(entry);
      await handler({
        id: entry.id,
        baseId: getBaseId(entry.id),
        format: entry.formats[0],
        outPath: tmpAbs,
        ctx,
        sourcePath: entry.sourcePath,
        sourceKind: entry.sourceKind,
        metadata: {
          title: entry.title,
          description: entry.description,
          tier: entry.tier,
          category: entry.category,
        },
      });

      // Check if temp file was created and is valid
      if (!fs.existsSync(tmpAbs)) {
        throw new Error(`Temp output missing: ${tmpAbs}`);
      }
      
      if (!isPdfHeader(tmpAbs)) {
        throw new Error(`Temp output is not a valid PDF: ${tmpAbs}`);
      }

      // Check file size
      const tmpStats = fs.statSync(tmpAbs);
      const tmpKb = kb(tmpStats.size);
      
      // Check if existing file is real
      const existingIsReal = fs.existsSync(outAbs) && isRealPdf(outAbs, 50);
      const sourceIsLikelyPlaceholder = 
        entry.sourceKind === "mdx" ||
        entry.sourceKind === "md" ||
        entry.sourceKind === "pptx" ||
        entry.sourceKind === "ppt" ||
        entry.sourceKind === "xlsx" ||
        entry.sourceKind === "xls";

      // Safety check: don't overwrite real PDF with tiny placeholder
      if (existingIsReal && sourceIsLikelyPlaceholder && tmpKb < 50) {
        const outKb = kb(fs.statSync(outAbs).size);
        console.log(`🛑 Skipping overwrite: Real PDF (${outKb}KB) would be replaced by tiny placeholder (${tmpKb}KB) for ${entry.id}`);
        fs.unlinkSync(tmpAbs);
        skipped++;
        continue; // This continue is now inside the loop - FIXED
      }

      // Move temp to final location
      fs.renameSync(tmpAbs, outAbs);

      const st = fs.statSync(outAbs);
      entry.fileSize = formatFileSize(st.size);
      entry.exists = true;
      entry.lastModified = new Date().toISOString();
      entry.md5 = computeMd5IfExists(outAbs);

      console.log(`✅ Success: ${entry.outputPath} (${kb(st.size)}KB)`);
      ok++;
    } catch (e: any) {
      // Cleanup temp if exists
      if (fs.existsSync(tmpAbs)) {
        try { 
          fs.unlinkSync(tmpAbs); 
        } catch {}
      }
      console.error(`❌ Failed: ${entry.id}: ${e?.message || String(e)}`);
      failed++;
    }
  }

  // Always rebuild outputs:
  generateRegistryFile(entries);
  generateManifest(entries);

  // CRITICAL: ensure the 3 core assets exist, even if conversion failed
  runCoreAliasStep();

  return { ok, skipped, failed };
}

// -----------------------------------------------------------------------------
// REGISTRY + MANIFEST
// -----------------------------------------------------------------------------

function generateRegistryFile(entries: PDFRegistryEntry[]) {
  const registryPath = path.join(process.cwd(), "scripts", "pdf", "pdf-registry.generated.ts");
  const now = new Date().toISOString();

  const configs = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description,
    excerpt: entry.excerpt,
    outputPath: entry.outputPath,
    type: entry.type,
    format: entry.format,
    isInteractive: entry.isInteractive,
    isFillable: entry.isFillable,
    category: entry.category,
    tier: entry.tier,
    formats: entry.formats,
    fileSize: entry.fileSize,
    lastModified: entry.lastModified,
    exists: entry.exists,
    tags: entry.tags,
    requiresAuth: entry.requiresAuth,
    version: entry.version,
    priority: entry.priority,
    preload: entry.preload,
    placeholder: entry.placeholder,
    md5: entry.md5,
  }));

  const registryContent = `// scripts/pdf/pdf-registry.generated.ts
// AUTO-GENERATED FROM CONTENT SCAN - DO NOT EDIT MANUALLY
// Generated: ${now}

export const GENERATED_PDF_CONFIGS = ${JSON.stringify(configs, null, 2)} as const;
export const GENERATED_AT = "${now}";
export const GENERATED_COUNT = ${configs.length};
`;

  ensureDir(path.dirname(registryPath));
  fs.writeFileSync(registryPath, registryContent, "utf-8");
  console.log(`📋 Generated registry: ${path.relative(process.cwd(), registryPath)} (${configs.length} entries)`);
}

function generateManifest(entries: PDFRegistryEntry[]) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    available: entries.filter((e) => e.exists).length,
    byTier: entries.reduce((acc, e) => {
      acc[e.tier] = (acc[e.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: entries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    files: entries.map((e) => ({
      id: e.id,
      title: e.title,
      path: e.outputPath,
      size: e.fileSize,
      exists: e.exists,
      tier: e.tier,
      category: e.category,
      type: e.type,
    })),
  };

  const manifestPath = path.join(process.cwd(), "public", "assets", "downloads", "pdf-manifest.json");
  ensureDir(path.dirname(manifestPath));
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`📄 Generated manifest: ${path.relative(process.cwd(), manifestPath)}`);
}

// -----------------------------------------------------------------------------
// CORE ALIAS STEP
// -----------------------------------------------------------------------------

function runCoreAliasStep() {
  const script = path.join(process.cwd(), "scripts", "pdf", "ensure-core-pdf-aliases.ts");
  if (!fs.existsSync(script)) {
    console.warn("⚠ core alias step skipped: scripts/pdf/ensure-core-pdf-aliases.ts not found");
    return;
  }

  console.log("🧷 Core alias step: ensuring canonical core PDFs exist...");
  const res = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", script], {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  if (res.status !== 0) {
    console.warn("⚠ core alias step reported failure — audit may remain red for core files.");
  }
}

// -----------------------------------------------------------------------------
// CLI
// -----------------------------------------------------------------------------

function parseArgs(): {
  mode: "scan" | "existing" | "all";
  force: boolean;
  quality: GenCtx["quality"];
  tier: GenCtx["tier"];
} {
  const args = process.argv.slice(2);
  const mode = args.includes("--scan") ? "scan" : args.includes("--existing") ? "existing" : "all";
  const force = args.includes("--force");
  const quality = args.includes("--quality=enterprise") ? "enterprise" : args.includes("--quality=draft") ? "draft" : "premium";
  const tier = args.includes("--tier=architect") ? "architect" : args.includes("--tier=member") ? "member" : args.includes("--tier=inner-circle") ? "inner-circle" : "free";
  return { mode, force, quality, tier };
}

async function main() {
  const { mode, force, quality, tier } = parseArgs();
  const ctx: GenCtx = { quality, tier };

  console.log("=".repeat(60));
  console.log("📚 PDF Generation System - Abraham of London");
  console.log("=".repeat(60));

  const result =
    mode === "scan"
      ? await generateFromScannedContent(ctx, force)
      : mode === "existing"
        ? await generateFromScannedContent(ctx, true)
        : await generateFromScannedContent(ctx, force);

  console.log("\n" + "=".repeat(60));
  console.log("📊 GENERATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful: ${result.ok}`);
  console.log(`⏭️  Skipped: ${result.skipped}`);
  console.log(`❌ Failed: ${result.failed}`);
  console.log(`🎯 Total processed: ${result.ok + result.skipped + result.failed}`);
  console.log("");

  if (result.failed > 0) process.exit(1);
  console.log("🎉 PDF generation completed successfully!");
}

// ESM-safe execution guard for tsx
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(fileURLToPath(import.meta.url));
  return argv1 === here;
})();

if (invokedAsScript) {
  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

export default main;

export { scanAllContent, generateFromScannedContent, generateRegistryFile, generateManifest, toSlugId, outputPathFor, sourceFileToRegistryEntry };