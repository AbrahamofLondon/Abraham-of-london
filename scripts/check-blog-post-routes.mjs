#!/usr/bin/env node
/**
 * scripts/check-blog-post-routes.mjs
 *
 * Phase 4 diagnostic: verifies every published blog post listed on /blog
 * can be resolved by the catch-all route pages/blog/[...slug].tsx.
 *
 * Fails if any published post cannot be resolved.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORTS_DIR = join(ROOT, "reports");

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizePath(input) {
  return String(input ?? "")
    .trim()
    .replace(/\\\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/\/{2,}/g, "/");
}

function toBareBlogSlug(input) {
  let s = String(input ?? "").trim().replace(/\\\\/g, "/").replace(/\/{2,}/g, "/");
  s = normalizePath(s);

  let changed = true;
  while (changed) {
    changed = false;
    const lower = s.toLowerCase();
    if (lower.startsWith("blog/")) { s = normalizePath(s.slice("blog/".length)); changed = true; }
    else if (lower.startsWith("posts/")) { s = normalizePath(s.slice("posts/".length)); changed = true; }
    else if (lower.startsWith("/blog/")) { s = normalizePath(s.slice("/blog/".length)); changed = true; }
    else if (lower.startsWith("/posts/")) { s = normalizePath(s.slice("/posts/".length)); changed = true; }
  }

  s = normalizePath(s);
  if (!s || s.includes("..")) return "";
  return s;
}

// ── Load contentlayer Post index ─────────────────────────────────────────

const POST_INDEX_PATH = join(ROOT, ".contentlayer/generated/Post/_index.json");

if (!existsSync(POST_INDEX_PATH)) {
  console.error("❌ Contentlayer Post index not found at:", POST_INDEX_PATH);
  console.error("   Run `pnpm contentlayer2 build` first.");
  process.exit(1);
}

const raw = readFileSync(POST_INDEX_PATH, "utf8");
const allPosts = JSON.parse(raw);

console.log(`\n📊 Loaded ${allPosts.length} posts from contentlayer Post index.\n`);

// ── Filter published non-draft, non-series posts ─────────────────────────

const publishedPosts = allPosts.filter((p) => {
  if (p.draft === true) return false;
  if (p.published === false) return false;
  // Future-dated
  if (p.date) {
    try {
      const d = new Date(p.date);
      if (Number.isFinite(d.getTime()) && d > new Date()) return false;
    } catch { /* ignore */ }
  }
  return true;
});

console.log(`📝 Published posts (non-draft): ${publishedPosts.length}`);

// Separate series posts
const seriesPosts = publishedPosts.filter((p) => p.series);
const standalonePosts = publishedPosts.filter((p) => !p.series);

console.log(`   Series posts: ${seriesPosts.length}`);
console.log(`   Standalone posts: ${standalonePosts.length}\n`);

// ── Simulate getStaticPaths ──────────────────────────────────────────────

const generatedPaths = [];
const pathSlugs = new Set();

for (const p of publishedPosts) {
  if (p.series) continue; // Series posts excluded from catch-all

  const raw = normalizePath(
    p?.urlSlug || p?.collectionSlug || p?.slug || p?._raw?.flattenedPath || ""
  );
  const bare = toBareBlogSlug(raw);
  if (bare) {
    generatedPaths.push({ slug: bare, title: p.title, date: p.date });
    pathSlugs.add(bare);
  }
}

console.log(`✅ getStaticPaths would generate ${generatedPaths.length} paths.\n`);

// ── Simulate getStaticProps lookup ───────────────────────────────────────

const results = [];
const failures = [];

