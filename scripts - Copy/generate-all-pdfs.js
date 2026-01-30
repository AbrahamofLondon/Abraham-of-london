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

// -----------------------------------------------------------------------------
// CONFIGURATION & CONSTANTS
// -----------------------------------------------------------------------------
const CONFIG = {
  timeout: 10 * 60 * 1000, // 10 minutes timeout per command
  retries: 3,
  retryDelay: 2000,
  maxConcurrent: 1,
  logLevel: process.env.LOG_LEVEL || "info",
  outputDir: path.join(process.cwd(), "public/assets/downloads"),
  enterpriseOutputDir: path.join(process.cwd(), "public/assets/downloads/enterprise"),
  scriptDir: __dirname,
  quality: (process.env.PDF_QUALITY || "premium") as string, // default premium
};

// -----------------------------------------------------------------------------
// LOGGER UTILITY (ENHANCED)
// -----------------------------------------------------------------------------
class Logger {
  static colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
  };

  static shouldLog(level: "silent" | "error" | "warn" | "info" | "debug") {
    const levels = ["silent", "error", "warn", "info", "debug"] as const;
    const currentLevel = levels.indexOf(CONFIG.logLevel as any);
    const targetLevel = levels.indexOf(level as any);
    return targetLevel <= currentLevel;
  }

  static formatTime() {
    return new Date().toISOString().split("T")[1].split(".")[0];
  }

  static log(level: "error" | "warn" | "info" | "debug", message: string, color = "") {
    if (!this.shouldLog(level as any)) return;

    const prefix = `[${this.formatTime()}] ${level.toUpperCase().padEnd(5)}`;
    const formattedMessage = color ? `${color}${message}${this.colors.reset}` : message;

    switch (level) {
      case "error":
        console.error(prefix, formattedMessage);
        break;
      case "warn":
        console.warn(prefix, formattedMessage);
        break;
      default:
        console.log(prefix, formattedMessage);
    }
  }

  static info(message: string) {
    this.log("info", message, this.colors.cyan);
  }
  static success(message: string) {
    this.log("info", message, this.colors.green);
  }
  static warn(message: string) {
    this.log("warn", message, this.colors.yellow);
  }
  static error(message: string) {
    this.log("error", message, this.colors.red);
  }
  static debug(message: string) {
    this.log("debug", message, this.colors.gray);
  }
  static start(name: string) {
    this.log("info", `▶️  Starting: ${name}`, this.colors.blue);
  }
  static complete(name: string, duration?: number) {
    const timeStr = duration ? ` (${duration}ms)` : "";
    this.log("info", `✅ Completed: ${name}${timeStr}`, this.colors.green);
  }

  static premium(message: string) {
    const premiumMsg = `✨ PREMIUM: ${message}`;
    this.log("info", premiumMsg, this.colors.magenta);
  }
}

// -----------------------------------------------------------------------------
// COMMAND RUNNER (ESM-SAFE)
// -----------------------------------------------------------------------------
class CommandRunner {
  private isWindows: boolean;
  private npxCmd: string;

  constructor() {
    this.isWindows = os.platform() === "win32";
    this.npxCmd = this.isWindows ? "npx.cmd" : "npx";
  }

  async checkDependencies(): Promise<void> {
    Logger.info("Checking dependencies for premium PDF generation...");

    const requiredPackages = ["tsx"];
    const missing: string[] = [];

    for (const pkg of requiredPackages) {
      try {
        // Use dynamic import instead of require for ESM compatibility
        await import(pkg);
        Logger.debug(`✓ ${pkg} is available`);
      } catch {
        missing.push(pkg);
        Logger.warn(`✗ ${pkg} is missing`);
      }
    }

    if (missing.length > 0) {
      Logger.warn(`Missing packages: ${missing.join(", ")}`);
      Logger.info("Attempting to install missing packages...");

      try {
        execSync(`npm install ${missing.join(" ")} --no-save`, {
          stdio: "inherit",
          cwd: process.cwd(),
        });
        Logger.success("Missing packages installed successfully");
      } catch (error: any) {
        throw new Error(`Failed to install missing packages: ${error?.message || String(error)}`);
      }
    }

    Logger.success("All dependencies are satisfied");
  }

