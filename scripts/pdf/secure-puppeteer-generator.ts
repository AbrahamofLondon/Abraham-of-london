// scripts/pdf/secure-puppeteer-generator.ts
// ABRAHAM OF LONDON — Secure Puppeteer PDF Generator (Premium-Premium Edition)
// -----------------------------------------------------------------------------
// GOALS (no excuses):
// - Real print-grade typography + spacing + hierarchy (not “markdown screenshot”)
// - Deterministic output (stable CSS, stable margins, stable page breaks)
// - Correct handling of MDX/MD (frontmatter stripped, imports/exports removed)
// - Smart sanitization (tables, quotes, code, lists, headings)
// - Premium header/footer (tier, title, timestamp, fingerprint)
// - Strong offline posture (no external requests by default)
// - Chrome auto-discovery (env + Windows paths) + explicit override support
// - Safe atomic writes + hash
// - Robust timeouts + watchdog + retries
//
// NOTE:
// - This is a renderer, not a “content compiler”. It prints the MD/MDX body in a premium format.
// - If you later want component rendering (true MDX React), use Option A print route (generateFromRoute).
// - This generator upgrades “premium-wanna-bes” into “premium-premium” without network dependencies.

import fs from "fs";
import path from "path";
import crypto from "crypto";
import matter from "gray-matter";
import { marked } from "marked";

type BrowserStatus = "connected" | "disconnected" | "unknown";

export type PuppeteerPDFOptions = {
  format?: "A4" | "Letter" | "A3";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };

  timeoutMs?: number;
  watchdogMs?: number;

  // Security + determinism
  blockExternalRequests?: boolean; // default true
  allowFileUrls?: boolean; // default false
  userAgent?: string;

  // Presentation metadata
  title?: string;
  subtitle?: string;
  description?: string;

  // Header/Footer (optional overrides)
  headerHTML?: string;
  footerHTML?: string;

  // Watermark + classification
  tier?: string; // free|member|architect|inner-circle|etc
  userId?: string; // fingerprint

  // Visual dial
  quality?: "draft" | "premium" | "enterprise";
  includeCover?: boolean; // default true
  includeTOC?: boolean; // default false (reserved)
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

  // IMPORTANT: allow both names (your unified generator passes chromePath)
  executablePath?: string;
  chromePath?: string;

  args?: string[];
};

// -----------------------------------------------------------------------------
// Small helpers
// -----------------------------------------------------------------------------

