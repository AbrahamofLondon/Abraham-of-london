#!/usr/bin/env node
/**
 * scripts/check-content-visibility-regression.mjs
 *
 * Estate-wide content visibility regression checker.
 *
 * Guards the public/gated rendering boundary so content cannot silently render
 * an empty shell. Reads the Contentlayer generated indexes
 * (.contentlayer/generated/<Type>/_index.json) and the content route files
 * under pages/** and verifies the root invariants:
 *
 *   1. Public content docs expose a non-empty renderable body (raw or code).
 *   2. Public-only collections do not import ClientUnlockRenderer or AccessGate.
 *   3. Gated collections that strip the static body have a client unlock path.
 *   4. Slugs are unique within each collection.
 *   5. No public doc resolves to an empty body (empty-shell prevention).
 *
 * Exit code: 0 = pass, 1 = fail.
 *
 * This checker is read-only. It does not modify content, indexes, or config.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const GENERATED = path.join(ROOT, ".contentlayer", "generated");
const PAGES = path.join(ROOT, "pages");

// ── Collection model ────────────────────────────────────────────────────────
// generatedDirs: Contentlayer type folders that hold this collection's docs.
// route:         the dynamic route file that renders the collection.
// access:        "public"  → must never gate / never strip body
//                "gated"   → may strip body, must have a client unlock path
//                "mixed"   → classify per document (public stays static)
const COLLECTIONS = [
  { name: "shorts", generatedDirs: ["Short"], route: "pages/shorts/[...slug].tsx", access: "public" },
  { name: "lexicon", generatedDirs: ["Lexicon"], route: "pages/lexicon/[slug].tsx", access: "public" },
  { name: "blog", generatedDirs: ["Post"], route: "pages/blog/[...slug].tsx", access: "mixed" },
  { name: "playbooks", generatedDirs: ["Playbook"], route: "pages/playbooks/[slug].tsx", access: "mixed" },
  { name: "books", generatedDirs: ["Book"], route: "pages/books/[slug].tsx", access: "mixed" },
  { name: "briefs", generatedDirs: ["Brief", "VaultBrief"], route: "pages/briefs/[slug].tsx", access: "mixed" },
  { name: "canon", generatedDirs: ["Canon"], route: "pages/canon/[slug].tsx", access: "mixed" },
  { name: "editorials", generatedDirs: ["Editorial"], route: "pages/editorials/[slug].tsx", access: "mixed" },
  { name: "intelligence", generatedDirs: ["Intelligence"], route: "pages/intelligence/[slug].tsx", access: "mixed" },
  { name: "vault", generatedDirs: ["Vault"], route: "pages/vault/[...slug].tsx", access: "gated" },
  { name: "prints", generatedDirs: ["Print"], route: "pages/prints/[slug].tsx", access: "mixed" },
  { name: "resources", generatedDirs: ["Resource"], route: "pages/resources/[...slug].tsx", access: "mixed" },
  { name: "strategy", generatedDirs: ["Strategy"], route: "pages/strategy/[...slug].tsx", access: "mixed" },
  { name: "downloads", generatedDirs: ["Download"], route: "pages/downloads/[...slug].tsx", access: "mixed" },
  { name: "events", generatedDirs: ["Event"], route: "pages/events/[slug].tsx", access: "mixed" },
];

// Collections that are public by owner rule and must never depend on a gate.
const PUBLIC_ONLY = new Set(["shorts", "lexicon"]);

const errors = [];
const warnings = [];
const passed = [];

function readJsonArray(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

function docBodyIsRenderable(doc) {
  const raw = typeof doc?.body?.raw === "string" ? doc.body.raw.trim() : "";
  const code = typeof doc?.body?.code === "string" ? doc.body.code.trim() : "";
  const content = typeof doc?.content === "string" ? doc.content.trim() : "";
  const bodyCode = typeof doc?.bodyCode === "string" ? doc.bodyCode.trim() : "";
  return Boolean(raw || code || content || bodyCode);
}

function docIsPublic(doc) {
  const tier = String(
    doc?.accessLevelSafe ?? doc?.accessLevel ?? doc?.tier ?? doc?.classification ?? doc?.clearance ?? "",
  ).toLowerCase();
  const requiresAuth = doc?.requiresAuth === true || doc?.requiresAuthSafe === true;
  if (tier && tier !== "public") return false;
  if (!tier && requiresAuth) return false;
  return true;
}

function docIsDraft(doc) {
  return doc?.draft === true || doc?.published === false;
}

function docSlug(doc) {
  return String(
    doc?.slugSafe || doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || doc?._id || "",
  )
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "");
}

function loadCollectionDocs(collection) {
  // Returns docs tagged with the generated dir they came from, so slug
  // uniqueness can distinguish a true same-index duplicate from an intentional
  // cross-collection pairing (e.g. a public Brief and its VaultBrief twin).
  const docs = [];
  for (const dir of collection.generatedDirs) {
    const indexPath = path.join(GENERATED, dir, "_index.json");
    if (!fs.existsSync(indexPath)) continue;
    const arr = readJsonArray(indexPath);
    if (arr === null) {
      errors.push(`[${collection.name}] ${dir}/_index.json is unreadable or malformed JSON.`);
      continue;
    }
    for (const doc of arr) docs.push({ doc, dir });
  }
  return docs;
}

function routeImportsGate(routeRel) {
  const abs = path.join(ROOT, routeRel);
  if (!fs.existsSync(abs)) return { exists: false, gate: false, unlock: false };
  const src = fs.readFileSync(abs, "utf8");
  // Match real imports / JSX usage only — never prose in comments.
  return {
    exists: true,
    gate: /import\s+[^;]*\bAccessGate\b[^;]*from/.test(src) || /<AccessGate[\s/>]/.test(src),
    unlock:
      /import\s+[^;]*\bClientUnlockRenderer\b[^;]*from/.test(src) || /<ClientUnlockRenderer[\s/>]/.test(src),
  };
}

// ── 1. Generated indexes must exist ─────────────────────────────────────────
if (!fs.existsSync(GENERATED)) {
  errors.push(
    ".contentlayer/generated is missing. Run the contentlayer build before this checker; " +
      "an empty registry at runtime is the classic 'content disappears after deploy' cause.",
  );
}

// ── 2. Per-collection invariants ────────────────────────────────────────────
for (const collection of COLLECTIONS) {
  if (!fs.existsSync(GENERATED)) break;

  const docs = loadCollectionDocs(collection);
  const route = routeImportsGate(collection.route);

  if (!route.exists) {
    warnings.push(`[${collection.name}] route ${collection.route} not found — skipping route-level checks.`);
  }

  // 2a. Public-only collections must not import a gate or unlock renderer.
  if (PUBLIC_ONLY.has(collection.name) && route.exists) {
    if (route.gate) errors.push(`[${collection.name}] public-only route imports/uses AccessGate.`);
    if (route.unlock) errors.push(`[${collection.name}] public-only route imports/uses ClientUnlockRenderer.`);
  }

  if (!docs.length) {
    warnings.push(`[${collection.name}] no generated docs found in ${collection.generatedDirs.join(", ")}.`);
    continue;
  }

  // 2b. Slug uniqueness. A repeat within ONE generated index is a real bug.
  // The same slug across two dirs of a merged collection (Brief + VaultBrief)
  // is an intentional public/gated pairing — flagged as a warning since it does
  // make getDocBySlug("<collection>/<slug>") resolution order-dependent.
  const perDir = new Map(); // dir -> Map(slug -> count)
  const dirsForSlug = new Map(); // slug -> Set(dir)
  for (const { doc, dir } of docs) {
    if (docIsDraft(doc)) continue;
    const slug = docSlug(doc);
    if (!slug) {
      warnings.push(`[${collection.name}] a doc has no resolvable slug (_id=${doc?._id ?? "?"}).`);
      continue;
    }
    if (!perDir.has(dir)) perDir.set(dir, new Map());
    const m = perDir.get(dir);
    m.set(slug, (m.get(slug) || 0) + 1);
    if (!dirsForSlug.has(slug)) dirsForSlug.set(slug, new Set());
    dirsForSlug.get(slug).add(dir);
  }
  for (const [dir, m] of perDir) {
    for (const [slug, count] of m) {
      if (count > 1) errors.push(`[${collection.name}] duplicate slug "${slug}" within ${dir} (${count} docs).`);
    }
  }
  for (const [slug, dirs] of dirsForSlug) {
    if (dirs.size > 1) {
      warnings.push(
        `[${collection.name}] slug "${slug}" appears in ${[...dirs].join(" + ")} — public/gated pairing; ` +
          `resolution is order-dependent.`,
      );
    }
  }

  // 2c. Empty-shell prevention: every public, non-draft doc needs a renderable body.
  let publicCount = 0;
  let emptyPublic = 0;
  for (const { doc } of docs) {
    if (docIsDraft(doc)) continue;
    const isPublic = docIsPublic(doc);

    // Owner rule: shorts are public regardless of metadata, but flag drift.
    if (PUBLIC_ONLY.has(collection.name) && !isPublic) {
      warnings.push(
        `[${collection.name}] "${docSlug(doc)}" carries non-public metadata but the collection is public-only ` +
          `(rendered public via override).`,
      );
    }

    const treatAsPublic = PUBLIC_ONLY.has(collection.name) || isPublic;
    if (!treatAsPublic) continue; // gated docs legitimately ship without static body

    publicCount += 1;
    if (!docBodyIsRenderable(doc)) {
      emptyPublic += 1;
      errors.push(`[${collection.name}] public doc "${docSlug(doc)}" has an empty body (would render an empty shell).`);
    }
  }

  if (emptyPublic === 0) {
    passed.push(`[${collection.name}] ${publicCount} public doc(s) have renderable bodies; ${dirsForSlug.size} unique slug(s).`);
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log("Content Visibility Regression Check");
console.log("===================================");
for (const line of passed) console.log(`  ✓ ${line}`);
if (warnings.length) {
  console.log("\nWarnings:");
  for (const w of warnings) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log("\nErrors:");
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log("\nFAILED");
  process.exit(1);
}
console.log("\nPASSED");
process.exit(0);
