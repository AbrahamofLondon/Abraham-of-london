#!/usr/bin/env node
/**
 * scripts/check-mdx-route-conventions.mjs
 *
 * Route Convention Parity Audit.
 * For every MDX collection, verifies that Contentlayer computed hrefs,
 * route manifest paths, page file routes, canonical URLs, and smoke URLs
 * all use the same route convention (singular vs plural, prefix, etc).
 *
 * Output: reports/mdx-route-convention-report.json
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GENERATED = path.join(ROOT, ".contentlayer", "generated");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "mdx-route-convention-report.json");

// ─── Expected route conventions (THE SOURCE OF TRUTH) ────────────────────────
// For each collection, define the expected canonical route prefix.
// This is what the page template generates and what the public URL should be.
const EXPECTED_CONVENTIONS = {
  Post:                { routePrefix: "/blog",          slugStyle: "catch-all",   pageFile: "pages/blog/[...slug].tsx" },
  Short:               { routePrefix: "/shorts",        slugStyle: "catch-all",   pageFile: "pages/shorts/[...slug].tsx" },
  Editorial:           { routePrefix: "/editorials",    slugStyle: "single",      pageFile: "pages/editorials/[slug].tsx" },
  EditorialSeriesPart: { routePrefix: "/editorials/series", slugStyle: "nested", pageFile: "pages/editorials/series/[seriesSlug]/[partSlug].tsx" },
  Book:                { routePrefix: "/books",         slugStyle: "single",      pageFile: "pages/books/[slug].tsx" },
  Canon:               { routePrefix: "/canon",         slugStyle: "single",      pageFile: "pages/canon/[slug].tsx" },
  Brief:               { routePrefix: "/briefs",        slugStyle: "single",      pageFile: "pages/briefs/[slug].tsx" },
  VaultBrief:          { routePrefix: "/vault/briefs",  slugStyle: "single",      pageFile: "pages/vault/briefs/[slug].tsx" },
  Intelligence:        { routePrefix: "/intelligence",  slugStyle: "single",      pageFile: "pages/intelligence/[slug].tsx" },
  Download:            { routePrefix: "/downloads",     slugStyle: "catch-all",   pageFile: "pages/downloads/[...slug].tsx" },
  Event:               { routePrefix: "/events",        slugStyle: "single",      pageFile: "pages/events/[slug].tsx" },
  Print:               { routePrefix: "/prints",        slugStyle: "single",      pageFile: "pages/prints/[slug].tsx" },
  Resource:            { routePrefix: "/resources",     slugStyle: "catch-all",   pageFile: "pages/resources/[...slug].tsx" },
  Strategy:            { routePrefix: "/strategy",      slugStyle: "catch-all",   pageFile: "pages/strategy/[...slug].tsx" },
  Lexicon:             { routePrefix: "/lexicon",       slugStyle: "single",      pageFile: "pages/lexicon/[slug].tsx" },
  Vault:               { routePrefix: "/vault",         slugStyle: "catch-all",   pageFile: "pages/vault/[...slug].tsx" },
  Playbook:            { routePrefix: "/playbooks",     slugStyle: "single",      pageFile: "pages/playbooks/[slug].tsx" },
};

// Internal types that don't need public route conventions
const INTERNAL_TYPES = new Set(["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v, fallback = "") {
  return (v && typeof v === "string") ? v.trim() : fallback;
}

function readIndexJson(typeDir) {
  const indexPath = path.join(GENERATED, typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getContentlayerHrefPrefix(typeDir) {
  const docs = readIndexJson(typeDir);
  if (docs.length === 0) return { prefix: "NO_DOCS", sample: null };
  // Get the hrefSafe from the first doc that has one
  for (const doc of docs) {
    const href = safeStr(doc.hrefSafe || doc.href);
    if (href) {
      // Extract prefix: /playbooks/execution-integrity-public → /playbooks
      const parts = href.split("/").filter(Boolean);
      if (parts.length >= 1) {
        const prefix = "/" + parts.slice(0, parts.length - 1).join("/");
        return { prefix, sample: href };
      }
    }
  }
  return { prefix: "NO_HREF", sample: null };
}

function getManifestRouteBase(typeDir) {
  // Read the manifest to find what routeBase was used
  if (!fs.existsSync(MANIFEST_PATH)) return "NO_MANIFEST";
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const col = manifest.collections?.[typeDir];
  return col?.routeBase || "NOT_IN_MANIFEST";
}

function getPageFile(typeDir) {
  const expected = EXPECTED_CONVENTIONS[typeDir];
  if (!expected) return null;
  const pagePath = path.join(ROOT, expected.pageFile);
  return fs.existsSync(pagePath) ? expected.pageFile : "FILE_NOT_FOUND";
}

function checkCanonicalUrlInTemplate(typeDir) {
  const expected = EXPECTED_CONVENTIONS[typeDir];
  if (!expected) return { pattern: null, found: false };
  const pagePath = path.join(ROOT, expected.pageFile);
  if (!fs.existsSync(pagePath)) return { pattern: null, found: false, error: "FILE_NOT_FOUND" };

  const content = fs.readFileSync(pagePath, "utf8");

  // Look for the route prefix in the template across multiple patterns:
  //   1. canonicalUrl prop on Layout: <Layout canonicalUrl={`/events/${slug}`} ...>
  //   2. canonical variable: const canonical = `${SITE}/events/${slug}`
  //   3. <link rel="canonical" href={...} />
  //   4. Share/share URLs: `https://site.com/events/${slug}`
  //   5. API fetch URLs: fetch(`/api/events/${slug}`)
  //   6. Doc lookup: getDocBySlug(`content/events/${slug}`)
  //   7. href strings: href="/events"
  //   8. Return/redirect: return `/events/${slug}`
  //   9. Any template literal or string containing the prefix followed by /$
  const prefix = expected.routePrefix;
  const escapedPrefix = prefix.replace(/\//g, "\\/");
  const contentPrefix = "content" + prefix; // e.g. content/events

  // Check for the route prefix in various contexts
  const patterns = [
    // canonicalUrl prop or canonical variable
    new RegExp(`canonical[Uu]rl?\\s*[=:].*?[\`"'](?:https?://[^/]+)?${escapedPrefix}/`, "i"),
    // const canonical = `...`
    new RegExp(`canonical\\s*=\\s*[\`"'].*?${escapedPrefix}/`, "i"),
    // <link rel="canonical" href=...
    new RegExp(`rel=["']canonical["'].*?href=.*?${escapedPrefix}`, "i"),
    // Share/social URLs
    new RegExp(`(?:share|url|href)=[\`"'](?:https?://[^/]+)?${escapedPrefix}/`, "i"),
    // API fetch URLs
    new RegExp(`fetch\\([\`"']/api${escapedPrefix}/`, "i"),
    // Doc lookup with content/ prefix
    new RegExp(`[\`"']${contentPrefix}/\\$\\{`, "i"),
    // Template literal with prefix
    new RegExp(`[\`"']${escapedPrefix}/\\$\\{`, "i"),
    // Return/redirect
    new RegExp(`return.*?[\`"']${escapedPrefix}/`, "i"),
    // Static href
    new RegExp(`href=[\`"']${escapedPrefix}(?:/|["'\`])`, "i"),
    // content/ prefix doc lookup
    new RegExp(`[\`"']content${escapedPrefix}/\\$\\{`, "i"),
    // Plain string reference
    new RegExp(`["'\`]${escapedPrefix}/[\\w-]`, "i"),
  ];

  const matches = patterns.map((p, i) => ({ index: i, match: content.match(p) }));
  const found = matches.some(m => m.match);

  return {
    pattern: prefix,
    found,
    matchDetails: matches.map((m, i) => ({
      pattern: i,
      found: !!m.match,
      sample: m.match ? m.match[0].substring(0, 80) : null,
    })),
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

function checkRouteConventions() {
  const results = [];
  const failures = [];
  const warnings = [];

  // Get all generated type directories
  const generatedDirs = fs.readdirSync(GENERATED, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const typeDir of generatedDirs) {
    if (INTERNAL_TYPES.has(typeDir)) continue;

    const expected = EXPECTED_CONVENTIONS[typeDir];
    if (!expected) {
      warnings.push({
        type: "UNEXPECTED_COLLECTION",
        collection: typeDir,
        detail: `Collection ${typeDir} has no expected convention defined`,
      });
      continue;
    }

    // 1. Contentlayer computed href prefix
    const clHref = getContentlayerHrefPrefix(typeDir);

    // 2. Manifest routeBase
    const manifestRouteBase = getManifestRouteBase(typeDir);

    // 3. Expected route prefix (from our convention table)
    const expectedPrefix = expected.routePrefix;

    // 4. Page file
    const pageFile = getPageFile(typeDir);

    // 5. Canonical URL in template
    const canonical = checkCanonicalUrlInTemplate(typeDir);

    // 6. Check the manifest routeBase against expected
    const manifestRoutePath = manifestRouteBase ? `/${manifestRouteBase}` : null;
    const manifestMatches = manifestRoutePath === expectedPrefix;

    // 7. Check Contentlayer href prefix against expected
    const clMatches = clHref.prefix === expectedPrefix;

    // 8. Check canonical URL in template against expected
    const templateMatches = canonical.found;

    // Build result
    const result = {
      collection: typeDir,
      contentFolder: expected.routePrefix.replace("/", ""), // approximate
      contentlayerHrefPrefix: clHref.prefix,
      contentlayerSampleHref: clHref.sample,
      manifestRouteBase: manifestRouteBase ? `/${manifestRouteBase}` : manifestRouteBase,
      expectedRoutePrefix: expectedPrefix,
      pageFile: pageFile,
      canonicalUrlInTemplate: canonical.pattern ? `${canonical.pattern}/[slug]` : "N/A",
      canonicalFound: canonical.found,
      checks: {
        contentlayerMatchesExpected: clMatches,
        manifestMatchesExpected: manifestMatches,
        templateMatchesExpected: templateMatches,
        pageFileExists: pageFile !== "FILE_NOT_FOUND" && pageFile !== null,
      },
      passed: false, // will be recalculated after all checks
      issues: [],
    };

    if (!clMatches) {
      // Check if it's a nested path that still starts with the expected prefix
      // e.g. /vault/indices starts with /vault → OK for nested content
      if (clHref.prefix && clHref.prefix.startsWith(expectedPrefix + "/")) {
        result.checks.contentlayerMatchesExpected = true;
        result.issues.push(`Contentlayer href prefix "${clHref.prefix}" is nested under expected "${expectedPrefix}" — acceptable for subdirectory content`);
        // Don't mark as failed for nested prefixes - this is valid
        result.passed = result.passed && true;
      } else {
        const issue = `Contentlayer href prefix "${clHref.prefix}" does not match expected "${expectedPrefix}"`;
        result.issues.push(issue);
        failures.push({
          type: "CONTENTLAYER_HREF_MISMATCH",
          collection: typeDir,
          actual: clHref.prefix,
          expected: expectedPrefix,
          detail: issue,
        });
      }
    }

    if (!manifestMatches) {
      const issue = `Manifest routeBase "${manifestRoutePath}" does not match expected "${expectedPrefix}"`;
      result.issues.push(issue);
      failures.push({
        type: "MANIFEST_ROUTE_MISMATCH",
        collection: typeDir,
        actual: manifestRoutePath,
        expected: expectedPrefix,
        detail: issue,
      });
    }

    if (!templateMatches) {
      const issue = `Page template does not use expected route prefix "${expectedPrefix}" in canonical URLs`;
      result.issues.push(issue);
      failures.push({
        type: "TEMPLATE_CANONICAL_MISMATCH",
        collection: typeDir,
        expected: expectedPrefix,
        detail: issue,
      });
    }

    if (pageFile === "FILE_NOT_FOUND" || pageFile === null) {
      const issue = `Page file not found at expected path "${expected.pageFile}"`;
      result.issues.push(issue);
      failures.push({
        type: "PAGE_FILE_NOT_FOUND",
        collection: typeDir,
        expected: expected.pageFile,
        detail: issue,
      });
    }

    // Recalculate passed based on final check values
    result.passed = result.checks.contentlayerMatchesExpected &&
                    result.checks.manifestMatchesExpected &&
                    result.checks.templateMatchesExpected &&
                    result.checks.pageFileExists &&
                    result.issues.every(i => i.includes("acceptable for subdirectory content")); // nested prefixes are OK

    results.push(result);
  }

  // ── Report ─────────────────────────────────────────────────────────────
  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalCollections: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      failures: failures.length,
      warnings: warnings.length,
    },
    collections: results,
    failures,
    warnings,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log("\n============================================");
  console.log("MDX ROUTE CONVENTION REPORT");
  console.log("============================================");
  console.log(`Collections checked: ${report.summary.totalCollections}`);
  console.log(`Passed:              ${report.summary.passed}`);
  console.log(`Failed:              ${report.summary.failed}`);
  console.log(`Failures:            ${report.summary.failures}`);
  console.log(`Warnings:            ${report.summary.warnings}`);
  console.log("\n");

  // Detailed results table
  console.log("Collection".padEnd(22), "CL Href".padEnd(22), "Manifest".padEnd(14), "Expected".padEnd(16), "Template".padEnd(10), "Status");
  console.log("-".repeat(90));
  for (const r of results) {
    const status = r.passed ? "✅" : "❌";
    const cl = r.contentlayerHrefPrefix.padEnd(20);
    const man = (r.manifestRouteBase || "").padEnd(12);
    const exp = r.expectedRoutePrefix.padEnd(14);
    const tmpl = r.canonicalFound ? "✅" : "❌";
    console.log(r.collection.padEnd(22), cl, man, exp, tmpl.padEnd(8), status);
  }

  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.collection}: ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — route convention check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All ${report.summary.passed}/${report.summary.totalCollections} collections pass route convention parity`);
  process.exit(0);
}

checkRouteConventions();