function yel(s: string) {
  return `\x1b[33m${s}\x1b[0m`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDirForFile(absFilePath: string) {
  fs.mkdirSync(path.dirname(absFilePath), { recursive: true });
}

function safeWriteFile(absPath: string, data: Buffer) {
  ensureDirForFile(absPath);
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
  try {
    return await import("puppeteer");
  } catch {
    return await import("puppeteer-core");
  }
}

function fileExists(p: string) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function discoverExecutablePath(): string | undefined {
  const env =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_PATH ||
    process.env.CHROMIUM_PATH;

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
    work.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// -----------------------------------------------------------------------------
// MARKDOWN / MDX SANITIZATION (no React runtime required)
// -----------------------------------------------------------------------------

function stripMdxNoise(s: string) {
  let out = String(s || "");

  // Remove import/export lines (MDX)
  out = out.replace(/^\s*(import|export)\s+.+$/gm, "");

  // Remove JSX blocks (best-effort)
  out = out.replace(/<[^>\n]+\/>/g, ""); // self-closing
  out = out.replace(/<([A-Z][A-Za-z0-9]*)[^>]*>[\s\S]*?<\/\1>/g, ""); // Components
  out = out.replace(/<([a-z][a-z0-9-]*)[^>]*>[\s\S]*?<\/\1>/g, ""); // HTML blocks

  // Remove MDX expressions { ... } (best-effort)
  out = out.replace(/\{[\s\S]*?\}/g, "");

  // collapse excessive blank lines
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

// -----------------------------------------------------------------------------
// MARKED CONFIG (stable HTML, premium-friendly)
// -----------------------------------------------------------------------------

let MARKED_CONFIGURED = false;

function configureMarkedOnce() {
  if (MARKED_CONFIGURED) return;
  MARKED_CONFIGURED = true;

  marked.setOptions({
    gfm: true,
    breaks: false,
    headerIds: true,
    mangle: false,
  });

  const renderer = new marked.Renderer();

  renderer.table = (header, body) => {
    return `<div class="aol-table-wrap"><table class="aol-table"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
  };

  renderer.blockquote = (quote) => `<blockquote class="aol-quote">${quote}</blockquote>`;

  renderer.code = (code, infostring) => {
    const lang = (infostring || "").trim();
    const cls = lang ? `language-${lang}` : "";
    return `<pre class="aol-code"><code class="${cls}">${escapeHtml(code)}</code></pre>`;
  };

  renderer.hr = () => `<hr class="aol-hr" />`;

  marked.use({ renderer });
}

function escapeHtml(s: string) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// -----------------------------------------------------------------------------
// PREMIUM HTML TEMPLATE
// -----------------------------------------------------------------------------

function nowISO() {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function normalizeTier(tier?: string) {
  const s = String(tier || "free").trim().toLowerCase();
  if (!s) return "free";
  if (s === "public") return "free";
  return s;
}

function tierLabel(tier: string) {
  const t = normalizeTier(tier);
  if (t === "free") return "PUBLIC";
  if (t === "member") return "MEMBER";
  if (t === "architect") return "ARCHITECT";
  if (t === "inner-circle") return "INNER CIRCLE";
  return t.toUpperCase();
}

function tierAccent(tier: string) {
  const t = normalizeTier(tier);
  if (t === "architect") return "#C9A96A";
  if (t === "inner-circle") return "#7C3AED";
  if (t === "member") return "#2563EB";
  return "#111827";
}

function qualityDial(q?: string) {
  const s = String(q || "premium").trim().toLowerCase();
  if (s === "enterprise") return "enterprise";
  if (s === "draft") return "draft";
  return "premium";
}

function cssForQuality(q: "draft" | "premium" | "enterprise") {
  if (q === "enterprise") {
    return { base: 12.2, leading: 1.55, h1: 34, h2: 22, h3: 16, code: 10.2, maxWidth: 760, marginTop: 78, marginBottom: 72 };
  }
  if (q === "draft") {
    return { base: 11.2, leading: 1.45, h1: 30, h2: 20, h3: 15, code: 9.8, maxWidth: 720, marginTop: 68, marginBottom: 64 };
  }
  return { base: 11.8, leading: 1.50, h1: 32, h2: 21, h3: 15.5, code: 10.0, maxWidth: 740, marginTop: 74, marginBottom: 68 };
}

function buildPremiumHTML(args: {
  htmlBody: string;
  title: string;
  subtitle?: string;
  description?: string;
  tier: string;
  quality: "draft" | "premium" | "enterprise";
  includeCover: boolean;
}) {
  const { htmlBody, title, subtitle, description, tier, quality, includeCover } = args;

  const accent = tierAccent(tier);
  const q = cssForQuality(quality);
  const tLabel = tierLabel(tier);
  const generatedAt = nowISO();

  const cover = includeCover
    ? `
  <section class="aol-cover" data-aol="cover">
    <div class="aol-cover__topbar"></div>
    <div class="aol-cover__wrap">
      <div class="aol-kicker">${tLabel} • ${quality.toUpperCase()}</div>
      <h1 class="aol-cover__title">${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="aol-cover__subtitle">${escapeHtml(subtitle)}</div>` : ""}
      ${description ? `<div class="aol-cover__desc">${escapeHtml(description)}</div>` : ""}
      <div class="aol-cover__meta">
        <span>Abraham of London</span>
        <span class="dot"></span>
        <span>${generatedAt.slice(0, 10)}</span>
      </div>
    </div>
  </section>
  <div class="aol-page-break" data-aol="page-break"></div>
`
    : "";

  const body = `
  ${cover}
  <main class="aol-doc" role="main">
    <article class="aol-prose" data-aol="prose">
      ${htmlBody}
    </article>
  </main>
`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>

  <style>
    :root{
      --aol-accent: ${accent};
      --aol-ink: #111827;
      --aol-paper: #FFFFFF;
      --aol-rule: rgba(17,24,39,0.12);
      --aol-code-bg: rgba(17,24,39,0.04);
      --aol-quote-bg: rgba(201,169,106,0.08);
      --aol-max: ${q.maxWidth}px;
      --aol-base: ${q.base}px;
      --aol-leading: ${q.leading};
      --aol-h1: ${q.h1}px;
      --aol-h2: ${q.h2}px;
      --aol-h3: ${q.h3}px;
      --aol-code: ${q.code}px;
    }

    @page { margin: ${q.marginTop}px 48px ${q.marginBottom}px 48px; }
    html, body { height: 100%; }

    body{
      margin: 0;
      padding: 0;
      background: var(--aol-paper);
      color: var(--aol-ink);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: var(--aol-base);
      line-height: var(--aol-leading);
      font-family: ui-serif, Georgia, "Times New Roman", Times, serif;
      text-rendering: geometricPrecision;
    }

    .aol-doc{ max-width: var(--aol-max); margin: 0 auto; }

    .aol-cover{
      min-height: calc(100vh - 1px);
      display: grid;
      align-content: center;
      position: relative;
      padding: 0;
    }
    .aol-cover__topbar{
      position: absolute; top: 0; left: 0; right: 0;
      height: 14px; background: var(--aol-accent);
    }
    .aol-cover__wrap{ max-width: var(--aol-max); margin: 0 auto; padding: 0 12px; }
    .aol-kicker{
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-size: 11px;
      color: rgba(17,24,39,0.65);
      margin-bottom: 18px;
    }
    .aol-cover__title{
      font-size: 42px;
      line-height: 1.08;
      margin: 0 0 14px 0;
      letter-spacing: -0.02em;
    }
    .aol-cover__subtitle{
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 15px;
      color: rgba(17,24,39,0.72);
      max-width: 92%;
      margin: 0 0 16px 0;
    }
    .aol-cover__desc{
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 12.5px;
      color: rgba(17,24,39,0.60);
      max-width: 92%;
      margin: 0 0 24px 0;
    }
    .aol-cover__meta{
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11px;
      color: rgba(17,24,39,0.58);
    }
    .aol-cover__meta .dot{
      width: 4px; height: 4px; border-radius: 999px;
      background: rgba(17,24,39,0.24);
    }

    .aol-page-break{ page-break-after: always; break-after: page; }

    .aol-prose > :first-child { margin-top: 0; }

    h1,h2,h3{
      letter-spacing: -0.01em;
      color: var(--aol-ink);
      break-after: avoid;
      page-break-after: avoid;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    h1{
      font-size: var(--aol-h1);
      line-height: 1.12;
      margin: 26px 0 10px;
      border-bottom: 1px solid var(--aol-rule);
      padding-bottom: 10px;
    }
    h2{ font-size: var(--aol-h2); line-height: 1.18; margin: 22px 0 8px; }
    h3{ font-size: var(--aol-h3); line-height: 1.22; margin: 18px 0 6px; color: rgba(17,24,39,0.92); }

    p{ margin: 0 0 12px; color: rgba(17,24,39,0.92); hyphens: auto; }
    a{ color: var(--aol-accent); text-decoration: none; border-bottom: 1px solid rgba(0,0,0,0.12); }

    ul,ol{ margin: 0 0 14px 22px; padding: 0; }
    li{ margin: 0 0 6px; }
    li::marker{ color: rgba(17,24,39,0.62); }

    .aol-hr{ border: 0; border-top: 1px solid var(--aol-rule); margin: 18px 0; }

    .aol-quote{
      margin: 16px 0;
      padding: 12px 14px;
      border-left: 4px solid var(--aol-accent);
      background: var(--aol-quote-bg);
      color: rgba(17,24,39,0.86);
      font-style: italic;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .aol-code{
      margin: 14px 0;
      padding: 12px 12px;
      background: var(--aol-code-bg);
      border: 1px solid rgba(17,24,39,0.10);
      border-radius: 10px;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .aol-code code{
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: var(--aol-code);
      line-height: 1.45;
      color: rgba(17,24,39,0.90);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .aol-table-wrap{
      margin: 16px 0;
      border: 1px solid rgba(17,24,39,0.10);
      border-radius: 10px;
      overflow: hidden;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .aol-table{
      width: 100%;
      border-collapse: collapse;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-size: 11px;
    }
    .aol-table thead th{
      background: rgba(17,24,39,0.92);
      color: white;
      text-align: left;
      padding: 10px 10px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }
    .aol-table tbody td{
      border-top: 1px solid rgba(17,24,39,0.10);
      padding: 9px 10px;
      color: rgba(17,24,39,0.90);
      vertical-align: top;
    }
    .aol-table tbody tr:nth-child(even) td{
      background: rgba(17,24,39,0.02);
    }

    img{
      max-width: 100%;
      height: auto;
      border-radius: 12px;
      border: 1px solid rgba(17,24,39,0.10);
      margin: 12px 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    p, li, blockquote, pre, table { orphans: 3; widows: 3; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

// -----------------------------------------------------------------------------
// HEADER / FOOTER TEMPLATES
// -----------------------------------------------------------------------------

function defaultHeaderHTML(tier: string, title?: string) {
  const accent = tierAccent(tier);
  const label = tierLabel(tier);

  const safeTitle = String(title || "").trim();
  const titleSpan = safeTitle
    ? `<span style="opacity:.62;margin-left:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:420px;display:inline-block;vertical-align:bottom;">${escapeHtml(safeTitle)}</span>`
    : "";

  return `
  <div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:rgba(17,24,39,0.55);padding:0 46px;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(17,24,39,0.68);">ABRAHAM OF LONDON</span>
        <span style="width:5px;height:5px;border-radius:999px;background:${accent};display:inline-block;"></span>
        <span style="font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${accent};">${label}</span>
        ${titleSpan}
      </div>
      <div style="opacity:.55;">${nowISO().slice(0, 10)}</div>
    </div>
    <div style="height:1px;background:rgba(17,24,39,0.10);margin-top:6px;"></div>
  </div>`;
}

function defaultFooterHTML(userId?: string) {
  const fp = userId ? ` • ID: ${escapeHtml(String(userId))}` : "";
  return `
  <div style="width:100%;font-family:Arial,sans-serif;font-size:8px;color:rgba(17,24,39,0.50);padding:0 46px;box-sizing:border-box;">
    <div style="height:1px;background:rgba(17,24,39,0.10);margin-bottom:6px;"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>abrahamoflondon.org • Institutional Vault${fp}</div>
      <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
    </div>
  </div>`;
}

// -----------------------------------------------------------------------------
// WATERMARK (non-free tiers) — print-safe CSS overlay
// -----------------------------------------------------------------------------

function watermarkCSS(tier: string) {
  const t = normalizeTier(tier);
  if (t === "free") return "";
  const accent = tierAccent(t);
  const label = tierLabel(t);

  return `
  <style>
    body::before{
      content:"${label}";
      position: fixed;
      top: 46%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-28deg);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      font-weight: 800;
      font-size: 72px;
      letter-spacing: 0.22em;
      color: ${accent};
      opacity: ${t === "inner-circle" ? "0.06" : t === "architect" ? "0.055" : "0.04"};
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
    }
    .aol-doc, .aol-cover, .aol-prose { position: relative; z-index: 1; }
  </style>`;
}

// -----------------------------------------------------------------------------
// MAIN CLASS
// -----------------------------------------------------------------------------

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
    this.timeout = opts.timeout ?? 70_000;
    this.watchdogMs = opts.watchdogMs ?? 160_000;
    this.maxRetries = Math.max(0, opts.maxRetries ?? 2);
    this.headless = opts.headless ?? true;

    this.executablePath = opts.executablePath || opts.chromePath || discoverExecutablePath();

    this.args =
      opts.args ??
      [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--font-render-hinting=none",
        "--disable-features=IsolateOrigins,site-per-process",
      ];
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
        console.warn(yel(`⚠️ Puppeteer launch failed: ${e?.message || String(e)}`));
        await this.close().catch(() => {});
        await sleep(Math.min(4000, 300 * this.launchAttempts));
      }
    }
  }

  async close(): Promise<void> {
    if (!this.browser) return;
    try {
      await this.browser.close();
    } finally {
      this.browser = null;
      this.launchAttempts = 0;
    }
  }

  /**
   * Premium render (production-grade):
   * - premium HTML template + optional cover
   * - strict network isolation by default
   * - deterministic print settings (Puppeteer margins + CSS @page + backgrounds)
   * - stabilization: fonts + images + layout settle
   * - hard sanity checks: empty render + too-small PDF + page count
   * - atomic write + hashing
   */
  async generateSecurePDF(
    htmlContent: string,
    outputFilePath: string,
    options: PuppeteerPDFOptions = {},
  ): Promise<SecurePDFResult> {
    const t0 = Date.now();
    await this.initialize();

    const absOut = path.isAbsolute(outputFilePath) ? outputFilePath : path.join(process.cwd(), outputFilePath);
    ensureDirForFile(absOut);

    const tier = normalizeTier(options.tier);
    const quality = qualityDial(options.quality) as "draft" | "premium" | "enterprise";
    const includeCover = options.includeCover !== false;

    const timeoutMs = Math.max(20_000, options.timeoutMs ?? this.timeout);
    const watchdogMs = Math.max(40_000, options.watchdogMs ?? this.watchdogMs);

    const MIN_BYTES = quality === "enterprise" ? 28_000 : quality === "premium" ? 14_000 : 9_000;
    const MIN_PAGES = includeCover ? 2 : 1;

    const doWork = (async () => {
      const page = await this.browser!.newPage();

      try {
        if (options.userAgent) await page.setUserAgent(options.userAgent);
        await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

        try {
          await page.emulateMediaType("print");
        } catch {
          // ignore
        }

        // Offline posture
        const blockExternal = options.blockExternalRequests !== false;
        if (blockExternal) {
          await page.setRequestInterception(true);
          page.on("request", (req: any) => {
            const url = String(req.url() || "");

            if (url.startsWith("data:")) return req.continue();

            if (url.startsWith("file:")) {
              return options.allowFileUrls === true ? req.continue() : req.abort();
            }

            if (url.startsWith("http://") || url.startsWith("https://")) return req.abort();

            return req.continue();
          });
        }

        page.setDefaultNavigationTimeout(timeoutMs);
        page.setDefaultTimeout(timeoutMs);

        const enhanced = this.enhanceHTML(htmlContent, {
          ...options,
          tier,
          quality,
          includeCover,
        });

        await page.setContent(enhanced, { waitUntil: ["domcontentloaded"], timeout: timeoutMs });

        // Stabilize
        await page.evaluate(async () => {
          // @ts-ignore
          if (document?.fonts?.ready) {
            // @ts-ignore
            await document.fonts.ready;
          }

          const imgs = Array.from(document.images || []);
          await Promise.all(
            imgs.map((img) => {
              try {
                // @ts-ignore
                if (img.decode) return img.decode();
              } catch {}
              return Promise.resolve();
            }),
          );

          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        });

        // Sanity checks
        const sanity = await page.evaluate(() => {
          const text = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
          const hasText = text.length > 140;

          const hasCover = !!document.querySelector("[data-aol='cover']");
          const hasProse = !!document.querySelector("[data-aol='prose']");

          return { textLen: text.length, hasText, hasCover, hasProse };
        });

        if (!sanity.hasText || !sanity.hasProse) {
          throw new Error(`RENDER_SANITY_FAIL: empty doc (textLen=${sanity.textLen}, hasProse=${sanity.hasProse}).`);
        }
        if (includeCover && !sanity.hasCover) {
          throw new Error(`RENDER_SANITY_FAIL: cover requested but missing data-aol="cover".`);
        }

        const pdfAny: any = await page.pdf({
          format: options.format ?? "A4",
          landscape: options.landscape ?? false,
          printBackground: options.printBackground ?? true,
          margin: options.margin ?? { top: "92px", right: "46px", bottom: "78px", left: "46px" },
          displayHeaderFooter: true,
          headerTemplate: options.headerHTML ?? defaultHeaderHTML(tier, options.title),
          footerTemplate: options.footerHTML ?? defaultFooterHTML(options.userId),
          preferCSSPageSize: true,
          timeout: timeoutMs,
        });

        const pdfBuffer = toNodeBuffer(pdfAny);

        if (!isPdfHeaderBytes(pdfBuffer)) throw new Error("Invalid PDF header");
        if (pdfBuffer.length < MIN_BYTES) {
          throw new Error(`RENDER_SANITY_FAIL: pdf too small (${pdfBuffer.length} bytes < ${MIN_BYTES}).`);
        }

        // Structural check: page count
        try {
          const { PDFDocument } = await import("pdf-lib");
          const loaded = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
          const pages = loaded.getPageCount();
          if (pages < MIN_PAGES) {
            throw new Error(`suspicious pageCount=${pages} (min=${MIN_PAGES})`);
          }
        } catch (e: any) {
          throw new Error(`RENDER_SANITY_FAIL: pdf structural check failed: ${e?.message || String(e)}`);
        }

        safeWriteFile(absOut, pdfBuffer);

        return {
          filePath: absOut,
          size: pdfBuffer.length,
          duration: Date.now() - t0,
          ...hashFile(absOut),
        };
      } finally {
        await page.close().catch(() => {});
      }
    })();

    return withWatchdog(doWork, watchdogMs, `render:${path.basename(absOut)}`);
  }

  /**
   * Convert a local source file (md/mdx/html) into a premium PDF.
   * NOTE: This is NOT “true MDX React”. For that, use generateFromRoute().
   */
  async generateFromSource(args: {
    sourceAbsPath: string;
    sourceKind: "mdx" | "md" | "html";
    outputAbsPath: string;
    quality: "premium" | "enterprise" | "draft";
    format: "A4" | "Letter" | "A3";
    title?: string;
    tier?: string;
    userId?: string;
    subtitle?: string;
    description?: string;
    includeCover?: boolean;
    allowFileUrls?: boolean;
  }): Promise<void> {
    configureMarkedOnce();

    const raw = fs.readFileSync(args.sourceAbsPath, "utf8");

    if (args.sourceKind === "html") {
      await this.generateSecurePDF(raw, args.outputAbsPath, {
        format: args.format,
        title: args.title,
        subtitle: args.subtitle,
        description: args.description,
        tier: args.tier,
        userId: args.userId,
        quality: args.quality,
        includeCover: args.includeCover ?? true,
        allowFileUrls: args.allowFileUrls ?? false,
        blockExternalRequests: true,
        timeoutMs: 120_000,
        watchdogMs: 180_000,
        printBackground: true,
      });
      return;
    }

    const { content, data } = matter(raw);
    const cleaned = stripMdxNoise(content);
    const htmlBody = String(await marked.parse(cleaned));

    const title = String(args.title || data.title || path.basename(args.sourceAbsPath, path.extname(args.sourceAbsPath))).trim();
    const subtitle = String(args.subtitle || data.subtitle || "").trim() || undefined;
    const description = String(args.description || data.description || data.excerpt || "").trim() || undefined;
    const tier = String(args.tier || data.tier || data.accessLevel || "free");

    await this.generateSecurePDF(htmlBody, args.outputAbsPath, {
      format: args.format,
      title,
      subtitle,
      description,
      tier,
      userId: args.userId,
      quality: args.quality,
      includeCover: args.includeCover ?? true,
      allowFileUrls: args.allowFileUrls ?? false,
      blockExternalRequests: true,
      timeoutMs: 120_000,
      watchdogMs: 180_000,
      printBackground: true,
    });
  }

  /**
   * Print a running Next SSR route to PDF (true MDX React rendering).
   * This is Option A. It does NOT compile MDX here; it prints the HTML from Next.
   */
  async generateFromRoute(args: {
    url: string; // e.g. http://127.0.0.1:4311/__pdf/ultimate-purpose-of-man-editorial?tier=public
    outputAbsPath: string;
    format?: "A4" | "Letter" | "A3";
    timeoutMs?: number;
    watchdogMs?: number;
    blockExternalRequests?: boolean;
    allowFileUrls?: boolean;
    userAgent?: string;
    headerHTML?: string;
    footerHTML?: string;
  }): Promise<SecurePDFResult> {
    const t0 = Date.now();
    await this.initialize();

    const absOut = path.isAbsolute(args.outputAbsPath) ? args.outputAbsPath : path.join(process.cwd(), args.outputAbsPath);
    ensureDirForFile(absOut);

    const timeoutMs = Math.max(20_000, args.timeoutMs ?? this.timeout);
    const watchdogMs = Math.max(40_000, args.watchdogMs ?? this.watchdogMs);

    const doWork = (async () => {
      const page = await this.browser!.newPage();
      try {
        if (args.userAgent) await page.setUserAgent(args.userAgent);
        await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

        const blockExternal = args.blockExternalRequests !== false;
        if (blockExternal) {
          await page.setRequestInterception(true);
          page.on("request", (req: any) => {
            const url = String(req.url() || "");
            if (url.startsWith("data:")) return req.continue();
            if (url.startsWith("file:")) return args.allowFileUrls === true ? req.continue() : req.abort();

            // Allow local server only
            if (url.startsWith("http://127.0.0.1") || url.startsWith("http://localhost")) return req.continue();
            if (url.startsWith("https://127.0.0.1") || url.startsWith("https://localhost")) return req.continue();

            if (url.startsWith("http://") || url.startsWith("https://")) return req.abort();
            return req.continue();
          });
        }

        page.setDefaultNavigationTimeout(timeoutMs);
        page.setDefaultTimeout(timeoutMs);

        await page.goto(args.url, { waitUntil: ["domcontentloaded"], timeout: timeoutMs });

        await page.evaluate(async () => {
          // @ts-ignore
          if (document?.fonts?.ready) {
            // @ts-ignore
            await document.fonts.ready;
          }
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        });

        const sanity = await page.evaluate(() => {
          const text = (document.body?.innerText || "").replace(/\s+/g, " ").trim();
          const hasCover = !!document.querySelector("[data-aol='cover']");
          const hasProse = !!document.querySelector("[data-aol='prose']");
          return { textLen: text.length, hasCover, hasProse };
        });

        if (!sanity.hasProse || sanity.textLen < 200) {
          throw new Error(`ROUTE_RENDER_SANITY_FAIL: textLen=${sanity.textLen}, hasProse=${sanity.hasProse}`);
        }

        await page.pdf({
          path: absOut,
          format: args.format ?? "A4",
          printBackground: true,
          preferCSSPageSize: true,
          margin: { top: "92px", right: "46px", bottom: "78px", left: "46px" },
          displayHeaderFooter: Boolean(args.headerHTML || args.footerHTML),
          headerTemplate: args.headerHTML ?? "<div></div>",
          footerTemplate: args.footerHTML ?? "<div></div>",
          timeout: timeoutMs,
        });

        const st = fs.statSync(absOut);
        return { filePath: absOut, size: st.size, duration: Date.now() - t0, ...hashFile(absOut) };
      } finally {
        await page.close().catch(() => {});
      }
    })();

    return withWatchdog(doWork, watchdogMs, `route:${path.basename(absOut)}`);
  }

  /**
   * Wraps HTML into premium shell (cover + watermark + typography).
   * Accepts either markdown-produced HTML OR full HTML documents (extracts <body>).
   */
  private enhanceHTML(
    htmlContent: string,
    options: PuppeteerPDFOptions & { quality?: any; includeCover?: any },
  ): string {
    const tier = normalizeTier(options.tier);
    const quality = qualityDial(options.quality) as "draft" | "premium" | "enterprise";
    const includeCover = options.includeCover !== false;

    const title = String(options.title || "Document").trim();
    const subtitle = String(options.subtitle || "").trim() || undefined;
    const description = String(options.description || "").trim() || undefined;

    let body = String(htmlContent || "");
    const bodyMatch = body.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch?.[1]) body = bodyMatch[1];

    const premium = buildPremiumHTML({ htmlBody: body, title, subtitle, description, tier, quality, includeCover });
    const wm = watermarkCSS(tier);
    if (!wm) return premium;
    return premium.replace("</head>", `${wm}\n</head>`);
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const puppeteer = await loadPuppeteer();
      const puppeteerVersion = puppeteer?.version ? await puppeteer.version() : "unknown";

      const details: string[] = [];
      details.push(`executablePath=${this.executablePath || "(auto)"}`);

      await this.initialize();
      let chromeVersion: string | undefined;

      try {
        chromeVersion = this.browser?.version ? await this.browser.version() : undefined;
      } catch {
        // ignore
      }

      return {
        browserStatus: "connected",
        puppeteerVersion,
        chromeVersion,
        isHealthy: true,
        details: details.join("; "),
      };
    } catch (e: any) {
      return {
        browserStatus: "disconnected",
        puppeteerVersion: "unknown",
        isHealthy: false,
        details: e?.message || String(e),
      };
    }
  }
}

// ✅ SINGLE EXPORT MODEL (prevents your esbuild duplicate export error)
export default SecurePuppeteerPDFGenerator;