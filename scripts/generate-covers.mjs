// scripts/generate-covers.mjs
import fs from "node:fs/promises";
import path from "path";
import { glob } from "glob";
import matter from "gray-matter";
import sharp from "sharp";

const ROOT = process.cwd();
const CONTENT_DIRS = ["content/posts", "_posts", "posts", "data/posts"];

const BLOG_OUT = path.join(ROOT, "public/assets/images/blog");
const SOCIAL_OUT = path.join(ROOT, "public/assets/images/social");

// ---------- helpers ----------
function toSlug(fp, fm) {
  if (fm?.slug) return String(fm.slug).trim();
  const base = path.basename(fp).replace(/\.(md|mdx)$/i, "");
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function esc(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function svgForTitle({ title, subtitle = "Abraham of London", w, h }) {
  // Minimal, crisp, embeddable SVG with gradient and text wrapping.
  // (Wrapping is manual via <foreignObject> + simple CSS.)
  return `
  <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0b2e1f"/>
        <stop offset="100%" stop-color="#1a6b47"/>
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g filter="url(#shadow)">
      <circle cx="${w - 180}" cy="160" r="110" fill="rgba(255,255,255,0.08)"/>
      <circle cx="${w - 80}" cy="80" r="48" fill="rgba(255,255,255,0.10)"/>
    </g>

    <foreignObject x="80" y="120" width="${w - 160}" height="${h - 200}">
      <div xmlns="http://www.w3.org/1999/xhtml"
           style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial; color: #fff; display: flex; flex-direction: column; height: 100%;">
        <div style="font-size: 64px; line-height: 1.1; font-weight: 800; margin-bottom: 18px; word-wrap: break-word;">
          ${esc(title)}
        </div>
        <div style="font-size: 26px; opacity: .9; font-weight: 500;">
          ${esc(subtitle)}
        </div>
      </div>
    </foreignObject>
  </svg>
  `.trim();
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeJpgFromSvg(svg, outPath, { width, height, quality = 90 }) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 220 })
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toFile(outPath);
}

async function writeWebpFromSvg(svg, outPath, { width, height, quality = 92 }) {
  const buf = Buffer.from(svg);
  await sharp(buf, { density: 220 })
    .resize(width, height, { fit: "cover" })
    .webp({ quality })
    .toFile(outPath);
}

// ---------- main ----------
async function run() {
  await ensureDir(BLOG_OUT);
  await ensureDir(SOCIAL_OUT);

  const patterns = CONTENT_DIRS.map((d) => path.join(ROOT, d, "**/*.{md,mdx}"));
  const files = (await Promise.all(patterns.map((p) => glob(p)))).flat();

  let made = 0;

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8");
    const { data: fm } = matter(raw);
    const slug = toSlug(file, fm);
    const title = fm?.title || "Untitled Post";

    const blogOut = path.join(BLOG_OUT, `${slug}.jpg`);
    const ogOut = path.join(SOCIAL_OUT, `${slug}-og.jpg`);

    // Skip if both exist
    try {
      await fs.access(blogOut);
      await fs.access(ogOut);
      continue;
    } catch {}

    const svgBlog = svgForTitle({
      title,
      subtitle: "Blog • Abraham of London",
      w: 1600,
      h: 900,
    });
    const svgOG = svgForTitle({
      title,
      subtitle: "abrahamoflondon.org",
      w: 1200,
      h: 630,
    });

    if (!(await exists(blogOut))) {
      await writeJpgFromSvg(svgBlog, blogOut, {
        width: 1600,
        height: 900,
        quality: 90,
      });
      made++;
    }
    if (!(await exists(ogOut))) {
      await writeJpgFromSvg(svgOG, ogOut, {
        width: 1200,
        height: 630,
        quality: 92,
      });
      made++;
    }
  }

  // Site-wide OG assets if missing
  const siteOg = path.join(SOCIAL_OUT, "og-image.jpg");
  const siteTw = path.join(SOCIAL_OUT, "twitter-image.webp");
  if (!(await exists(siteOg))) {
    const svg = svgForTitle({
      title: "Abraham of London",
      subtitle: "Leadership • Fatherhood • Strategy",
      w: 1200,
      h: 630,
    });
    await writeJpgFromSvg(svg, siteOg, {
      width: 1200,
      height: 630,
      quality: 92,
    });
    made++;
  }
  if (!(await exists(siteTw))) {
    const svg = svgForTitle({
      title: "Abraham of London",
      subtitle: "Leadership • Fatherhood • Strategy",
      w: 1600,
      h: 900,
    });
    await writeWebpFromSvg(svg, siteTw, {
      width: 1600,
      height: 900,
      quality: 92,
    });
    made++;
  }

  console.log(`generate-covers: created ${made} image(s).`);
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
