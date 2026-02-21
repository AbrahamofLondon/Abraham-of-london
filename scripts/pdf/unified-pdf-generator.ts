// scripts/pdf/unified-pdf-generator.ts
// ABRAHAM OF LONDON — Unified PDF Generator (Production Grade)
// - Deterministic scanning + conversion
// - Correct Windows path mapping (NO leading-slash join bugs)
// - Hard PDF validation gate
// - Integrity hashing (sha256 + md5)
// - Optional Prisma upsert (metadata only)
// - Per-file START/DONE/FAIL with timers
// - Timeout-safe LibreOffice (spawn + kill process tree)
// - Puppeteer hard timeouts per entry
// - Commander negation flags: --no-use-puppeteer / --no-use-universal

import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import matter from "gray-matter";
import { spawn, spawnSync } from "child_process";
import { SecurePuppeteerPDFGenerator } from "./secure-puppeteer-generator";

// =============================================================================
// TYPES
// =============================================================================

type Tier = "architect" | "member" | "free" | "all";
type Quality = "premium" | "enterprise" | "draft";
type Format = "A4" | "Letter" | "A3";
type SourceKind = "mdx" | "md" | "xlsx" | "xls" | "pptx" | "ppt" | "pdf" | "html";
type SourceFrom = "content/downloads" | "lib/pdf";

type GenerationOptions = {
  tier: Tier;
  quality: Quality;
  formats: Format[];
  outputDirAbs: string;         // absolute path to .../public/assets/downloads (or custom)
  outputBaseWeb: string;        // default "/assets/downloads"
  verbose: boolean;
  scanContent: boolean;
  scanOnly: boolean;
  usePuppeteer: boolean;
  useUniversal: boolean;
  strict: boolean;
  overwrite: boolean;
  minBytes: number;
  generate: boolean;
  writeRegistry: boolean;
  registryOutAbs: string;
  db: boolean;
  sofficePath?: string;         // optional explicit path to soffice
};

type SourceFile = {
  absPath: string;
  relPath: string;
  kind: SourceKind;
  baseName: string;
  mtimeMs: number;
  size: number;
  from: SourceFrom;
};

type ContentRegistryEntry = {
  id: string;
  title: string;
  description: string;
  excerpt?: string;

  // deterministic mapping
  outputAbsPath: string;       // physical
  outputPathWeb: string;       // web

  sourcePathAbs: string;
  sourceKind: SourceKind;
  from: SourceFrom;

  type: string;
  format: string;
  isInteractive: boolean;
  isFillable: boolean;
  category: string;
  tier: Exclude<Tier, "all">;
  formats: Format[];
  exists: boolean;
  needsGeneration: boolean;
  fileSizeBytes: number;
  fileSizeLabel: string;
  lastModifiedIso: string;
  tags: string[];
  requiresAuth: boolean;
  version: string;
  sha256?: string;
  md5?: string;
};

type ProcessResult = {
  id: string;
  ok: boolean;
  method: "copy" | "libreoffice" | "puppeteer" | "fallback";
  durationMs: number;
  outputBytes?: number;
  error?: string;
  sha256?: string;
  md5?: string;
};

// =============================================================================
// CLI
// =============================================================================

const program = new Command();

program
  .name("unified-pdf-generator")
  .description("Institutional PDF generator (scan + convert + validate + register + optional DB sync)")
  .version("5.0.0")
  .option("-t, --tier <tier>", "Tier filter (architect|member|free|all)", "all")
  .option("-q, --quality <quality>", "PDF quality (premium|enterprise|draft)", "premium")
  .option("-f, --formats <formats>", "Formats (A4,Letter,A3)", "A4")
  .option("-o, --output <output>", "Output directory (relative or abs)", "./public/assets/downloads")
  .option("--output-base-web <path>", "Web base for outputs", "/assets/downloads")
  .option("-v, --verbose", "Verbose logging", false)
  .option("--scan-content", "Scan content/downloads and lib/pdf for sources", false)
  .option("--scan-only", "Scan only (no generation)", false)
  .option("--generate", "Generate outputs", true)
  .option("--use-puppeteer", "Use Puppeteer for MD/MDX/HTML -> PDF", true)
  .option("--no-use-puppeteer", "Disable Puppeteer for MD/MDX/HTML -> PDF")
  .option("--use-universal", "Use LibreOffice for Office -> PDF", true)
  .option("--no-use-universal", "Disable LibreOffice conversion")
  .option("--strict", "Fail process if any conversion fails", false)
  .option("--overwrite", "Overwrite existing PDFs", false)
  .option("--min-bytes <bytes>", "Minimum bytes for a PDF to be considered valid", "8000")
  .option("--write-registry", "Write registry JSON to disk", true)
  .option("--registry-out <file>", "Registry JSON output file", "./public/assets/downloads/_generated.registry.json")
  .option("--db", "Upsert ContentMetadata in DB (metadata only)", false)
  .option("--soffice <path>", "Explicit soffice path (optional)", "");

