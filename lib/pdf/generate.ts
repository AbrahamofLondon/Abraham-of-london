// scripts/pdf/generate-pdf-batch.ts
import { spawn, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

/* -----------------------------------------------------------------------------
   TYPES
----------------------------------------------------------------------------- */

export type PDFQuality = "draft" | "standard" | "premium" | "enterprise";
export type LogLevel = "silent" | "error" | "warn" | "info" | "debug";

export interface PDFGenerationConfig {
  timeoutMs?: number; // per task
  retries?: number;
  retryDelayMs?: number;

  quality?: PDFQuality;

  outputDir?: string;
  enterpriseOutputDir?: string;

  logLevel?: LogLevel;

  /**
   * When true, skips Ghostscript even if installed.
   * Useful for CI where GS isn't present.
   */
  disableOptimization?: boolean;
}

export interface GenerationResult {
  name: string;
  success: boolean;
  durationMs: number;
  error?: string;
  timestampISO: string;
}

export interface PDFFile {
  source: string;
  target: string;
}

export interface OptimizationResult {
  success: boolean;
  optimized: boolean;
  originalSize: number;
  newSize: number;
  qualityGainPct?: number;
  method: "ghostscript" | "skipped" | "original_better" | "error";
}

/* -----------------------------------------------------------------------------
   DEFAULT CONFIG (SSOT)
----------------------------------------------------------------------------- */

export const DEFAULT_CONFIG: Required<PDFGenerationConfig> = {
  timeoutMs: 10 * 60 * 1000,
  retries: 3,
  retryDelayMs: 2000,
  quality: "premium",
  outputDir: path.join(process.cwd(), "public/assets/downloads"),
  enterpriseOutputDir: path.join(process.cwd(), "public/assets/downloads/enterprise"),
  logLevel: "info",
  disableOptimization: false,
};

/* -----------------------------------------------------------------------------
   LOGGER
----------------------------------------------------------------------------- */

const LEVELS: readonly LogLevel[] = ["silent", "error", "warn", "info", "debug"];

class Logger {
  private cfg: Required<PDFGenerationConfig>;

  constructor(cfg: Required<PDFGenerationConfig>) {
    this.cfg = cfg;
  }

  private shouldLog(level: LogLevel): boolean {
    const current = LEVELS.indexOf(this.cfg.logLevel);
    const target = LEVELS.indexOf(level);
    return target <= current && current !== 0;
  }

  private ts(): string {
    const d = new Date();
    // HH:mm:ss
    const t = d.toISOString().split("T")[1];
    return t ? t.split(".")[0] ?? "00:00:00" : "00:00:00";
  }

  private out(level: LogLevel, msg: string): void {
    if (!this.shouldLog(level)) return;

    const prefix = `[${this.ts()}] ${level.toUpperCase().padEnd(5)}`;

    if (level === "error") console.error(prefix, msg);
    else if (level === "warn") console.warn(prefix, msg);
    else console.log(prefix, msg);
  }

  info(m: string) { this.out("info", m); }
  warn(m: string) { this.out("warn", m); }
  error(m: string) { this.out("error", m); }
  debug(m: string) { this.out("debug", m); }

  start(name: string) { this.out("info", `▶️  ${name}`); }
  done(name: string, ms: number) { this.out("info", `✅ ${name} (${ms}ms)`); }
}

/* -----------------------------------------------------------------------------
   HELPERS
----------------------------------------------------------------------------- */

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function listPdfFiles(dir: string): PDFFile[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => ({ source: path.join(dir, f), target: path.join(dir, f) }));
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"] as const;
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* -----------------------------------------------------------------------------
   COMMAND RUNNER (NO SHELL INJECTION)
----------------------------------------------------------------------------- */

export class CommandRunner {
  private cfg: Required<PDFGenerationConfig>;
  private log: Logger;

  constructor(cfg: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.log = new Logger(this.cfg);
  }

  /**
   * Runs a script:
   * - .ts/.tsx => npx tsx <script>
   * - .js      => node <script>
   * - otherwise treated as a binary path
   *
   * This uses execFile/spawn with args array — no `shell: true`.
   */
  run(name: string, scriptPath: string, args: string[] = [], opts?: { cwd?: string; timeoutMs?: number }): Promise<{ code: 0; durationMs: number }> {
    const cwd = opts?.cwd ?? process.cwd();
    const timeoutMs = opts?.timeoutMs ?? this.cfg.timeoutMs;

    const isWin = os.platform() === "win32";
    const npx = isWin ? "npx.cmd" : "npx";

    const ext = path.extname(scriptPath).toLowerCase();
    let cmd = scriptPath;
    let cmdArgs: string[] = [...args];

    if (ext === ".ts" || ext === ".tsx") {
      cmd = npx;
      cmdArgs = ["tsx", scriptPath, ...args];
    } else if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
      cmd = "node";
      cmdArgs = [scriptPath, ...args];
    }

    this.log.start(name);

    const start = Date.now();

    return new Promise((resolve, reject) => {
      const child = spawn(cmd, cmdArgs, {
        cwd,
        stdio: "inherit",
        env: {
          ...process.env,
          PDF_QUALITY: this.cfg.quality,
        },
      });

      const killTimer =
        timeoutMs > 0
          ? setTimeout(() => {
              try {
                child.kill("SIGKILL");
              } catch {
                // ignore
              }
            }, timeoutMs)
          : null;

      child.on("error", (err) => {
        if (killTimer) clearTimeout(killTimer);
        reject(err);
      });

      child.on("close", (code) => {
        if (killTimer) clearTimeout(killTimer);
        const durationMs = Date.now() - start;

        if (code === 0) {
          this.log.done(name, durationMs);
          resolve({ code: 0, durationMs });
        } else {
          const msg = `Process failed: ${name} (exit ${code ?? "null"})`;
          this.log.error(msg);
          reject(new Error(msg));
        }
      });
    });
  }

  async runWithRetry(name: string, scriptPath: string, args: string[] = [], opts?: { cwd?: string; timeoutMs?: number }): Promise<{ durationMs: number }> {
    let lastErr: unknown = null;

    for (let attempt = 1; attempt <= this.cfg.retries; attempt++) {
      try {
        if (attempt > 1) {
          this.log.warn(`Retry ${attempt}/${this.cfg.retries}: ${name}`);
          await sleep(this.cfg.retryDelayMs * attempt);
        }
        const res = await this.run(name, scriptPath, args, opts);
        return { durationMs: res.durationMs };
      } catch (e) {
        lastErr = e;
        // if missing binary/script, don't retry meaninglessly
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("ENOENT")) throw e;
      }
    }

    const msg = lastErr instanceof Error ? lastErr.message : String(lastErr);
    throw new Error(`Failed after ${this.cfg.retries} attempts: ${name} :: ${msg}`);
  }

  /**
   * Hard dependency check: does `tsx` resolve?
   * We do NOT auto-install in production scripts; that’s how projects rot.
   */
  checkDependencies(): void {
    this.log.info("Verifying build tooling...");
    try {
      execFileSync(process.platform === "win32" ? "npx.cmd" : "npx", ["tsx", "--version"], {
        stdio: "ignore",
      });
      this.log.info("✓ tsx available");
    } catch {
      throw new Error("Missing dependency: tsx. Install it (dev dependency) and re-run.");
    }
  }
}

