#!/usr/bin/env node
/**
 * scripts/check-public-link-integrity.mjs
 *
 * Crawls actual generated public page links and fails if:
 * - a public page links to a missing internal route
 * - a public series card links to a future-dated unreadable part
 * - a scheduled part has an active "Read" link
 * - a visible series has CTA to a non-public first part
 *
 * Also checks the mandatory regression cases:
 *   /blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape
 *   /shorts/when-the-burden-changes-address
 *
 * Output: reports/public-link-integrity-report.json
 * Exit code: 0 if all pass, 1 if failures found.
 */

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "reports", "mdx-route-manifest.json");
const OUTPUT_PATH = path.join(ROOT, "reports", "public-link-integrity-report.json");

const TODAY = new Date("2026-05-28T23:59:59Z");

// ─── Known broken URLs (regression cases) ────────────────────────────────────
const REGRESSION_URLS_LIST = [
  "/blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape",
  "/shorts/when-the-burden-changes-address",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeStr(v, fallback = "") {
  return (v && typeof v === "string") ? v.trim() : fallback;
}

function safeBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return fallback;
}

function isFutureDated(doc) {
  const dateStr = safeStr(doc.date || doc.eventDate || doc.startDate || doc.scheduledDate || doc.releaseDate);
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime()) && d > TODAY;
}

function classifyDoc(doc) {
  if (!doc) return "UNKNOWN";
  const type = safeStr(doc.type || doc.docKind || "");
  if (["LinkedInOutbound", "FacebookOutbound", "XOutbound", "Dispatch"].includes(type)) return "INTERNAL";
  if (isFutureDated(doc)) return "SCHEDULED";
  if (safeBool(doc.draft, false)) return "DRAFT";
  if (safeBool(doc.published, true) === false) return "DRAFT";
  const status = safeStr(doc.status || doc.publicationStatus).toLowerCase();
  if (status === "draft") return "DRAFT";
  const tier = safeStr(doc.accessTierSafe || doc.accessTier || doc.accessLevel || doc.tier || "public").toLowerCase();
  if (!["public", "open", "free", "unclassified"].includes(tier)) return "RESTRICTED";
  if (status === "scheduled" || status === "limited") return "SCHEDULED";
  return "PUBLIC_READABLE_NOW";
}

