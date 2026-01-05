// scripts/generate-pdfs.ts
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import crypto from "crypto";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------------------------------------------------
// TYPES
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

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------
const CONFIG = {
  timeout: 10 * 60 * 1000,
  retries: 3,
  retryDelay: 1500,
  logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",
  outputDir: path.join(process.cwd(), "public/assets/downloads"),
  scriptDir: __dirname,
  quality: ((process.env.PDF_QUALITY as Quality) || "premium") as Quality,
  tier: ((process.env.PDF_TIER as Tier) || "premium") as Tier,
  maxConcurrent: 1,
};

// ----------------------------------------------------------------------------
// LOGGER (QUIET, PROFESSIONAL)
// ----------------------------------------------------------------------------
class Logger {
  static colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
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

  static info(m: string) { Logger.out("info", m, Logger.colors.cyan); }
  static warn(m: string) { Logger.out("warn", m, Logger.colors.yellow); }
  static error(m: string) { Logger.out("error", m, Logger.colors.red); }
  static debug(m: string) { Logger.out("debug", m, Logger.colors.gray); }
}

// ----------------------------------------------------------------------------
// COMMAND RUNNER (ESM + WINDOWS SAFE)
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
          Logger.warn(`retry ${attempt}/${CONFIG.retries}: ${name}`);
          await this.delay(CONFIG.retryDelay * attempt);
        }
        return await this.runCommand(name, script, args, options);
      } catch (e: any) {
        lastError = e;
        const msg = (e?.message || String(e)).toLowerCase();
        Logger.warn(`${name} failed: ${e?.message || String(e)}`);
        if (msg.includes("enoent") || msg.includes("not found")) throw e; // hard fail
      }
    }

    throw new Error(`failed after ${CONFIG.retries} attempts: ${lastError?.message || String(lastError)}`);
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

    Logger.info(`start: ${name}`);
    Logger.debug(`cmd: ${command} ${commandArgs.join(" ")}`);

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
        },
      });

      const timer =
        timeout && timeout > 0
          ? setTimeout(() => {
              if (child.exitCode === null) {
                try { child.kill("SIGTERM"); } catch {}
                reject(new Error(`timeout after ${timeout}ms`));
              }
            }, timeout)
          : null;

      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        const duration = Date.now() - start;
        if (code === 0) {
          Logger.info(`done:  ${name} (${duration}ms)`);
          resolve({ code: 0, duration });
        } else {
          Logger.error(`fail:  ${name} (${duration}ms)`);
          reject(Object.assign(new Error(`exit code ${code}`), { code, duration }));
        }
      });

      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        Logger.error(`error: ${name}: ${err.message}`);
        reject(err);
      });
    });
  }

  checkDependencies() {
    // Keep it simple: we only need tsx.
    const required = ["tsx"];
    const missing: string[] = [];
    for (const pkg of required) {
      try {
        require.resolve(pkg);
      } catch {
        missing.push(pkg);
      }
    }
    if (missing.length) {
      Logger.warn(`missing deps: ${missing.join(", ")}; attempting install (no-save)`);
      execSync(`npm install ${missing.join(" ")} --no-save`, { stdio: "inherit", cwd: process.cwd() });
    }
  }
}