/* -----------------------------------------------------------------------------
   PDF OPTIMIZER (GHOSTSCRIPT)
----------------------------------------------------------------------------- */

export class PDFQualityOptimizer {
  private cfg: Required<PDFGenerationConfig>;
  private log: Logger;
  private gsCmd: string | null;

  constructor(cfg: PDFGenerationConfig = DEFAULT_CONFIG) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.log = new Logger(this.cfg);
    this.gsCmd = this.cfg.disableOptimization ? null : this.detectGhostscript();
  }

  private detectGhostscript(): string | null {
    const isWin = os.platform() === "win32";
    const candidates = isWin ? ["gswin64c", "gswin32c"] : ["gs"];

    for (const c of candidates) {
      try {
        execFileSync(c, ["--version"], { stdio: "ignore" });
        this.log.info(`✓ Ghostscript detected: ${c}`);
        return c;
      } catch {
        // continue
      }
    }

    this.log.warn("Ghostscript not found. Optimization will be skipped.");
    return null;
  }

  async optimizePDF(source: string, target: string): Promise<OptimizationResult> {
    const originalSize = fs.statSync(source).size;

    // Skip tiny files or missing GS
    if (!this.gsCmd || originalSize < 100 * 1024) {
      return { success: true, optimized: false, originalSize, newSize: originalSize, method: "skipped" };
    }

    const tmp = `${target}.tmp`;

    const qualityMap: Record<PDFQuality, string> = {
      draft: "/screen",
      standard: "/ebook",
      premium: "/printer",
      enterprise: "/prepress",
    };

    const pdfSettings = qualityMap[this.cfg.quality];

    try {
      // IMPORTANT: args array, no shell.
      const args = [
        "-q",
        "-dNOPAUSE",
        "-dBATCH",
        "-dSAFER",
        "-sDEVICE=pdfwrite",
        `-dPDFSETTINGS=${pdfSettings}`,
        `-sOutputFile=${tmp}`,
        source,
      ];

      execFileSync(this.gsCmd, args, { stdio: "ignore" });

      const newSize = fs.statSync(tmp).size;

      if (newSize > 0 && newSize < originalSize) {
        fs.renameSync(tmp, target);
        const gain = ((originalSize - newSize) / originalSize) * 100;
        return { success: true, optimized: true, originalSize, newSize, qualityGainPct: gain, method: "ghostscript" };
      }

      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      return { success: true, optimized: false, originalSize, newSize: originalSize, method: "original_better" };
    } catch {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      return { success: false, optimized: false, originalSize, newSize: originalSize, method: "error" };
    }
  }

  async optimizeBatch(files: PDFFile[]): Promise<{ optimized: number; savedBytes: number }> {
    if (!files.length) return { optimized: 0, savedBytes: 0 };

    this.log.info(`Optimizing ${files.length} PDFs...`);

    let optimized = 0;
    let savedBytes = 0;

    for (const f of files) {
      const res = await this.optimizePDF(f.source, f.target);
      if (res.optimized) {
        optimized++;
        savedBytes += res.originalSize - res.newSize;
        this.log.debug(`Optimized: ${path.basename(f.target)} (-${formatBytes(res.originalSize - res.newSize)})`);
      }
    }

    this.log.info(`Optimization complete: ${optimized}/${files.length} optimized, saved ${formatBytes(savedBytes)}`);
    return { optimized, savedBytes };
  }
}

