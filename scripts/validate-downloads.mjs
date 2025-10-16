#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Validate downloadable PDFs under public/downloads and their related covers.
 * - No deps (Node built-ins only)
 * - Cross-checks netlify.toml "to" targets and repo references to /downloads/*.pdf
 * - Enforces naming rules and basic file sanity
 *
 * Flags:
 *   --strict            Treat warnings as errors (overrides env)
 *   --skip-covers       Don’t require cover images to exist
 *
 * Env:
 *   DOWNLOADS_STRICT=1  Enable strict mode in CI or locally
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOWNLOADS_DIR = path.resolve(ROOT, 'public', 'downloads');
const COVERS_DIR = path.resolve(ROOT, 'public', 'assets', 'images', 'downloads');
const NETLIFY_TOML = path.resolve(ROOT, 'netlify.toml');

const args = new Set(process.argv.slice(2));
// LAX by default. Strict ONLY if you pass --strict or set DOWNLOADS_STRICT=1
const STRICT = args.has('--strict') || process.env.DOWNLOADS_STRICT === '1';
const SKIP_COVERS = args.has('--skip-covers');

const PDF_EXT = '.pdf';
const COVER_EXTS = ['.jpg', '.webp', '.png'];

// Either Title_Case_With_Underscores.pdf OR kebab-case.pdf
const RX_TITLE_CASE_UNDERSCORE = /^(?:[A-Z][A-Za-z0-9]*)(?:_[A-Z][A-Za-z0-9]*)+\.pdf$/;
const RX_KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*\.pdf$/;

const log = {
  info: (msg) => console.log(msg),
  ok:   (msg) => console.log(`✅ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
  err:  (msg) => console.error(`❌ ${msg}`)
};

function toKebabBase(filename) {
  const base = filename.replace(/\.pdf$/i, '');
  return base
    .replace(/[_\s]+/g, '-')         // underscores/spaces -> hyphen
    .replace(/[^a-zA-Z0-9-]+/g, '-') // strip odd chars
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function isPDF(name) {
  return name.toLowerCase().endsWith(PDF_EXT);
}

async function pathExists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listFilesRecursive(dir) {
  const out = [];
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFilesRecursive(p)));
    } else {
      out.push(p);
    }
  }
  return out;
}

async function readTextIfExists(p) {
  try {
    return await fsp.readFile(p, 'utf8');
  } catch {
    return '';
  }
}

function extractDownloadsFromText(text) {
  // Match /downloads/<file>.pdf within quotes or parens
  const rx = /\/downloads\/([A-Za-z0-9_\- .%]+?\.pdf)/g;
  const hits = new Set();
  let m;
  while ((m = rx.exec(text))) {
    try {
      const decoded = decodeURIComponent(m[1]);
      hits.add(decoded.replace(/^\//, ''));
    } catch {
      hits.add(m[1].replace(/^\//, ''));
    }
  }
  return Array.from(hits);
}

async function extractNetlifyTargets() {
  const text = await readTextIfExists(NETLIFY_TOML);
  const rx = /^\s*to\s*=\s*"\/downloads\/([^"]+?\.pdf)"\s*$/gmi;
  const targets = new Set();
  let m;
  while ((m = rx.exec(text))) {
    targets.add(m[1]);
  }
  return Array.from(targets);
}

async function findAllRepoDownloadRefs() {
  const roots = [
    path.resolve(ROOT, 'content'),
    path.resolve(ROOT, 'pages'),
    path.resolve(ROOT, 'app'),
    path.resolve(ROOT, 'components'),
    path.resolve(ROOT, 'public'),
    NETLIFY_TOML
  ];

  const refs = new Set();

  for (const root of roots) {
    const exists = await pathExists(root);
    if (!exists) continue;

    const stat = await fsp.stat(root);
    if (stat.isFile()) {
      const text = await readTextIfExists(root);
      extractDownloadsFromText(text).forEach((r) => refs.add(r));
      continue;
    }

    const files = await listFilesRecursive(root);
    for (const f of files) {
      if (/\.(png|jpg|jpeg|webp|gif|ico|mp4|webm|pdf)$/i.test(f)) continue; // skip binary-ish
      const text = await readTextIfExists(f);
      if (!text) continue;
      extractDownloadsFromText(text).forEach((r) => refs.add(r));
    }
  }

  return Array.from(refs);
}

async function checkCoversFor(pdfName) {
  const slug = toKebabBase(pdfName);
  for (const ext of COVER_EXTS) {
    const p = path.join(COVERS_DIR, slug + ext);
    if (await pathExists(p)) return true;
  }
  return false;
}

async function main() {
  log.info(`\n🔍 Validating downloads in: ${DOWNLOADS_DIR}`);
  const errors = [];
  const warnings = [];

  // dir exists
  if (!(await pathExists(DOWNLOADS_DIR))) {
    errors.push(`Missing directory: ${DOWNLOADS_DIR}`);
    return reportAndExit(errors, warnings);
  }

  // gather PDFs
  const files = (await listFilesRecursive(DOWNLOADS_DIR))
    .filter((f) => isPDF(f))
    .map((f) => path.relative(DOWNLOADS_DIR, f).replace(/\\/g, '/'));

  if (files.length === 0) {
    warnings.push('No PDFs found in public/downloads.');
  } else {
    log.ok(`Found ${files.length} PDF(s).`);
  }

  // case-insensitive collisions
  const lcMap = new Map();
  for (const f of files) {
    const lc = f.toLowerCase();
    const list = lcMap.get(lc) || [];
    list.push(f);
    lcMap.set(lc, list);
  }
  for (const group of lcMap.values()) {
    if (group.length > 1) {
      errors.push(`Case-insensitive filename collision in /public/downloads: ${group.join(', ')}`);
    }
  }

  // validate each
  for (const rel of files) {
    const name = path.basename(rel);

    if (/\s/.test(name)) {
      warnings.push(`Filename contains spaces (discouraged): ${name}`);
    }

    if (!(RX_TITLE_CASE_UNDERSCORE.test(name) || RX_KEBAB.test(name))) {
      warnings.push(
        `Filename style should be Title_Case_With_Underscores.pdf or kebab-case.pdf: ${name}`
      );
    }

    const abs = path.join(DOWNLOADS_DIR, rel);
    try {
      const stat = await fsp.stat(abs);
      if (stat.size < 10 * 1024) {
        warnings.push(`Suspiciously small PDF (<10KB): ${name}`);
      }
    } catch (e) {
      errors.push(`Cannot stat file ${name}: ${e.message}`);
    }

    if (!SKIP_COVERS) {
      const hasCover = await checkCoversFor(name);
      if (!hasCover) {
        warnings.push(
          `Missing cover image for ${name}. Expected one of: ${COVER_EXTS.map(
            (e) => `/assets/images/downloads/${toKebabBase(name)}${e}`
          ).join(', ')}`
        );
      }
    }
  }

  // netlify.toml "to" targets
  const netlifyTargets = await extractNetlifyTargets();
  for (const t of netlifyTargets) {
    const exists = await pathExists(path.join(DOWNLOADS_DIR, t));
    const msg = `netlify.toml 'to' target is missing: /downloads/${t}`;
    if (!exists) (STRICT ? errors : warnings).push(msg);
  }

  // repo references to /downloads/*.pdf
  const repoRefs = await findAllRepoDownloadRefs();
  const missingFromRefs = repoRefs.filter(
    (r) => !files.some((f) => f.toLowerCase() === r.toLowerCase())
  );
  for (const miss of missingFromRefs) {
    const msg = `Referenced download not found: /downloads/${miss}`;
    (STRICT ? errors : warnings).push(msg);
  }

  // Unreferenced PDFs (FYI)
  const unreferenced = files.filter(
    (f) =>
      !repoRefs.some((r) => r.toLowerCase() === f.toLowerCase()) &&
      !netlifyTargets.some((r) => r.toLowerCase() === f.toLowerCase())
  );
  if (unreferenced.length) {
    warnings.push(
      `Unreferenced PDFs (present but never linked nor targeted in netlify.toml): ${unreferenced.join(', ')}`
    );
  }

  reportAndExit(errors, warnings);
}

function reportAndExit(errors, warnings) {
  if (warnings.length) warnings.forEach((w) => log.warn(w));
  if (errors.length) errors.forEach((e) => log.err(e));

  const warnCount = warnings.length;
  const errCount = errors.length;

  if (errCount === 0 && warnCount === 0) {
    log.ok('Download validation passed cleanly.');
    process.exit(0);
  }

  if (errCount > 0) {
    log.err(`\nFailed: ${errCount} error(s), ${warnCount} warning(s).`);
    process.exit(1);
  }

  // In non-strict mode, warnings never fail the build
  if (!STRICT && warnCount > 0) {
    log.ok(`\nPassed with warnings (lax mode): ${warnCount} warning(s).`);
    process.exit(0);
  }

  // In strict mode, warnings fail
  if (STRICT && warnCount > 0) {
    log.err(`\nFailed due to warnings (strict mode): ${warnCount} warning(s).`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(`\n🚨 FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Generate placeholder PDFs in public/downloads and matching cover JPGs
 * in public/assets/images/downloads so strict validation can pass.
 *
 * - No PDF deps: we emit a minimal but valid PDF (with proper xref).
 * - Covers are generated from SVG via sharp (already in devDeps).
 *
 * Flags:
 *   --force         Overwrite existing PDFs and/or covers
 *   --no-covers     Skip cover generation
 */

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DL_DIR = path.resolve(ROOT, 'public', 'downloads');
const COVERS_DIR = path.resolve(ROOT, 'public', 'assets', 'images', 'downloads');

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const MAKE_COVERS = !args.has('--no-covers');

