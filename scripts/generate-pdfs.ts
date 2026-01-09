// scripts/generate-pdfs.ts — Enhanced, ESM-safe, build-safe, real async FS
import { spawn, execSync } from "child_process";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";
import fs from "fs";

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

  // Files older than this are considered stale for cleanup
  maxOldFileAge: 5 * 60 * 1000, // 5 minutes
} as const;

// ----------------------------------------------------------------------------
// LOGGER
// ----------------------------------------------------------------------------
class Logger {
  static colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
    magenta: "\x1b[35m",
  };

  static shouldLog(level: LogLevel) {
    const levels: LogLevel[] = ["silent", "error", "warn", "info", "debug"];
    return levels.indexOf(level) <= levels.indexOf(CONFIG.logLevel);
  }

  static ts() {
    return new Date().toISOString().split("T")[1].split(".")[0];
  }

  static out(level: Exclude<LogLevel, "silent">, msg: string, color?: string) {
    if (!Logger.shouldLog(level)) return;
    const prefix = `[${Logger.ts()}] ${level.toUpperCase().padEnd(5)}`;
    const m = color ? `${color}${msg}${Logger.colors.reset}` : msg;
    if (level === "error") console.error(prefix, m);
    else if (level === "warn") console.warn(prefix, m);
    else console.log(prefix, m);
  }

  static success(m: string) { Logger.out("info", `✅ ${m}`, Logger.colors.green); }
  static info(m: string) { Logger.out("info", `ℹ️  ${m}`, Logger.colors.cyan); }
  static warn(m: string) { Logger.out("warn", `⚠️  ${m}`, Logger.colors.yellow); }
  static error(m: string) { Logger.out("error", `❌ ${m}`, Logger.colors.red); }
  static debug(m: string) { Logger.out("debug", `🔍 ${m}`, Logger.colors.gray); }
  static start(m: string) { Logger.out("info", `🚀 ${m}`, Logger.colors.magenta); }
}

// ----------------------------------------------------------------------------
// FS HELPERS
// ----------------------------------------------------------------------------
async function exists(p: string) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p: string) {
  if (!(await exists(p))) await fsp.mkdir(p, { recursive: true });
}

function checksum16(filePath: string) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------------
// FILE CLEANUP UTILITIES
// ----------------------------------------------------------------------------
class FileCleaner {
  static async cleanupOldFiles() {
    Logger.start("Cleaning up old PDF files...");

    const now = Date.now();
    let cleanedCount = 0;

    // Clean downloads directory
    if (await exists(CONFIG.outputDir)) {
      const files = await fsp.readdir(CONFIG.outputDir).catch(() => []);
      for (const file of files) {
        const filePath = path.join(CONFIG.outputDir, file);
        const stat = await fsp.stat(filePath).catch(() => null);
        if (!stat) continue;

        // Only touch PDFs + JSON reports
        const isTarget = file.endsWith(".pdf") || file.endsWith(".json");
        if (!isTarget) continue;

        if (now - stat.mtimeMs > CONFIG.maxOldFileAge) {
          await fsp.unlink(filePath).catch(() => {});
          cleanedCount++;
          Logger.debug(`Removed old file: ${file}`);
        }
      }
    }

    // Clean lib/pdfs directory
    if (await exists(CONFIG.libDir)) {
      const files = await fsp.readdir(CONFIG.libDir).catch(() => []);
      for (const file of files) {
        const filePath = path.join(CONFIG.libDir, file);
        const stat = await fsp.stat(filePath).catch(() => null);
        if (!stat) continue;

        const isTarget = file.endsWith(".pdf") || file.endsWith(".json");
        if (!isTarget) continue;

        if (now - stat.mtimeMs > CONFIG.maxOldFileAge) {
          await fsp.unlink(filePath).catch(() => {});
          cleanedCount++;
          Logger.debug(`Removed old file from lib: ${file}`);
        }
      }
    }

    Logger.success(`Cleaned ${cleanedCount} old files`);
    return cleanedCount;
  }

  static async ensureDirectories() {
    await ensureDir(CONFIG.outputDir);
    await ensureDir(CONFIG.libDir);
  }

