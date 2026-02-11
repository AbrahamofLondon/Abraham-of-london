// scripts/pdf/secure-puppeteer-generator.ts
// – PRODUCTION GRADE, ESM‑SAFE, CI‑SAFE, HARD TIMEOUTS ADDED
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { marked } from "marked";
import matter from "gray-matter";

type BrowserStatus = "connected" | "disconnected" | "unknown";

export type PuppeteerPDFOptions = {
  format?: "A4" | "Letter" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  timeoutMs?: number;
  blockExternalRequests?: boolean;
  allowFileUrls?: boolean;
  userAgent?: string;
  title?: string;
  headerHTML?: string;
  footerHTML?: string;
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
  timeout?: number;      // per‑navigation timeout
  maxRetries?: number;
  headless?: boolean;
  executablePath?: string;
  args?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function yel(s: string) { return `\x1b[33m${s}\x1b[0m`; }
function grn(s: string) { return `\x1b[32m${s}\x1b[0m`; }
function red(s: string) { return `\x1b[31m${s}\x1b[0m`; }

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function isPdfHeader(buf: Buffer) {
  return buf?.length >= 4 && buf.subarray(0, 4).toString("utf8") === "%PDF";
}

function hashFile(absPath: string) {
  const buf = fs.readFileSync(absPath);
  return {
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    md5: crypto.createHash("md5").update(buf).digest("hex"),
  };
}

function ensureDir(absFilePath: string) { fs.mkdirSync(path.dirname(absFilePath), { recursive: true }); }

function safeWriteFile(absPath: string, data: Buffer) {
  ensureDir(absPath);
  const tmp = `${absPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, absPath);
}

async function loadPuppeteer(): Promise<any> {
  try { return await import("puppeteer-core"); }
  catch { return await import("puppeteer"); }
}

export class SecurePuppeteerPDFGenerator {
  private browser: any | null = null;
  private launchAttempts = 0;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly headless: boolean;
  private readonly executablePath?: string;
  private readonly args: string[];

  constructor(opts: CtorOptions = {}) {
    this.timeout = opts.timeout ?? 60_000;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
    this.headless = opts.headless ?? true;
    this.executablePath = opts.executablePath;
    this.args = opts.args ?? [
      "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
      "--disable-gpu", "--no-zygote", "--font-render-hinting=none",
    ];
  }

  async initialize(): Promise<void> {
    if (this.browser) return;
    const puppeteer = await loadPuppeteer();
    for (;;) {
      try {
        this.launchAttempts++;
        if (this.launchAttempts > this.maxRetries + 1) {
          throw new Error(`Launch retries exhausted`);
        }
        const launchOpts: any = { headless: this.headless, args: this.args };
        if (this.executablePath) launchOpts.executablePath = this.executablePath;
        this.browser = await puppeteer.launch(launchOpts);
        return;
      } catch (e: any) {
        const backoff = Math.min(2500, 250 * this.launchAttempts);
        await sleep(backoff);
      }
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      await page.goto("about:blank");
      const v = await this.browser.version();
      await page.close();
      return { browserStatus: "connected", puppeteerVersion: "loaded", chromeVersion: v, isHealthy: true };
    } catch (e: any) {
      return { browserStatus: "disconnected", puppeteerVersion: "unknown", isHealthy: false, details: e.message };
    }
  }

  async close(): Promise<void> {
    if (!this.browser) return;
    try { await this.browser.close(); } finally { this.browser = null; }
  }

  async generateSecurePDF(
    htmlContent: string,
    outputFilePath: string,
    options: PuppeteerPDFOptions = {}
  ): Promise<SecurePDFResult> {
    const t0 = Date.now();
    await this.initialize();
    const absOut = path.isAbsolute(outputFilePath) ? outputFilePath : path.join(process.cwd(), outputFilePath);
    ensureDir(absOut);
    const page = await this.browser.newPage();

    // 🔒 HARD TIMEOUTS – prevents hanging
    page.setDefaultTimeout(options.timeoutMs ?? this.timeout);
    page.setDefaultNavigationTimeout(options.timeoutMs ?? this.timeout);

    try {
      if (options.blockExternalRequests !== false) {
        await page.setRequestInterception(true);
        page.on("request", (req: any) => {
          if (req.url().startsWith("http")) return req.abort();
          req.continue();
        });
      }
      const enhanced = this.enhanceHTML(htmlContent, options);
      await page.setContent(enhanced, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: options.timeoutMs ?? this.timeout,
      });
      const pdfBuffer: Buffer = await page.pdf({
        format: options.format ?? "A4",
        printBackground: true,
        margin: options.margin ?? { top: "40px", right: "30px", bottom: "40px", left: "30px" },
        displayHeaderFooter: Boolean(options.headerHTML || options.footerHTML),
        headerTemplate: options.headerHTML ?? "<div></div>",
        footerTemplate: options.footerHTML ?? "<div></div>",
      });
      if (!isPdfHeader(pdfBuffer)) throw new Error("Invalid PDF header");
      safeWriteFile(absOut, pdfBuffer);
      const { sha256, md5 } = hashFile(absOut);
      return { filePath: absOut, size: pdfBuffer.length, duration: Date.now() - t0, sha256, md5 };
    } finally {
      await page.close();
    }
  }

  /**
   * 🎯 ENHANCED: accepts explicit timeoutMs (passed to generateSecurePDF)
   */
  async generateFromSource(args: {
    sourceAbsPath: string;
    sourceKind: "mdx" | "md" | "html";
    outputAbsPath: string;
    quality: "premium" | "enterprise" | "draft";
    format: "A4" | "Letter" | "A3";
    title?: string;
    timeoutMs?: number;   // 👈 ADDED – per‑entry timeout override
  }): Promise<void> {
    const { sourceAbsPath, sourceKind, outputAbsPath, format, title, quality, timeoutMs } = args;
    if (!fs.existsSync(sourceAbsPath)) throw new Error(`Source missing: ${sourceAbsPath}`);

    const docId = path.parse(outputAbsPath).name.toUpperCase();
    const lastMod = fs.statSync(sourceAbsPath).mtime.toISOString().split('T')[0];

    let htmlBody = "";
    if (sourceKind === "html") {
      htmlBody = fs.readFileSync(sourceAbsPath, "utf8");
    } else {
      const raw = fs.readFileSync(sourceAbsPath, "utf8");
      const { content } = matter(raw);
      const markdownHtml = await marked.parse(content);
      htmlBody = `
        <div class="inst-header">
          <small>Abraham of London — Intelligence Brief</small>
          <div class="doc-meta">ID: ${docId} | Modified: ${lastMod}</div>
        </div>
        ${markdownHtml}
      `;
    }

    await this.generateSecurePDF(htmlBody, outputAbsPath, {
      format,
      title,
      blockExternalRequests: true,
      userAgent: `AOL-Generator/${quality}`,
      timeoutMs: timeoutMs ?? (quality === "premium" ? 120_000 : 60_000), // quality‑sensitive
      footerHTML: `
        <div style="font-family:sans-serif; font-size:8pt; width:100%; text-align:center; color:#999; border-top:1px solid #eee; padding-top:5px;">
          Abraham of London — Restricted Property — Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });
  }

  private enhanceHTML(htmlContent: string, options: PuppeteerPDFOptions): string {
    const quality = options.userAgent?.split('/')[1] || 'premium';
    let watermarkCss = "";
    if (quality === "draft" || quality === "enterprise") {
      watermarkCss = `body::before { content: "${quality.toUpperCase()}"; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100pt; color: rgba(200, 200, 200, 0.1); z-index: -1; pointer-events: none; font-weight: bold; }`;
    }

    return `<!DOCTYPE html><html><head><style>
      body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; line-height: 1.7; color: #1a1a1a; font-size: 11pt; padding: 40px; position: relative; }
      ${watermarkCss}
      .inst-header { border-bottom: 2px solid #111; margin-bottom: 30px; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-end; }
      .inst-header small { text-transform: uppercase; color: #666; letter-spacing: 1.5px; font-weight: 600; }
      .doc-meta { font-size: 8pt; color: #999; font-family: monospace; }
      h1 { font-size: 26pt; margin-top: 0; color: #000; } 
      h2 { font-size: 18pt; margin-top: 2em; border-left: 4px solid #111; padding-left: 15px; }
      p { margin-bottom: 1.2em; text-align: justify; hyphens: auto; }
      table { width: 100%; border-collapse: collapse; margin: 2em 0; font-size: 10pt; }
      th { background: #111; color: #fff; padding: 12px; text-align: left; text-transform: uppercase; font-size: 9pt; }
      td { border: 1px solid #eee; padding: 10px; }
      @page { margin: 60px 40px; }
    </style></head><body>${htmlContent}</body></html>`;
  }
}