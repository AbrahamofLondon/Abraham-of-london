#!/usr/bin/env node
/**
 * Abraham of London - PDF Renderer (World-Class Quality)
 * ---------------------------------------------------------
 * Goals:
 * - Generate PDFs from MDX content in content/downloads.
 * - Use standard YAML parser (gray-matter) for robust front-matter handling.
 * - Apply professional-grade print settings (margins, scale, headers/footers).
 * - Validate front-matter and assets (e.g., coverImage).
 *
 * Usage:
 * node scripts/render-pdfs.mjs [--base=http://localhost:5555] [--out=public/downloads] [--dry=false] [--strict=false]
 * [--report=scripts/_reports/pdf-report.json]
 */
import puppeteer from "puppeteer";
import fs from "node:fs/promises";
import path from "path";
import { URL } from "node:url";
import matter from "gray-matter"; // Using a proper YAML parser
import { spawnSync } from "node:child_process";

const args = Object.fromEntries(
  process.argv.slice(2).map((s) => {
    const [k, v] = s.replace(/^-+/, "").split("=");
    return [k, v === undefined ? true : v];
  })
);
const DRY = String(args.dry ?? "false").toLowerCase() === "true";
const STRICT = String(args.strict ?? "false").toLowerCase() === "true";
const BASE_URL = args.base ?? "http://localhost:5555";
const OUT_DIR = path.resolve(args.out ?? "public/downloads");
const REPORT_PATH = args.report || "scripts/_reports/pdf-report.json";
const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content/downloads");
const PUBLIC_ASSETS = path.join(ROOT, "public/assets/images");
const norm = (p) => p.replaceAll("\\", "/");

/* ───────────────────── Report Class ───────────────────── */

class Report {
  constructor() {
    this.data = {
      startedAt: new Date().toISOString(),
      dryRun: DRY,
      strict: STRICT,
      baseUrl: BASE_URL,
      outDir: norm(OUT_DIR),
      pagesProcessed: 0,
      pagesGenerated: 0,
      errors: [],
      missingAssets: [],
      invalidFrontMatter: [],
      brandFrameUsage: [],
      notes: [],
      endedAt: null,
    };
  }
  record(key, value) {
    if (Array.isArray(this.data[key])) this.data[key].push(value);
    else this.data[key] = value;
  }
  increment(key) {
    this.data[key]++;
  }
  finalize() {
    this.data.endedAt = new Date().toISOString();
  }
  get() {
    try {
      return JSON.parse(JSON.stringify(this.data));
    } catch {
      return { ...this.data, errors: [], notes: [] };
    }
  }
}

const report = new Report();

/* ───────────────────── Utilities ──────────────────────── */

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function write(p, content) {
  if (DRY) return;
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, content, "utf8");
}