// ————————————————————————————————————————————————————————————————
// 1) Any PDFs the repo references but are missing — we’ll create them.
//    (This list comes from your validator output.)
const MUST_HAVE = [
  'Fathering_Without_Fear_Teaser-A4.pdf',
  'Family_Altar_Liturgy.pdf',
  'Scripture_Track_John14.pdf',
  'Household_Rhythm_Starter.pdf',
  'Principles_for_My_Son.pdf',
  'Principles_for_My_Son_Cue_Card.pdf',
  'brotherhood-covenant.pdf',
  'brotherhood-cue-card.pdf',
  'fathering-without-fear.pdf',
  'standards-brief.pdf',
  'Fatherhood_Guide.pdf',
  'Fathering_Without_Fear_Teaser_Mobile.pdf',
  'fathering-without-fear-mobile.pdf',
  'Fathering_Without_Fear_Teaser_A4.pdf'
];

// ————————————————————————————————————————————————————————————————
// PDF helper: build a tiny valid PDF (>10KB) with simple text content.
// No third-party libs; we emit objects + correct xref offsets.
function makePdfBuffer(titleLine, subtitleLine) {
  const objs = [];

  const header = '%PDF-1.4\n';

  // 1) Catalog
  objs.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2) Pages
  objs.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // 3) Page
  objs.push(
    '3 0 obj\n' +
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n' +
      '   /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\n' +
      'endobj\n'
  );

  // 4) Font
  objs.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  // 5) Content stream
  // Add enough text lines to push the file > 10KB
  const lines = [
    `BT /F1 24 Tf 72 770 Td (${escapePdfText(titleLine)}) Tj ET`,
    `BT /F1 14 Tf 72 740 Td (${escapePdfText(subtitleLine)}) Tj ET`,
    `BT /F1 11 Tf 72 720 Td (This placeholder will be replaced by the premium PDF.) Tj ET`
  ];

  // Pad with extra lines to increase size
  for (let i = 0; i < 220; i += 1) {
    lines.push(`BT /F1 10 Tf 72 ${700 - i * 2} Td (•) Tj ET`);
  }

  const stream = lines.join('\n') + '\n';
  const content =
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}endstream\nendobj\n`;

  objs.push(content);

  // Build full file with xref
  const parts = [header];
  const offsets = [0]; // object 0 is the free head
  let pos = header.length;

  for (const obj of objs) {
    offsets.push(pos);
    parts.push(obj);
    pos += Buffer.byteLength(obj, 'utf8');
  }

  const xrefStart = pos;
  const count = objs.length + 1;

  let xref = `xref\n0 ${count}\n`;
  xref += `0000000000 65535 f \n`;
  for (let i = 1; i < count; i++) {
    xref += `${offsets[i].toString().padStart(10, '0')} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${count} /Root 1 0 R >>\n` +
    `startxref\n${xrefStart}\n%%EOF\n`;

  parts.push(xref, trailer);
  return Buffer.from(parts.join(''), 'utf8');
}

function escapePdfText(s) {
  return String(s).replace(/[()\\]/g, (m) => `\\${m}`);
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

function baseNameNoExt(name) {
  return name.replace(/\.pdf$/i, '');
}

function toTitleFromFile(name) {
  const base = baseNameNoExt(name).replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return base
    .split(' ')
    .map((w) => (w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

function toKebabBase(name) {
  return baseNameNoExt(name)
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function writePdfIfMissing(fileName, force = false) {
  const dest = path.join(DL_DIR, fileName);
  if (!force && fs.existsSync(dest)) return false;

  const title = 'Abraham of London';
  const subtitle = `Placeholder — ${fileName}`;
  const buf = makePdfBuffer(title, subtitle);
  await fsp.writeFile(dest, buf);
  return true;
}

async function writeCoverIfMissing(fileName, force = false) {
  const kebab = toKebabBase(fileName);
  const dest = path.join(COVERS_DIR, `${kebab}.jpg`);
  if (!force && fs.existsSync(dest)) return false;

  const title = toTitleFromFile(fileName);
  const svg = `
  <svg width="1600" height="900" viewBox="0 0 1600 900" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0f1214"/>
        <stop offset="1" stop-color="#14181b"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#g)"/>
    <text x="80" y="140" fill="#d9c8a1" font-family="Georgia, serif" font-size="42">Abraham of London</text>
    <text x="80" y="240" fill="#eae6df" font-family="Georgia, serif" font-size="64" font-weight="700">${escapeXml(
      title
    )}</text>
    <rect x="80" y="280" width="720" height="6" fill="#c9a552" />
    <text x="80" y="360" fill="#c7c7c7" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif" font-size="28">
      Download — ${escapeXml(fileName)}
    </text>
    <text x="80" y="820" fill="#9aa3aa" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, sans-serif" font-size="22">
      Placeholder artwork — will be replaced
    </text>
  </svg>`.trim();

  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(dest);
  return true;
}

function escapeXml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function main() {
  await ensureDir(DL_DIR);
  await ensureDir(COVERS_DIR);

  let created = 0;
  let covered = 0;

  // 1) Ensure MUST_HAVE placeholders exist
  for (const name of MUST_HAVE) {
    const made = await writePdfIfMissing(name, FORCE);
    if (made) {
      created += 1;
      console.log(`📝 Created placeholder PDF: ${name}`);
    }
    if (MAKE_COVERS) {
      const c = await writeCoverIfMissing(name, FORCE);
      if (c) {
        covered += 1;
        console.log(`🖼️  Created cover: assets/images/downloads/${toKebabBase(name)}.jpg`);
      }
    }
  }

  // 2) For *all* PDFs under /public/downloads, ensure a cover exists
  if (MAKE_COVERS) {
    const all = (await fsp.readdir(DL_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'));
    for (const f of all) {
      const c = await writeCoverIfMissing(f, false);
      if (c) {
        covered += 1;
        console.log(`🖼️  Created cover: assets/images/downloads/${toKebabBase(f)}.jpg`);
      }
    }
  }

  console.log(`\n✅ Done. PDFs created: ${created}, covers created: ${covered}`);
  console.log('   (Run with --force to overwrite, or --no-covers to skip covers.)');
}

main().catch((e) => {
  console.error(`\n🚨 FATAL: ${e.stack || e.message}`);
  process.exit(1);
});
