// scripts/pdf/secure-puppeteer-generator.ts
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

function ensureDir(absFilePath: string) {
  fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
}

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

// ✅ Normalise Buffer vs Uint8Array
function toNodeBuffer(input: any): Buffer {
  if (!input) return Buffer.alloc(0);
  if (Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) return Buffer.from(input);
  // last resort
  return Buffer.from(input);
}

function isPdfHeaderBytes(buf: Buffer) {
  // %PDF = 0x25 0x50 0x44 0x46
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
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      path.join(process.env.LOCALAPPDATA || "", "Microsoft\\Edge\\Application\\msedge.exe"),
    ].filter(Boolean) as string[];

    for (const p of candidates) if (fileExists(p)) return p;
  }

  return undefined;
}

function withWatchdog<T>(work: Promise<T>, watchdogMs: number, label: string): Promise<T> {
  if (!watchdogMs || watchdogMs < 1) return work;
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`WATCHDOG_TIMEOUT after ${watchdogMs}ms (${label})`)), watchdogMs);
    work.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
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
    this.args = opts.args ?? [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-extensions",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-first-run",
      "--font-render-hinting=none",
    ];
  }

  private async launchBrowser(): Promise<any> {
    const puppeteer = await loadPuppeteer();

    const launchOpts: any = {
      headless: this.headless,
      args: this.args,
    };

    if (this.executablePath) {
      launchOpts.executablePath = this.executablePath;
    }

    if (process.env.PUPPETEER_SKIP_DOWNLOAD === "1" && !launchOpts.executablePath) {
      throw new Error("PUPPETEER_SKIP_DOWNLOAD=1 but no executablePath detected. Set PUPPETEER_EXECUTABLE_PATH.");
    }

    return puppeteer.launch(launchOpts);
  }

  async initialize(): Promise<void> {
    if (this.browser) return;

    for (;;) {
      try {
        this.launchAttempts++;
        if (this.launchAttempts > this.maxRetries + 1) {
          throw new Error(`Puppeteer launch retries exhausted (${this.launchAttempts - 1} attempts)`);
        }
        this.browser = await withWatchdog(this.launchBrowser(), 45_000, `launch(attempt=${this.launchAttempts})`);
        return;
      } catch (e: any) {
        console.warn(yel(`⚠️ Puppeteer launch failed: ${e?.message || e}`));
        await this.close().catch(() => {});
        await sleep(Math.min(3000, 250 * this.launchAttempts));
      }
    }
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      await this.initialize();
      if (!this.browser) return { browserStatus: "disconnected", puppeteerVersion: "unknown", isHealthy: false, details: "No browser" };
      const page = await this.browser.newPage();
      page.setDefaultTimeout(10_000);
      page.setDefaultNavigationTimeout(10_000);
      await page.goto("about:blank", { waitUntil: "domcontentloaded", timeout: 10_000 });
      const v = await this.browser.version();
      await page.close();
      return { browserStatus: "connected", puppeteerVersion: "loaded", chromeVersion: v, isHealthy: true };
    } catch (e: any) {
      return { browserStatus: "disconnected", puppeteerVersion: "unknown", isHealthy: false, details: e?.message };
    }
  }

  async close(): Promise<void> {
    if (!this.browser) return;
    try { await this.browser.close(); }
    finally { this.browser = null; this.launchAttempts = 0; }
  }

  async generateSecurePDF(htmlContent: string, outputFilePath: string, options: PuppeteerPDFOptions = {}): Promise<SecurePDFResult> {
    const t0 = Date.now();
    const opTimeout = options.timeoutMs ?? this.timeout;
    const watchdog = options.watchdogMs ?? this.watchdogMs;

    await this.initialize();
    if (!this.browser) throw new Error("Browser not initialized");

    const absOut = path.isAbsolute(outputFilePath) ? outputFilePath : path.join(process.cwd(), outputFilePath);
    ensureDir(absOut);

    const doWork = (async () => {
      const page = await this.browser.newPage();
      page.setDefaultTimeout(opTimeout);
      page.setDefaultNavigationTimeout(opTimeout);

      try {
        const blockExternal = options.blockExternalRequests !== false;

        if (blockExternal) {
          await page.setRequestInterception(true);
          page.on("request", (req: any) => {
            try {
              const url = req.url();
              const isHttp = url.startsWith("http://") || url.startsWith("https://");
              const isFile = url.startsWith("file://");
              if (isHttp) return req.abort();
              if (isFile && options.allowFileUrls !== true) return req.abort();
              return req.continue();
            } catch {
              try { req.abort(); } catch {}
            }
          });
        }

        const enhanced = this.enhanceHTML(htmlContent, options);

        // ✅ Do NOT use networkidle0
        await page.setContent(enhanced, { waitUntil: "domcontentloaded", timeout: opTimeout });

        const pdfAny: any = await page.pdf({
          format: options.format ?? "A4",
          landscape: options.landscape ?? false,
          printBackground: options.printBackground ?? true,
          margin: options.margin ?? { top: "40px", right: "30px", bottom: "40px", left: "30px" },
          displayHeaderFooter: Boolean(options.headerHTML || options.footerHTML),
          headerTemplate: options.headerHTML ?? "<div></div>",
          footerTemplate: options.footerHTML ?? "<div></div>",
        });

        // ✅ Normalise output, then validate header
        const pdfBuffer = toNodeBuffer(pdfAny);
        if (!isPdfHeaderBytes(pdfBuffer)) throw new Error("Invalid PDF header");

        safeWriteFile(absOut, pdfBuffer);
        const { sha256, md5 } = hashFile(absOut);

        return { filePath: absOut, size: pdfBuffer.length, duration: Date.now() - t0, sha256, md5 };
      } finally {
        try { await page.close(); } catch {}
      }
    })();

    try {
      return await withWatchdog(doWork, watchdog, `render:${path.basename(absOut)}`);
    } catch (e: any) {
      console.warn(yel(`⚠️ Render failed: ${e?.message || e}`));
      await this.close().catch(() => {});
      throw e;
    }
  }

  async generateFromSource(args: {
    sourceAbsPath: string;
    sourceKind: "mdx" | "md" | "html";
    outputAbsPath: string;
    quality: "premium" | "enterprise" | "draft";
    format: "A4" | "Letter" | "A3";
    title?: string;
    timeoutMs?: number;
    watchdogMs?: number;
  }): Promise<void> {
    const { sourceAbsPath, sourceKind, outputAbsPath, format, title, quality } = args;
    if (!fs.existsSync(sourceAbsPath)) throw new Error(`Source missing: ${sourceAbsPath}`);

    const t = args.timeoutMs ?? (quality === "premium" ? 90_000 : 60_000);
    const w = args.watchdogMs ?? (quality === "premium" ? 120_000 : 80_000);

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
          <div class="doc-meta">${path.basename(sourceAbsPath)}</div>
        </div>
        ${markdownHtml}
      `;
    }

    await this.generateSecurePDF(htmlBody, outputAbsPath, {
      format,
      title,
      blockExternalRequests: true,
      allowFileUrls: false,
      userAgent: `AOL-Generator/${quality}`,
      timeoutMs: t,
      watchdogMs: w,
      footerHTML: `
        <div style="font-family:sans-serif;font-size:8pt;width:100%;text-align:center;color:#999;border-top:1px solid #eee;padding-top:5px;">
          Abraham of London — Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
    });
  }

  private enhanceHTML(htmlContent: string, options: PuppeteerPDFOptions): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${options.title ?? "Generated PDF"}</title>
