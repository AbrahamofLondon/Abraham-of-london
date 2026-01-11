// scripts/generate-pdfs.ts — TOP-TIER CONSOLIDATED VERSION
import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";
import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const fsp = fs.promises;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------
type LogLevel = "silent" | "error" | "warn" | "info" | "debug";
type Quality = "premium" | "enterprise";
type Tier = "public" | "basic" | "premium" | "enterprise" | "restricted";
type Format = "A4" | "Letter" | "A3";

const FORMAT_ALIASES: Record<string, Format> = {
  a4: "A4",
  letter: "Letter",
  a3: "A3",
};

const TIER_SLUG: Record<Tier, string> = {
  public: "free",
  basic: "member",
  premium: "architect",
  enterprise: "enterprise",
  restricted: "restricted",
};

const TIER_DISPLAY: Record<Tier, string> = {
  public: "Public",
  basic: "Inner Circle",
  premium: "Inner Circle Plus",
  enterprise: "Inner Circle Elite",
  restricted: "Private",
};

const CONFIG = {
  timeout: 10 * 60 * 1000,
  retries: 3,
  retryDelay: 1500,
  maxConcurrent: 1,

  logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",

  outputDir: path.join(process.cwd(), "public/assets/downloads"),
  libDir: path.join(process.cwd(), "lib/pdfs"),
  scriptDir: __dirname,

  quality: ((process.env.PDF_QUALITY as Quality) || "premium") as Quality,
  tier: ((process.env.PDF_TIER as Tier) || "premium") as Tier,

  // Safer: Only clean files older than 30 minutes
  maxOldFileAge: 30 * 60 * 1000,
} as const;

// ----------------------------------------------------------------------------
// ENHANCED LOGGER WITH BETTER VISUALS
// ----------------------------------------------------------------------------
class Logger {
  private static colors = {
    reset: "\x1b[0m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
  };

  private static symbols = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
    debug: "🔍",
    start: "🚀",
    file: "📄",
    folder: "📁",
    clock: "⏱️",
    check: "✅",
    cross: "❌",
    warning2: "⚠️",
    rocket: "🚀",
    magnify: "🔎",
    gear: "⚙️",
  };

  static shouldLog(level: LogLevel) {
    const levels: LogLevel[] = ["silent", "error", "warn", "info", "debug"];
    return levels.indexOf(level) <= levels.indexOf(CONFIG.logLevel);
  }

  static timestamp() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  }

  static format(level: Exclude<LogLevel, "silent">, message: string, icon?: string, color?: string) {
    if (!Logger.shouldLog(level)) return;
    
    const timestamp = `\x1b[90m${Logger.timestamp()}\x1b[0m`;
    const levelColor = {
      error: Logger.colors.brightRed,
      warn: Logger.colors.brightYellow,
      info: Logger.colors.brightCyan,
      debug: Logger.colors.gray,
    }[level];
    
    const levelText = `${levelColor}${level.toUpperCase().padEnd(5)}\x1b[0m`;
    const iconText = icon ? `${icon} ` : '';
    const messageText = color ? `${color}${message}\x1b[0m` : message;
    
    const line = `${timestamp} ${levelText} ${iconText}${messageText}`;
    
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
  }

  static header(title: string) {
    console.log(`\n${Logger.colors.brightMagenta}╔${'═'.repeat(title.length + 2)}╗\x1b[0m`);
    console.log(`${Logger.colors.brightMagenta}║ ${Logger.colors.brightWhite}${title}${Logger.colors.brightMagenta} ║\x1b[0m`);
    console.log(`${Logger.colors.brightMagenta}╚${'═'.repeat(title.length + 2)}╝\x1b[0m\n`);
  }

  static separator(length = 60) {
    console.log(`${Logger.colors.gray}${'─'.repeat(length)}\x1b[0m`);
  }

  static success(message: string) { 
    Logger.format("info", message, Logger.symbols.success, Logger.colors.brightGreen); 
  }
  
  static info(message: string) { 
    Logger.format("info", message, Logger.symbols.info, Logger.colors.brightCyan); 
  }
  
  static warn(message: string) { 
    Logger.format("warn", message, Logger.symbols.warning, Logger.colors.brightYellow); 
  }
  
  static error(message: string) { 
    Logger.format("error", message, Logger.symbols.error, Logger.colors.brightRed); 
  }
  
  static debug(message: string) { 
    Logger.format("debug", message, Logger.symbols.debug, Logger.colors.gray); 
  }
  
  static start(message: string) { 
    Logger.format("info", message, Logger.symbols.rocket, Logger.colors.brightMagenta); 
  }
  
  static file(message: string) { 
    Logger.format("info", message, Logger.symbols.file, Logger.colors.brightBlue); 
  }
  
  static folder(message: string) { 
    Logger.format("info", message, Logger.symbols.folder, Logger.colors.brightBlue); 
  }
  
  static time(message: string) { 
    Logger.format("info", message, Logger.symbols.clock, Logger.colors.brightYellow); 
  }
}