  async runCommand(
    name: string,
    script: string,
    args: string[] = [],
    options: { timeout?: number; cwd?: string } = {}
  ) {
    const { timeout = CONFIG.timeout, cwd = process.cwd() } = options;
    const startTime = Date.now();

    // Build the command
    let command: string;
    let commandArgs: string[];

    const lower = script.toLowerCase();

    if (lower.endsWith(".ts") || lower.endsWith(".tsx")) {
      command = this.npxCmd;
      commandArgs = ["tsx", script, ...args];
    } else if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) {
      command = "node";
      commandArgs = [script, ...args];
    } else {
      command = script;
      commandArgs = args;
    }

    Logger.start(name);
    Logger.debug(`Command: ${command} ${commandArgs.join(" ")}`);

    return new Promise<{ code: number; duration: number }>((resolve, reject) => {
      // IMPORTANT: do not shadow global "process"
      const child = spawn(command, commandArgs, {
        stdio: "inherit",
        shell: true, // Windows friendliness for npx.cmd + paths
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: "1",
          NODE_OPTIONS: process.env.NODE_OPTIONS || "--max-old-space-size=4096",
          PDF_QUALITY: CONFIG.quality,
        },
      });

      const killTimer =
        timeout && timeout > 0
          ? setTimeout(() => {
              if (child.exitCode === null) {
                try {
                  child.kill("SIGTERM");
                } catch {}
                reject(new Error(`Timeout after ${timeout}ms`));
              }
            }, timeout)
          : null;

      child.on("close", (code) => {
        if (killTimer) clearTimeout(killTimer);

        const duration = Date.now() - startTime;

        if (code === 0) {
          Logger.complete(name, duration);
          resolve({ code, duration });
        } else {
          Logger.error(`Failed: ${name} (${duration}ms)`);
          reject(Object.assign(new Error(`Process exited with code ${code}`), { code, duration }));
        }
      });

      child.on("error", (error) => {
        if (killTimer) clearTimeout(killTimer);
        const duration = Date.now() - startTime;
        Logger.error(`Process error for ${name}: ${error.message} (${duration}ms)`);
        reject(error);
      });
    });
  }

  async delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async checkDependencies() {
    Logger.info("Checking dependencies for premium PDF generation...");

    const requiredPackages = ["tsx"];
    const missing: string[] = [];

    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        Logger.debug(`✓ ${pkg} is available`);
      } catch {
        missing.push(pkg);
        Logger.warn(`✗ ${pkg} is missing`);
      }
    }

    if (missing.length > 0) {
      Logger.warn(`Missing packages: ${missing.join(", ")}`);
      Logger.info("Attempting to install missing packages...");

      try {
        execSync(`npm install ${missing.join(" ")} --no-save`, {
          stdio: "inherit",
          cwd: process.cwd(),
        });
        Logger.success("Missing packages installed successfully");
      } catch (error: any) {
        throw new Error(`Failed to install missing packages: ${error?.message || String(error)}`);
      }
    }

    Logger.success("All dependencies are satisfied");
  }
}

// -----------------------------------------------------------------------------
// PDF GENERATION ORCHESTRATOR
// -----------------------------------------------------------------------------
class PDFGenerationOrchestrator {
  private runner: CommandRunner;
  private results: Array<any>;
  private startTime: number;

  constructor() {
    this.runner = new CommandRunner();
    this.results = [];
    this.startTime = Date.now();
  }

