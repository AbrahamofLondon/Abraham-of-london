// scripts/fix-images.mjs
// Creates fallback artwork for missing coverImage/heroImage/og images.
// It reads frontmatter (title/author/category) and writes an on-brand
// typographic image where the field points to.
//
// Usage:
//   node scripts/fix-images.mjs
//   node scripts/fix-images.mjs --dry
//
// Requires: sharp, gray-matter, fast-glob
//   npm i -D sharp gray-matter fast-glob

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import matter from 'gray-matter';
import fg from 'fast-glob';

const ROOT = process.cwd();
const DRY = process.argv.includes('--dry');

const TARGET_FIELDS = [
  { field: 'coverImage', w: 1200, h: 1600, ext: 'jpg' },   // book covers
  { field: 'heroImage',  w: 1600, h: 900,  ext: 'jpg' },   // event/blog hero
  // Optional: generate ogImage if you store it in fm as 'ogImage'
  { field: 'ogImage',    w: 1200, h: 630,  ext: 'jpg' }    // social share
];

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }
function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

function pickPalette(kind) {
  // Simple palette selector; tweak to your brand
  if (kind === 'Book')    return ['#0B1221', '#2C3E94', '#A5B4FC']; // deep navy → indigo
  if (kind === 'Event')   return ['#1B1B1B', '#444',    '#C0C0C0']; // neutral darks
  if (kind === 'Strategy')return ['#0C2411', '#1E7A46', '#B9E2C6']; // green
  if (kind === 'Post')    return ['#111827', '#374151', '#9CA3AF']; // gray scale
  return ['#111827', '#374151', '#9CA3AF'];
}

function svgFor({ w, h, title, subtitle, type }) {
  const [bg1, bg2, accent] = pickPalette(type);
  const titleEsc = (title || 'Untitled').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const subEsc = (subtitle || '').replace(/&/g,'&amp;').replace(/</g,'&lt;');

  // simple gradient + large type
  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <filter id="s" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="12" stdDeviation="32" flood-color="rgba(0,0,0,0.35)"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g filter="url(#s)">
    <text x="7%" y="58%" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="${Math.round(h*0.10)}" font-weight="800" fill="white">
      ${titleEsc}
    </text>
    ${subEsc ? `<text x="7%" y="${Math.round(h*0.70)}" font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto" font-size="${Math.round(h*0.045)}" font-weight="600" fill="${accent}">${subEsc}</text>` : ''}
  </g>
</svg>`;
}

async function generateImage(absOut, w, h, title, subtitle, type) {
  const svg = svgFor({ w, h, title, subtitle, type });
  ensureDir(path.dirname(absOut));
  if (DRY) {
    console.log(`[dry] would write: ${absOut}`);
    return;
  }
  await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(absOut);
  console.log(`✔ wrote ${path.relative(ROOT, absOut)}`);
}

async function main() {
  const files = await fg(['content/**/*.{md,mdx}'], { dot: false });
  for (const rel of files) {
    const raw = fs.readFileSync(rel, 'utf8');
    const { data: fm } = matter(raw);
    const type = fm.type || 'Post';
    const title = fm.title || path.basename(rel);
    const subtitle =
      type === 'Book' ? fm.author :
      type === 'Event' ? fm.location :
      fm.category || '';

    for (const spec of TARGET_FIELDS) {
      const v = fm[spec.field];
      if (!v || typeof v !== 'string') continue;
      // Only create if missing
      const abs = v.startsWith('/') ? path.join(ROOT, v) : path.join(path.dirname(path.join(ROOT, rel)), v);
      if (!exists(abs)) {
        await generateImage(abs, spec.w, spec.h, title, subtitle, type);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
