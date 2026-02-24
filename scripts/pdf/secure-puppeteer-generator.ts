import fs from "fs";
import path from "path";
import crypto from "crypto";
import { marked } from "marked";
import matter from "gray-matter";

type BrowserStatus = "connected" | "disconnected" | "unknown";

export type PuppeteerPDFOptions = {
  format?: "A4" | "Letter" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  timeoutMs?: number;
  watchdogMs?: number;
  blockExternalRequests?: boolean;
  allowFileUrls?: boolean;
  userAgent?: string;
  title?: string;
  headerHTML?: string;
  footerHTML?: string;
  tier?: string;      // Institutional classification
  userId?: string;    // Digital Fingerprint
};

export type SecurePDFResult = {
  filePath: string;
  size: number;
  duration: number;
  sha256: string;
  md5: string;
};

export type HealthCheckResult = {
  browserStatus: BrowserStatus;
  puppeteerVersion: string;
  chromeVersion?: string;
  isHealthy: boolean;
  details?: string;
};

type CtorOptions = {
  timeout?: number;
  watchdogMs?: number;
  maxRetries?: number;
  headless?: boolean;
  executablePath?: string;
  args?: string[];
};

function yel(s: string) { return `\x1b[33m${s}\x1b[0m`; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function ensureDir(absFilePath: string) { fs.mkdirSync(path.dirname(absFilePath), { recursive: true }); }

function safeWriteFile(absPath: string, data: Buffer) {
  ensureDir(absPath);
  const tmp = `${absPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, absPath);
}

function hashFile(absPath: string) {
  const buf = fs.readFileSync(absPath);
  return {
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    md5: crypto.createHash("md5").update(buf).digest("hex"),
  };
}

function toNodeBuffer(input: any): Buffer {
  if (!input) return Buffer.alloc(0);
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  return Buffer.from(input);
}

function isPdfHeaderBytes(buf: Buffer) {
  return buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;
}

async function loadPuppeteer(): Promise<any> {
  try { return await import("puppeteer"); }
  catch { return await import("puppeteer-core"); }
}

function fileExists(p: string) {
  try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; }
}

function discoverExecutablePath(): string | undefined {
  const env = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
  if (env && fileExists(env)) return env;
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    ].filter(Boolean) as string[];
    for (const p of candidates) if (fileExists(p)) return p;
  }
  return undefined;
}

function withWatchdog<T>(work: Promise<T>, watchdogMs: number, label: string): Promise<T> {
  if (!watchdogMs || watchdogMs < 1) return work;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`WATCHDOG_TIMEOUT after ${watchdogMs}ms (${label})`)), watchdogMs);
    work.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export class SecurePuppeteerPDFGenerator {
  private browser: any | null = null;
  private launchAttempts = 0;
  private readonly timeout: number;
  private readonly watchdogMs: number;
  private readonly maxRetries: number;
  private readonly headless: boolean;
  private readonly executablePath?: string;
  private readonly args: string[];

  constructor(opts: CtorOptions = {}) {
    this.timeout = opts.timeout ?? 60_000;
    this.watchdogMs = opts.watchdogMs ?? 140_000;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
    this.headless = opts.headless ?? true;
    this.executablePath = opts.executablePath || discoverExecutablePath();
    this.args = opts.args ?? ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu", "--font-render-hinting=none"];
  }

  private async launchBrowser(): Promise<any> {
    const puppeteer = await loadPuppeteer();
    const launchOpts: any = { headless: this.headless, args: this.args };
    if (this.executablePath) launchOpts.executablePath = this.executablePath;
    return puppeteer.launch(launchOpts);
  }

  async initialize(): Promise<void> {
    if (this.browser) return;
    for (;;) {
      try {
        this.launchAttempts++;
        if (this.launchAttempts > this.maxRetries + 1) throw new Error("Puppeteer launch retries exhausted");
        this.browser = await withWatchdog(this.launchBrowser(), 45_000, `launch(attempt=${this.launchAttempts})`);
        return;
      } catch (e: any) {
        console.warn(yel(`⚠️ Puppeteer launch failed: ${e?.message}`));
        await this.close().catch(() => {});
        await sleep(Math.min(3000, 250 * this.launchAttempts));
      }
    }
  }

  async close(): Promise<void> {
    if (!this.browser) return;
    try { await this.browser.close(); }
    finally { this.browser = null; this.launchAttempts = 0; }
  }

  async generateSecurePDF(htmlContent: string, outputFilePath: string, options: PuppeteerPDFOptions = {}): Promise<SecurePDFResult> {
    const t0 = Date.now();
    await this.initialize();
    const absOut = path.isAbsolute(outputFilePath) ? outputFilePath : path.join(process.cwd(), outputFilePath);
    ensureDir(absOut);

    const doWork = (async () => {
      const page = await this.browser.newPage();
      try {
        if (options.blockExternalRequests !== false) {
          await page.setRequestInterception(true);
          page.on("request", (req: any) => {
            const url = req.url();
            if (url.startsWith("http") || (url.startsWith("file") && options.allowFileUrls !== true)) return req.abort();
            return req.continue();
          });
        }

        const enhanced = this.enhanceHTML(htmlContent, options);
        await page.setContent(enhanced, { waitUntil: "domcontentloaded", timeout: options.timeoutMs ?? this.timeout });

        // Apply Physical Watermark for High-Tier Content
        if (options.tier === "PRIVATE" || options.tier === "ELITE") {
          await this.injectWatermark(page, options.tier);
        }

        const pdfAny: any = await page.pdf({
          format: options.format ?? "A4",
          landscape: options.landscape ?? false,
          printBackground: true,
          margin: options.margin ?? { top: "60px", right: "40px", bottom: "60px", left: "40px" },
          displayHeaderFooter: true,
          headerTemplate: options.headerHTML ?? `<div style="font-size:8px;width:100%;text-align:right;padding-right:40px;color:#ccc;">${options.tier || "PUBLIC"}</div>`,
          footerTemplate: options.footerHTML ?? this.getDefaultFooter(options.userId),
        });

        const pdfBuffer = toNodeBuffer(pdfAny);
        if (!isPdfHeaderBytes(pdfBuffer)) throw new Error("Invalid PDF header");

        safeWriteFile(absOut, pdfBuffer);
        return { filePath: absOut, size: pdfBuffer.length, duration: Date.now() - t0, ...hashFile(absOut) };
      } finally {
        await page.close();
      }
    })();

    return withWatchdog(doWork, options.watchdogMs ?? this.watchdogMs, `render:${path.basename(absOut)}`);
  }

  private async injectWatermark(page: any, tier: string) {
    const color = tier === "ELITE" ? "rgba(184, 134, 11, 0.12)" : "rgba(220, 38, 38, 0.08)";
    await page.evaluate((text: string, colorValue: string) => {
      const div = document.createElement("div");
      div.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:100pt;font-weight:900;color:${colorValue};z-index:9999;pointer-events:none;white-space:nowrap;font-family:sans-serif;`;
      div.innerText = text;
      document.body.appendChild(div);
    }, tier, color);
  }

  private getDefaultFooter(userId?: string): string {
    const fingerprint = userId ? ` | ID: ${userId}` : "";
    return `
      <div style="font-family:sans-serif;font-size:7pt;width:100%;display:flex;justify-content:space-between;padding:0 40px;color:#aaa;">
        <span>Abraham of London — Institutional Vault${fingerprint}</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
      </div>`;
  }

  async generateFromSource(args: {
    sourceAbsPath: string;
    sourceKind: "mdx" | "md" | "html";
    outputAbsPath: string;
    quality: "premium" | "enterprise" | "draft";
    format: "A4" | "Letter" | "A3";
    title?: string;
    tier?: string;
    userId?: string;
  }): Promise<void> {
    const raw = fs.readFileSync(args.sourceAbsPath, "utf8");
    const { content, data } = matter(raw);
    const htmlBody = args.sourceKind === "html" ? raw : await marked.parse(content);
    
    await this.generateSecurePDF(htmlBody, args.outputAbsPath, {
      format: args.format,
      title: args.title || data.title,
      tier: args.tier || data.tier || data.accessLevel,
      userId: args.userId,
      timeoutMs: 90_000,
    });
  }

  private enhanceHTML(htmlContent: string, options: PuppeteerPDFOptions): string {
    return `<!DOCTYPE html><html><head><style>
      body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #111; padding: 20px; }
      h1 { font-size: 24pt; border-bottom: 2px solid #111; padding-bottom: 8px; }
      pre { background: #f4f4f4; padding: 10px; border-radius: 4px; }
      blockquote { border-left: 4px solid #111; padding-left: 15px; font-style: italic; color: #444; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #111; color: #fff; padding: 8px; text-align: left; }
      td { border: 1px solid #ddd; padding: 8px; }
    </style></head><body>${htmlContent}</body></html>`;
  }
}