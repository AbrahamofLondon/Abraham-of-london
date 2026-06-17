#!/usr/bin/env node
/**
 * scripts/check-content-route-tracing.mjs
 *
 * DRIFT-GUARD for the content-persistence fix (Approach A).
 *
 * Content pages are `●` ISR routes whose getStaticProps reads
 * `.contentlayer/generated/<Type>/_index.json` at runtime. next.config.mjs
 * traces each route's type `_index.json` into the Netlify handler, GENERATED
 * from the SSOT lib/content/route-content-types.mjs. If a route's loader and its
 * trace entry drift apart, ISR regeneration silently returns empty content again.
 *
 * This guard enforces three invariants and FAILS THE BUILD (exit 1) on any:
 *   (1) MISSING ROUTE   — a content page (calls a content getter in getStaticProps/
 *       getStaticPaths) is not listed in ROUTE_CONTENT_TYPES or CATCH_ALL_CONTENT_ROUTES.
 *   (2) UNDER-PROVISIONED — a route's loader reads a generated type that its SSOT
 *       entry does not list (so that type would not be traced into the handler).
 *   (3) TRACING MISMATCH — the generated outputFileTracingIncludes does not contain
 *       the `_index.json` for every type the SSOT lists for a route.
 *
 * (1)+(2) are exactly the two failure modes called out by the owner: a new route
 * added with no entry, AND an existing route whose loader later pulls an extra type.
 *
 * Scope: content PAGES under pages/ (.tsx) only. API routes (under pages/api/) and
 * sitemap routes (the "-sitemap.xml.ts" pages, which read the full corpus and are SSR,
 * not ISR) are out of scope for this guard — a separate concern, noted here so a future
 * reader knows it was deliberate, not forgotten.
 *
 * Exit: 0 = all invariants hold, 1 = one or more violations.
 */

import fs from "node:fs";
import path from "node:path";
import {
  ROUTE_CONTENT_TYPES,
  CATCH_ALL_CONTENT_ROUTES,
  buildContentTracingIncludes,
} from "../lib/content/route-content-types.mjs";

const ROOT = process.cwd();
const PAGES = path.join(ROOT, "pages");

// ── content getter → generated type dirs (mirrors lib/contentlayer-helper.ts) ──
const GETTER_TYPES = {
  getAllShorts: ["Short"], getShortBySlug: ["Short"], getPublishedShorts: ["Short"],
  getAllPosts: ["Post"], getPublishedPosts: ["Post"], getPostBySlug: ["Post"],
  getAllBriefs: ["Brief", "VaultBrief"], getPublishedBriefs: ["Brief", "VaultBrief"], getBriefBySlug: ["Brief", "VaultBrief"],
  getAllLexicon: ["Lexicon"], getAllLexicons: ["Lexicon"],
  getAllBooks: ["Book"], getPublishedBooks: ["Book"], getBookBySlug: ["Book"],
  getAllCanons: ["Canon"], getCanonBySlug: ["Canon"],
  getAllPlaybooks: ["Playbook"],
  getAllEditorials: ["Editorial"],
  getAllIntelligence: ["Intelligence"], getPublishedIntelligence: ["Intelligence"],
  getAllPrints: ["Print"], getPrintBySlug: ["Print"],
  getAllResources: ["Resource"], getResourceBySlug: ["Resource"],
  getAllStrategies: ["Strategy"], getPublishedStrategies: ["Strategy"], getStrategyBySlug: ["Strategy"],
  getAllDownloads: ["Download"], getDownloadBySlug: ["Download"],
  getAllVault: ["Vault"],
  getAllEvents: ["Event"], getEventBySlug: ["Event"],
};

// getDocBySlug("<prefix>/…") / getDocBySlug(`<prefix>/…`) → generated type(s)
const PREFIX_TYPES = {
  lexicon: ["Lexicon"], prints: ["Print"], shorts: ["Short"], blog: ["Post"], posts: ["Post"],
  briefs: ["Brief", "VaultBrief"], canon: ["Canon"], books: ["Book"], vault: ["Vault"],
  editorials: ["Editorial"], resources: ["Resource"], strategy: ["Strategy"],
  downloads: ["Download"], events: ["Event"], intelligence: ["Intelligence"],
};

const errors = [];
const passed = [];

function fileToRoute(relFromPages) {
  let r = "/" + relFromPages.replace(/\\/g, "/").replace(/\.(t|j)sx?$/i, "");
  r = r.replace(/\/index$/i, "");
  return r === "" ? "/" : r;
}

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (/\.tsx$/i.test(e.name)) yield full;
  }
}

/**
 * Detect which generated types a page's source reads, AND record WHY each was
 * matched. Returns a Map<type, reasons[]> so the guard can print its reasoning —
 * a human reviewing the output can then spot a bad heuristic match (e.g. the
 * vault/canon getDocBySlug case) by reading it, instead of relying on luck.
 * @returns {Map<string, string[]>} type → human-readable match evidence
 */