<style>
  @page { margin: 60px 40px; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif; line-height: 1.65; color: #111; font-size: 11pt; }
  .inst-header { border-bottom: 2px solid #111; margin-bottom: 24px; padding-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }
  .inst-header small { text-transform: uppercase; color:#666; letter-spacing: 1.2px; font-weight: 700; font-size: 9pt; }
  .doc-meta { font-size: 8pt; color:#999; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  h1 { font-size: 24pt; margin: 0 0 12px; }
  h2 { font-size: 16pt; margin: 28px 0 10px; border-left: 4px solid #111; padding-left: 12px; }
  h3 { font-size: 13pt; margin: 20px 0 8px; }
  p { margin: 0 0 12px; text-align: justify; }
  ul,ol { margin: 0 0 12px 22px; }
  table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 10pt; }
  th { background: #111; color: #fff; padding: 10px; text-align: left; font-size: 9pt; text-transform: uppercase; }
  td { border: 1px solid #eee; padding: 10px; vertical-align: top; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #f5f5f5; padding: 2px 5px; border-radius: 4px; font-size: 10pt; }
  pre { background: #f5f5f5; padding: 12px; border-radius: 6px; overflow-x:auto; }
  blockquote { border-left: 4px solid #111; padding-left: 12px; color:#555; margin: 14px 0; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
  }
}