// Node ESM script: auto-discovers Markdown/MDX/HTML docs, renders branded PDFs.
// Usage:
//   node scripts/make-pdfs.mjs [--all] [--watch] [--open] [--debug]
//
// Inputs discovered automatically:
//   - content/downloads/**/*.{md,mdx,html}
//   - content/events/**/*.{md,mdx}   (only if front matter has pdf: true)
//   - scripts/pdfs/static/**/*.html  (raw HTML docs)
// Output:
//   - public/downloads/<FileName>.pdf
//
// Front matter keys (optional):
//   title, author, date, excerpt, coverImage, pdfFileName, file, pdf (boolean)
// If `file` points to a .pdf (already supplied), it will be copied/renamed.
//
// CI behavior:
// - Skips by default when CI/NETLIFY is set, unless PDF_ON_CI=1 is present.

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import anchor from "markdown-it-anchor";
import puppeteer from "puppeteer";
import fg from "fast-glob";

// ───────────────────────────────────────────────────────────
// CI guard
// ───────────────────────────────────────────────────────────
if ((process.env.CI || process.env.NETLIFY) && process.env.PDF_ON_CI !== "1") {
  console.log("[pdfs] CI detected and PDF_ON_CI != '1' — skipping.");
  process.exit(0);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argv = new Set(process.argv.slice(2));
const FORCE_ALL = argv.has("--all");
const WATCH = argv.has("--watch");
const OPEN = argv.has("--open");
const DEBUG = argv.has("--debug");

// Paths
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const PUBLIC_DOWNLOADS = path.join(PUBLIC_DIR, "downloads");
const BRAND_DIR = path.join(ROOT, "scripts", "pdfs");
const BRAND_CSS = path.join(BRAND_DIR, "brand.css");
const BRAND_TEMPLATE = path.join(BRAND_DIR, "template.html");
const CACHE_DIR = path.join(ROOT, ".pdfcache");

const CONTENT_DIRS = [
  "content/downloads/**/*.{md,mdx,html}",
  "content/events/**/*.{md,mdx}",
  "scripts/pdfs/static/**/*.html",
];

// Utils
const log = (...a) => console.log("[pdfs]", ...a);
const dbg = (...a) => DEBUG && console.log("[pdfs:debug]", ...a);

const ensureDir = async (p) => fs.mkdir(p, { recursive: true });
const exists = async (p) => !!(await fs.stat(p).catch(() => false));
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9\-_. ]+/g, "")
    .trim()
    .replace(/\s+/g, "-");

const toOutName = (fm, sourcePath) => {
  if (fm?.pdfFileName) return fm.pdfFileName.replace(/\.pdf$/i, "") + ".pdf";
  if (fm?.file && /\.pdf$/i.test(fm.file)) return path.basename(fm.file);
  if (fm?.title) return slugify(fm.title) + ".pdf";
  return slugify(path.parse(sourcePath).name) + ".pdf";
};

const readOr = async (p, orStr) => (await exists(p) ? fs.readFile(p, "utf8") : orStr);

// Markdown renderer
const md = new MarkdownIt({ html: false, linkify: true, typographer: true })
  .use(anchor, { permalink: anchor.permalink.ariaHidden({}) })
  .use(mila, { attrs: { target: "_blank", rel: "noopener" } });

// HTML template (fallbacks)
const FALLBACK_CSS = `
:root{ --brand:#1B4332; --ink:#111827; --muted:#6B7280; --gold:#D4AF37; }
*{ box-sizing:border-box; }
body{ font: 14px/1.6 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:var(--ink); margin:0; }
.header{ padding:18mm 16mm 0; }
.brand{ letter-spacing:.08em; text-transform:uppercase; font-weight:700; color:var(--brand); }
.title{ font: 700 28px/1.2 Georgia, "Times New Roman", serif; margin:.25rem 0; }
.meta{ color:var(--muted); font-size:12px; }
.cover{ border-top: 2px solid var(--brand); margin:8mm 0 0; }
.page{ padding:0 16mm 16mm; }
hr{ border:0; border-top:1px solid #e5e7eb; margin:16px 0; }
h1,h2,h3{ font-family: Georgia, "Times New Roman", serif; }
h1{ font-size:24px; margin:20px 0 10px; }
h2{ font-size:18px; margin:16px 0 8px; }
blockquote{ margin:12px 0; padding-left:12px; border-left:3px solid #e5e7eb; color:#374151; }
code{ background:#f7f7f9; padding:.1em .35em; border-radius:4px; }
.footer{ position: fixed; bottom: 10px; right: 16mm; font-size: 10px; color: #9CA3AF;}
`;

