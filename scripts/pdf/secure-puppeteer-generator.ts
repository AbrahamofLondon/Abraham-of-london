// scripts/pdf/secure-puppeteer-generator.ts
// PRODUCTION GRADE — ESM-safe — CI-safe — Hard timeouts — External request blocking

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

type BrowserStatus = "connected" | "disconnected" | "unknown";

export type PuppeteerPDFOptions = {
  format?: "A4" | "Letter" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
  timeoutMs?: number;

  // Security
  blockExternalRequests?: boolean;
  allowFileUrls?: boolean;

  // Metadata/branding
  userAgent?: string;
  title?: string;

  // Header/footer
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
  timeout?: number;
  maxRetries?: number;
  headless?: boolean;
  executablePath?: string;
  args?: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function isPdfHeader(buf: Buffer) {
  return !!buf && buf.length >= 4 && buf.subarray(0, 4).toString("utf8") === "%PDF";
}

function hashFile(absPath: string) {
  const buf = fs.readFileSync(absPath);
  return {
    sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    md5: crypto.createHash("md5").update(buf).digest("hex"),
  };
}

function ensureDirForFile(absFile: string) {
  fs.mkdirSync(path.dirname(absFile), { recursive: true });
}

function safeWriteFile(absPath: string, data: Buffer) {
  ensureDirForFile(absPath);
  const tmp = `${absPath}.tmp-${Date.now()}`;
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, absPath);
}

