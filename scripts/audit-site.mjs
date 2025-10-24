// scripts/audit-site.mjs
// Scans /content for MD/MDX, validates & can fix:
//  • slug/title/filename alignment
//  • date fields & ISO format
//  • missing/invalid links to local pages, images, and downloads
//  • category/type sanity
//  • optional --rename: rename files to <slug>.mdx and update frontmatter
//
// Usage:
//   node scripts/audit-site.mjs                 # report only
//   node scripts/audit-site.mjs --fix           # write safe fixes (frontmatter/links)
//   node scripts/audit-site.mjs --rename        # also rename files to match slug
//   node scripts/audit-site.mjs --report report/audit-site.json
//
// Safe defaults: never deletes; backs up changed files as <name>.bak once per run.

import { existsSync, copyFileSync, renameSync, mkdirSync } from 'node:fs';
import fsp from 'node:fs/promises';
import path from "path";
import fg from 'fast-glob';
import matter from 'gray-matter';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const HAS = (f) => argv.includes(f);
const VAL = (f, def = null) => { const i = argv.indexOf(f); return i > -1 ? argv[i + 1] : def; };

const DO_FIX    = HAS('--fix') || HAS('--rename');
const DO_RENAME = HAS('--rename');
const REPORT    = HAS('--report') ? VAL('--report') : null;

const CONTENT_GLOBS = ['content/**/*.{md,mdx}'];

const knownTypes = new Set(['Book','Event','Strategy','Post','Article','Guide']);
const imageFields = ['coverImage','heroImage','ogImage'];
// const downloadRoots = ['public/downloads']; // Not used
// const imageRoots = ['public','public/assets','public/assets/images']; // Not used

const out = [];
const backups = new Set();

async function backupOnce(abs) {
  if (backups.has(abs) || !existsSync(abs)) return;
  const bak = abs + '.bak';
  if (!existsSync(bak)) await fsp.copyFile(abs, bak);
  backups.add(abs);
}

function normSlug(s = '') {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/[^\w\-\/]+/g, '-')   // collapse non-word
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

// Function `ensureExt` removed as it was unused.

async function loadFile(rel) {
  const raw = await fsp.readFile(rel, 'utf8');
  return { raw, ...matter(raw) };
}

async function writeFile(rel, data, content) {
  await backupOnce(rel);
  const out = matter.stringify(content, data);
  await fsp.writeFile(rel, out, 'utf8');
}

// Function `toAbsFromDoc` removed as it was unused.

function existsPublic(relOrAbs) {
  const abs = relOrAbs.startsWith('/') ? path.join(ROOT, relOrAbs) : path.join(ROOT, 'public', relOrAbs);
  return existsSync(abs);
}

// Function `existsAny` removed as it was unused.

// Very basic internal link scan in MDX
function extractLinks(body) {
  const links = new Set();
  const regex = /\]\((\/[^)]+)\)|href=["'](\/[^"']+)["']/g;
  let m;
  while ((m = regex.exec(body))) {
    const link = m[1] || m[2];
    if (link) links.add(link.split('#')[0]);
  }
  return [...links];
}

function guessKindFromPath(rel) {
  if (rel.includes('/books/')) return 'Book';
  if (rel.includes('/events/')) return 'Event';
  if (rel.includes('/strategy/')) return 'Strategy';
  if (rel.includes('/blog/')) return 'Post';
  return null;
}

function desiredFileNameFromSlug(slug, ext) {
  const leaf = slug.split('/').filter(Boolean).pop();
  return leaf + ext;
}

