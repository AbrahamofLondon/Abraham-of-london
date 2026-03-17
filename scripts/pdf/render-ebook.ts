// scripts/pdf/render-ebook.ts
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";

import { loadEbookSource } from "./load-ebook-source";
import { buildEbookManifest } from "./build-ebook-manifest";
import { compileEbookBody } from "./compile-ebook-body";
import { renderCoverPage } from "./templates/cover-template";
import { renderImprintPage } from "./templates/imprint-template";
import { renderTocPage } from "./templates/toc-template";
import { renderClosingPage } from "./templates/closing-template";
import { SecurePuppeteerPDFGenerator } from "./secure-puppeteer-generator";

import { buildFingerprintProfile } from "../../lib/premium/fingerprint-profile";
import { createWatermarkPayload } from "../../lib/premium/watermark";
import { logger } from "../../lib/logging";

// ============================================================================
// CONFIG
// ============================================================================

const PIPELINE_VERSION = "4.0.0";
const EDITION_LABEL = "Institutional Orientation Edition";
const PDF_TIMEOUT_MS = 120_000;
const WATCHDOG_MS = 180_000;
const MAX_RETRIES = 2;

type TocItem = {
  label: string;
  page?: number;
  section?: string;
  isSubsection?: boolean;
};

type CompileStats = {
  totalBlocks?: number;
  chapterCount?: number;
  calloutCount?: number;
  figureCount?: number;
  pullquoteCount?: number;
  markdownCount?: number;
};

type CompiledBodyResult = {
  openingHtml: string | null;
  bodyHtml: string;
  stats?: CompileStats;
};

// ============================================================================
// HELPERS
// ============================================================================

function abs(p: string): string {
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
}