/* -----------------------------------------------------------------------------
   MAIN: BATCH GENERATION
----------------------------------------------------------------------------- */

export type BatchTask = {
  name: string;
  script: string; // relative to repo root OR absolute
  args?: string[];
};

function resolveScript(p: string): string {
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  return abs;
}

function fileExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

export async function generatePDFBatch(cfg: PDFGenerationConfig = DEFAULT_CONFIG) {
  const config: Required<PDFGenerationConfig> = { ...DEFAULT_CONFIG, ...cfg };
  const log = new Logger(config);

  const start = Date.now();
  const runner = new CommandRunner(config);
  const optimizer = new PDFQualityOptimizer(config);

  ensureDir(config.outputDir);
  ensureDir(config.enterpriseOutputDir);

  runner.checkDependencies();

  // Expand this task list as needed.
  const tasks: BatchTask[] = [
    { name: "Legacy Canvas (A4)", script: "scripts/generate-legacy-canvas.ts", args: ["A4"] },
    { name: "Legacy Canvas (Letter)", script: "scripts/generate-legacy-canvas.ts", args: ["Letter"] },
    { name: "Legacy Canvas (A3)", script: "scripts/generate-legacy-canvas.ts", args: ["A3"] },
  ];

  const results: GenerationResult[] = [];

  for (const t of tasks) {
    const scriptPath = resolveScript(t.script);

    if (!fileExists(scriptPath)) {
      log.warn(`Skipping missing script: ${t.script}`);
      results.push({
        name: t.name,
        success: false,
        durationMs: 0,
        error: `Missing script: ${t.script}`,
        timestampISO: new Date().toISOString(),
      });
      continue;
    }

    try {
      const res = await runner.runWithRetry(t.name, scriptPath, t.args ?? []);
      results.push({
        name: t.name,
        success: true,
        durationMs: res.durationMs,
        timestampISO: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        name: t.name,
        success: false,
        durationMs: 0,
        error: msg,
        timestampISO: new Date().toISOString(),
      });
    }
  }

  // Optimize outputDir PDFs (you can also include enterprise dir)
  const pdfs = listPdfFiles(config.outputDir);
  await optimizer.optimizeBatch(pdfs);

  const totalMs = Date.now() - start;

  return {
    success: results.every((r) => r.success),
    results,
    summary: {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      totalDurationMs: totalMs,
    },
  };
}

export async function verifyGeneratedPDFs(cfg: PDFGenerationConfig = DEFAULT_CONFIG) {
  const config: Required<PDFGenerationConfig> = { ...DEFAULT_CONFIG, ...cfg };
  const dir = config.outputDir;

  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .map((f) => {
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      return {
        filename: f,
        exists: true,
        sizeKB: Number((st.size / 1024).toFixed(1)),
        isValid: st.size > 5000,
        path: full,
      };
    });
}