// ----------------------------------------------------------------------------
// ENHANCED FILE MANAGER WITH SAFETY FEATURES
// ----------------------------------------------------------------------------
class FileManager {
  static async exists(p: string) {
    try {
      await fsp.access(p);
      return true;
    } catch {
      return false;
    }
  }

  static async ensureDir(p: string) {
    if (!(await FileManager.exists(p))) {
      await fsp.mkdir(p, { recursive: true });
      Logger.folder(`Created directory: ${p}`);
    }
  }

  static async safeCleanup() {
    Logger.start("Performing safe cleanup...");
    const now = Date.now();
    let cleanedCount = 0;
    let backupCount = 0;

    // CRITICAL: DO NOT DELETE ZIP FILES
      if (file.endsWith('.zip')) {
        Logger.debug(`Skipping ZIP file: ${file}`);
        continue;

    // Create backup directory
    const backupDir = path.join(os.tmpdir(), `pdf-backup-${Date.now()}`);
    await FileManager.ensureDir(backupDir);

    // Clean downloads directory
    if (await FileManager.exists(CONFIG.outputDir)) {
      const files = await fsp.readdir(CONFIG.outputDir).catch(() => []);
      
      for (const file of files) {
        const filePath = path.join(CONFIG.outputDir, file);
        const stat = await fsp.stat(filePath).catch(() => null);
        if (!stat) continue;

        const isTarget = file.endsWith(".pdf") || file.endsWith(".json");
        if (!isTarget) continue;

        const fileAge = now - stat.mtimeMs;
        
        if (fileAge > CONFIG.maxOldFileAge) {
          // Backup before deletion
          const backupPath = path.join(backupDir, file);
          await fsp.copyFile(filePath, backupPath);
          backupCount++;
          
          await fsp.unlink(filePath).catch(() => {});
          cleanedCount++;
          Logger.debug(`Removed (backed up): ${file} (${Math.round(fileAge / 60000)}min old)`);
        } else if (fileAge > 5 * 60 * 1000) { // Older than 5 minutes
          Logger.debug(`Skipped (recent): ${file} (${Math.round(fileAge / 60000)}min old)`);
        }
      }
    }

    // Clean lib/pdfs directory
    if (await FileManager.exists(CONFIG.libDir)) {
      const files = await fsp.readdir(CONFIG.libDir).catch(() => []);
      
      for (const file of files) {
        const filePath = path.join(CONFIG.libDir, file);
        const stat = await fsp.stat(filePath).catch(() => null);
        if (!stat) continue;

        const isTarget = file.endsWith(".pdf") || file.endsWith(".json");
        if (!isTarget) continue;

        const fileAge = now - stat.mtimeMs;
        
        if (fileAge > CONFIG.maxOldFileAge) {
          await fsp.unlink(filePath).catch(() => {});
          cleanedCount++;
          Logger.debug(`Removed from lib: ${file}`);
        }
      }
    }

    if (backupCount > 0) {
      Logger.info(`Backup created at: ${backupDir}`);
    }

    Logger.success(`Safe cleanup: ${cleanedCount} files removed, ${backupCount} backed up`);
    return { cleanedCount, backupDir, backupCount };
  }

  static async validateFiles() {
    Logger.start("Validating generated files...");
    const issues: string[] = [];
    const validFiles: string[] = [];

    const downloadsFiles = await fsp.readdir(CONFIG.outputDir).catch(() => []);
    const pdfFiles = downloadsFiles.filter((f) => f.endsWith(".pdf"));

    for (const pdf of pdfFiles) {
      const filePath = path.join(CONFIG.outputDir, pdf);
      const stat = await fsp.stat(filePath).catch(() => null);

      if (!stat) {
        issues.push(`Cannot stat file: ${pdf}`);
        continue;
      }

      // Quality-based validation
      let minSize: number;
      switch (CONFIG.quality) {
        case 'enterprise':
          minSize = 50000; // 50KB
          break;
        case 'premium':
          minSize = 30000; // 30KB
          break;
        default:
          minSize = 20000; // 20KB
      }

      if (stat.size < minSize) {
        issues.push(`Suspiciously small: ${pdf} (${stat.size} bytes < ${minSize} min)`);
      } else if (stat.size > 10 * 1024 * 1024) { // 10MB max
        issues.push(`Suspiciously large: ${pdf} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      } else {
        validFiles.push(pdf);
      }
    }

    if (issues.length > 0) {
      Logger.warn(`Found ${issues.length} issues:`);
      issues.forEach((issue) => Logger.warn(`  ${issue}`));
    }

    Logger.success(`Validation: ${validFiles.length} valid PDFs, ${issues.length} issues`);
    return { validFiles, issues, total: pdfFiles.length };
  }

  static checksum16(filePath: string) {
    try {
      const buf = fs.readFileSync(filePath);
      return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
    } catch {
      return null;
    }
  }
}

// ----------------------------------------------------------------------------
// PREMIUM FALLBACK GENERATOR
// ----------------------------------------------------------------------------
class PremiumFallbackGenerator {
  static async generateLegacyCanvasFallback(
    format: Format, 
    quality: Quality, 
    tier: Tier, 
    outputPath: string
  ) {
    try {
      Logger.warn(`Generating premium fallback for ${format}-${quality}-${tier}`);
      
      const { w, h } = {
        A4: { w: 595.28, h: 841.89 },
        Letter: { w: 612, h: 792 },
        A3: { w: 841.89, h: 1190.55 },
      }[format];

      const doc = await PDFDocument.create();
      const page = doc.addPage([w, h]);

      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
      const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

      // Premium metadata
      doc.setTitle(`Legacy Architecture Canvas - ${TIER_DISPLAY[tier]}`);
      doc.setAuthor("Abraham of London");
      doc.setSubject("Strategic Framework Document");
      doc.setKeywords(["legacy", "architecture", "canvas", tier, quality, "fallback"]);
      doc.setCreationDate(new Date());
      doc.setModificationDate(new Date());

      // Premium background
      page.drawRectangle({
        x: 0, y: 0, width: w, height: h,
        color: rgb(0.98, 0.98, 0.97),
      });

      // Decorative border
      page.drawRectangle({
        x: 36, y: 36, width: w - 72, height: h - 72,
        borderColor: rgb(0.85, 0.85, 0.85),
        borderWidth: 1,
      });

      // Header
      page.drawText("LEGACY ARCHITECTURE CANVAS", {
        x: 72, y: h - 100,
        size: 28,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText(`TIER: ${TIER_DISPLAY[tier].toUpperCase()} | QUALITY: ${quality.toUpperCase()} | FORMAT: ${format}`, {
        x: 72, y: h - 140,
        size: 10,
        font: font,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Premium notice
      page.drawText("PREMIUM FALLBACK DOCUMENT", {
        x: 72, y: h - 180,
        size: 12,
        font: fontBold,
        color: rgb(0.7, 0.2, 0.2),
      });

      page.drawText("This is a high-quality fallback generated because the primary system", {
        x: 72, y: h - 210,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText("encountered a temporary issue. The full interactive version with", {
        x: 72, y: h - 230,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      page.drawText("form fields and enhanced formatting will be available shortly.", {
        x: 72, y: h - 250,
        size: 10,
        font: font,
        color: rgb(0.3, 0.3, 0.3),
      });

      // Generated info
      const info = [
        `Document ID: LAC-FB-${Date.now().toString(36).toUpperCase()}`,
        `Tier: ${TIER_DISPLAY[tier]} (${TIER_SLUG[tier]})`,
        `Quality: ${quality}`,
        `Format: ${format}`,
        `Generated: ${new Date().toLocaleString()}`,
        `Status: Premium Fallback`,
      ];

      info.forEach((line, i) => {
        page.drawText(line, {
          x: 72,
          y: h - 320 - (i * 24),
          size: 11,
          font: i === 0 ? fontBold : font,
          color: rgb(0.2, 0.2, 0.2),
        });
      });

      // Footer
      page.drawText("Abraham of London · Strategic Editorials", {
        x: 72, y: 72,
        size: 9,
        font: fontItalic,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.drawText("This document will be replaced with the full version on next generation cycle", {
        x: w - 400, y: 72,
        size: 8,
        font: font,
        color: rgb(0.6, 0.6, 0.6),
      });

      const pdfBytes = await doc.save();
      await fsp.writeFile(outputPath, pdfBytes);
      
      const stats = await fsp.stat(outputPath);
      Logger.success(`Premium fallback generated: ${path.basename(outputPath)} (${Math.round(stats.size / 1024)}KB)`);
      
      return true;
    } catch (error: any) {
      Logger.error(`Premium fallback failed: ${error.message}`);
      return false;
    }
  }
}

// ----------------------------------------------------------------------------
// ENHANCED COMMAND RUNNER
// ----------------------------------------------------------------------------
class CommandRunner {
  private isWindows = os.platform() === "win32";
  private npxCmd = this.isWindows ? "npx.cmd" : "npx";

  async delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async runWithRetry(
    name: string,
    script: string,
    args: string[] = [],
    options: { timeout?: number; cwd?: string; tier?: Tier; quality?: Quality; format?: Format } = {}
  ) {
    let lastError: any;

    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
      try {
        if (attempt > 1) {
          Logger.warn(`Retry ${attempt}/${CONFIG.retries}: ${name}`);
          await this.delay(CONFIG.retryDelay * attempt);
        }
        return await this.runCommand(name, script, args, options);
      } catch (e: any) {
        lastError = e;
        const msg = (e?.message || String(e)).toLowerCase();
        Logger.warn(`${name} failed: ${e?.message || String(e)}`);
        
        // If it's a missing script or dependency, don't retry
        if (msg.includes("enoent") || msg.includes("not found")) {
          throw e;
        }
        
        // On final attempt, try fallback
        if (attempt === CONFIG.retries && options.tier && options.quality && options.format) {
          Logger.info("Attempting premium fallback generation...");
          const fallbackPath = path.join(
            CONFIG.outputDir,
            `legacy-architecture-canvas-${options.format.toLowerCase()}-${options.quality}-${TIER_SLUG[options.tier]}.pdf`
          );
          
          const fallbackSuccess = await PremiumFallbackGenerator.generateLegacyCanvasFallback(
            options.format,
            options.quality,
            options.tier,
            fallbackPath
          );
          
          if (fallbackSuccess) {
            return { code: 0, duration: 0, fallback: true };
          }
        }
      }
    }

    throw new Error(
      `Failed after ${CONFIG.retries} attempts: ${lastError?.message || String(lastError)}`
    );
  }

  async runCommand(
    name: string,
    script: string,
    args: string[] = [],
    options: { timeout?: number; cwd?: string } = {}
  ) {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    const start = Date.now();

    let command = script;
    let commandArgs = args;

    const lower = script.toLowerCase();
    if (lower.endsWith(".ts") || lower.endsWith(".tsx")) {
      command = this.npxCmd;
      commandArgs = ["tsx", script, ...args];
    } else if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) {
      command = "node";
      commandArgs = [script, ...args];
    }

    Logger.start(`Starting: ${name}`);
    Logger.debug(`Command: ${command} ${commandArgs.join(" ")}`);

    return new Promise<{ code: number; duration: number; fallback?: boolean }>((resolve, reject) => {
      const child = spawn(command, commandArgs, {
        stdio: "inherit",
        shell: true,
        cwd,
        env: {
          ...process.env,
          NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
          PDF_QUALITY: CONFIG.quality,
          PDF_TIER: CONFIG.tier,
          PDF_CLEANUP: "true",
          FORCE_COLOR: "1",
        },
      });

      const timer =
        timeout && timeout > 0
          ? setTimeout(() => {
              if (child.exitCode === null) {
                try { child.kill("SIGTERM"); } catch {}
                reject(new Error(`Timeout after ${timeout}ms`));
              }
            }, timeout)
          : null;

      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        const duration = Date.now() - start;
        if (code === 0) {
          Logger.success(`Completed: ${name} (${duration}ms)`);
          resolve({ code: 0, duration });
        } else {
          Logger.error(`Failed: ${name} (${duration}ms)`);
          reject(Object.assign(new Error(`Exit code ${code}`), { code, duration }));
        }
      });

      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        Logger.error(`Error: ${name}: ${err.message}`);
        reject(err);
      });
    });
  }

  async checkDependencies() {
    const missing: string[] = [];

    // Check for pdf-lib instead of puppeteer (since we're using your pdf-lib version)
    try { await import("tsx"); } catch { missing.push("tsx"); }
    try { await import("pdf-lib"); } catch { missing.push("pdf-lib"); }

    if (!missing.length) {
      Logger.success("Dependencies OK (tsx, pdf-lib)");
      return;
    }

    Logger.warn(`Missing dependencies: ${missing.join(", ")}; attempting install...`);
    try {
      execSync(`npm install ${missing.join(" ")} --no-save`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      Logger.success("Dependencies installed");
    } catch (error: any) {
      Logger.error(`Failed to install dependencies: ${error?.message || String(error)}`);
      throw error;
    }
  }
}

// ----------------------------------------------------------------------------
// TOP-TIER PDF GENERATION ORCHESTRATOR
// ----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  private runner = new CommandRunner();
  private steps: Array<any> = [];
  private start = Date.now();
  private generatedFiles: string[] = [];

  private pushStep(row: any) {
    this.steps.push({ ...row, at: new Date().toISOString() });
  }

  async initialize() {
    Logger.header("PDF GENERATION SYSTEM");
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`Quality: ${CONFIG.quality}`);
    Logger.info(`Tier: ${TIER_DISPLAY[CONFIG.tier]} (${TIER_SLUG[CONFIG.tier]})`);
    Logger.info(`Output: ${CONFIG.outputDir}`);
    Logger.info(`Lib: ${CONFIG.libDir}`);
    Logger.separator();

    const cleanup = await FileManager.safeCleanup();
    await FileManager.ensureDir(CONFIG.outputDir);
    await FileManager.ensureDir(CONFIG.libDir);
    await this.runner.checkDependencies();

    Logger.success("Initialization complete");
    return cleanup;
  }

  private canvasScriptPath() {
    return path.join(CONFIG.scriptDir, "generate-legacy-canvas.ts");
  }

  private expectedCanvasFilename(format: Format) {
    const tierSlug = TIER_SLUG[CONFIG.tier];
    return `legacy-architecture-canvas-${format.toLowerCase()}-${CONFIG.quality}-${tierSlug}.pdf`;
  }

  async runStep(name: string, script: string, args: string[], timeout?: number) {
    const stepStart = Date.now();
    try {
      const r = await this.runner.runWithRetry(name, script, args, { 
        timeout,
        tier: CONFIG.tier,
        quality: CONFIG.quality,
        format: args[0] as Format
      });
      
      this.pushStep({ 
        name, 
        ok: true, 
        duration: r.duration,
        fallback: r.fallback || false
      });
      return r;
    } catch (e: any) {
      this.pushStep({
        name,
        ok: false,
        duration: Date.now() - stepStart,
        error: e?.message || String(e),
        fallback: false
      });
      throw e;
    }
  }

  async generateLegacyCanvas(formats: Format[]) {
    const script = this.canvasScriptPath();
    if (!(await FileManager.exists(script))) {
      throw new Error(`Missing script: ${script}`);
    }

    Logger.header("GENERATING LEGACY CANVAS");
    
    for (const f of formats) {
      await this.runStep(
        `Legacy Canvas (${f})`,
        script,
        [f, CONFIG.quality, CONFIG.tier],
        5 * 60 * 1000
      );

      const filename = this.expectedCanvasFilename(f);
      this.generatedFiles.push(filename);
    }
  }

  async runAdditionalGenerators() {
    Logger.header("ADDITIONAL PDF GENERATORS");
    
    const standaloneScript = path.join(CONFIG.scriptDir, "generate-standalone-pdf.tsx");
    if (await FileManager.exists(standaloneScript)) {
      await this.runStep(
        "Standalone Editorial PDF",
        standaloneScript,
        [CONFIG.quality, CONFIG.tier],
        7 * 60 * 1000
      );
      this.generatedFiles.push(`ultimate-purpose-of-man-${CONFIG.quality}.pdf`);
    }

    const frameworksScript = path.join(CONFIG.scriptDir, "generate-frameworks-pdf.tsx");
    if (await FileManager.exists(frameworksScript)) {
      await this.runStep(
        "Strategic Frameworks PDF",
        frameworksScript,
        [CONFIG.quality, CONFIG.tier],
        10 * 60 * 1000
      );
    }
  }

  async verifyCanvas(formats: Format[]) {
    const results: any[] = [];

    for (const f of formats) {
      const filename = this.expectedCanvasFilename(f);
      const downloadsPath = path.join(CONFIG.outputDir, filename);
      const libPath = path.join(CONFIG.libDir, filename);

      const locations = [
        { filePath: downloadsPath, location: "downloads" as const },
        { filePath: libPath, location: "lib" as const },
      ];

      for (const loc of locations) {
        if (await FileManager.exists(loc.filePath)) {
          const st = await fsp.stat(loc.filePath);
          
          // Enhanced validation
          let minSize: number;
          switch (CONFIG.quality) {
            case 'enterprise':
              minSize = 50000;
              break;
            case 'premium':
              minSize = 30000;
              break;
            default:
              minSize = 20000;
          }
          
          const valid = st.size >= minSize && st.size <= 5 * 1024 * 1024; // 5MB max

          results.push({
            format: f,
            filename,
            location: loc.location,
            exists: true,
            valid,
            size: st.size,
            sizeKB: +(st.size / 1024).toFixed(1),
            checksum: FileManager.checksum16(loc.filePath),
            mtime: st.mtime.toISOString(),
            tier: CONFIG.tier,
            quality: CONFIG.quality,
          });
        }
      }
    }

    return results;
  }

  async consolidateFiles() {
    Logger.start("Consolidating generated files...");

    const libFiles = (await fsp.readdir(CONFIG.libDir).catch(() => []))
      .filter((f) => f.endsWith(".pdf"));

    for (const file of libFiles) {
      const src = path.join(CONFIG.libDir, file);
      const dest = path.join(CONFIG.outputDir, file);
      if (!(await FileManager.exists(dest))) {
        await fsp.copyFile(src, dest);
        Logger.debug(`Copied: ${file} from lib to downloads`);
      }
    }

    const downloadFiles = (await fsp.readdir(CONFIG.outputDir).catch(() => []))
      .filter((f) => f.endsWith(".pdf"));

    for (const file of downloadFiles) {
      const src = path.join(CONFIG.outputDir, file);
      const dest = path.join(CONFIG.libDir, file);
      if (!(await FileManager.exists(dest))) {
        await fsp.copyFile(src, dest);
        Logger.debug(`Backfilled: ${file} from downloads to lib`);
      }
    }
  }

  async generateReport(formats: Format[]) {
    const total = Date.now() - this.start;
    const ok = this.steps.filter((s) => s.ok).length;
    const fail = this.steps.filter((s) => !s.ok).length;
    const fallbacks = this.steps.filter((s) => s.fallback).length;

    const pdfs = await this.verifyCanvas(formats);
    const validPdfs = pdfs.filter((p) => p.valid).length;
    const validation = await FileManager.validateFiles();

    const payload = {
      summary: {
        ok,
        fail,
        fallbacks,
        totalMs: total,
        quality: CONFIG.quality,
        tier: CONFIG.tier,
        tierDisplay: TIER_DISPLAY[CONFIG.tier],
        formats,
        platform: os.platform(),
        node: process.version,
        when: new Date().toISOString(),
        generatedFiles: this.generatedFiles,
      },
      steps: this.steps,
      pdfs,
      validation,
      outputDir: CONFIG.outputDir,
      libDir: CONFIG.libDir,
    };

    const reportPath = path.join(CONFIG.outputDir, "pdf-generation-report.json");
    await fsp.writeFile(reportPath, JSON.stringify(payload, null, 2), "utf8");

    const manifest = {
      generatedAt: new Date().toISOString(),
      files: pdfs.map((p) => ({
        name: p.filename,
        sizeKB: p.sizeKB,
        location: p.location,
        format: p.format,
        valid: p.valid,
        tier: p.tier,
        quality: p.quality,
      })),
    };

    const manifestPath = path.join(CONFIG.outputDir, "manifest.json");
    await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    Logger.file(`Report saved: ${reportPath}`);
    Logger.file(`Manifest saved: ${manifestPath}`);
    Logger.info(`PDFs valid: ${validPdfs}/${pdfs.length}`);
    Logger.info(`Total PDFs in downloads: ${validation.total}`);
    
    if (fallbacks > 0) {
      Logger.warn(`${fallbacks} files generated using premium fallback system`);
    }

    return { payload, pdfs, validPdfs, validation, fallbacks };
  }

  async run(formats: Format[]) {
    const cleanup = await this.initialize();
    await this.generateLegacyCanvas(formats);
    await this.runAdditionalGenerators();
    await this.consolidateFiles();
    const report = await this.generateReport(formats);

    // Summary
    Logger.header("GENERATION COMPLETE");
    Logger.success(`Successfully processed ${report.validPdfs} PDFs`);
    if (report.fallbacks > 0) {
      Logger.warn(`${report.fallbacks} files used fallback generation`);
    }
    if (report.validation.issues.length > 0) {
      Logger.warn(`${report.validation.issues.length} validation issues detected`);
    }
    
    Logger.time(`Total duration: ${Math.round(report.payload.summary.totalMs / 1000)}s`);
    Logger.separator();

    return { 
      success: report.validPdfs === report.pdfs.length,
      ...report,
      cleanup 
    };
  }
}

// ----------------------------------------------------------------------------
// ARG PARSERS
// ----------------------------------------------------------------------------
function parseFormats(arg?: string): Format[] {
  const v = (arg || "all").toLowerCase().trim();
  if (v === "all") return ["A4", "Letter", "A3"];
  const single = FORMAT_ALIASES[v];
  if (!single) return ["A4", "Letter", "A3"];
  return [single];
}

function parseTier(v?: string): Tier {
  const s = (v || CONFIG.tier).toLowerCase();
  if (s === "public") return "public";
  if (s === "basic") return "basic";
  if (s === "premium") return "premium";
  if (s === "enterprise") return "enterprise";
  if (s === "restricted") return "restricted";
  return CONFIG.tier;
}

function parseQuality(v?: string): Quality {
  const s = (v || CONFIG.quality).toLowerCase();
  return s === "enterprise" ? "enterprise" : "premium";
}

// ----------------------------------------------------------------------------
// CLI ENTRY
// ----------------------------------------------------------------------------
async function cliMain() {
  const args = process.argv.slice(2);

  let formatsArg = "all";
  let qualityArg: string | undefined;
  let tierArg: string | undefined;
  let forceClean = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];

    if (a === "--formats" || a.startsWith("--formats=")) {
      formatsArg = a.includes("=") ? a.split("=")[1] : (args[++i] || "all");
      continue;
    }
    if (a === "--quality" || a.startsWith("--quality=")) {
      qualityArg = a.includes("=") ? a.split("=")[1] : args[++i];
      continue;
    }
    if (a === "--tier" || a.startsWith("--tier=")) {
      tierArg = a.includes("=") ? a.split("=")[1] : args[++i];
      continue;
    }
    if (a === "--verbose" || a === "-v") {
      (CONFIG as any).logLevel = "debug";
      continue;
    }
    if (a === "--silent" || a === "-s") {
      (CONFIG as any).logLevel = "error";
      continue;
    }
    if (a === "--force-clean" || a === "-f") {
      forceClean = true;
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.log(`
${Logger.colors.brightMagenta}╔══════════════════════════════════════════════════════════════╗
║               TOP-TIER PDF GENERATION SYSTEM               ║
╚══════════════════════════════════════════════════════════════╝${Logger.colors.reset}

${Logger.colors.brightCyan}Usage:${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts [options]

${Logger.colors.brightCyan}Options:${Logger.colors.reset}
  --formats <all|a4|letter|a3>    Paper formats to generate
  --quality <premium|enterprise>  Output quality level
  --tier <public|basic|premium|enterprise|restricted>  Access tier
  --force-clean, -f               Force clean all outputs (careful!)
  --verbose, -v                   Detailed debug output
  --silent, -s                    Minimal error-only output
  --help, -h                      Show this help

${Logger.colors.brightCyan}Examples:${Logger.colors.reset}
  ${Logger.colors.gray}# Generate all tiers with default settings${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts
  
  ${Logger.colors.gray}# Generate enterprise quality for enterprise tier${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts --quality enterprise --tier enterprise
  
  ${Logger.colors.gray}# Generate only A4 for public tier${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts --formats a4 --tier public
  
  ${Logger.colors.gray}# Force clean and regenerate everything${Logger.colors.reset}
  pnpm tsx scripts/generate-pdfs.ts --force-clean

${Logger.colors.brightCyan}Environment Variables:${Logger.colors.reset}
  LOG_LEVEL=debug|info|warn|error|silent
  PDF_QUALITY=premium|enterprise
  PDF_TIER=public|basic|premium|enterprise|restricted
`);
      process.exit(0);
    }
  }

  (CONFIG as any).quality = parseQuality(qualityArg);
  (CONFIG as any).tier = parseTier(tierArg);

  if (forceClean) {
    Logger.warn("FORCE CLEAN ENABLED - This will delete ALL PDF files!");
    for (const dir of [CONFIG.outputDir, CONFIG.libDir]) {
      if (await FileManager.exists(dir)) {
        const files = await fsp.readdir(dir).catch(() => []);
        for (const file of files) {
          if (file.endsWith(".pdf") || file.endsWith(".json")) {
            await fsp.unlink(path.join(dir, file)).catch(() => {});
          }
        }
      }
    }
    Logger.success("Force cleaned all PDF + JSON outputs");
  }

  const formats = parseFormats(formatsArg);
  const orch = new PDFGenerationOrchestrator();

  try {
    const result = await orch.run(formats);

    if (result.success) {
      Logger.success(`${Logger.colors.brightGreen}🎉 PDF generation completed successfully!${Logger.colors.reset}`);
    } else {
      Logger.warn(`Completed with ${result.pdfs.length - result.validPdfs} invalid files`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (e: any) {
    Logger.error(`Fatal error: ${e?.message || String(e)}`);
    process.exit(1);
  }
}

// ESM-safe: run only when invoked directly
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(__filename);
  return argv1 === here;
})();

if (invokedAsScript) {
  cliMain();
}

export { PDFGenerationOrchestrator, CommandRunner, Logger, FileManager, PremiumFallbackGenerator };