function ensureDirForFile(fileAbs: string): void {
  const dir = path.dirname(fileAbs);
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (error) {
    logger.error("[Ebook] Failed to create output directory", {
      dir,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Cannot create output directory: ${dir}`);
  }
}

function argValue(key: string): string | undefined {
  const argv = process.argv.slice(2);
  const eq = argv.find((a) => a.startsWith(`${key}=`));
  if (eq) return eq.split("=").slice(1).join("=");

  const i = argv.indexOf(key);
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--")) {
    return argv[i + 1];
  }

  return undefined;
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function shortFingerprint(input: string, len = 12): string {
  return String(input || "").slice(0, len);
}

function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function normalizeClassification(tier: string | undefined): string {
  const t = safeText(tier, "public").toUpperCase().replace(/-/g, "_");
  return t || "PUBLIC";
}

function normalizeTocItems(rawToc: unknown): TocItem[] {
  if (!Array.isArray(rawToc) || rawToc.length === 0) {
    return [
      { label: "Introduction" },
      { label: "Main Text", section: "EDITORIAL" },
      { label: "Closing Statement", isSubsection: true },
      { label: "Institutional Record", isSubsection: true },
    ];
  }

  const first = rawToc[0];

  if (typeof first === "string") {
    return (rawToc as string[])
      .map((label) => safeText(label))
      .filter(Boolean)
      .map((label) => ({ label }));
  }

  return (rawToc as TocItem[])
    .map((item) => ({
      label: safeText(item.label),
      page: typeof item.page === "number" ? item.page : undefined,
      section: safeText(item.section) || undefined,
      isSubsection: Boolean(item.isSubsection),
    }))
    .filter((item) => Boolean(item.label));
}

function pageLabel(pageCount: unknown): string {
  return typeof pageCount === "number" && pageCount > 0
    ? `${pageCount} pages`
    : "page count unavailable";
}

// ============================================================================
// SHELL
// ============================================================================

function buildBookShell(args: {
  coverHtml: string;
  imprintHtml: string;
  openingHtml: string | null;
  tocHtml: string;
  bodyHtml: string;
  closingHtml: string;
  footerText: string;
  fingerprintId: string;
  shortTitle: string;
  editionLabel: string;
  isoDate: string;
}): string {
  const safeShortTitle = escapeHtml(args.shortTitle);
  const safeEditionLabel = escapeHtml(args.editionLabel);
  const safeIsoDate = escapeHtml(args.isoDate);
  const safeFooterText = escapeHtml(args.footerText);
  const safeFingerprintId = escapeHtml(shortFingerprint(args.fingerprintId));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeShortTitle} — Abraham of London</title>
  <meta name="generator" content="AoL eBook Pipeline v${PIPELINE_VERSION}" />
  <meta name="format-detection" content="telephone=no" />
  <meta name="format-detection" content="date=no" />
  <meta name="format-detection" content="address=no" />
  <style>
    * {
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }

    :root {
      --paper: #fffdf8;
      --bg: #fbfaf7;
      --ink: #14171d;
      --ink-soft: #252933;
      --muted: #5d6470;
      --muted-soft: #8b919c;
      --rule: #e9dfcf;
      --rule-soft: rgba(233, 223, 207, 0.6);
      --gold: #b8923f;
      --gold-soft: rgba(184, 146, 63, 0.12);
      --gold-glow: rgba(184, 146, 63, 0.045);
      --panel: #f6f2ea;
      --panel-soft: #faf8f3;
      --navy: #0c1730;

      --font-serif: Georgia, "Times New Roman", serif;
      --font-sans: Arial, Helvetica, sans-serif;
      --font-mono: "Courier New", Courier, monospace;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: var(--font-serif);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      text-rendering: optimizeLegibility;
      font-feature-settings: "kern", "liga", "clig", "calt";
    }

    body {
      font-size: 11.8pt;
      line-height: 1.64;
    }

    .book {
      position: relative;
      max-width: 760px;
      margin: 0 auto;
      background: var(--paper);
    }

    .frontmatter-block,
    .body-block,
    .closing-block {
      position: relative;
      z-index: 1;
    }

    .body-shell {
      padding: 0 0 18px 0;
    }

    .content {
      padding: 18px 0 24px;
    }

    .running-header {
      position: fixed;
      top: 6mm;
      left: 16mm;
      right: 16mm;
      z-index: 20;
      pointer-events: none;

      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      font: 700 8px var(--font-sans);
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--muted-soft);
    }

    .running-header > div {
      white-space: nowrap;
    }

    .header-title {
      flex: 1 1 auto;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .running-footer {
      position: fixed;
      bottom: 6mm;
      left: 16mm;
      right: 16mm;
      z-index: 20;
      pointer-events: none;

      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;

      font: 700 8px var(--font-sans);
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #7a7466;
    }

    .footer-left,
    .footer-right {
      white-space: nowrap;
    }

    .footer-center {
      flex: 1 1 auto;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-family: var(--font-mono);
      font-size: 7px;
      letter-spacing: 0;
      text-transform: none;
      color: #7a7466;
    }

    .page-number::after {
      content: counter(page);
    }

    .ghost-mark {
      position: fixed;
      top: 44%;
      left: 14%;
      z-index: 0;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;

      transform: rotate(-27deg);
      font-family: var(--font-sans);
      font-size: 38px;
      font-weight: 300;
      letter-spacing: 0.26em;
      text-transform: uppercase;
      color: var(--gold-glow);
    }

    .content h1,
    .content h2,
    .content h3,
    .content h4 {
      page-break-after: avoid;
      color: #151821;
      font-weight: 600;
    }

    .content h1 {
      margin: 28px 0 12px;
      padding-top: 8px;
      border-top: 1px solid var(--rule);
      font-size: 24px;
      line-height: 1.18;
      letter-spacing: -0.01em;
    }

    .content h2 {
      margin: 24px 0 10px;
      font-size: 18px;
      line-height: 1.24;
      color: #1d2535;
    }

    .content h3 {
      margin: 19px 0 9px;
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.3;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: #4b5260;
    }

    .content h4 {
      margin: 16px 0 8px;
      font-family: var(--font-sans);
      font-size: 12.5px;
      line-height: 1.3;
      font-weight: 700;
      color: #303747;
    }

    .content p {
      margin: 0 0 12px;
      color: var(--ink-soft);
      orphans: 2;
      widows: 2;
    }

    .content ul,
    .content ol {
      margin: 0 0 16px 22px;
      padding: 0;
    }

    .content li {
      margin: 0 0 7px;
      color: var(--ink-soft);
    }

    .content blockquote {
      margin: 20px 0;
      padding: 14px 18px;
      border-left: 3px solid var(--gold);
      border-radius: 0 4px 4px 0;
      background: linear-gradient(180deg, var(--panel-soft), transparent);
      color: #3d4450;
      font-style: italic;
      line-height: 1.7;
    }

    .content hr {
      width: 30%;
      margin: 24px 0;
      border: 0;
      border-top: 1px solid var(--rule);
    }

    .content code {
      padding: 2px 6px;
      border-radius: 4px;
      background: #f2efe8;
      color: #2a3140;
      font-family: var(--font-mono);
      font-size: 0.92em;
    }

    .content pre {
      margin: 18px 0;
      padding: 14px;
      overflow: hidden;
      border: 1px solid var(--rule);
      border-radius: 6px;
      background: #f4f1ea;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 9px;
      line-height: 1.52;
    }

    .content pre code {
      padding: 0;
      background: transparent;
      font-size: 9px;
    }

    .content a {
      color: #6f5520;
      text-decoration: none;
      border-bottom: 1px solid var(--gold-soft);
    }

    .content table {
      width: 100%;
      margin: 20px 0;
      border-collapse: collapse;
      border: 1px solid var(--rule);
      font-size: 10.8px;
    }

    .content th,
    .content td {
      padding: 9px 11px;
      border: 1px solid var(--rule);
      vertical-align: top;
    }

    .content th {
      background: var(--panel);
      color: #2f3645;
      text-align: left;
      font-family: var(--font-sans);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .content td {
      background: var(--paper);
    }
  </style>
</head>
<body>
  <div class="ghost-mark">ABRAHAM OF LONDON</div>

  <section class="frontmatter-block">
    <div class="book">
      ${args.coverHtml}
      ${args.imprintHtml}
      ${args.openingHtml ?? ""}
      ${args.tocHtml}
    </div>
  </section>

  <section class="body-block">
    <div class="running-header">
      <div>ABRAHAM OF LONDON</div>
      <div class="header-title">${safeShortTitle}</div>
      <div>${safeIsoDate}</div>
    </div>

    <div class="running-footer">
      <div class="footer-left">${safeEditionLabel}</div>
      <div class="footer-center">${safeFooterText} • FP ${safeFingerprintId}</div>
      <div class="footer-right">Page <span class="page-number"></span></div>
    </div>

    <div class="book body-shell">
      <main class="content">
        ${args.bodyHtml}
      </main>
    </div>
  </section>

  <section class="closing-block">
    <div class="book">
      ${args.closingHtml}
    </div>
  </section>
</body>
</html>`;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const startTime = performance.now();
  const requestId = Math.random().toString(36).slice(2, 8);

  logger.info(`[Ebook:${requestId}] Starting PDF generation`, {
    version: PIPELINE_VERSION,
    nodeVersion: process.version,
    platform: process.platform,
  });

  try {
    const slug = argValue("--slug") || argValue("-s");
    if (!slug) {
      throw new Error("Missing required argument: --slug");
    }

    const outPath = abs(argValue("--out") || `public/assets/downloads/${slug}.pdf`);
    const source = loadEbookSource(slug);
    const manifest = buildEbookManifest(slug);

    const year =
      safeText((source as { date?: string }).date).slice(0, 4) ||
      new Date().getFullYear().toString();

    const isoDate =
      safeText((source as { date?: string }).date) ||
      new Date().toISOString().slice(0, 10);

    logger.info(`[Ebook:${requestId}] Processing publication`, {
      slug,
      title: source.title,
      tier: source.tier,
      outputPath: outPath,
    });

    const fingerprint = buildFingerprintProfile({
      contentId: source.slug,
      title: source.title,
      filename: path.basename(outPath),
      mimeType: "application/pdf",
      tier: source.tier,
      userId: "PUBLIC",
      producer: "SecurePuppeteerPDFGenerator",
      creator: "AoL eBook Pipeline",
      classification: source.tier,
    });

    const watermark = createWatermarkPayload({
      contentId: source.slug,
      userId: "PUBLIC",
      tier: source.tier,
      briefTitle: source.title,
      fingerprint,
    });

    const compileStart = performance.now();
    const compiled = (await compileEbookBody(source.content)) as CompiledBodyResult;
    const openingHtml = compiled.openingHtml ?? null;
    const bodyHtml = compiled.bodyHtml ?? "";
    const stats = compiled.stats;

    logger.info(`[Ebook:${requestId}] Content compiled`, {
      durationMs: Math.round(performance.now() - compileStart),
      blocks: stats?.totalBlocks ?? null,
      chapters: stats?.chapterCount ?? null,
      callouts: stats?.calloutCount ?? null,
      figures: stats?.figureCount ?? null,
    });

    const tocItems = normalizeTocItems((manifest as { toc?: unknown }).toc);

    const coverHtml = renderCoverPage({
  title: source.title,
  subtitle: source.subtitle,
  author: source.author,
  edition: "Institutional Edition",
  year,
  documentId: source.documentId,
  classification: source.tier?.toUpperCase() || "PUBLIC",
  coverImage: undefined, // or your optional premium image path
});

    const imprintHtml = renderImprintPage({
      title: source.title,
      subtitle: source.subtitle,
      author: source.author,
      version: safeText((source as { version?: string }).version, PIPELINE_VERSION),
      year,
      site: "abrahamoflondon.org",
      documentId: safeText((source as { documentId?: string }).documentId, "IMPRINT-001"),
      classification: normalizeClassification(source.tier),
    });

    const tocHtml = renderTocPage(tocItems);

    const closingHtml = renderClosingPage({
  statement:
    "The task of leadership is not self-expression. It is alignment with truth.",
  author: source.author,
  imprint: "Institutional Orientation Edition",
  classification: source.tier?.toUpperCase() || "PUBLIC",
});

    const fullHtml = buildBookShell({
      coverHtml,
      imprintHtml,
      openingHtml,
      tocHtml,
      bodyHtml,
      closingHtml,
      footerText: watermark.footerText,
      fingerprintId: fingerprint.profileId,
      shortTitle: source.title,
      editionLabel: EDITION_LABEL,
      isoDate,
    });

    ensureDirForFile(outPath);

    const generator = new SecurePuppeteerPDFGenerator({
      timeout: PDF_TIMEOUT_MS,
      watchdogMs: WATCHDOG_MS,
      maxRetries: MAX_RETRIES,
      headless: true,
    });

    try {
      const pdfStart = performance.now();

      const result = await generator.generateSecurePDF(fullHtml, outPath, {
        format: "A4",
        title: source.title,
        subtitle: source.subtitle,
        description: source.description
          ? `${source.description} | ${watermark.footerText}`
          : watermark.footerText,
        tier: source.tier,
        userId: "PUBLIC",
        printBackground: true,
        blockExternalRequests: true,
        allowFileUrls: false,
        timeoutMs: PDF_TIMEOUT_MS,
        watchdogMs: WATCHDOG_MS,
      });

      const fileStats = fs.statSync(outPath);
      const totalDuration = performance.now() - startTime;
      const pdfDuration = performance.now() - pdfStart;

      logger.info(`[Ebook:${requestId}] PDF generation complete`, {
        durationMs: Math.round(totalDuration),
        pdfDurationMs: Math.round(pdfDuration),
        filePath: result.filePath,
        fileSize: formatFileSize(fileStats.size),
        pageCount: result.pageCount ?? null,
        watermarkId: watermark.watermarkId,
        fingerprintId: fingerprint.profileId,
      });

      console.log(`\n✨ Abraham of London eBook Pipeline v${PIPELINE_VERSION}`);
      console.log(`📄 "${source.title}"`);
      console.log(`📁 ${result.filePath} (${formatFileSize(fileStats.size)})`);
      console.log(`📑 ${pageLabel(result.pageCount)} · ${Math.round(totalDuration)}ms`);
      console.log(`🔐 Watermark: ${watermark.watermarkId}`);
      console.log(`🧬 Fingerprint: ${fingerprint.profileId}`);
      console.log(`✅ Generation successful\n`);
    } finally {
      await generator.close().catch((error) => {
        logger.error(`[Ebook:${requestId}] Failed to close generator`, {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error(`[Ebook] Fatal pipeline error`, {
      durationMs: Math.round(duration),
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : String(error),
    });

    console.error(`\n❌ Abraham of London eBook Pipeline v${PIPELINE_VERSION}`);
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Duration: ${Math.round(duration)}ms\n`);
    process.exit(1);
  }
}

// ============================================================================
// PROCESS GUARDS
// ============================================================================

process.on("uncaughtException", (error) => {
  logger.error("[Ebook] Uncaught exception", {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
          }
        : String(error),
  });
  console.error("\n❌ Uncaught exception:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("[Ebook] Unhandled rejection", {
    reason:
      reason instanceof Error
        ? {
            message: reason.message,
            stack: reason.stack,
          }
        : String(reason),
  });
  console.error(
    "\n❌ Unhandled rejection:",
    reason instanceof Error ? reason.message : String(reason),
  );
  process.exit(1);
});

main();