function fixFrontmatter(data, rel) {
  let changed = false;
  const report = {};

  // type
  const inferred = data.type || guessKindFromPath(rel);
  if (inferred && data.type !== inferred) {
    report.type = { was: data.type, now: inferred };
    if (DO_FIX) data.type = inferred;
    changed = true;
  }

  // slug
  const fileLeaf = path.basename(rel, path.extname(rel));
  const wantSlug = data.slug ? normSlug(data.slug) : normSlug(fileLeaf);
  if (!data.slug || data.slug !== wantSlug) {
    report.slug = { was: data.slug, now: wantSlug };
    if (DO_FIX) data.slug = wantSlug;
    changed = true;
  }

  // title: keep user's, but trim whitespace
  if (typeof data.title === 'string') {
    const t = data.title.trim();
    if (t !== data.title) {
      report.title = { was: data.title, now: t };
      if (DO_FIX) data.title = t;
      changed = true;
    }
  }

  // date: normalize to ISO (YYYY-MM-DD or ISO8601 with TZ)
  if (data.date) {
    const d = new Date(data.date);
    if (Number.isNaN(d.getTime())) {
      report.date = { error: `Invalid date: ${data.date}` };
    } else {
      const iso = (data.date.length <= 10)
        ? d.toISOString().slice(0, 10) // YYYY-MM-DD
        : d.toISOString(); // Keep full ISO if time present
      if (iso !== data.date) {
        report.date = { was: data.date, now: iso };
        if (DO_FIX) data.date = iso;
        changed = true;
      }
    }
  }

  // If events carry a 'time' like "18:30", fold it into date (same day) as ISO time
  if (data.type === 'Event' && typeof data.time === 'string' && data.date) {
    const d = new Date(data.date);
    const m = data.time.match(/^(\d{1,2}):(\d{2})$/);

    if (!Number.isNaN(d.getTime()) && m) {
      // Create a copy of the date to avoid side-effects if original date was only YYYY-MM-DD
      const dateToMerge = new Date(d.getTime());

      dateToMerge.setHours(Number(m[1]), Number(m[2]), 0, 0);
      const iso = dateToMerge.toISOString();

      report.dateTimeMerged = { dateWas: data.date, timeWas: data.time, now: iso };
      if (DO_FIX) {
        data.date = iso;
        delete data.time;
      }
      changed = true;
    } else {
      report.time = { warn: `Unrecognized time or invalid date: "${data.time}"` };
    }
  }


  // category normalize: capitalize first letter, keep rest
  if (typeof data.category === 'string') {
    // Only trim whitespace; the original code mentioned 'capitalize first letter' but didn't implement it.
    const norm = data.category.trim();
    if (norm !== data.category) {
      report.category = { was: data.category, now: norm };
      if (DO_FIX) data.category = norm;
      changed = true;
    }
  }

  // drop unknown fields (example: 'time' leakage) - report only
  const extras = [];
  // The original logic here was very narrow. Removing the check entirely
  // and relying on ContentLayer schema validation is safer, but keeping the
  // structure for future feature expansion.
  if (data.type === 'Event') {
    for (const k of Object.keys(data)) {
      // This is checking for 'time' but only reporting it, which seems fine for auditing
      if (k === 'time' && data.time !== undefined) extras.push('time');
    }
  }
  if (extras.length) report.extraFields = extras;

  return { changed, report, data };
}

function fixLocalLinks(body, allSlugs) {
  let changed = false;
  let updated = body;

  // map trailing slash duplicates to canonical
  for (const s of allSlugs) {
    // Determine the version *without* a trailing slash
    const withoutSlash = s.endsWith('/') ? s.slice(0, -1) : s;
    const withSlash = withoutSlash + '/';

    // Check if the current slug ends with a slash (i.e., is it the version we want to remove?)
    if (s.endsWith('/')) {
        // We only check for the trailing slash version to remove it.
        const re = new RegExp(`\\]\\(${withSlash}\\)`, 'g');
        if (re.test(updated)) {
          updated = updated.replace(re, `](${withoutSlash})`);
          changed = true;
        }
    }
  }

  return { changed, body: updated };
}