function detectRequiredTypes(src) {
  /** @type {Map<string, string[]>} */
  const types = new Map();
  const add = (t, reason) => {
    const arr = types.get(t) || [];
    if (!arr.includes(reason)) arr.push(reason);
    types.set(t, arr);
  };

  for (const [getter, ts] of Object.entries(GETTER_TYPES)) {
    if (new RegExp(`\\b${getter}\\s*\\(`).test(src)) ts.forEach((t) => add(t, `${getter}()`));
  }
  // getDocBySlug("<path>/...") — map via the DEEPEST known collection segment, so
  // e.g. `vault/canon/${slug}` resolves to Canon (a canon doc stored under a vault
  // path), not Vault. This avoids false positives from path wrappers (vault/, content/).
  const re = /getDocBySlug\s*\(\s*[`'"]([^`'"${)]*)/gi;
  let m;
  while ((m = re.exec(src))) {
    const raw = m[1];
    const segs = raw.toLowerCase().split("/").filter(Boolean);
    for (let i = segs.length - 1; i >= 0; i--) {
      if (PREFIX_TYPES[segs[i]]) {
        // Record the literal path + which segment matched, so a wrong deepest-segment
        // resolution is visible in the output (this is the heuristic most likely to
        // mis-fire on a future content type with a different path shape).
        PREFIX_TYPES[segs[i]].forEach((t) =>
          add(t, `getDocBySlug("${raw}…" → deepest-known segment "${segs[i]}")`),
        );
        break;
      }
    }
  }
  return types;
}

/** Render a type→evidence Map as `Type←reason; …` for human inspection. */
function formatEvidence(typeMap) {
  return [...typeMap.entries()]
    .map(([t, reasons]) => `${t} ← ${reasons.join(" + ")}`)
    .join("; ");
}

if (!fs.existsSync(PAGES)) {
  console.error("[content-route-tracing] pages/ not found");
  process.exit(1);
}

const catchAll = new Set(CATCH_ALL_CONTENT_ROUTES);
const generated = buildContentTracingIncludes();

for (const file of walk(PAGES)) {
  const rel = path.relative(PAGES, file).replace(/\\/g, "/");
  if (rel.startsWith("api/")) continue;            // API routes out of scope
  if (/-sitemap.*\.xml/i.test(rel)) continue;       // sitemap (SSR, full corpus) out of scope

  const src = fs.readFileSync(file, "utf8");
  if (!/getStaticProps|getStaticPaths/.test(src)) continue; // not an SSG/ISR page

  const required = detectRequiredTypes(src);
  if (required.size === 0) continue;                // page reads no contentlayer types

  const requiredTypes = [...required.keys()];
  const evidence = formatEvidence(required);        // why each type was matched
  const route = fileToRoute(rel);

  // Invariant (1): route must be declared
  if (catchAll.has(route)) {
    passed.push(`${route} — catch-all (full content set) — matched: ${evidence}`);
    continue;
  }
  const declared = ROUTE_CONTENT_TYPES[route];
  if (!declared) {
    errors.push(
      `MISSING ROUTE: ${route} (pages/${rel}) reads [${requiredTypes.join(", ")}] ` +
        `but has no entry in lib/content/route-content-types.mjs.\n      matched: ${evidence}`,
    );
    continue;
  }

  // Invariant (2): declared entry must cover every type the loader reads
  const declaredSet = new Set(declared);
  const missing = requiredTypes.filter((t) => !declaredSet.has(t));
  if (missing.length) {
    errors.push(
      `UNDER-PROVISIONED: ${route} (pages/${rel}) loader reads [${missing.join(", ")}] ` +
        `not listed in its SSOT entry [${declared.join(", ")}]. Add them (and they will be traced).\n` +
        `      matched: ${evidence}`,
    );
    continue;
  }

  // Invariant (3): generated tracing must include each declared type's _index.json
  const traced = generated[route] || [];
  const notTraced = declared.filter(
    (t) => !traced.includes(`./.contentlayer/generated/${t}/_index.json`),
  );
  if (notTraced.length) {
    errors.push(
      `TRACING MISMATCH: ${route} declares [${notTraced.join(", ")}] but next.config ` +
        `outputFileTracingIncludes (generated) does not trace them. buildContentTracingIncludes() is broken.`,
    );
    continue;
  }

  passed.push(`${route} — all traced — matched: ${evidence}`);
}

console.log("Content Route Tracing Drift-Guard");
console.log("=================================");
for (const p of passed) console.log(`  ✓ ${p}`);
if (errors.length) {
  console.log("\nViolations:");
  for (const e of errors) console.log(`  ✗ ${e}`);
  console.log(
    `\nFAILED — ${errors.length} violation(s). Update lib/content/route-content-types.mjs ` +
      `so every content route's tracing matches what its loader reads, then rebuild.`,
  );
  process.exit(1);
}
console.log(`\nPASSED — ${passed.length} content route(s); SSOT, loaders, and generated tracing agree.`);
process.exit(0);