  async initialize() {
    console.log("\n" + "=".repeat(60));
    Logger.premium("LEGACY ARCHITECTURE PDF GENERATOR");
    console.log("=".repeat(60));
    Logger.info(`Platform: ${os.platform()} ${os.arch()}`);
    Logger.info(`Node: ${process.version}`);
    Logger.info(`CWD: ${process.cwd()}`);
    Logger.info(`Quality: ${String(CONFIG.quality).toUpperCase()}`);
    Logger.info(`Output Dir: ${CONFIG.outputDir}`);
    console.log("=".repeat(60) + "\n");

    // Ensure output directories exist
    [CONFIG.outputDir, CONFIG.enterpriseOutputDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Logger.info(`Created directory: ${dir}`);
      }
    });

    await this.runner.checkDependencies();
  }

  async runStep(name: string, script: string, args: string[] = [], options: any = {}) {
    const stepStart = Date.now();

    try {
      const result = await this.runner.runWithRetry(name, script, args, options);
      this.results.push({
        name,
        success: true,
        duration: result.duration,
        timestamp: new Date().toISOString(),
      });
      return result;
    } catch (error: any) {
      this.results.push({
        name,
        success: false,
        error: error?.message || String(error),
        duration: Date.now() - stepStart,
        timestamp: new Date().toISOString(),
      });

      const msg = (error?.message || "").toLowerCase();
      const shouldContinue = !msg.includes("fatal") && !msg.includes("enoent");
      if (!shouldContinue) throw error;

      return null;
    }
  }

  async generatePremiumPDFs() {
    Logger.premium("Starting premium PDF generation...");

    const scripts = [
      {
        name: "Legacy Canvas (A4)",
        script: path.join(CONFIG.scriptDir, "generate-legacy-canvas.ts"),
        args: ["A4", CONFIG.quality],
      },
      {
        name: "Legacy Canvas (Letter)",
        script: path.join(CONFIG.scriptDir, "generate-legacy-canvas.ts"),
        args: ["Letter", CONFIG.quality],
      },
      {
        name: "Legacy Canvas (A3)",
        script: path.join(CONFIG.scriptDir, "generate-legacy-canvas.ts"),
        args: ["A3", CONFIG.quality],
      },
    ];

    for (const { name, script, args } of scripts) {
      if (fs.existsSync(script)) {
        await this.runStep(name, script, args, { timeout: 5 * 60 * 1000 });
      } else {
        Logger.warn(`Script not found: ${script}`);
        this.results.push({
          name,
          success: false,
          error: "Script not found",
          duration: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  async verifyGeneratedPDFs() {
    Logger.info("Verifying generated PDFs...");

    const expectedFiles = [
      `legacy-architecture-canvas-a4-${CONFIG.quality}.pdf`,
      `legacy-architecture-canvas-letter-${CONFIG.quality}.pdf`,
      `legacy-architecture-canvas-a3-${CONFIG.quality}.pdf`,
    ];

    const verificationResults: any[] = [];

    for (const filename of expectedFiles) {
      const filePath = path.join(CONFIG.outputDir, filename);

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const isValid = stats.size > 5000; // At least 5KB

        verificationResults.push({
          filename,
          exists: true,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(1),
          isValid,
          path: filePath,
          checksum: checksum16(filePath),
        });

        if (isValid) Logger.success(`✓ ${filename} - ${(stats.size / 1024).toFixed(1)} KB`);
        else Logger.warn(`⚠ ${filename} is too small (${stats.size} bytes)`);
      } else {
        verificationResults.push({
          filename,
          exists: false,
          size: 0,
          isValid: false,
          path: filePath,
          checksum: null,
        });
        Logger.error(`✗ ${filename} not found`);
      }
    }

    return verificationResults;
  }

  async generateStatusReport() {
    const totalDuration = Date.now() - this.startTime;
    const successful = this.results.filter((r) => r.success).length;
    const failed = this.results.filter((r) => !r.success).length;

    console.log("\n" + "=".repeat(60));
    Logger.premium("GENERATION REPORT");
    console.log("=".repeat(60));

    this.results.forEach((result: any, index: number) => {
      const status = result.success ? "✅" : "❌";
      const duration = result.duration ? ` (${result.duration}ms)` : "";
      const error = result.error ? ` - ${result.error}` : "";
      Logger.info(`${status} ${index + 1}. ${result.name}${duration}${error}`);
    });

    console.log("=".repeat(60));
    Logger.info(`Total Steps: ${this.results.length}`);
    Logger.info(`Successful: ${successful}`);
    Logger.info(`Failed: ${failed}`);
    Logger.info(`Total Time: ${totalDuration}ms`);
    console.log("=".repeat(60));

    const pdfs = await this.verifyGeneratedPDFs();
    const validPdfs = pdfs.filter((p: any) => p.isValid).length;

    Logger.info(`\n📄 PDF Verification:`);
    Logger.info(`Generated: ${validPdfs}/${pdfs.length} valid PDFs`);

    const report = {
      summary: {
        total: this.results.length,
        successful,
        failed,
        totalDuration,
        quality: CONFIG.quality,
        timestamp: new Date().toISOString(),
        platform: os.platform(),
        nodeVersion: process.version,
      },
      steps: this.results,
      pdfs,
      outputDirectory: CONFIG.outputDir,
    };

    const reportPath = path.join(CONFIG.outputDir, "premium-generation-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    Logger.info(`Report saved to: ${reportPath}`);

    return { report, pdfs, validPdfs };
  }

  async cleanup() {
    Logger.info("Performing cleanup...");

    const tempPatterns = [/\.tmp$/, /\.temp$/, /\.log$/];
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

    if (!fs.existsSync(CONFIG.outputDir)) return;

    const files = fs.readdirSync(CONFIG.outputDir);
    for (const file of files) {
      if (!tempPatterns.some((p) => p.test(file))) continue;

      const filePath = path.join(CONFIG.outputDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.mtimeMs < oneDayAgo) {
          fs.unlinkSync(filePath);
          Logger.debug(`Removed: ${file}`);
        }
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async run() {
    await this.initialize();

    try {
      await this.generatePremiumPDFs();

      const { report, validPdfs } = await this.generateStatusReport();

      await this.cleanup();

      console.log("\n" + "=".repeat(60));
      if (validPdfs === 3) Logger.premium("ALL PREMIUM PDFS GENERATED SUCCESSFULLY!");
      else Logger.warn(`Generated ${validPdfs}/3 premium PDFs`);
      console.log("=".repeat(60));
      Logger.success(`Output directory: ${CONFIG.outputDir}`);
      Logger.success(`Total time: ${report.summary.totalDuration}ms`);
      Logger.success(`Quality level: ${String(CONFIG.quality).toUpperCase()}`);
      console.log("=".repeat(60));

      return {
        success: validPdfs === 3,
        report,
        validPdfs,
        totalPdfs: 3,
      };
    } catch (error: any) {
      Logger.error(`Orchestration failed: ${error?.message || String(error)}`);

      try {
        await this.generateStatusReport();
      } catch (reportError: any) {
        Logger.error(`Failed to generate error report: ${reportError?.message || String(reportError)}`);
      }

      throw error;
    }
  }
}

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------
function checksum16(filePath: string) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// MAIN EXECUTION WITH ARGUMENTS
// -----------------------------------------------------------------------------
async function cliMain() {
  const args = process.argv.slice(2);

  const options = {
    quality: CONFIG.quality,
    allFormats: false,
    verbose: false,
    silent: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if ((arg === "--quality" || arg.startsWith("--quality=")) && (args[i + 1] || arg.includes("="))) {
      options.quality = arg.includes("=") ? arg.split("=")[1] : args[i + 1];
      if (!arg.includes("=")) i++;
    } else if (arg === "--all-formats" || arg === "-a") {
      options.allFormats = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
      CONFIG.logLevel = "debug";
    } else if (arg === "--silent" || arg === "-s") {
      options.silent = true;
      CONFIG.logLevel = "error";
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
📚 Premium PDF Generation Orchestrator

Usage: pnpm tsx scripts/generate-pdfs.ts [options]

Options:
  --quality <level>     Set quality: draft, standard, premium, enterprise
  --all-formats, -a     Generate all formats (A4, Letter, A3)
  --verbose, -v         Enable verbose/debug logging
  --silent, -s          Silent mode (errors only)
  --help, -h            Show this help message

Examples:
  pnpm tsx scripts/generate-pdfs.ts
  pnpm tsx scripts/generate-pdfs.ts --quality enterprise
  pnpm tsx scripts/generate-pdfs.ts -a -v
`);
      process.exit(0);
    }
  }

  CONFIG.quality = options.quality;

  const orchestrator = new PDFGenerationOrchestrator();

  try {
    const result = await orchestrator.run();

    if (result.success) {
      Logger.premium("Generation completed successfully!");
      process.exit(0);
    } else {
      Logger.warn(`Generation completed with ${3 - result.validPdfs} missing PDFs`);
      process.exit(1);
    }
  } catch (error: any) {
    Logger.error(`Fatal error in PDF generation: ${error?.message || String(error)}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// ENTRY POINT (ESM-safe)
// -----------------------------------------------------------------------------
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const here = path.resolve(__filename);
  return argv1 === here;
})();

if (invokedAsScript) {
  cliMain();
}

export { PDFGenerationOrchestrator, CommandRunner, Logger };
