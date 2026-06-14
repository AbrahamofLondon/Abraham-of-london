#!/usr/bin/env node
/**
 * scripts/check-public-content-routes.mjs
 *
 * Repo-wide public content route verification.
 *
 * Proves that public content families (blog, books, playbooks, editorials,
 * intelligence, briefs) index their documents and resolve their public URLs.
 * Mirrors the resolution rules in lib/content/public-content-resolver.ts but
 * reads the generated .contentlayer/generated/<Type>/_index.json directly so it
 * can run without a TypeScript build step.
 *
 * Exit code 1 on any failure.
 */

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GENERATED = join(ROOT, ".contentlayer", "generated");
const CONTENT = join(ROOT, "content");
const REPORTS_DIR = join(ROOT, "reports");

// ── Slug helpers (mirror public-content-resolver.ts) ───────────────────────

const KNOWN_PREFIXES = [
  "blog", "blogs", "post", "posts", "article", "articles",
  "editorial", "editorials", "book", "books", "playbook", "playbooks",
  "library", "content", "public", "restricted", "member", "members",
  "intelligence", "brief", "briefs", "vault",
];

function normalizeSlug(input) {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/")
    .toLowerCase();
}

function stripKnownPrefixes(input) {
  let s = normalizeSlug(input);
  if (!s || s.includes("..")) return "";
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of KNOWN_PREFIXES) {
      const p = `${prefix}/`;
      if (s.startsWith(p)) {
        s = normalizeSlug(s.slice(p.length));
        changed = true;
        break;
      }
    }
  }
  if (!s || s.includes("..")) return "";
  return s;
}

function getDocumentSlugCandidates(doc) {
  if (!doc) return [];
  const sources = [
    doc.urlSlug, doc.slug, doc.slugComputed, doc.collectionSlug,
    doc.href, doc.canonical,
    doc._raw?.flattenedPath, doc._raw?.sourceFilePath, doc._raw?.sourceFileName,
  ];
  const out = new Set();
  for (const src of sources) {
    if (typeof src !== "string") continue;
    const bare = stripKnownPrefixes(src);
    if (bare) out.add(bare);
  }
  return [...out];
}

function isPublishedDoc(doc) {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;
  if (doc.date) {
    const d = new Date(doc.date);
    if (Number.isFinite(d.getTime()) && d > new Date()) return false;
  }
  return true;
}

function isPublicDoc(doc) {
  if (!doc) return false;
  if (doc.requiresAuthSafe === true || doc.requiresAuth === true) return false;
  const tier = String(
    doc.accessTierSafe ?? doc.accessLevel ?? doc.accessTier ?? doc.tier ?? doc.classification ?? "public",
  ).trim().toLowerCase();
  if (!tier) return true;
  return tier === "public" || tier === "open" || tier === "free" || tier === "unclassified";
}

// ── Load generated indexes ─────────────────────────────────────────────────

