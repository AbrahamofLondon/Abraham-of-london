/**
 * Lexicon Link Guard
 *
 * Scans all content and source files for /lexicon/[slug] links.
 * Fails if any linked slug is missing from content/lexicon/.
 */

import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

const root = process.cwd();
const lexiconDir = path.join(root, "content", "lexicon");

// ── 1. Build set of existing lexicon slugs ──
const existingSlugs = new Set();
if (fs.existsSync(lexiconDir)) {
  for (const file of fs.readdirSync(lexiconDir)) {
    if (file.endsWith(".mdx") && file !== "_index.mdx") {
      existingSlugs.add(file.replace(/\.mdx$/, ""));
    }
  }
}

// ── 2. Scan all content and source files for /lexicon/ links ──
const scanPatterns = [
  "content/briefs/**/*.mdx",
  "content/blog/**/*.mdx",
  "content/canon/**/*.mdx",
  "content/books/**/*.mdx",
  "content/playbooks/**/*.mdx",
  "content/resources/**/*.mdx",
  "content/intelligence/**/*.mdx",
  "content/lexicon/**/*.mdx",
  "pages/**/*.tsx",
  "app/**/*.tsx",
  "components/**/*.tsx",
];

const files = scanPatterns.flatMap((pattern) =>
  globSync(pattern, { cwd: root, ignore: ["node_modules/**", ".next/**"] }),
);

const IGNORE_SLUGS = new Set(["index", "lexiconcard", "_index", "slug"]);
const linkPattern = /\/lexicon\/([a-z0-9-]+)/gi;
const referencedSlugs = new Map(); // slug → set of files
let totalLinks = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  let match;
  linkPattern.lastIndex = 0;

  // Use a fresh regex per file to avoid global state issues
  const regex = /\/lexicon\/([a-z0-9-]+)/gi;
  while ((match = regex.exec(content)) !== null) {
    const slug = match[1].toLowerCase();
    if (IGNORE_SLUGS.has(slug)) continue;
    totalLinks++;
    if (!referencedSlugs.has(slug)) {
      referencedSlugs.set(slug, new Set());
    }
    referencedSlugs.get(slug).add(file);
  }
}

// ── 3. Check for missing slugs ──
const missingSlugs = [];
const existingReferenced = [];

for (const [slug, files] of referencedSlugs) {
  if (existingSlugs.has(slug)) {
    existingReferenced.push(slug);
  } else {
    missingSlugs.push({ slug, files: [...files] });
  }
}

// ── 4. Report ──
console.log(`[LEXICON_LINK_GUARD] Scanned ${files.length} files.`);
console.log(`[LEXICON_LINK_GUARD] Total lexicon links found: ${totalLinks}`);
console.log(`[LEXICON_LINK_GUARD] Unique slugs referenced: ${referencedSlugs.size}`);
console.log(`[LEXICON_LINK_GUARD] Existing slugs matched: ${existingReferenced.length}`);
console.log(`[LEXICON_LINK_GUARD] Existing lexicon entries: ${existingSlugs.size}`);

if (missingSlugs.length > 0) {
  console.error(`\n[LEXICON_LINK_GUARD] FAIL — ${missingSlugs.length} missing lexicon slug(s):\n`);
  for (const { slug, files } of missingSlugs) {
    console.error(`  MISSING: /lexicon/${slug}`);
    for (const file of files.slice(0, 3)) {
      console.error(`    ← ${file}`);
    }
    if (files.length > 3) {
      console.error(`    ← ... and ${files.length - 3} more`);
    }
  }
  process.exit(1);
} else {
  console.log(`\n[LEXICON_LINK_GUARD] PASS — all ${referencedSlugs.size} referenced lexicon slugs exist.`);
}