async function loadPuppeteer(): Promise<any> {
  try {
    return await import("puppeteer-core");
  } catch {
    return await import("puppeteer");
  }
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
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--font-render-hinting=none",
    ];
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    const puppeteer = await loadPuppeteer();

    for (;;) {
      try {
        this.launchAttempts++;
        if (this.launchAttempts > this.maxRetries + 1) {
          throw new Error(`Puppeteer launch retries exhausted`);
        }

        const launchOpts: any = {
          headless: this.headless,
          args: this.args,
        };
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
      // "Try init but don't die" behaviour is implemented by caller if needed.
      await this.initialize();

      if (!this.browser) {
        return { browserStatus: "disconnected", puppeteerVersion: "unknown", isHealthy: false };
      }

      const page = await this.browser.newPage();
      try {
        page.setDefaultTimeout(5000);
        page.setDefaultNavigationTimeout(5000);
        await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 5000 });
        const v = await this.browser.version();
        return { browserStatus: "connected", puppeteerVersion: "loaded", chromeVersion: v, isHealthy: true };
      } finally {
        await page.close().catch(() => {});
      }
    } catch (e: any) {
      return {
        browserStatus: "unknown",
        puppeteerVersion: "unknown",
        isHealthy: false,
        details: e?.message || "health check failed",
      };
    }
  }

  async close(): Promise<void> {
    if (!this.browser) return;
    try {
      await this.browser.close();
    } catch {
      // ignore
    } finally {
      this.browser = null;
      this.launchAttempts = 0;
    }
  }

  async generateSecurePDF(
    htmlContent: string,
    outputFilePath: string,
    options: PuppeteerPDFOptions = {}
  ): Promise<SecurePDFResult> {
    const t0 = Date.now();
    await this.initialize();

    if (!this.browser) throw new Error("Puppeteer browser is not available");

    const absOut = path.isAbsolute(outputFilePath) ? outputFilePath : path.join(process.cwd(), outputFilePath);
    ensureDirForFile(absOut);

    const page = await this.browser.newPage();
    const hardTimeout = options.timeoutMs ?? this.timeout;

    // Hard limits
    page.setDefaultTimeout(hardTimeout);
    page.setDefaultNavigationTimeout(hardTimeout);

    try {
      // Block external network by default (prevent hangs & leakage)
      const blockExternal = options.blockExternalRequests !== false;

      if (blockExternal) {
        await page.setRequestInterception(true);

        page.on("request", (req: any) => {
          const url = req.url();

          // allow about: and data:
          if (url.startsWith("about:") || url.startsWith("data:")) return req.continue();

          // allow file:// only if explicitly allowed
          if (url.startsWith("file:")) {
            if (options.allowFileUrls) return req.continue();
            return req.abort();
          }

          // block all http(s)
          if (url.startsWith("http:") || url.startsWith("https:")) return req.abort();

          // everything else: be conservative
          return req.abort();
        });
      }

      if (options.userAgent) {
        await page.setUserAgent(options.userAgent);
      }

      const enhanced = this.enhanceHTML(htmlContent, options);

      await page.setContent(enhanced, {
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: hardTimeout,
      });

      const pdfBuffer: Buffer = await page.pdf({
        format: options.format ?? "A4",
        landscape: Boolean(options.landscape),
        printBackground: options.printBackground ?? true,
        margin: options.margin ?? { top: "40px", right: "30px", bottom: "40px", left: "30px" },

        displayHeaderFooter: Boolean(options.headerHTML || options.footerHTML),
        headerTemplate: options.headerHTML ?? "<div></div>",
        footerTemplate: options.footerHTML ?? "<div></div>",
      });

      if (!isPdfHeader(pdfBuffer)) throw new Error("Generated buffer is not a valid PDF (%PDF header missing)");

      safeWriteFile(absOut, pdfBuffer);
      const { sha256, md5 } = hashFile(absOut);

      return {
        filePath: absOut,
        size: pdfBuffer.length,
        duration: Date.now() - t0,
        sha256,
        md5,
      };
    } finally {
      await page.close().catch(() => {});
    }
  }

  /**
   * Converts:
   * - html => rendered as-is
   * - md/mdx => frontmatter stripped, markdown rendered
   */
  async generateFromSource(args: {
    sourceAbsPath: string;
    sourceKind: "mdx" | "md" | "html";
    outputAbsPath: string;
    quality: "premium" | "enterprise" | "draft";
    format: "A4" | "Letter" | "A3";
    title?: string;
    timeoutMs?: number;
  }): Promise<void> {
    const { sourceAbsPath, sourceKind, outputAbsPath, format, title, quality, timeoutMs } = args;

    if (!fs.existsSync(sourceAbsPath)) throw new Error(`Source missing: ${sourceAbsPath}`);

    const lastMod = fs.statSync(sourceAbsPath).mtime.toISOString().split("T")[0];
    const docId = path.parse(outputAbsPath).name.toUpperCase();

    let htmlBody = "";

    if (sourceKind === "html") {
      htmlBody = fs.readFileSync(sourceAbsPath, "utf8");
    } else {
      const raw = fs.readFileSync(sourceAbsPath, "utf8");
      const { content } = matter(raw);
      const markdownHtml = await marked.parse(content);

      htmlBody = `
        <div class="inst-header">
          <small>Abraham of London — Download</small>
          <div class="doc-meta">ID: ${docId} | Modified: ${lastMod}</div>
        </div>
        ${markdownHtml}
      `;
    }

    const hard = timeoutMs ?? (quality === "premium" ? 120_000 : quality === "enterprise" ? 90_000 : 60_000);

    await this.generateSecurePDF(htmlBody, outputAbsPath, {
      format,
      title,
      blockExternalRequests: true,
      userAgent: `AOL-Generator/${quality}`,
      timeoutMs: hard,
      footerHTML: `
        <div style="font-family:sans-serif; font-size:8pt; width:100%; text-align:center; color:#999; border-top:1px solid #eee; padding-top:5px;">
          Abraham of London — Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>`,
    });
  }

  private enhanceHTML(htmlContent: string, options: PuppeteerPDFOptions): string {
    const ua = options.userAgent || "";
    const quality = ua.includes("/") ? ua.split("/")[1] : "premium";

    const watermark =
      quality === "draft" || quality === "enterprise"
        ? `body::before {
            content: "${quality.toUpperCase()}";
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 92pt;
            color: rgba(150,150,150,0.12);
            z-index: 0;
            pointer-events: none;
            font-weight: 800;
            letter-spacing: 6px;
          }`
        : "";

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      @page { margin: 60px 40px; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        line-height: 1.65;
        color: #111;
        font-size: 11pt;
        padding: 0;
        margin: 0;
        position: relative;
      }
      ${watermark}
      .inst-header {
        border-bottom: 2px solid #111;
        margin: 0 0 26px 0;
        padding: 0 0 10px 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 16px;
      }
      .inst-header small {
        text-transform: uppercase;
        color: #666;
        letter-spacing: 1.4px;
        font-weight: 700;
        font-size: 9pt;
      }
      .doc-meta {
        font-size: 8.5pt;
        color: #999;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        white-space: nowrap;
      }
      h1 { font-size: 24pt; margin: 0 0 12px 0; }
      h2 { font-size: 16pt; margin: 22px 0 10px 0; border-left: 4px solid #111; padding-left: 12px; }
      h3 { font-size: 13pt; margin: 18px 0 8px 0; }
      p { margin: 0 0 12px 0; text-align: justify; hyphens: auto; }
      ul, ol { margin: 0 0 12px 22px; }
      li { margin: 0 0 6px 0; }
      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        background: #f4f4f4;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10pt;
      }
      pre {
        background: #f4f4f4;
        padding: 12px;
        border-radius: 8px;
        overflow-x: auto;
      }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
      th { background: #111; color: #fff; padding: 10px; text-align: left; font-size: 9pt; text-transform: uppercase; }
      td { border: 1px solid #e6e6e6; padding: 10px; vertical-align: top; }
      img { max-width: 100%; height: auto; }
      .page {
        padding: 40px;
        position: relative;
        z-index: 1;
      }
    </style>
  </head>
  <body>
    <div class="page">
      ${htmlContent}
    </div>
  </body>
</html>`;
  }
}