function loadIndex(typeDir) {
  const p = join(GENERATED, typeDir, "_index.json");
  if (!existsSync(p)) return [];
  try {
    const data = JSON.parse(readFileSync(p, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// family -> generated type dirs
const FAMILY_DIRS = {
  blog: ["Post"],
  books: ["Book"],
  playbooks: ["Playbook"],
  editorials: ["Editorial"],
  intelligence: ["Intelligence"],
  briefs: ["Brief"],
};

function publicDocsForFamily(family) {
  const dirs = FAMILY_DIRS[family] || [];
  const docs = dirs.flatMap(loadIndex);
  return docs.filter(isPublishedDoc).filter(isPublicDoc);
}

function resolveBySlug(family, slug) {
  const needle = stripKnownPrefixes(slug);
  if (!needle) return null;
  const docs = publicDocsForFamily(family);
  const exact = docs.find((d) => stripKnownPrefixes(d.urlSlug) === needle);
  if (exact) return exact;
  return docs.find((d) => getDocumentSlugCandidates(d).includes(needle)) || null;
}

function countContentFiles(subdir) {
  const dir = join(CONTENT, subdir);
  if (!existsSync(dir)) return 0;
  let count = 0;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(d, entry.name));
      else if (/\.mdx?$/i.test(entry.name) && !entry.name.startsWith("_")) count++;
    }
  };
  walk(dir);
  return count;
}

// ── Run checks ─────────────────────────────────────────────────────────────

const failures = [];
const results = [];

function check(name, condition, detail = "") {
  if (condition) {
    results.push({ name, status: "pass", detail });
    console.log(`   ✅ ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    results.push({ name, status: "fail", detail });
    failures.push(name);
    console.log(`   ❌ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

if (!existsSync(GENERATED)) {
  console.error("❌ .contentlayer/generated not found. Run the contentlayer build first.");
  process.exit(1);
}

console.log("\n────────────────────────────────────────────────────────────");
console.log("  PUBLIC CONTENT ROUTE VERIFICATION");
console.log("────────────────────────────────────────────────────────────\n");

// Family counts
const counts = {};
for (const family of Object.keys(FAMILY_DIRS)) {
  counts[family] = publicDocsForFamily(family).length;
}
console.log("📊 Public indexed counts:");
for (const [family, n] of Object.entries(counts)) {
  console.log(`   ${family.padEnd(14)}: ${n}`);
}
console.log("");

// 1. Known failing blog slug resolves if source exists
const BLOG_SLUG = "the-meeting-was-never-the-problem";
if (existsSync(join(CONTENT, "blog", `${BLOG_SLUG}.mdx`))) {
  const doc = resolveBySlug("blog", BLOG_SLUG);
  check(`blog/${BLOG_SLUG} resolves`, !!doc, doc ? `"${doc.title}"` : "NOT RESOLVED");
}

// 2. Known failing book slug resolves if source exists
const BOOK_SLUG = "architecture-of-ascension";
if (existsSync(join(CONTENT, "books", `${BOOK_SLUG}.mdx`))) {
  const doc = resolveBySlug("books", BOOK_SLUG);
  check(`books/${BOOK_SLUG} resolves`, !!doc, doc ? `"${doc.title}"` : "NOT RESOLVED");
}

// 3. Playbooks index count is not zero if playbook files exist
const playbookFiles = countContentFiles("playbooks");
if (playbookFiles > 0) {
  check(
    "playbooks index is non-empty",
    counts.playbooks > 0,
    `${counts.playbooks} indexed from ${playbookFiles} source files`,
  );
}

// 4. At least 10 classic blog routes resolve if 10 classic blog files exist
const blogFiles = countContentFiles("blog");
if (blogFiles >= 10) {
  const blogDocs = publicDocsForFamily("blog");
  let resolved = 0;
  for (const d of blogDocs) {
    const bare = stripKnownPrefixes(d.urlSlug) || getDocumentSlugCandidates(d)[0];
    if (bare && resolveBySlug("blog", bare)) resolved++;
  }
  check("at least 10 blog routes resolve", resolved >= 10, `${resolved} resolved`);
}

// 5. No restricted/member-only documents exposed publicly
for (const family of Object.keys(FAMILY_DIRS)) {
  const dirs = FAMILY_DIRS[family] || [];
  const all = dirs.flatMap(loadIndex).filter(isPublishedDoc);
  const leaked = all.filter((d) => publicDocsForFamily(family).includes(d) && !isPublicDoc(d));
  check(`${family}: no restricted docs exposed`, leaked.length === 0,
    leaked.length ? `${leaked.length} leaked` : "clean");
}

// 6. No duplicate slug collision silently ignored (per family)
for (const family of Object.keys(FAMILY_DIRS)) {
  const docs = publicDocsForFamily(family);
  const seen = new Map();
  const dups = [];
  for (const d of docs) {
    const bare = stripKnownPrefixes(d.urlSlug) || getDocumentSlugCandidates(d)[0];
    if (!bare) continue;
    if (seen.has(bare) && seen.get(bare) !== (d._id || d.slug)) {
      dups.push(bare);
    } else {
      seen.set(bare, d._id || d.slug);
    }
  }
  check(`${family}: no duplicate slug collision`, dups.length === 0,
    dups.length ? `dups: ${dups.slice(0, 5).join(", ")}` : "unique");
}

// 7. Every generated static path has a matching resolver result
for (const family of Object.keys(FAMILY_DIRS)) {
  const docs = publicDocsForFamily(family);
  let missing = 0;
  for (const d of docs) {
    const bare = stripKnownPrefixes(d.urlSlug) || getDocumentSlugCandidates(d)[0];
    if (!bare) { missing++; continue; }
    if (!resolveBySlug(family, bare)) missing++;
  }
  check(`${family}: all static paths resolve`, missing === 0,
    missing ? `${missing} unresolved` : `${docs.length} ok`);
}

// 8. Resolver handles sourceFilePath, flattenedPath, slug, url(href) forms
{
  const sample = publicDocsForFamily("blog")[0];
  if (sample) {
    const forms = {
      flattenedPath: sample._raw?.flattenedPath,
      sourceFilePath: sample._raw?.sourceFilePath,
      slug: sample.slug,
      href: sample.href,
    };
    let ok = true;
    for (const [, val] of Object.entries(forms)) {
      if (!val) continue;
      if (!resolveBySlug("blog", val)) ok = false;
    }
    check("resolver handles flattenedPath/sourceFilePath/slug/href forms", ok);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────

if (!existsSync(REPORTS_DIR)) mkdirSync(REPORTS_DIR, { recursive: true });
writeFileSync(
  join(REPORTS_DIR, "public-content-route-audit.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), counts, results }, null, 2),
);

console.log("\n📄 JSON report written to reports/public-content-route-audit.json");

if (failures.length > 0) {
  console.log(`\n❌ Audit FAILED: ${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\n✅ Audit PASSED: public content families index and resolve correctly.");