  static async validateGeneratedFiles() {
    Logger.start("Validating generated files...");

    const issues: string[] = [];

    const downloadsFiles = await fsp.readdir(CONFIG.outputDir).catch(() => []);
    const pdfFiles = downloadsFiles.filter((f) => f.endsWith(".pdf"));

    const now = Date.now();

    for (const pdf of pdfFiles) {
      const filePath = path.join(CONFIG.outputDir, pdf);
      const stat = await fsp.stat(filePath).catch(() => null);

      if (!stat) {
        issues.push(`Cannot stat file: ${pdf}`);
        continue;
      }

      if (stat.size < 1024) {
        issues.push(`Suspiciously small file: ${pdf} (${stat.size} bytes)`);
      }

      if (now - stat.mtimeMs > CONFIG.maxOldFileAge) {
        issues.push(
          `Old file detected: ${pdf} (modified ${Math.round(
            (now - stat.mtimeMs) / 60000
          )} minutes ago)`
        );
      }
    }

    if (issues.length > 0) {
      Logger.warn(`Found ${issues.length} issues:`);
      issues.forEach((issue) => Logger.warn(`  ${issue}`));
    } else {
      Logger.success(`All ${pdfFiles.length} PDF files validated`);
    }

    return { totalPdfs: pdfFiles.length, issues, fileList: pdfFiles };
  }
}

