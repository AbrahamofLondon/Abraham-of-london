function printPdfHelp() {
  const txt = `
Abraham of London – PDF Renderer

Usage:
  node scripts/render-pdfs.mjs [options]

Options:
  --base=<url>                      Base URL to render from (default: http://localhost:5555)
  --out=<dir>                       Output dir for PDFs (default: public/downloads)
  --manifest=<file>                 JSON manifest path (default: public/downloads/manifest.json)
  --report=<file>                   Run report path (default: scripts/_reports/pdf-report.json)
  --dry=<true|false>                Dry run (no files written) (default: false)
  --strict=<true|false>             Exit 1 on errors/invalid FM (default: false)
  --concurrency=<n>                 Parallel renders (default: 2)
  --retries=<n>                     Retries per page (default: 2)
  --autostart=<true|false>          Start dev server automatically (default: false)
  --dev-cmd="<cmd>"                 Command to start server (default: npm run dev)
  --wait-timeout=<ms>               Wait for base URL (default: 90000 if autostart, else 30000)
  --selector="<css>"                Container to wait for (default: #pdf-root)
  --inject-css=<path>               Extra print CSS file to inject
  --inject-css-text="<css>"         Raw CSS to inject (overrides --inject-css)
  --format=<A4|Letter|...>          Page format (default: A4)
  --margin-top=<mm>                 Top margin (default: 22)
  --margin-right=<mm>               Right margin (default: 18)
  --margin-bottom=<mm>              Bottom margin (default: 22)
  --margin-left=<mm>                Left margin (default: 18)
  --scale=<num>                     PDF scale (default: 1)
  --header="<html>"                 Header template HTML
  --footer="<html>"                 Footer template HTML
  --print-background=<true|false>   Print backgrounds (default: true)
  --prefer-css-page-size=<true|false>  Respect @page size (default: true)
  --media=<print|screen>            Emulated media type (default: print)
  --landscape=<true|false>          Landscape (default: false)
  --page-ranges="<str>"             e.g. 1-3,5,7-8
  --fail-on-missing-assets=<true|false>  Fail when assets missing (default: false)
  --fm-required="<csv>"             Required FM keys (default: title,slug,pdfPath)
  --fm-default-author="<name>"      Default author if missing
  --puppeteer-arg="<arg>"           Extra Chromium arg (repeatable)
  --only="<glob>"                   Only render files matching glob (repeatable)
  --ignore="<glob>"                 Ignore files matching glob (repeatable)
  --help                            Show this help and exit

Examples:
  node scripts/render-pdfs.mjs --autostart=true --dev-cmd="npm run dev:pdf" --strict=true
  node scripts/render-pdfs.mjs --only="board-update-onepager.mdx" --concurrency=1
`.trim();
  console.log(txt + "\n");
}

// after your args parsing:
if (args.help === true || String(args.help).toLowerCase() === "true") {
  printPdfHelp();
  process.exit(0);
}
ursive: true }); }
async function writeText(p, t) { if (!DRY) { await ensureDir(path.dirname(p)); await fs.writeFile(p, t, "utf8"); } }
function sanitizeFilename(name) { return name.replace(/[^A-Za-z0-9._-]/g, "_"); }

/* ───────────── Preflight: base availability ───────────── */
async function waitForBase(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.ok || res.status === 404) return true;
    } catch {}
    await sleep(1000);
  }
  return false;
}