// ----------------------------------------------------------------------------
// ORCHESTRATOR
// ----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  private runner = new CommandRunner();
  private steps: Array<any> = [];
  private start = Date.now();

  private pushStep(row: any) {
    this.steps.push({ ...row, at: new Date().toISOString() });
  }

  async initialize() {
    ensureDir(CONFIG.outputDir);

    Logger.info(`pdf generation`);
    Logger.info(`platform=${os.platform()} arch=${os.arch()} node=${process.version}`);
    Logger.info(`cwd=${process.cwd()}`);
    Logger.info(`quality=${CONFIG.quality} tier=${CONFIG.tier}`);
    Logger.info(`out=${CONFIG.outputDir}`);

    this.runner.checkDependencies();
  }

  private canvasScriptPath() {
    return path.join(CONFIG.scriptDir, "generate-legacy-canvas.ts");
  }

  private expectedCanvasFilename(format: Format) {
    // matches the upgraded generator naming convention:
    // legacy-architecture-canvas-${format}-${quality}-${tierSlug}.pdf
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
      this.pushStep({ name, ok: false, duration: Date.now() - stepStart, error: e?.message || String(e) });
      throw e;
    }
  }

  async generateLegacyCanvas(formats: Format[]) {
    const script = this.canvasScriptPath();
    if (!fs.existsSync(script)) {
      throw new Error(`missing script: ${script}`);
    }

    // We run format-by-format so failures are isolated and logs are clean.
    for (const f of formats) {
      await this.runStep(
        `legacy-canvas:${f}`,
        script,
        [f, CONFIG.quality, CONFIG.tier],
        5 * 60 * 1000
      );
    }
  }

  verifyCanvas(formats: Format[]) {
    const results: any[] = [];
    for (const f of formats) {
      const filename = this.expectedCanvasFilename(f);
      const fp = path.join(CONFIG.outputDir, filename);
      if (!fs.existsSync(fp)) {
        results.push({ format: f, filename, exists: false, valid: false, size: 0, checksum: null });
        continue;
      }
      const st = fs.statSync(fp);
      const valid = st.size > 10_000; // raise the bar: these should not be tiny
      results.push({
        format: f,
        filename,
        exists: true,
        valid,
        size: st.size,
        sizeKB: +(st.size / 1024).toFixed(1),
        checksum: checksum16(fp),
      });
    }
    return results;
  }

  async report(formats: Format[]) {
    const total = Date.now() - this.start;
    const ok = this.steps.filter((s) => s.ok).length;
    const fail = this.steps.filter((s) => !s.ok).length;

    const pdfs = this.verifyCanvas(formats);
    const validPdfs = pdfs.filter((p) => p.valid).length;

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
      },
      steps: this.steps,
      pdfs,
      outputDir: CONFIG.outputDir,
    };

    const reportPath = path.join(CONFIG.outputDir, "pdf-generation-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2), "utf8");

    Logger.info(`report=${reportPath}`);
    Logger.info(`pdfs valid=${validPdfs}/${pdfs.length}`);

    return { payload, pdfs, validPdfs };
  }

  async run(formats: Format[]) {
    await this.initialize();
    await this.generateLegacyCanvas(formats);
    return await this.report(formats);
  }
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function checksum16(filePath: string) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

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
// CLI
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
      CONFIG.logLevel = "debug";
      continue;
    }
    if (a === "--silent" || a === "-s") {
      CONFIG.logLevel = "error";
      continue;
    }
    if (a === "--help" || a === "-h") {
      console.log(`
Usage:
  pnpm tsx scripts/generate-pdfs.ts [options]

Options:
  --formats <all|a4|letter|a3>          default: all
  --quality <premium|enterprise>       default: premium
  --tier <public|basic|premium|enterprise|restricted> default: premium
  --verbose, -v
  --silent, -s

Examples:
  pnpm tsx scripts/generate-pdfs.ts
  pnpm tsx scripts/generate-pdfs.ts --quality enterprise --tier enterprise
  pnpm tsx scripts/generate-pdfs.ts --formats a4 --tier public
`);
      process.exit(0);
    }
  }

  CONFIG.quality = parseQuality(qualityArg);
  CONFIG.tier = parseTier(tierArg);

  const formats = parseFormats(formatsArg);
  const orch = new PDFGenerationOrchestrator();

  try {
    const result = await orch.run(formats);
    const ok = result.validPdfs === result.pdfs.length;
    process.exit(ok ? 0 : 1);
  } catch (e: any) {
    Logger.error(e?.message || String(e));
    process.exit(1);
  }
}

// ESM-safe entry detection
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(__filename);
  return argv1 === here;
})();
if (invokedAsScript) {
  cliMain();
}

export { PDFGenerationOrchestrator, CommandRunner, Logger };