function kebab(s) {
  return s
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

async function validateAsset(assetPath) {
  const absPath = path.join(ROOT, "public", assetPath);
  if (!(await exists(absPath))) {
    report.record("missingAssets", norm(assetPath));
    return false;
  }
  return true;
}

/* ───────────────── Front-Matter & Page Coordination ───── */

// REMOVED: extractFM and parseFM (replaced by gray-matter)

async function ensureDownloadPage() {
  const pagePath = path.join(ROOT, "pages/downloads/[slug].tsx");
  if (!(await exists(pagePath))) {
    // NOTE: Added 'matter' import for completeness, though it's likely installed.
    const pageContent = `
import { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import matter from "gray-matter";
import path from "path";
import fs from "fs";
import Head from "next/head";

// World-class PDF pages must not be indexable by search engines
// and must include proper PDF/Print styling hooks.
export default function DownloadPage({ source, frontMatter }) {
  const { title, pdfPath, coverImage, description } = frontMatter;
  return (
    <>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content={description || title} />
        {/* Print Stylesheet Hook */}
        <style dangerouslySetInnerHTML={{ __html: \`
          @page { size: A4; margin: 20mm; }
          .pdf-container {
            font-family: serif;
            color: #000;
            line-height: 1.5;
            padding: 0;
            margin: 0;
            page-break-after: auto;
          }
          .pdf-container h1, .pdf-container h2, .pdf-container h3 {
            page-break-after: avoid;
          }
          .pdf-container img {
            max-width: 100%;
            height: auto;
          }
          .no-print { display: none !important; }
        \`}} />
      </Head>
      <div id="pdf-container" className="pdf-container no-print">
        {/* This content is only for Puppeteer/Print view */}
        <MDXRemote {...source} />
      </div>
    </>
  );
}

// ... (getStaticPaths and getStaticProps remain the same as they are standard)

export const getStaticPaths: GetStaticPaths = async () => {
  const files = fs.readdirSync(path.join(process.cwd(), "content/downloads"));
  const paths = files
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => ({ params: { slug: f.replace(/\\.mdx$/, "") } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const filePath = path.join(process.cwd(), "content/downloads", \`\${params.slug}.mdx\`);
  const { content, data } = matter(fs.readFileSync(filePath, "utf8"));
  const source = await serialize(content, { scope: data });
  return { props: { source, frontMatter: data } };
};
`;
    await write(pagePath, pageContent);
    report.record("notes", `Created dynamic download page: ${norm(pagePath)}`);
  }
}

/* ───────────────── PDF Rendering ──────────────────────── */

async function renderPDF(browser, url, outPath, frontMatter) {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 45000 }); // Increased timeout
    await page.waitForSelector("#pdf-container", { timeout: 15000 }); // Wait for the specific container

    // Apply high-quality print settings
    await page.emulateMediaType("print");

    // Optional: Add a simple header/footer for world-class branding
    const headerTemplate = `<div style="font-size: 8pt; width: 100%; text-align: right; padding-right: 20mm;">${frontMatter.title}</div>`;
    const footerTemplate = `<div style="font-size: 8pt; width: 100%; text-align: center; border-top: 1px solid #ccc;"><span class="pageNumber"></span> / <span class="totalPages"></span> | Abraham of London</div>`;

    await page.pdf({
      path: DRY ? undefined : outPath,
      format: "A4",
      margin: {
        top: "25mm", // More space for header
        right: "20mm",
        bottom: "25mm", // More space for footer
        left: "20mm",
      },
      scale: 1, // Ensures perfect scale (1 is default)
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
    });
    report.increment("pagesGenerated");
    return { status: "success" };
  } catch (e) {
    report.record("errors", { url, outPath: norm(outPath), error: e.message, slug: frontMatter.slug });
    return { status: "failed", error: e.message };
  } finally {
    await page.close();
  }
}

/* ───────────────── Check BrandFrame Usage ─────────────── */

async function checkBrandFrame(filePath, content) {
  const matches = content.match(/<BrandFrame\b[^>]*>/g);
  if (matches) {
    report.record("brandFrameUsage", { file: norm(filePath), brandFrameCount: matches.length });
  }
}

/* ───────────────── Main Rendering Logic ──────────────── */

