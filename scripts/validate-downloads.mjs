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