// ----------------------------------------------------------------------------
// ENHANCED COMMAND RUNNER (TSX / NODE / CLI)
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
    options: { timeout?: number; cwd?: string } = {}
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
        if (msg.includes("enoent") || msg.includes("not found")) throw e;
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

    return new Promise<{ code: number; duration: number }>((resolve, reject) => {
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

  /**
   * Build-safe dependency checks:
   * - Uses STATIC literal imports (no webpack "expression" dependency)
   * - Works in ESM
   * - Falls back to npm install --no-save
   */
  async checkDependencies() {
    const missing: string[] = [];

    // STATIC LITERAL CHECKS (webpack-safe if ever analyzed)
    try { await import("tsx"); } catch { missing.push("tsx"); }
    try { await import("puppeteer"); } catch { missing.push("puppeteer"); }

    if (!missing.length) {
      Logger.success("Dependencies OK (tsx, puppeteer)");
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
      // Hard fail: generator cannot reliably run without these
      throw error;
    }
  }
}

// ----------------------------------------------------------------------------
// PDF GENERATION ORCHESTRATOR
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
    Logger.start("=== PDF Generation Initialization ===");
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`Quality: ${CONFIG.quality}`);
    Logger.info(`Tier: ${CONFIG.tier}`);
    Logger.info(`Output: ${CONFIG.outputDir}`);
    Logger.info(`Lib: ${CONFIG.libDir}`);

    await FileCleaner.cleanupOldFiles();
    await FileCleaner.ensureDirectories();
    await this.runner.checkDependencies();

    Logger.success("Initialization complete");
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
      const r = await this.runner.runWithRetry(name, script, args, { timeout });
      this.pushStep({ name, ok: true, duration: r.duration });
      return r;
    } catch (e: any) {
      this.pushStep({
        name,
        ok: false,
        duration: Date.now() - stepStart,
        error: e?.message || String(e),
      });
      throw e;
    }
  }

  async generateLegacyCanvas(formats: Format[]) {
    const script = this.canvasScriptPath();
    if (!(await exists(script))) throw new Error(`Missing script: ${script}`);

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
    const standaloneScript = path.join(CONFIG.scriptDir, "generate-standalone-pdf.tsx");
    if (await exists(standaloneScript)) {
      await this.runStep(
        "Standalone Editorial PDF",
        standaloneScript,
        [CONFIG.quality, CONFIG.tier],
        7 * 60 * 1000
      );
    }

    const frameworksScript = path.join(CONFIG.scriptDir, "generate-frameworks-pdf.tsx");
    if (await exists(frameworksScript)) {
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
        if (await exists(loc.filePath)) {
          const st = await fsp.stat(loc.filePath);
          const valid = st.size > 10_000;

          results.push({
            format: f,
            filename,
            location: loc.location,
            exists: true,
            valid,
            size: st.size,
            sizeKB: +(st.size / 1024).toFixed(1),
            checksum: checksum16(loc.filePath),
            mtime: st.mtime.toISOString(),
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
      if (!(await exists(dest))) {
        await fsp.copyFile(src, dest);
        Logger.info(`Copied: ${file} from lib to downloads`);
      }
    }

    const downloadFiles = (await fsp.readdir(CONFIG.outputDir).catch(() => []))
      .filter((f) => f.endsWith(".pdf"));

    for (const file of downloadFiles) {
      const src = path.join(CONFIG.outputDir, file);
      const dest = path.join(CONFIG.libDir, file);
      if (!(await exists(dest))) {
        await fsp.copyFile(src, dest);
        Logger.info(`Backfilled: ${file} from downloads to lib`);
      }
    }
  }

  async report(formats: Format[]) {
    const total = Date.now() - this.start;
    const ok = this.steps.filter((s) => s.ok).length;
    const fail = this.steps.filter((s) => !s.ok).length;

    const pdfs = await this.verifyCanvas(formats);
    const validPdfs = pdfs.filter((p) => p.valid).length;

    const validation = await FileCleaner.validateGeneratedFiles();

    const payload = {
      summary: {
        ok,
        fail,
        totalMs: total,
        quality: CONFIG.quality,
        tier: CONFIG.tier,
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
      })),
    };

    const manifestPath = path.join(CONFIG.outputDir, "manifest.json");
    await fsp.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

    Logger.success(`Report saved: ${reportPath}`);
    Logger.success(`Manifest saved: ${manifestPath}`);
    Logger.info(`PDFs valid: ${validPdfs}/${pdfs.length}`);
    Logger.info(`Total PDFs in downloads: ${validation.totalPdfs}`);

    return { payload, pdfs, validPdfs, validation };
  }

  async run(formats: Format[]) {
    await this.initialize();
    await this.generateLegacyCanvas(formats);
    await this.runAdditionalGenerators();
    await this.consolidateFiles();
    return await this.report(formats);
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
      for (const dir of [CONFIG.outputDir, CONFIG.libDir]) {
        if (await exists(dir)) {
          const files = await fsp.readdir(dir).catch(() => []);
          for (const file of files) {
            if (file.endsWith(".pdf") || file.endsWith(".json")) {
              await fsp.unlink(path.join(dir, file)).catch(() => {});
            }
          }
        }
      }
      Logger.success("Force cleaned all PDF + JSON outputs");
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.log(`
📚 Strategic PDF Generator
=========================

Usage:
  pnpm tsx scripts/generate-pdfs.ts [options]

Options:
  --formats <all|a4|letter|a3>
  --quality <premium|enterprise>
  --tier <public|basic|premium|enterprise|restricted>
  --force-clean, -f
  --verbose, -v
  --silent, -s

Examples:
  pnpm tsx scripts/generate-pdfs.ts
  pnpm tsx scripts/generate-pdfs.ts --quality enterprise --tier enterprise
  pnpm tsx scripts/generate-pdfs.ts --formats a4 --tier public
  pnpm tsx scripts/generate-pdfs.ts --force-clean

Env:
  LOG_LEVEL=debug|info|warn|error|silent
  PDF_QUALITY=premium|enterprise
  PDF_TIER=public|basic|premium|enterprise|restricted
`);
      process.exit(0);
    }
  }

  (CONFIG as any).quality = parseQuality(qualityArg);
  (CONFIG as any).tier = parseTier(tierArg);

  const formats = parseFormats(formatsArg);
  const orch = new PDFGenerationOrchestrator();

  try {
    const result = await orch.run(formats);

    // “validPdfs === pdfs.length” is strict; you can loosen if needed
    const ok = result.validPdfs === result.pdfs.length;

    if (ok) Logger.success("🎉 PDF generation completed successfully!");
    else Logger.warn(`Completed with invalid files: ${result.pdfs.length - result.validPdfs}`);

    process.exit(ok ? 0 : 1);
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

export { PDFGenerationOrchestrator, CommandRunner, Logger, FileCleaner };