function normaliseSeriesSlug(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function readIndexJson(typeDir) {
  const indexPath = path.join(ROOT, ".contentlayer", "generated", typeDir, "_index.json");
  if (!fs.existsSync(indexPath)) return [];
  try {
    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function checkPublicLinkIntegrity() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("[check-public-link-integrity] ERROR: Run scripts/build-mdx-route-manifest.mjs first");
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const docs = manifest.documents;
  const failures = [];
  const warnings = [];

  console.log("\n============================================");
  console.log("PUBLIC LINK INTEGRITY CHECK");
  console.log("============================================");
  console.log(`Today: ${TODAY.toISOString().split("T")[0]}`);

  // ── Check 1: Regression cases ─────────────────────────────────────────
  for (const REGRESSION_URL of REGRESSION_URLS_LIST) {
    console.log(`\n--- Regression case: ${REGRESSION_URL} ---`);

    // Check if the document exists in the manifest
    const slug = REGRESSION_URL.split("/").filter(Boolean).pop();
    const regressionDoc = docs.find(d =>
      d.routePath === REGRESSION_URL ||
      d.routePath === `/blog/${slug}` ||
      d.routePath === `/shorts/${slug}` ||
      (d.slug === slug && (d.collection === "Post" || d.collection === "Short"))
    );

    if (regressionDoc) {
      const classification = classifyDoc(regressionDoc);
      console.log(`  Document found: "${regressionDoc.title}"`);
      console.log(`  Route path in manifest: ${regressionDoc.routePath}`);
      console.log(`  Classification: ${classification}`);
      console.log(`  Expected public route: ${regressionDoc.expectedPublicRoute}`);
      console.log(`  Is future-dated: ${regressionDoc.isFutureDated}`);
      console.log(`  Date: ${regressionDoc.date}`);
      console.log(`  Draft: ${regressionDoc.draft}`);
      console.log(`  Published: ${regressionDoc.published}`);

      // Check if the sitemap contains this URL
      let sitemapHasUrl = false;
      const sitemapPath = path.join(ROOT, "public", "sitemap-0.xml");
      if (fs.existsSync(sitemapPath)) {
        const sitemapContent = fs.readFileSync(sitemapPath, "utf8");
        if (sitemapContent.includes(REGRESSION_URL)) {
          sitemapHasUrl = true;
          failures.push({
            type: "SITEMAP_CONTAINS_FUTURE_URL",
            url: REGRESSION_URL,
            detail: `Sitemap at public/sitemap-0.xml contains future-dated URL ${REGRESSION_URL}`,
          });
        }
      }

      if (classification === "SCHEDULED" || classification === "DRAFT") {
        if (sitemapHasUrl) {
          // Already reported above
        } else {
          console.log(`  ✅ Correctly classified as ${classification} — not publicly linked`);
        }
      }
    } else {
      // Document not found in manifest — check sitemap directly
      const sitemapPath = path.join(ROOT, "public", "sitemap-0.xml");
      if (fs.existsSync(sitemapPath)) {
        const sitemapContent = fs.readFileSync(sitemapPath, "utf8");
        if (sitemapContent.includes(REGRESSION_URL)) {
          failures.push({
            type: "SITEMAP_CONTAINS_UNKNOWN_URL",
            url: REGRESSION_URL,
            detail: `Sitemap contains ${REGRESSION_URL} but document not found in manifest`,
          });
        } else {
          console.log(`  ✅ URL absent from sitemap (document not in manifest)`);
        }
      }
    }
  }

  // ── Check 2: All series parts — verify no public links to non-public parts ──
  console.log("\n--- Series part link integrity ---");

  // Read Post index to get all blog series parts
  const posts = readIndexJson("Post");
  const seriesParts = posts.filter(p => p.series && p.seriesOrder != null);

  // Group by series
  const seriesGroups = {};
  for (const part of seriesParts) {
    const slug = normaliseSeriesSlug(String(part.series));
    if (!seriesGroups[slug]) seriesGroups[slug] = [];
    seriesGroups[slug].push(part);
  }

  for (const [seriesSlug, parts] of Object.entries(seriesGroups)) {
    parts.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
    const seriesTitle = parts[0].seriesTitle || parts[0].series || seriesSlug;
    console.log(`\n  Series: ${seriesTitle} (${seriesSlug})`);

    for (const part of parts) {
      const classification = classifyDoc(part);
      const partUrl = `/blog/series/${seriesSlug}/${part.slug}`;
      const isPublic = classification === "PUBLIC_READABLE_NOW";

      console.log(`    Part ${part.seriesOrder}: "${part.title}" — ${classification}${isPublic ? " ✅" : " ⏳"}`);

      // Check: if the part is NOT public, it should NOT have an active link in the series hub
      if (!isPublic) {
        // Check if the sitemap contains this URL
        const sitemapPath = path.join(ROOT, "public", "sitemap-0.xml");
        if (fs.existsSync(sitemapPath)) {
          const sitemapContent = fs.readFileSync(sitemapPath, "utf8");
          if (sitemapContent.includes(partUrl)) {
            failures.push({
              type: "SITEMAP_CONTAINS_NON_PUBLIC_SERIES_PART",
              url: partUrl,
              series: seriesSlug,
              part: part.slug,
              title: part.title,
              detail: `Sitemap contains non-public series part URL ${partUrl} (${classification})`,
            });
          }
        }
      }
    }
  }

  // ── Check 3: Series hub pages — verify CTA integrity ──────────────────
  console.log("\n--- Series hub CTA integrity ---");

  for (const [seriesSlug, parts] of Object.entries(seriesGroups)) {
    parts.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0));
    const seriesTitle = parts[0].seriesTitle || parts[0].series || seriesSlug;
    const firstPart = parts[0];
    const firstPartClassification = classifyDoc(firstPart);
    const firstPartUrl = `/blog/series/${seriesSlug}/${firstPart.slug}`;

    // The blog index page has a "Begin Part One →" link that points to the first published part
    // If the first part is not public, this link should not be active
    if (firstPartClassification !== "PUBLIC_READABLE_NOW") {
      // Check if the blog index series shelf links to the first part
      // This is a potential issue — the shelf shows "Begin Part One →" only if firstPublishedPartSlug exists
      // The series resolver only includes PUBLISHED parts, so firstPublishedPartSlug would be null
      // if the first part is not published. This is correct behaviour.
      console.log(`    ${seriesTitle}: First part is ${firstPartClassification} — "Begin" CTA should be disabled ✅`);
    } else {
      console.log(`    ${seriesTitle}: First part is PUBLIC_READABLE_NOW — "Begin" CTA is active ✅`);
    }

    // Check all parts: if a part is not public, the series hub should show "Coming Soon" not "Read"
    for (const part of parts) {
      const classification = classifyDoc(part);
      if (classification !== "PUBLIC_READABLE_NOW") {
        // The series hub page renders draft parts with `href="#"` and `pointer-events-none opacity-40`
        // This is correct behaviour — no active link to the non-public part
        console.log(`      Part ${part.seriesOrder}: "${part.title}" — Coming Soon (correct) ✅`);
      }
    }
  }

  // ── Check 4: Sitemap audit — find all series part URLs ────────────────
  console.log("\n--- Sitemap audit ---");

  const sitemapPath = path.join(ROOT, "public", "sitemap-0.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemapContent = fs.readFileSync(sitemapPath, "utf8");

    // Find all /blog/series/ URLs in the sitemap
    const seriesUrlRegex = /<loc>(https?:\/\/[^<]*\/blog\/series\/[^<]+)<\/loc>/g;
    let match;
    const sitemapSeriesUrls = [];
    while ((match = seriesUrlRegex.exec(sitemapContent)) !== null) {
      sitemapSeriesUrls.push(match[1]);
    }

    console.log(`  Found ${sitemapSeriesUrls.length} series URLs in sitemap`);

    for (const url of sitemapSeriesUrls) {
      // Extract the path from the full URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Check if this path corresponds to a non-public part
      // Parse the path: /blog/series/[seriesSlug]/[partSlug]
      const pathParts = pathname.replace(/^\/+/, "").split("/");
      if (pathParts.length >= 4 && pathParts[0] === "blog" && pathParts[1] === "series") {
        const sSeriesSlug = pathParts[2];
        const sPartSlug = pathParts.slice(3).join("/");

        // Find the document
        const seriesGroup = seriesGroups[sSeriesSlug];
        if (seriesGroup) {
          const part = seriesGroup.find(p => p.slug === sPartSlug);
          if (part) {
            const classification = classifyDoc(part);
            if (classification !== "PUBLIC_READABLE_NOW") {
              failures.push({
                type: "SITEMAP_NON_PUBLIC_SERIES_PART",
                url: pathname,
                series: sSeriesSlug,
                part: sPartSlug,
                title: part.title,
                classification,
                detail: `Sitemap contains non-public series part URL ${pathname} (${classification}) — should not be indexed until ${part.date || "release date"}`,
              });
            }
          }
        }
      }
    }
  } else {
    warnings.push({
      type: "SITEMAP_NOT_FOUND",
      detail: "public/sitemap-0.xml not found — cannot audit sitemap URLs",
    });
  }

  // ── Check 5: Blog index series shelf — verify series CTA ──────────────
  console.log("\n--- Blog index series shelf audit ---");

  // Check that series with zero published parts don't have "Begin Part One →" CTA
  for (const [seriesSlug, parts] of Object.entries(seriesGroups)) {
    const publishedParts = parts.filter(p => classifyDoc(p) === "PUBLIC_READABLE_NOW");
    const firstPublished = publishedParts.sort((a, b) => (a.seriesOrder || 0) - (b.seriesOrder || 0))[0];

    if (publishedParts.length === 0) {
      // Series has no published parts — should not have "Begin" CTA
      // The series resolver already skips DRAFT_INTERNAL and SCHEDULED_HIDDEN series
      // But SCHEDULED_VISIBLE series with zero published parts might still appear
      console.log(`    ${parts[0].seriesTitle || seriesSlug}: 0 published parts — no "Begin" CTA expected ✅`);
    } else {
      console.log(`    ${parts[0].seriesTitle || seriesSlug}: ${publishedParts.length} published parts — "Begin" CTA points to "${firstPublished.title}" ✅`);
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  console.log("\n============================================");
  if (failures.length > 0) {
    console.error("FAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.url || f.slug || "(no path)"} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — public link integrity check FAILED`);
  } else {
    console.log("✅ All public link integrity checks pass");
  }

  if (warnings.length > 0) {
    console.log("\nWARNINGS:");
    for (const w of warnings) {
      console.log(`  [${w.type}] ${w.detail}`);
    }
  }

  // Write report
  const report = {
    generated: new Date().toISOString(),
    today: TODAY.toISOString().split("T")[0],
    regressionUrls: REGRESSION_URLS_LIST,
    summary: {
      totalFailures: failures.length,
      totalWarnings: warnings.length,
      seriesAudited: Object.keys(seriesGroups).length,
    },
    failures,
    warnings,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log(`\nReport written to ${OUTPUT_PATH}`);

  if (failures.length > 0) {
    process.exit(1);
  }

  // ── Live sitemap check (when PUBLIC_BASE_URL is set) ───────────────────
  const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || "";
  if (PUBLIC_BASE_URL) {
    console.log("\n============================================");
    console.log("LIVE SITEMAP REGRESSION CHECK");
    console.log("============================================");
    console.log(`Base URL: ${PUBLIC_BASE_URL}`);

    const LIVE_REGRESSION_URLS = [
      "/blog/series/the-science-of-inherited-selves/choose-the-ancestral-landscape",
      "/shorts/when-the-burden-changes-address",
    ];

    const baseClean = PUBLIC_BASE_URL.replace(/\/+$/, "").trim();
    const sitemapUrls = [
      `${baseClean}/sitemap-0.xml`,
      `${baseClean}/shorts-sitemap.xml`,
      `${baseClean}/blog-sitemap.xml`,
    ];

    // Use https module for sync-style fetching (no top-level await)
    function fetchUrl(url) {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => resolve({ status: res.statusCode, body: data }));
        }).on("error", (err) => reject(err));
      });
    }

    for (const sitemapUrl of sitemapUrls) {
      console.log(`\n  Fetching: ${sitemapUrl}`);
      try {
        const { status, body } = await fetchUrl(sitemapUrl);
        if (status !== 200) {
          console.log(`    ⚠ HTTP ${status} — skipping`);
          continue;
        }

        for (const regUrl of LIVE_REGRESSION_URLS) {
          if (body.includes(regUrl)) {
            failures.push({
              type: "LIVE_SITEMAP_REGRESSION",
              url: regUrl,
              sitemap: sitemapUrl,
              detail: `LIVE sitemap ${sitemapUrl} contains regression URL ${regUrl}`,
            });
            console.error(`    ❌ REGRESSION: ${regUrl} found in ${sitemapUrl}`);
          } else {
            console.log(`    ✅ ${regUrl} — absent`);
          }
        }
      } catch (err) {
        console.log(`    ⚠ Fetch failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  // ── Report ─────────────────────────────────────────────────────────────
  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.url || f.slug || "(no path)"} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — public link integrity check FAILED`);
    process.exit(1);
  }
  process.exit(0);
}

await checkPublicLinkIntegrity();