for (const p of standalonePosts) {
  const rawSlug = normalizePath(
    p?.urlSlug || p?.collectionSlug || p?.slug || p?._raw?.flattenedPath || ""
  );
  const bare = toBareBlogSlug(rawSlug);

  if (!bare) {
    failures.push({
      title: p.title,
      slug: p.slug,
      rawSlug,
      reason: "toBareBlogSlug returned empty",
    });
    results.push({ title: p.title, slug: p.slug, bare, status: "FAIL", reason: "empty slug" });
    continue;
  }

  const wantBlog = `blog/${bare}`;
  const wantPosts = `posts/${bare}`;

  // Simulate the exact lookup from getStaticProps
  const found =
    allPosts.find((d) => normalizePath(d?.collectionSlug || "") === wantBlog) ||
    allPosts.find((d) => normalizePath(d?.collectionSlug || "") === wantPosts) ||
    allPosts.find((d) => normalizePath(d?.slug || "") === wantBlog) ||
    allPosts.find((d) => normalizePath(d?._raw?.flattenedPath || "") === wantBlog) ||
    allPosts.find((d) => normalizePath(d?.slug || "") === wantPosts) ||
    allPosts.find((d) => normalizePath(d?._raw?.flattenedPath || "") === wantPosts) ||
    allPosts.find((d) => normalizePath(d?.urlSlug || "") === bare) ||
    null;

  if (found) {
    results.push({ title: p.title, slug: p.slug, bare, status: "OK" });
  } else {
    failures.push({
      title: p.title,
      slug: p.slug,
      bare,
      reason: "Not found via any slug field in getStaticProps lookup",
    });
    results.push({ title: p.title, slug: p.slug, bare, status: "FAIL", reason: "lookup failed" });
  }
}

// ── Report ───────────────────────────────────────────────────────────────

console.log("=".repeat(60));
console.log("  BLOG POST ROUTE AUDIT RESULTS");
console.log("=".repeat(60));
console.log(`  Total published posts:     ${publishedPosts.length}`);
console.log(`  Standalone (non-series):   ${standalonePosts.length}`);
console.log(`  Paths generated:           ${generatedPaths.length}`);
console.log(`  Lookups succeeded:         ${results.filter((r) => r.status === "OK").length}`);
console.log(`  Lookups failed:            ${failures.length}`);
console.log("");

if (failures.length > 0) {
  console.log("❌ FAILURES:");
  for (const f of failures) {
    console.log(`   - "${f.title}" (slug: ${f.slug}, bare: ${f.bare})`);
    console.log(`     Reason: ${f.reason}`);
  }
  console.log("");
} else {
  console.log("✅ All standalone posts resolve correctly via getStaticProps lookup.\n");
}

// ── Check series posts (they should be excluded from catch-all) ──────────

console.log("─".repeat(60));
console.log("  SERIES POSTS (should be excluded from catch-all):");
console.log("─".repeat(60));
for (const p of seriesPosts) {
  const rawSlug = normalizePath(
    p?.urlSlug || p?.collectionSlug || p?.slug || p?._raw?.flattenedPath || ""
  );
  const bare = toBareBlogSlug(rawSlug);
  console.log(`   ${p.slug} (series: ${p.series}) → bare: ${bare}`);
}
console.log("");

// ── Write JSON report ────────────────────────────────────────────────────

if (!existsSync(REPORTS_DIR)) {
  mkdirSync(REPORTS_DIR, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  totalPosts: allPosts.length,
  publishedPosts: publishedPosts.length,
  standalonePosts: standalonePosts.length,
  seriesPosts: seriesPosts.length,
  pathsGenerated: generatedPaths.length,
  lookupsSucceeded: results.filter((r) => r.status === "OK").length,
  lookupsFailed: failures.length,
  failures: failures.map((f) => ({
    title: f.title,
    slug: f.slug,
    bare: f.bare,
    reason: f.reason,
  })),
  results: results,
};

writeFileSync(
  join(REPORTS_DIR, "blog-post-route-audit.json"),
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(`📄 JSON report written to reports/blog-post-route-audit.json`);

// ── Exit with code ───────────────────────────────────────────────────────

if (failures.length > 0) {
  console.error(`\n❌ Audit FAILED: ${failures.length} post(s) cannot be resolved by the catch-all route.`);
  process.exit(1);
} else {
  console.log(`\n✅ Audit PASSED: All standalone posts resolve correctly.`);
  process.exit(0);
}