let devProc = null;
async function maybeAutostart() {
  if (!AUTOSTART) return;
  const [cmd, ...cmdArgs] = DEV_CMD.split(/\s+/);
  devProc = spawn(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32" });
  report.record("notes", `Autostarted dev server: ${DEV_CMD}`);
}

/* ───────────── BrandFrame sniff ───────────── */
function checkBrandFrame(filePath, content) {
  const m = content.match(/<BrandFrame\b[^>]*>/g);
  if (m && m.length) report.record("brandFrameUsage", { file: norm(filePath), brandFrameCount: m.length });
}

/* ───────────── Front-matter helpers ───────────── */
function kebab(s) {
  return s.replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^A-Za-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}
function titleCase(s) {
  return s.replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}
async function validateAssetPath(publicRelPath) {
  const abs = path.join(PUBLIC_DIR, publicRelPath.replace(/^\/+/, ""));
  if (!fss.existsSync(abs)) {
    report.record("missingAssets", norm(publicRelPath));
    return false;
  }
  return true;
}

/* ───────────── Print CSS (professional) ───────────── */
const PRINT_CSS = `
@page { size: A4; margin: 20mm 18mm 22mm 18mm; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #000; }
#pdf-root { font-family: "Georgia", "Times New Roman", serif; font-size: 11pt; line-height: 1.5; }
#pdf-root h1, #pdf-root h2, #pdf-root h3 { page-break-after: avoid; orphans: 3; widows: 3; }
#pdf-root p { orphans: 3; widows: 3; hyphens: auto; }
#pdf-root img { max-width: 100%; height: auto; page-break-inside: avoid; }
#pdf-root table { width: 100%; border-collapse: collapse; }
#pdf-root th, #pdf-root td { padding: 4pt; }
hr { page-break-after: avoid; }
.figure, blockquote { page-break-inside: avoid; }
.page-break { page-break-before: always; }
`;

/* ───────────── Puppeteer rendering ───────────── */
async function renderPDF(browser, url, outPath, frontMatter) {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const page = await browser.newPage();
    try {
      // Hardened navigation + idle
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      // Inject print CSS (page expects #pdf-root as container, but we also fallback)
      await page.addStyleTag({ content: PRINT_CSS });
      await page.emulateMediaType("print");

      const headerTemplate = `
        <div style="font-size:8pt;width:100%;text-align:right;padding-right:18mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${escapeHtml(frontMatter.title || "")}
        </div>`;
      const footerTemplate = `
        <div style="font-size:8pt;width:100%;text-align:center;border-top:1px solid #ccc;padding-top:4mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span> • Abraham of London
        </div>`;

      if (!DRY) {
        await page.pdf({
          path: outPath,
          format: "A4",
          margin: { top: "22mm", right: "18mm", bottom: "22mm", left: "18mm" },
          printBackground: true,
          scale: 1,
          displayHeaderFooter: true,
          headerTemplate,
          footerTemplate,
          preferCSSPageSize: true,
          omitBackground: false,
        });
      }
      report.increment("pagesGenerated");
      await page.close();
      return { ok: true };
    } catch (e) {
      await page.close();
      if (attempt === RETRIES) {
        return { ok: false, error: `Failed after ${RETRIES + 1} attempts: ${e.message}` };
      }
      await sleep(1000 * (attempt + 1)); // backoff
    }
  }
  return { ok: false, error: "unreachable" };
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ───────────── Work queue (concurrency) ───────────── */
async function runQueue(items, max, worker) {
  const q = [...items];
  const workers = Array.from({ length: max }, async () => {
    while (q.length) {
      const it = q.shift();
      try { await worker(it); } catch (e) {
        report.record("errors", { task: "queue-item", error: e.message, item: norm(it.filePath || it) });
      }
    }
  });
  await Promise.all(workers);
}

/* ───────────── Ensure downloads page (optional fallback) ─────────────
   Your project already wires a dynamic [slug] page; if missing, we scaffold
   a minimal one that renders MDX into #pdf-root (not indexed).
*/
async function ensureDownloadPage() {
  const pagePath = path.join(ROOT, "pages/downloads/[slug].tsx");
  if (await exists(pagePath)) return;
  const content = `
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import path from "path";
import fs from "fs";
import Head from "next/head";

export default function DownloadPage({ source, frontMatter }) {
  const { title, description } = frontMatter;
  return (
    <>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={description || title} />
        <style dangerouslySetInnerHTML={{ __html: \`${PRINT_CSS}\` }} />
      </Head>
      <main id="pdf-root"><MDXRemote {...source} /></main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const base = path.join(process.cwd(), "content/downloads");
  const paths = fs.readdirSync(base).filter(f => f.endsWith(".mdx")).map(f => ({ params: { slug: f.replace(/\\.mdx$/, "") } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const fp = path.join(process.cwd(), "content/downloads", \`\${params.slug}.mdx\`);
  const raw = fs.readFileSync(fp, "utf8");
  const { content, data } = matter(raw);
  const source = await serialize(content, { scope: data });
  return { props: { source, frontMatter: data } };
};
`.trim() + "\n";
  await writeText(pagePath, content);
  report.record("notes", `Created fallback page: ${norm(pagePath)}`);
}

/* ───────────── Main ───────────── */
(async () => {
  console.log(`\n🚀 PDF Renderer v2 (dry=${DRY}, strict=${STRICT})`);
  console.log(`   base=${BASE_URL}, out=${norm(OUT_DIR)}, conc=${CONCURRENCY}, retries=${RETRIES}`);
  await ensureDir(path.dirname(REPORT_PATH));
  await ensureDir(OUT_DIR);

  // sanity: package.json
  try { JSON.parse(await fs.readFile(path.join(ROOT, "package.json"), "utf8")); }
  catch (e) { report.record("errors", { task: "package.json", error: e.message }); if (STRICT) throw e; }

  await ensureDownloadPage();

  // collect MDX
  let mdxNames = [];
  try {
    mdxNames = (await fs.readdir(CONTENT_DIR)).filter((f) => f.endsWith(".mdx"));
  } catch (e) {
    report.record("errors", { task: "collect", error: e.message });
  }
  const mdxFiles = mdxNames.map((f) => path.join(CONTENT_DIR, f));
  if (!mdxFiles.length) {
    report.record("errors", { task: "collect", error: "No MDX files in content/downloads" });
    await flushReport(1);
  }

  // base availability
  if (AUTOSTART) await maybeAutostart();
  const ok = await waitForBase(BASE_URL, AUTOSTART ? 90000 : 30000);
  if (!ok) {
    report.record("errors", { task: "preflight", error: `Base URL not reachable: ${BASE_URL}` });
    await killDev();
    await flushReport(1);
  }

  const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });

  const manifest = {};
  await runQueue(
    mdxFiles.map((filePath) => ({ filePath })),
    CONCURRENCY,
    async ({ filePath }) => {
      report.increment("pagesProcessed");
      let raw = await fs.readFile(filePath, "utf8");
      const parsed = matter(raw);
      const content = parsed.content;
      const fm = { ...parsed.data };

      checkBrandFrame(filePath, content);

      // validate / autofix FM
      const baseName = path.basename(filePath);
      if (!fm.slug) fm.slug = kebab(baseName);
      if (!fm.title) fm.title = titleCase(fm.slug);
      if (!fm.pdfPath) fm.pdfPath = `/downloads/${sanitizeFilename(fm.slug)}.pdf`;

      // persist FM fixes if any
      const fixedStr = matter.stringify(content, fm);
      if (fixedStr !== raw && !DRY) {
        await fs.writeFile(filePath, fixedStr, "utf8");
        report.record("invalidFrontMatter", { file: norm(filePath), fixed: ["slug/title/pdfPath"] });
      }

      // asset validation
      if (fm.coverImage) await validateAssetPath(fm.coverImage);
      // ensure out filename from pdfPath
      const outName = sanitizeFilename(path.basename(fm.pdfPath));
      const outPath = path.join(OUT_DIR, outName);

      // render
      const url = new URL(`/downloads/${fm.slug}`, BASE_URL).toString();
      const res = await renderPDF(browser, url, outPath, fm);
      if (!res.ok) {
        report.record("errors", { file: norm(filePath), slug: fm.slug, out: norm(outPath), error: res.error });
        if (STRICT) throw new Error(res.error);
      } else {
        report.record("outputs", { slug: fm.slug, url, out: norm(outPath) });
        manifest[fm.slug] = { title: fm.title, pdf: `/${norm(path.relative(PUBLIC_DIR, outPath))}` };
      }
    }
  );

  await browser.close();
  await killDev();

  // write manifest
  if (!DRY) {
    await ensureDir(path.dirname(MANIFEST_PATH));
    await writeText(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  }

  await flushReport(0);
})().catch(async (e) => {
  report.record("errors", { task: "FATAL", error: e.message });
  await killDev();
  await flushReport(1);
});

/* ───────────── helpers ───────────── */
async function flushReport(code) {
  report.finalize();
  await writeText(REPORT_PATH, JSON.stringify(report.get(), null, 2));
  console.log(`\n✅ PDF pass complete. Report: ${norm(REPORT_PATH)}`);
  console.log(`Processed: ${report.data.pagesProcessed} | Generated: ${report.data.pagesGenerated}`);
  console.log(`Errors: ${report.data.errors.length} | Missing assets: ${report.data.missingAssets.length}`);
  if (STRICT && (report.data.errors.length || report.data.invalidFrontMatter.length)) code = 1;
  process.exit(code);
}
async function killDev() {
  if (devProc && !devProc.killed) {
    try { devProc.kill(process.platform === "win32" ? "SIGTERM" : "SIGINT"); } catch {}
    devProc = null;
  }
}