// =============================================================================
// LOGGING
// =============================================================================

class Log {
  static dim(s: string) { return `\x1b[90m${s}\x1b[0m`; }
  static red(s: string) { return `\x1b[31m${s}\x1b[0m`; }
  static yel(s: string) { return `\x1b[33m${s}\x1b[0m`; }
  static grn(s: string) { return `\x1b[32m${s}\x1b[0m`; }
  static cya(s: string) { return `\x1b[36m${s}\x1b[0m`; }
  static mag(s: string) { return `\x1b[35m${s}\x1b[0m`; }
}

// =============================================================================
// HELPERS
// =============================================================================

function toAbs(p: string) {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function normalizeId(baseName: string): string {
  return String(baseName || "")
    .trim()
    .toLowerCase()
    .replace(/\.mdx?$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseFormats(input: string): Format[] {
  const parts = String(input || "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowed: Format[] = ["A4", "Letter", "A3"];
  const out: Format[] = [];
  for (const p of parts) if (allowed.includes(p as Format)) out.push(p as Format);
  return out.length ? out : ["A4"];
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function isPdfHeader(buf: Buffer): boolean {
  return !!buf && buf.length >= 4 && buf.subarray(0, 4).toString("utf8") === "%PDF";
}

function validatePdf(absPath: string, minBytes: number): { ok: boolean; reason: string; size?: number } {
  try {
    const st = fs.statSync(absPath);
    if (!st.isFile()) return { ok: false, reason: "not a file" };
    if (st.size < minBytes) return { ok: false, reason: `too small (${st.size} bytes)`, size: st.size };
    const head = fs.readFileSync(absPath);
    if (!isPdfHeader(head)) return { ok: false, reason: "missing %PDF header", size: st.size };
    return { ok: true, reason: "ok", size: st.size };
  } catch (e: any) {
    return { ok: false, reason: `cannot read (${e?.message || "unknown"})` };
  }
}

function hashFile(absPath: string): { sha256: string; md5: string } {
  const buf = fs.readFileSync(absPath);
  return {
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    md5: crypto.createHash("md5").update(buf).digest("hex"),
  };
}

function ensureDirForFile(absFile: string) {
  fs.mkdirSync(path.dirname(absFile), { recursive: true });
}

/**
 * Timeout-safe spawn. Kills entire tree on Windows.
 */
async function spawnWithTimeout(
  cmd: string,
  args: string[],
  timeoutMs: number
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], shell: false });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (c) => (stdout += c.toString()));
    child.stderr?.on("data", (c) => (stderr += c.toString()));

    const timer = setTimeout(() => {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", shell: true });
        } else {
          child.kill("SIGKILL");
        }
      } catch {}
      reject(new Error(`Timeout after ${timeoutMs}ms: ${cmd} ${args.join(" ")}`));
    }, timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`Command failed (code=${code}): ${cmd} ${args.join(" ")}\n${stderr}`));
    });
  });
}

function resolveSofficePath(explicit?: string): string {
  const env = process.env.SOFFICE_PATH || process.env.LIBREOFFICE_PATH || "";
  const candidate = (explicit && explicit.trim()) ? explicit.trim() : (env.trim() ? env.trim() : "soffice");
  return candidate;
}

function hasSoffice(sofficePath: string): boolean {
  try {
    const r = spawnSync(sofficePath, ["--version"], { stdio: "ignore" });
    return r.status === 0;
  } catch {
    return false;
  }
}