(async () => {
  console.log(`\n🚀 PDF Renderer (dry=${DRY}, strict=${STRICT})`);
  console.log(`    base=${BASE_URL}, out=${norm(OUT_DIR)}`);
  console.log(`    report=${norm(REPORT_PATH)}`);

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Validate package.json (kept this check for environment robustness)
  try {
    await fs.readFile(path.join(ROOT, "package.json")).then(JSON.parse);
  } catch (e) {
    report.record("errors", { task: "validate-package-json", error: `Invalid package.json: ${e.message}` });
    if (STRICT) throw new Error(`Invalid package.json: ${e.message}`);
  }

  // Ensure dynamic download page (with enhanced print/SEO settings)
  await ensureDownloadPage();

  // Collect MDX files
  const files = (await fs.readdir(CONTENT_DIR))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(CONTENT_DIR, f));

  if (!files.length) {
    report.record("errors", { task: "collect-files", error: "No MDX files found in content/downloads" });
    if (STRICT) throw new Error("No MDX files found in content/downloads");
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] }); // Added safety args

    for (const filePath of files) {
      let fmContent = null;
      try {
        report.increment("pagesProcessed");
        fmContent = await fs.readFile(filePath, "utf8");
        const { content, data: frontMatter } = matter(fmContent);

        // 1. Check for BrandFrame usage
        await checkBrandFrame(filePath, content);

        // 2. Validate and Auto-Fix Front-Matter
        const requiredFields = ["title", "slug", "pdfPath"];
        const missingFields = requiredFields.filter((k) => !frontMatter[k]);

        if (missingFields.length) {
          report.record("invalidFrontMatter", { file: norm(filePath), missing: missingFields });
          if (STRICT) continue;

          // --- Auto-Fix Logic (Enhanced to maintain proper YAML structure) ---
          let title = frontMatter.title;
          let slug = frontMatter.slug;
          let pdfPath = frontMatter.pdfPath;

          if (!slug) {
            slug = kebab(path.basename(filePath));
            report.record("notes", `Auto-slug: ${slug} in ${norm(filePath)}`);
          }
          if (!title) {
            title = slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
            report.record("notes", `Auto-title: ${title} in ${norm(filePath)}`);
          }
          if (!pdfPath) {
            pdfPath = `/downloads/${slug}.pdf`;
            report.record("notes", `Auto-pdfPath: ${pdfPath} in ${norm(filePath)}`);
          }

          const newFrontMatter = matter.stringify(content, { ...frontMatter, title, slug, pdfPath });

          if (!DRY) {
            await write(filePath, newFrontMatter);
            report.record("notes", `Fixed and wrote front-matter for ${norm(filePath)}`);
          }
        }

        // 3. Asset Validation
        if (frontMatter.coverImage && !(await validateAsset(frontMatter.coverImage))) {
          if (STRICT) continue;
        }

        // 4. PDF Rendering
        const url = new URL(`/downloads/${frontMatter.slug}`, BASE_URL).toString();
        const outPath = path.join(OUT_DIR, `${frontMatter.slug}.pdf`);
        const result = await renderPDF(browser, url, outPath, frontMatter);

        if (result.status === "success") {
          report.record("notes", `Generated PDF: ${norm(outPath)} for ${url}`);
        } else if (STRICT) {
          throw new Error(`PDF generation failed for ${frontMatter.slug}: ${result.error}`);
        }

      } catch (e) {
        report.record("errors", { file: norm(filePath), error: e.message });
        if (STRICT) throw e;
      }
    }

  } catch (fatalError) {
    report.record("errors", { task: "FATAL", error: fatalError.message });
    console.error(`\n❌ FATAL ERROR in PDF generation: ${fatalError.message}`);
    // If browser exists, ensure it is closed on fatal error
    if (browser) await browser.close();

    report.finalize();
    await write(REPORT_PATH, JSON.stringify(report.get(), null, 2));
    process.exit(1);
  } finally {
    // Ensure browser closes even if the loop completes
    if (browser) await browser.close();
  }


  // Final Report Generation
  report.finalize();
  await write(REPORT_PATH, JSON.stringify(report.get(), null, 2));
  console.log(`\n✅ PDF rendering completed. See report: ${norm(REPORT_PATH)}\n`);
  console.log(`Pages processed: ${report.data.pagesProcessed}`);
  console.log(`Pages generated: ${report.data.pagesGenerated}`);
  console.log(`Errors: ${report.data.errors.length}`);
  console.log(`Missing assets: ${report.data.missingAssets.length}`);
  console.log(`Invalid front-matter: ${report.data.invalidFrontMatter.length}`);

  if (STRICT && (report.data.errors.length || report.data.invalidFrontMatter.length)) {
    console.error("❌ Strict mode: failing due to errors.");
    process.exit(1);
  }
  process.exit(0);
})();