async function main() {
  const files = await fg(CONTENT_GLOBS, { dot: false });
  const slugIndex = new Map(); // slug -> file
  const allLinks = new Set(); // Kept for consistency, but not fully utilized

  // First pass: build slug index
  for (const rel of files) {
    try {
      const { data } = await loadFile(rel);
      const slug = normSlug(data.slug || path.basename(rel, path.extname(rel)));

      const routePrefix = rel.includes('/events/') ? 'events' :
                          rel.includes('/books/') ? 'books' :
                          rel.includes('/strategy/') ? 'strategy' :
                          rel.includes('/blog/') ? 'blog' : '';

      // Store the full URL slug (e.g., /blog/my-post)
      slugIndex.set('/' + routePrefix + '/' + slug, rel);
    } catch (e) {
      console.error(`Error processing file ${rel} for slug index:`, e.message);
    }
  }

  // Second pass: validate / fix
  for (const rel of files) {
    const startReport = { file: rel, issues: [] };
    let data, content, raw;
    let anyChange = false;

    try {
        ({ data, content, raw } = await loadFile(rel));
    } catch (e) {
        startReport.issues.push({ kind: 'read_error', message: e.message });
        out.push(startReport);
        continue;
    }

    let currentData = { ...data };
    let currentBody = content;

    // frontmatter normalization
    const { changed, report, data: newData } = fixFrontmatter(currentData, rel);
    currentData = newData;
    if (changed) {
      anyChange = true;
      startReport.issues.push({ kind: 'frontmatter', details: report });
    }

    // image fields existence (relative or /absolute under /public)
    for (const f of imageFields) {
      const val = currentData[f];
      if (!val) continue;
      const isExternal = /^https?:\/\//.test(val);
      if (isExternal) continue;

      // Check for existence under public/
      const publicPath = val.startsWith('/') ? val : path.join('public', val);
      if (!existsSync(path.join(ROOT, publicPath))) {
        startReport.issues.push({ kind:'image_missing', field:f, value: val });
      }
    }

    // collect body links & validate local existence
    const links = extractLinks(currentBody);
    for (const href of links) {
      allLinks.add(href);
      const isFile = href.match(/\.(pdf|jpg|jpeg|png|webp|svg)$/i);

      if (isFile) {
        // check under /public
        const ok = existsPublic(href);
        if (!ok) startReport.issues.push({ kind:'asset_404', href });
      } else {
        // internal page: must be in slugIndex (normalize by removing trailing slash for lookup)
        const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
        if (!slugIndex.has(normalizedHref)) {
          startReport.issues.push({ kind:'route_404', href });
        }
      }
    }

    // optional body link normalization (trailing slash)
    const { changed: linksChanged, body: newBody } = fixLocalLinks(currentBody, [...slugIndex.keys()]);
    if (linksChanged) {
      anyChange = true;
      currentBody = newBody;
      startReport.issues.push({ kind:'links_normalized' });
    }

    // write back if needed
    if (DO_FIX && anyChange) await writeFile(rel, currentData, currentBody);

    // optional: rename to match slug
    if (DO_RENAME) {
      const ext = path.extname(rel).toLowerCase();
      const dir = path.dirname(rel);
      const want = desiredFileNameFromSlug(currentData.slug, ext || '.mdx');
      const wantAbs = path.join(dir, want);

      if (path.basename(rel) !== want) {
        const abs = path.join(ROOT, rel);
        const destAbs = path.join(ROOT, wantAbs);

        if (!existsSync(destAbs)) {
          renameSync(abs, destAbs); // Use sync rename as this is final step
          startReport.issues.push({ kind:'renamed', was: rel, now: wantAbs });
        } else {
          startReport.issues.push({ kind:'rename_conflict', want: wantAbs });
        }
      }
    }

    // type sanity
    if (currentData.type && !knownTypes.has(currentData.type)) {
      startReport.issues.push({ kind:'unknown_type', value: currentData.type });
    }

    out.push(startReport);
  }

  // Emit summary
  const summary = out.reduce((acc, r) => {
    for (const i of r.issues) {
      acc[i.kind] = (acc[i.kind] || 0) + 1;
    }
    return acc;
  }, {});
  console.log('audit-site summary:', summary);

  if (REPORT) {
    const abs = path.isAbsolute(REPORT) ? REPORT : path.join(ROOT, REPORT);
    mkdirSync(path.dirname(abs), { recursive: true });
    await fsp.writeFile(abs, JSON.stringify({ summary, out }, null, 2));
    console.log('Report →', path.relative(ROOT, abs));
  }

  // fail CI if issues found and not fixing
  const issuesCount = Object.values(summary).reduce((a, b) => a + b, 0);
  if (issuesCount > 0 && !(DO_FIX || DO_RENAME)) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(2); });