// =============================================================================
// SCANNER (ONLY what you said: content/downloads + lib/pdf)
// =============================================================================

class ContentScanner {
  static discover(rootAbs: string, from: SourceFrom, recursive = true): SourceFile[] {
    if (!fs.existsSync(rootAbs)) return [];
    const out: SourceFile[] = [];
    const allowed = new Set(["mdx", "md", "xlsx", "xls", "pptx", "ppt", "pdf", "html", "htm"]);

    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        const abs = path.join(dir, ent.name);
        if (ent.isDirectory()) { if (recursive) walk(abs); continue; }
        const ext = path.extname(ent.name).toLowerCase().replace(".", "");
        if (!allowed.has(ext)) continue;

        const kind: SourceKind = (ext === "htm" ? "html" : (ext as SourceKind));
        const st = fs.statSync(abs);

        out.push({
          absPath: abs,
          relPath: path.relative(rootAbs, abs),
          kind,
          baseName: path.basename(ent.name, path.extname(ent.name)),
          mtimeMs: st.mtimeMs,
          size: st.size,
          from,
        });
      }
    };

    walk(rootAbs);
    return out;
  }

  static extractMeta(absPath: string, kind: SourceKind): Record<string, any> {
    try {
      if (kind === "mdx" || kind === "md") {
        const raw = fs.readFileSync(absPath, "utf8");
        return (matter(raw).data || {}) as Record<string, any>;
      }
      if (kind === "html") {
        const raw = fs.readFileSync(absPath, "utf8");
        const title = raw.match(/<title>(.*?)<\/title>/i)?.[1];
        const description = raw.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i)?.[1];
        return { title, description };
      }
      return {};
    } catch {
      return {};
    }
  }

  static tagsFrom(meta: Record<string, any>): string[] {
    const raw = meta?.tags;
    if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
    if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
  }

  static detectCategory(id: string, tags: string[], meta: Record<string, any>): string {
    if (meta?.category) return String(meta.category);
    const tagFirst = tags.map((t) => t.toLowerCase());
    const known = new Set(["legacy", "leadership", "theology", "surrender-framework", "personal-growth", "organizational", "tools", "templates"]);
    for (const t of tagFirst) if (known.has(t)) return t;

    const s = id.toLowerCase();
    if (s.includes("legacy") || s.includes("architecture")) return "legacy";
    if (s.includes("leadership") || s.includes("management")) return "leadership";
    if (s.includes("theology") || s.includes("scripture")) return "theology";
    if (s.includes("personal") || s.includes("alignment")) return "personal-growth";
    if (s.includes("board") || s.includes("organizational")) return "organizational";
    if (s.includes("surrender") || s.includes("framework")) return "surrender-framework";
    if (s.includes("template") || s.includes("worksheet")) return "templates";
    if (s.includes("tool") || s.includes("calculator")) return "tools";
    return "downloads";
  }

  static detectTier(id: string, meta: Record<string, any>): Exclude<Tier, "all"> {
    const m = String(meta?.tier || meta?.accessLevel || "").toLowerCase();
    if (m === "architect" || m === "member" || m === "free") return m as any;

    const s = id.toLowerCase();
    if (s.includes("architect") || s.includes("inner-circle-plus") || s.includes("elite")) return "architect";
    if (s.includes("member") || s.includes("inner-circle")) return "member";
    return "free";
  }

  static titleFrom(baseName: string, meta: Record<string, any>): string {
    if (meta?.title) return String(meta.title);
    return baseName.split("-").map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
  }

  static descriptionFrom(title: string, meta: Record<string, any>): string {
    return String(meta?.description || meta?.excerpt || `${title} — A resource from Abraham of London`);
  }

  /**
   * Deterministic folder mapping:
   * - content/downloads => content-downloads/
   * - lib/pdf => lib-pdf/
   */
  static subdirFor(from: SourceFrom): "content-downloads" | "lib-pdf" {
    return from === "content/downloads" ? "content-downloads" : "lib-pdf";
  }

  static toRegistryEntry(sf: SourceFile, opts: GenerationOptions): ContentRegistryEntry {
    const id = normalizeId(sf.baseName);
    const meta = this.extractMeta(sf.absPath, sf.kind);
    const tags = this.tagsFrom(meta);
    const title = this.titleFrom(sf.baseName, meta);
    const description = this.descriptionFrom(title, meta);
    const excerpt =
      String(meta?.excerpt || "").trim() ||
      (description.length > 140 ? `${description.slice(0, 140)}…` : description);

    const category = this.detectCategory(id, tags, meta);
    const tier = this.detectTier(id, meta);
    const subdir = this.subdirFor(sf.from);

    // ✅ FIX: physical output is always based on opts.outputDirAbs (no leading slash surprises)
    const outputAbsPath = path.join(opts.outputDirAbs, subdir, `${id}.pdf`);

    // ✅ FIX: web output is always a clean posix URL
    const outputPathWeb = `${opts.outputBaseWeb}/${subdir}/${id}.pdf`.replace(/\/{2,}/g, "/");

    const exists = fs.existsSync(outputAbsPath);

    // needsGeneration: compare src mtime vs output mtime, and also validate PDF
    const needsGeneration = (() => {
      if (!exists) return true;
      try {
        const outSt = fs.statSync(outputAbsPath);
        // if source is newer (allow 1s slack)
        if (sf.mtimeMs > outSt.mtimeMs + 1000) return true;
        // if output is invalid
        const v = validatePdf(outputAbsPath, opts.minBytes);
        return !v.ok;
      } catch {
        return true;
      }
    })();

    const outBytes = exists ? fs.statSync(outputAbsPath).size : 0;

    const format =
      sf.kind === "pdf" ? "PDF" :
      (sf.kind === "xlsx" || sf.kind === "xls") ? "EXCEL" :
      (sf.kind === "pptx" || sf.kind === "ppt") ? "POWERPOINT" :
      (sf.kind === "html") ? "HTML" :
      "PDF";

    const isFillable = id.includes("fillable") || sf.kind === "xlsx" || sf.kind === "xls";
    const isInteractive = id.includes("interactive") || isFillable;

    return {
      id,
      title,
      description,
      excerpt,
      outputAbsPath,
      outputPathWeb,
      sourcePathAbs: sf.absPath,
      sourceKind: sf.kind,
      from: sf.from,
      type: String(meta?.type || "tool"),
      format,
      isInteractive,
      isFillable,
      category,
      tier,
      formats: opts.formats,
      exists,
      needsGeneration,
      fileSizeBytes: outBytes,
      fileSizeLabel: formatBytes(outBytes),
      lastModifiedIso: new Date(sf.mtimeMs).toISOString(),
      tags,
      requiresAuth: tier !== "free",
      version: String(meta?.version || "1.0.0"),
    };
  }
}

