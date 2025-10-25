#!/usr/bin/env node
/**
 * Front-Matter First Aid
 * - Repairs "catastrophic" FM: stray { ... }, merged keys (type/slug/title/etc),
 *   over-escaped quotes like "\"guide\"", and mojibake in FM/body.
 * - Safe to run multiple times.
 */
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const TARGET_DIRS = [
  path.join(ROOT, "content", "downloads"),
  path.join(ROOT, "content", "resources"),
  path.join(ROOT, "content", "blog"),
  path.join(ROOT, "content", "books"),
];
const norm = (p) => p.replaceAll("\\", "/");
const INVIS = /[\u00A0\u200B\uFEFF\u2009]/g;
const CP1252 = [
  [/â€”/g, "—"],
  [/â€“/g, "–"],
  [/â€™/g, "'"],
  [/â€˜/g, "'"],
  [/â€œ/g, '"'],
  [/â€/g, '"'],
  [/â€¢/g, "•"],
  [/â€¦/g, "…"],
  [/Â\s/g, ""],
  [/Ã‚Â/g, ""],
];

const KEYS = [
  "title",
  "type",
  "kind",
  "slug",
  "date",
  "author",
  "readTime",
  "category",
  "excerpt",
  "pdfPath",
  "coverImage",
];

function demojibake(s) {
  if (!s) return s;
  let out = String(s).replace(INVIS, "");
  for (const [re, rep] of CP1252) out = out.replace(re, rep);
  return out;
}

function rescueFrontMatterText(fmRaw) {
  let fm = fmRaw.trim();

  // strip accidental surrounding braces
  if (fm.startsWith("{")) fm = fm.slice(1);
  if (fm.endsWith("}")) fm = fm.slice(0, -1);

  // de-mojibake inside FM
  fm = demojibake(fm);

  // fix insane merged lines like: slug: "x"type:"Resource"slug:"x"
  // Insert newlines before any known key that isn't already at line start.
  fm = fm.replace(
    new RegExp(`(?!^)\\s*(${KEYS.join("|")})\\s*:`, "g"),
    (m) => `\n${m.trim()}`,
  );

  // Collapse accidental repeats like  'kind:' -> 'type:'
  fm = fm.replace(/^(\s*)kind(\s*):/gim, "$1type$2:");

  // Unwrap over-escaped values:  "\"guide\"" -> "guide"
  fm = fm.replace(/:\s*"\\"([^"]+)\\""\s*$/gm, ': "$1"');

  // If value looks like it swallowed other key/value text, split it.
  fm = fm.replace(
    /:\s*"([^"]*?)(?=title:|type:|slug:|date:|author:|readTime:|category:|excerpt:|pdfPath:|coverImage:)/g,
    ': "$1"',
  );

  // Ensure each key:value is on its own line
  fm = fm
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");

  return fm.trim() + "\n";
}

function quoteIfNeeded(val) {
  if (val === undefined || val === null) return val;
  const s = String(val);
  if (/^(true|false|\d+)$/.test(s)) return s; // allow booleans/ints
  if (/^".*"$/.test(s)) return s; // already quoted
  if (/^[A-Za-z0-9._/-]+$/.test(s)) return s; // simple tokens
  return `"${s.replace(/"/g, '\\"')}"`;
}

function normalizeFrontMatterData(data, filename) {
  const safe = { ...data };

  // prefer `type` over `kind`
  if (safe.kind && !safe.type) safe.type = safe.kind;
  delete safe.kind;

  // common auto-fills
  if (!safe.slug) {
    const base = path.basename(filename).replace(/\.[^.]+$/, "");
    safe.slug = base
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-");
  }
  if (!safe.title) {
    safe.title = safe.slug
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  // demojibake stringy fields
  for (const k of KEYS) if (safe[k]) safe[k] = demojibake(safe[k]);

  // ensure nice quoting for stringy props
  for (const k of Object.keys(safe)) {
    if (typeof safe[k] === "string") {
      safe[k] = safe[k].trim();
    }
  }

  return safe;
}

async function processFile(fp) {
  const raw = await fs.readFile(fp, "utf8");
  let txt = raw.replace(/\r\n/g, "\n");

  // If the start of file looks like `{  ---` or has clearly broken FM, rebuild it.
  const fmBlock = txt.match(/^\s*---\n([\s\S]*?)\n---/);
  let outText = null;

  try {
    if (fmBlock) {
      // Try gray-matter first; if it parses, we still sanitize/demojibake.
      const parsed = matter(txt);
      let data = normalizeFrontMatterData(parsed.data, fp);
      const body = demojibake(parsed.content);
      outText = matter.stringify(body, data);
    } else {
      // no FM or shattered — try to pull a fake FM-like region and rebuild
      const shattered = txt.match(/^\s*\{?\s*---([\s\S]*?)---\s*\}?/);
      if (shattered) {
        const fmRescued = rescueFrontMatterText(shattered[1]);
        const body = demojibake(txt.slice(shattered[0].length).trimStart());
        // Try parsing the rescued FM as if it were valid
        const test = matter(`---\n${fmRescued}---\n\n${body}`);
        const data = normalizeFrontMatterData(test.data, fp);
        outText = matter.stringify(body, data);
      } else {
        // No FM at all: synthesize minimal FM
        const body = demojibake(txt);
        const base = path.basename(fp).replace(/\.[^.]+$/, "");
        const data = {
          type: "guide",
          slug: base
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, "-")
            .replace(/-+/g, "-"),
          title: base
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (m) => m.toUpperCase()),
        };
        outText = matter.stringify(body, data);
      }
    }
  } catch {
    // If parsing failed, attempt rescue of FM region explicitly
    if (fmBlock) {
      const rescued = rescueFrontMatterText(fmBlock[1]);
      const body = demojibake(txt.slice(fmBlock[0].length).trimStart());
      const test = matter(`---\n${rescued}---\n\n${body}`);
      const data = normalizeFrontMatterData(test.data, fp);
      outText = matter.stringify(body, data);
    }
  }

  // Final polish: strip invisibles + mild CP1252 fix again
  outText = demojibake(outText).replace(/[ \t]+$/gm, "");

  if (outText !== raw) {
    await fs.writeFile(fp + ".bak", raw, "utf8").catch(() => {});
    await fs.writeFile(fp, outText, "utf8");
    console.log("✅ Repaired FM/body:", norm(fp));
  }
}

async function walk(dir) {
  const entries = await fs
    .readdir(dir, { withFileTypes: true })
    .catch(() => []);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p);
    } else if (/\.(mdx?|md)$/i.test(e.name)) {
      await processFile(p);
    }
  }
}

for (const d of TARGET_DIRS) {
  await walk(d).catch(() => {});
}
console.log("Done.");