const FALLBACK_TEMPLATE = (payload, baseHref) => `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${payload.title}</title>
<base href="${baseHref}">
<style>${payload.brandCss}</style>
</head>
<body>
  <div class="header">
    <div class="brand">Abraham of London</div>
    <div class="title">${payload.title}</div>
    ${payload.excerpt ? `<div class="meta">${payload.excerpt}</div>` : ""}
    <div class="meta">${[payload.author, payload.prettyDate].filter(Boolean).join(" — ")}</div>
    ${payload.coverImage ? `<div class="cover"><img src="${payload.coverImage}" style="width:100%; margin-top:8mm;"/></div>` : ""}
  </div>
  <div class="page">
    ${payload.html}
  </div>
  <div class="footer"><span class="brand">A/L</span> — ${payload.title}</div>
</body>
</html>`;

// Date prettifier
const isDateOnly = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
function prettyDate(s, tz = "Europe/London") {
  if (!s) return "";
  if (isDateOnly(s)) s = `${s}T00:00:00Z`;
  const d = new Date(s);
  if (Number.isNaN(d.valueOf())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

// file:// helper
function toFileURL(absPath) {
  return "file://" + absPath.replace(/\\/g, "/");
}
const PUBLIC_BASE_HREF = toFileURL(PUBLIC_DIR) + "/"; // used in <base href="...">

// Discover
async function discover() {
  const matches = await fg(CONTENT_DIRS, {
    cwd: ROOT,
    onlyFiles: true,
    absolute: true,
    dot: false,
  });

  const items = [];
  for (const abs of matches) {
    const ext = path.extname(abs).toLowerCase();
    if (ext === ".html") {
      items.push({ kind: "html", abs });
      continue;
    }
    if (ext === ".md" || ext === ".mdx") {
      const raw = await fs.readFile(abs, "utf8");
      const { data } = matter(raw);
      const inEvents = /[/\\]content[/\\]events[/\\]/.test(abs);
      if (inEvents && data?.pdf !== true) {
        dbg("skip (event without pdf:true):", abs);
        continue;
      }
      items.push({ kind: "md", abs, fm: data });
    }
  }
  return items;
}

// Build one
async function buildOne(browser, item) {
  const brandCss = await readOr(BRAND_CSS, FALLBACK_CSS);
  const tplStr = await readOr(BRAND_TEMPLATE, null);

  let html = "";
  let fm = {};
  let srcBuf;

  if (item.kind === "md") {
    const raw = await fs.readFile(item.abs, "utf8");
    srcBuf = Buffer.from(raw);
    const parsed = matter(raw);
    fm = parsed.data || {};
    const body = parsed.content || "";
    html = md.render(body);
  } else {
    html = await fs.readFile(item.abs, "utf8");
    srcBuf = Buffer.from(html);
    fm = {};
  }

  // If front-matter points to a ready-made PDF
  if (fm.file && /\.pdf$/i.test(fm.file)) {
    const srcPdf = path.isAbsolute(fm.file)
      ? fm.file
      : path.join(PUBLIC_DIR, fm.file.replace(/^\/+/, ""));
    const outName = toOutName(fm, item.abs);
    const outPath = path.join(PUBLIC_DOWNLOADS, outName);
    await ensureDir(PUBLIC_DOWNLOADS);
    if (await exists(srcPdf)) {
      await fs.copyFile(srcPdf, outPath);
      log("copied existing pdf →", path.relative(ROOT, outPath));
      return outPath;
    } else {
      log("warn: file declared but not found:", fm.file);
      // fall through to render if we have HTML
    }
  }

  // Normalize coverImage to file:// if it starts with "/" (served from /public)
  const coverImage =
    fm.coverImage && fm.coverImage.startsWith("/")
      ? PUBLIC_BASE_HREF + fm.coverImage.replace(/^\//, "")
      : fm.coverImage || "";

  const payload = {
    title: fm.title || path.parse(item.abs).name.replace(/[-_]/g, " "),
    author: fm.author || "Abraham of London",
    excerpt: fm.excerpt || "",
    prettyDate: prettyDate(fm.date),
    coverImage,
    brandCss,
    html,
  };

  // Build HTML (inject <base> to resolve /assets/... from /public)
  const templateHtml =
    tplStr && tplStr.includes("{{content}}")
      ? tplStr
          .replace(/{{\s*title\s*}}/g, payload.title)
          .replace(/{{\s*author\s*}}/g, payload.author)
          .replace(/{{\s*excerpt\s*}}/g, payload.excerpt)
          .replace(/{{\s*date\s*}}/g, payload.prettyDate)
          .replace(/{{\s*coverImage\s*}}/g, payload.coverImage || "")
          .replace(/{{\s*brandCss\s*}}/g, payload.brandCss)
          .replace(/{{\s*content\s*}}/g, payload.html)
          .replace(/<head>/i, `<head>\n<base href="${PUBLIC_BASE_HREF}">`)
      : FALLBACK_TEMPLATE(payload, PUBLIC_BASE_HREF);

  const outName = toOutName(fm, item.abs);
  const outPath = path.join(PUBLIC_DOWNLOADS, outName);

  // Hash cache (source + css + template)
  const hash = sha(
    Buffer.concat([
      srcBuf || Buffer.from(""),
      Buffer.from(payload.brandCss),
      Buffer.from(templateHtml),
    ])
  );
  const cacheKey = path.join(CACHE_DIR, outName + ".sha");
  const oldHash = (await exists(cacheKey)) ? (await fs.readFile(cacheKey, "utf8")).trim() : "";
  if (!FORCE_ALL && oldHash === hash && (await exists(outPath))) {
    dbg("cache hit:", outName);
    return outPath;
  }

  // Puppeteer launch (honor PUPPETEER_EXECUTABLE_PATH if present)
  const launchOpts = {};
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOpts.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const page = await (await browser).newPage();
  await page.setContent(templateHtml, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: "18mm", bottom: "16mm", left: "16mm", right: "16mm" },
    displayHeaderFooter: false,
  });
  await page.close();
  await ensureDir(CACHE_DIR);
  await fs.writeFile(cacheKey, hash, "utf8");

  log("✅", path.relative(ROOT, outPath));
  return outPath;
}

async function buildAll() {
  const items = await discover();
  if (items.length === 0) {
    log("No sources found — add MD/MDX/HTML to content/downloads or scripts/pdfs/static.");
    return [];
  }
  const browser = puppeteer.launch({ headless: "new" });
  const outs = [];
  try {
    for (const item of items) {
      try {
        const outPath = await buildOne(browser, item);
        if (outPath) outs.push(outPath);
      } catch (err) {
        console.error("[pdfs:error]", item.abs, err?.message || err);
      }
    }
  } finally {
    (await browser).close();
  }
  return outs;
}

async function main() {
  await ensureDir(PUBLIC_DOWNLOADS);
  const outs = await buildAll();

  if (OPEN && outs.length) {
    const opener =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    const { exec } = await import("node:child_process");
    for (const o of outs) exec(`${opener} "${o}"`);
  }

  if (WATCH) {
    log("watching for changes…");
    const watcher = chokidar.watch(CONTENT_DIRS, { cwd: ROOT, ignoreInitial: true });
    watcher.on("all", async () => {
      try {
        await buildAll();
      } catch (e) {
        console.error("[pdfs:watch]", e);
      }
    });
  }
}