// =============================================================================
// UNIVERSAL CONVERTER (LibreOffice) + fallback PDF
// =============================================================================

class UniversalConverter {
  static async convertOfficeToPdf(sofficePath: string, srcAbs: string, destAbs: string): Promise<void> {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aol-pdf-"));
    try {
      ensureDirForFile(destAbs);

      await spawnWithTimeout(
        sofficePath,
        [
          "--headless",
          "--nologo",
          "--nolockcheck",
          "--nodefault",
          "--norestore",
          "--invisible",
          "--convert-to",
          "pdf",
          "--outdir",
          tmpDir,
          srcAbs,
        ],
        120_000
      );

      const base = path.basename(srcAbs, path.extname(srcAbs));
      const produced = path.join(tmpDir, `${base}.pdf`);

      if (fs.existsSync(produced)) {
        fs.copyFileSync(produced, destAbs);
        return;
      }

      // Some LO builds alter output filename; pick first PDF in tmpDir
      const pdfs = fs.readdirSync(tmpDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
      if (!pdfs.length) throw new Error("LibreOffice produced no PDF output");
      fs.copyFileSync(path.join(tmpDir, pdfs[0]), destAbs);
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }

  static async createFallbackPdf(entry: ContentRegistryEntry, destAbs: string, note: string): Promise<void> {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
    ensureDirForFile(destAbs);

    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("Abraham of London — Fallback PDF", { x: 50, y: 780, size: 18, font: bold, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(entry.title, { x: 50, y: 745, size: 14, font: bold, color: rgb(0.2, 0.2, 0.2), maxWidth: 500 });
    page.drawText(entry.description.slice(0, 250), { x: 50, y: 715, size: 10, font, color: rgb(0.35, 0.35, 0.35), maxWidth: 500 });

    const lines = [
      `ID: ${entry.id}`,
      `Source: ${path.basename(entry.sourcePathAbs)} (${entry.sourceKind})`,
      `From: ${entry.from}`,
      `Tier: ${entry.tier} | Category: ${entry.category}`,
      `Note: ${note}`,
      `Generated: ${new Date().toISOString()}`,
    ];

    let y = 675;
    for (const l of lines) {
      page.drawText(l, { x: 50, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
      y -= 18;
    }

    const bytes = await doc.save();
    fs.writeFileSync(destAbs, bytes);
  }
}

// =============================================================================
// ENGINE
// =============================================================================

class GeneratorEngine {
  private opts: GenerationOptions;
  private puppeteer: SecurePuppeteerPDFGenerator;
  private sofficePath: string;

  constructor(opts: GenerationOptions) {
    this.opts = opts;
    this.puppeteer = new SecurePuppeteerPDFGenerator({
      timeout: 70_000,
      maxRetries: 2,
    });
    this.sofficePath = resolveSofficePath(opts.sofficePath);
  }

  async run(): Promise<void> {
    this.banner();

    const entries = this.opts.scanContent ? this.scanSources() : [];
    if (this.opts.scanOnly) {
      this.printScanSummary(entries);
      if (this.opts.writeRegistry) this.writeRegistry(entries);
      return;
    }

    if (!this.opts.generate) {
      this.printScanSummary(entries);
      return;
    }

    const results = await this.generateAll(entries);

    if (this.opts.writeRegistry) {
      const byId = new Map(results.map((r) => [r.id, r]));
      for (const e of entries) {
        const rr = byId.get(e.id);
        if (rr?.ok) {
          e.sha256 = rr.sha256;
          e.md5 = rr.md5;
          e.fileSizeBytes = rr.outputBytes ?? e.fileSizeBytes;
          e.fileSizeLabel = formatBytes(e.fileSizeBytes);
          e.exists = true;
          e.needsGeneration = false;
        }
      }
      this.writeRegistry(entries);
    }

    if (this.opts.db) {
      await this.syncToDb(entries, results);
    }

    // Always close Puppeteer cleanly
    await this.puppeteer.close().catch(() => {});

    const failed = results.filter((r) => !r.ok);
    if (failed.length && this.opts.strict) {
      console.error(Log.red(`\n❌ STRICT MODE: ${failed.length} failures. Exiting code 1.\n`));
      process.exit(1);
    }

    console.log(Log.grn(`\n✅ Completed: ${results.filter((r) => r.ok).length} ok, ${failed.length} failed.\n`));
  }

  private banner() {
    console.log(Log.mag("\n✨ UNIFIED PDF GENERATOR (Institutional) ✨"));
    console.log(Log.dim("────────────────────────────────────────────────────────────"));
    console.log(`${Log.cya("Tier:")} ${this.opts.tier}`);
    console.log(`${Log.cya("Quality:")} ${this.opts.quality}`);
    console.log(`${Log.cya("Formats:")} ${this.opts.formats.join(", ")}`);
    console.log(`${Log.cya("Scan:")} ${this.opts.scanContent ? "ON" : "OFF"}  ${Log.cya("Generate:")} ${this.opts.generate ? "ON" : "OFF"}`);
    console.log(`${Log.cya("Puppeteer:")} ${this.opts.usePuppeteer ? "ON" : "OFF"}  ${Log.cya("LibreOffice:")} ${this.opts.useUniversal ? "ON" : "OFF"}`);
    console.log(`${Log.cya("Overwrite:")} ${this.opts.overwrite ? "YES" : "NO"}  ${Log.cya("Strict:")} ${this.opts.strict ? "YES" : "NO"}`);
    console.log(`${Log.cya("Min bytes:")} ${this.opts.minBytes}`);
    console.log(`${Log.cya("Output (abs):")} ${this.opts.outputDirAbs}`);
    console.log(`${Log.cya("Output base web):")} ${this.opts.outputBaseWeb}`);
    console.log(`${Log.cya("soffice):")} ${resolveSofficePath(this.opts.sofficePath)}`);
    console.log(Log.dim("────────────────────────────────────────────────────────────\n"));
    fs.mkdirSync(this.opts.outputDirAbs, { recursive: true });
  }

  private scanSources(): ContentRegistryEntry[] {
    const contentDir = path.join(process.cwd(), "content", "downloads");
    const libDir = path.join(process.cwd(), "lib", "pdf");

    console.log(Log.cya(`🔍 Scanning ${contentDir}`));
    const a = ContentScanner.discover(contentDir, "content/downloads", true);

    console.log(Log.cya(`🔍 Scanning ${libDir}`));
    const b = ContentScanner.discover(libDir, "lib/pdf", true);

    // De-dupe by id (prefer content/downloads over lib/pdf if collision)
    const all = [...a, ...b];
    const map = new Map<string, SourceFile>();
    for (const sf of all) {
      const id = normalizeId(sf.baseName);
      if (!map.has(id)) map.set(id, sf);
      else {
        const existing = map.get(id)!;
        if (existing.from === "lib/pdf" && sf.from === "content/downloads") map.set(id, sf);
      }
    }

    const entries = Array.from(map.values()).map((sf) => ContentScanner.toRegistryEntry(sf, this.opts));
    entries.sort((x, y) => x.title.localeCompare(y.title));
    this.printScanSummary(entries);
    return entries;
  }

  private printScanSummary(entries: ContentRegistryEntry[]) {
    const need = entries.filter((e) => e.needsGeneration).length;
    console.log(Log.grn(`📊 Found ${entries.length} sources. ${need} need generation.`));
    if (this.opts.verbose) {
      for (const e of entries) {
        console.log(Log.dim(` - ${e.id} [${e.sourceKind}] from=${e.from} needs=${e.needsGeneration} -> ${e.outputPathWeb}`));
      }
    }
  }

  private writeRegistry(entries: ContentRegistryEntry[]) {
    fs.mkdirSync(path.dirname(this.opts.registryOutAbs), { recursive: true });
    fs.writeFileSync(
      this.opts.registryOutAbs,
      JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2),
      "utf8"
    );
    console.log(Log.grn(`🧾 Registry written: ${this.opts.registryOutAbs}`));
  }

  private tierAllowed(entryTier: Exclude<Tier, "all">): boolean {
    if (this.opts.tier === "all") return true;
    return this.opts.tier === entryTier;
  }

  private postValidateOrThrow(outAbs: string) {
    const v = validatePdf(outAbs, this.opts.minBytes);
    if (!v.ok) {
      try { fs.unlinkSync(outAbs); } catch {}
      throw new Error(`Invalid PDF (${v.reason})`);
    }
  }

  private async processEntry(entry: ContentRegistryEntry, index: number, total: number): Promise<ProcessResult> {
    const start = Date.now();
    const dest = entry.outputAbsPath;

    console.log(`\n🧾 [${index + 1}/${total}] ${entry.id} :: ${entry.sourceKind} → ${entry.outputPathWeb}`);
    if (this.opts.verbose) console.log(Log.dim(`   src: ${entry.sourcePathAbs}`));
    if (this.opts.verbose) console.log(Log.dim(`   out: ${dest}`));

    if (!fs.existsSync(entry.sourcePathAbs) || fs.statSync(entry.sourcePathAbs).size < 10) {
      throw new Error(`Source missing/empty: ${entry.sourcePathAbs}`);
    }

    ensureDirForFile(dest);

    try {
      // 1) Direct PDF copy
      if (entry.sourceKind === "pdf") {
        fs.copyFileSync(entry.sourcePathAbs, dest);
        this.postValidateOrThrow(dest);
        const { sha256, md5 } = hashFile(dest);
        return {
          id: entry.id,
          ok: true,
          method: "copy",
          durationMs: Date.now() - start,
          outputBytes: fs.statSync(dest).size,
          sha256,
          md5,
        };
      }

      // 2) Office conversion via LibreOffice (if enabled + available)
      if (["xlsx", "xls", "pptx", "ppt"].includes(entry.sourceKind)) {
        const sofficeOk = this.opts.useUniversal && hasSoffice(this.sofficePath);

        if (sofficeOk) {
          await UniversalConverter.convertOfficeToPdf(this.sofficePath, entry.sourcePathAbs, dest);
          this.postValidateOrThrow(dest);
          const { sha256, md5 } = hashFile(dest);
          return {
            id: entry.id,
            ok: true,
            method: "libreoffice",
            durationMs: Date.now() - start,
            outputBytes: fs.statSync(dest).size,
            sha256,
            md5,
          };
        }

        // fallback
        await UniversalConverter.createFallbackPdf(entry, dest, "LibreOffice disabled/unavailable.");
        this.postValidateOrThrow(dest);
        const { sha256, md5 } = hashFile(dest);
        return {
          id: entry.id,
          ok: true,
          method: "fallback",
          durationMs: Date.now() - start,
          outputBytes: fs.statSync(dest).size,
          sha256,
          md5,
        };
      }

      // 3) MD/MDX/HTML via Puppeteer (if enabled)
      if ((entry.sourceKind === "mdx" || entry.sourceKind === "md" || entry.sourceKind === "html")) {
        if (this.opts.usePuppeteer) {
          const timeoutMs = this.opts.quality === "premium" ? 120_000 : this.opts.quality === "enterprise" ? 90_000 : 60_000;

          await this.puppeteer.generateFromSource({
            sourceAbsPath: entry.sourcePathAbs,
            sourceKind: entry.sourceKind,
            outputAbsPath: dest,
            quality: this.opts.quality,
            format: this.opts.formats[0] ?? "A4",
            title: entry.title,
            timeoutMs,
          });

          this.postValidateOrThrow(dest);
          const { sha256, md5 } = hashFile(dest);
          return {
            id: entry.id,
            ok: true,
            method: "puppeteer",
            durationMs: Date.now() - start,
            outputBytes: fs.statSync(dest).size,
            sha256,
            md5,
          };
        }

        // fallback if puppeteer disabled
        await UniversalConverter.createFallbackPdf(entry, dest, "Puppeteer disabled.");
        this.postValidateOrThrow(dest);
        const { sha256, md5 } = hashFile(dest);
        return {
          id: entry.id,
          ok: true,
          method: "fallback",
          durationMs: Date.now() - start,
          outputBytes: fs.statSync(dest).size,
          sha256,
          md5,
        };
      }

      // Unknown => fallback
      await UniversalConverter.createFallbackPdf(entry, dest, "No renderer configured for this kind.");
      this.postValidateOrThrow(dest);
      const { sha256, md5 } = hashFile(dest);
      return {
        id: entry.id,
        ok: true,
        method: "fallback",
        durationMs: Date.now() - start,
        outputBytes: fs.statSync(dest).size,
        sha256,
        md5,
      };
    } catch (error: any) {
      if (fs.existsSync(dest)) { try { fs.unlinkSync(dest); } catch {} }
      throw new Error(`${entry.id}: ${error?.message || "unknown error"}`);
    }
  }

  private async generateAll(entries: ContentRegistryEntry[]): Promise<ProcessResult[]> {
    const candidates = entries
      .filter((e) => this.tierAllowed(e.tier))
      .filter((e) => this.opts.overwrite || e.needsGeneration);

    console.log(Log.cya(`⚙️ Generating ${candidates.length} assets...`));

    const results: ProcessResult[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const entry = candidates[i];
      const t0 = Date.now();

      try {
        const r = await this.processEntry(entry, i, candidates.length);
        console.log(Log.grn(`✅ DONE: ${entry.id} (${r.durationMs}ms, ${formatBytes(r.outputBytes ?? 0)})`));
        results.push(r);
      } catch (e: any) {
        const msg = e?.message || "unknown error";
        console.log(Log.red(`❌ FAIL: ${entry.id} (${Date.now() - t0}ms) :: ${msg}`));
        results.push({ id: entry.id, ok: false, method: "fallback", durationMs: Date.now() - t0, error: msg });
      }
    }

    const ok = results.filter((r) => r.ok).length;
    const fail = results.length - ok;

    console.log(Log.dim("────────────────────────────────────────────────────────────"));
    console.log(Log.grn(`✅ Generated OK: ${ok}`));
    if (fail) console.log(Log.red(`❌ Failed: ${fail}`));
    console.log(Log.dim("────────────────────────────────────────────────────────────"));

    return results;
  }

  private async syncToDb(entries: ContentRegistryEntry[], results: ProcessResult[]) {
    console.log(Log.cya("\n🧠 Syncing metadata to DB (ContentMetadata)…"));
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const byId = new Map(results.map((r) => [r.id, r]));
    const toUpsert = entries.filter((e) => e.exists || byId.get(e.id)?.ok);

    let upserted = 0;
    try {
      for (const e of toUpsert) {
        const r = byId.get(e.id);
        const classification = e.requiresAuth ? "RESTRICTED" : "PUBLIC";

        const payload = {
          slug: e.id,
          title: e.title,
          contentType: "Briefing",
          classification,
          summary: e.description,
          content: JSON.stringify({
            outputPathWeb: e.outputPathWeb,
            outputAbsPath: e.outputAbsPath,
            fileSizeBytes: r?.outputBytes ?? e.fileSizeBytes,
            fileSizeLabel: formatBytes(r?.outputBytes ?? e.fileSizeBytes),
            sha256: r?.sha256,
            md5: r?.md5,
            tags: e.tags,
            category: e.category,
            tier: e.tier,
            sourceKind: e.sourceKind,
            sourceFrom: e.from,
            version: e.version,
            generatedAt: new Date().toISOString(),
          }),
        };

        await prisma.contentMetadata.upsert({
          where: { slug: payload.slug },
          create: payload as any,
          update: payload as any,
        });

        upserted++;
      }

      console.log(Log.grn(`✅ DB sync complete. Upserted: ${upserted}`));
    } finally {
      await prisma.$disconnect();
    }
  }
}

// =============================================================================
// OPTIONS
// =============================================================================

function buildOptions(): GenerationOptions {
  const raw = program.opts();

  const tier = String(raw.tier || "all") as Tier;
  const quality = String(raw.quality || "premium") as Quality;
  const formats = parseFormats(String(raw.formats || "A4"));

  const outputDirAbs = toAbs(String(raw.output || "./public/assets/downloads"));
  const outputBaseWeb = String(raw.outputBaseWeb || "/assets/downloads").trim() || "/assets/downloads";

  const registryOutAbs = toAbs(String(raw.registryOut || "./public/assets/downloads/_generated.registry.json"));

  const sofficePath = (raw.soffice && String(raw.soffice).trim()) ? String(raw.soffice).trim() : undefined;

  return {
    tier: (["architect", "member", "free", "all"].includes(tier) ? tier : "all") as Tier,
    quality: (["premium", "enterprise", "draft"].includes(quality) ? quality : "premium") as Quality,
    formats,
    outputDirAbs,
    outputBaseWeb,
    verbose: Boolean(raw.verbose),
    scanContent: Boolean(raw.scanContent),
    scanOnly: Boolean(raw.scanOnly),
    usePuppeteer: Boolean(raw.usePuppeteer),
    useUniversal: Boolean(raw.useUniversal),
    strict: Boolean(raw.strict),
    overwrite: Boolean(raw.overwrite),
    minBytes: Math.max(1000, parseInt(String(raw.minBytes || "8000"), 10) || 8000),
    generate: Boolean(raw.generate),
    writeRegistry: Boolean(raw.writeRegistry),
    registryOutAbs,
    db: Boolean(raw.db),
    sofficePath,
  };
}

// =============================================================================
// MAIN
// =============================================================================

(async () => {
  try {
    program.parse(process.argv);
    const opts = buildOptions();
    const engine = new GeneratorEngine(opts);
    await engine.run();
  } catch (e: any) {
    console.error(Log.red(`\nCRITICAL ENGINE FAILURE: ${e?.message || "unknown"}\n`));
    process.exit(1);
  }
})();