import path from "node:path";
import fsp from "node:fs/promises";
import { constants } from "node:fs";
import glob from "fast-glob";
import matter from "gray-matter";
import sharp from "sharp";

const ROOT = process.cwd();
const CONTENT = path.join(ROOT, "content");
const PUBLIC_DIR = path.join(ROOT, "public");
const DO_FIX = process.argv.includes("--fix");

const HERO_MIN_W = 1200;
const HERO_MIN_B = 40 * 1024; // 40KB
const IMG_MIN_W  = 800;
const IMG_MIN_B  = 20 * 1024; // 20KB

async function exists(p){ try{ await fsp.access(p, constants.F_OK); return true; } catch { return false; } }

function brandSVG(title = "Abraham of London", subtitle = "Signature Collection") {
  return `
<svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0B2E1F"/><stop offset="1" stop-color="#16573D"/></linearGradient></defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect x="80" y="80" width="1440" height="740" rx="24" fill="#FAF7F2" fill-opacity=".08" stroke="#C5A352" stroke-opacity=".35"/>
  <text x="800" y="445" text-anchor="middle" fill="#FAF7F2" font-family="Playfair Display, Georgia, serif" font-size="72" font-weight="700">${title}</text>
  <text x="800" y="510" text-anchor="middle" fill="#E9D79A" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="500">${subtitle}</text>
</svg>`.trim();
}

async function writePlaceholder(absPath, title) {
  const svg = brandSVG(title);
  await fsp.mkdir(path.dirname(absPath), { recursive: true });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  await fsp.writeFile(absPath, png);
}

async function imageMeta(abs) {
  try {
    const buf = await fsp.readFile(abs);
    const meta = await sharp(buf).metadata();
    return { width: meta.width || 0, size: buf.length };
  } catch {
    return { width: 0, size: 0 };
  }
}

async function collectContentImages() {
  const out = [];
  const files = await glob(
    ["blog/**/*.mdx","books/**/*.mdx","events/**/*.mdx","downloads/**/*.mdx","resources/**/*.md","strategy/**/*.md"],
    { cwd: CONTENT }
  );

  for (const rel of files) {
    const abs = path.join(CONTENT, rel);
    const raw = await fsp.readFile(abs, "utf8");
    const { data } = matter(raw);
    const section = rel.split(path.sep)[0];
    const title = data.title || rel;

    const keys = section === "events" ? ["heroImage"] : ["coverImage"];
    for (const k of keys) {
      if (!data[k]) continue;
      const p = String(data[k]);
      if (!p.startsWith("/")) continue;
      out.push({ file: rel, title, type: "cover", publicPath: p });
    }
  }
  return out;
}

async function walkPublicImages() {
  const files = await glob(["assets/images/**/*.{png,jpg,jpeg,webp,avif,svg}"], { cwd: PUBLIC_DIR });
  return files.map(rel => ({ file: `public/${rel}`, type: "asset", publicPath: `/${rel.replace(/\\/g,"/")}` }));
}

async function main() {
  const report = { checked: 0, upgraded: [], weak: [], missing: [], ok: [] };
  const candidates = [...await collectContentImages(), ...await walkPublicImages()];

  for (const item of candidates) {
    const { publicPath, type, title } = item;
    const abs = path.join(PUBLIC_DIR, publicPath.replace(/^\//,""));
    const present = await exists(abs);

    if (!present) {
      report.missing.push(item);
      if (DO_FIX) {
        await writePlaceholder(abs, title || "Abraham of London");
        report.upgraded.push({ ...item, action: "created" });
      }
      continue;
    }

    const meta = await imageMeta(abs);
    report.checked++;

    const isHero = type === "cover";
    const minW = isHero ? HERO_MIN_W : IMG_MIN_W;
    const minB = isHero ? HERO_MIN_B : IMG_MIN_B;

    if ((meta.width || 0) < minW || (meta.size || 0) < minB) {
      report.weak.push({ ...item, width: meta.width, bytes: meta.size, minW, minB });
      if (DO_FIX) {
        await writePlaceholder(abs, title || "Abraham of London");
        report.upgraded.push({ ...item, action: "replaced", before: { width: meta.width, bytes: meta.size } });
      }
    } else {
      report.ok.push({ ...item, width: meta.width, bytes: meta.size });
    }
  }

  console.log(JSON.stringify(report, null, 2));
  if (report.weak.length || report.missing.length) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exit(1); });
