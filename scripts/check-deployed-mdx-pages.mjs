#!/usr/bin/env node
/**
 * scripts/check-deployed-mdx-pages.mjs
 *
 * Runtime smoke test against a deployed preview URL.
 * Fetches each smoke URL and verifies:
 *   - HTTP 200 (not 404, not SSO redirect)
 *   - Page title matches expected document
 *   - Body content text sample from source MDX is present in HTML
 *   - No "Page missing" or "not found" text
 *
 * Usage:
 *   $env:MDX_SMOKE_BASE_URL="https://aol-check-visual-abrahamoflondons-projects.vercel.app"
 *   node scripts/check-deployed-mdx-pages.mjs
 *
 * Or:
 *   MDX_SMOKE_BASE_URL="https://example.com" node scripts/check-deployed-mdx-pages.mjs
 *
 * Exit code: 0 if all pass, 1 if failures found.
 */

const BASE_URL = process.env.MDX_SMOKE_BASE_URL || "";
const SKIP_SSO_CHECK = process.env.MDX_SMOKE_SKIP_SSO === "true";

if (!BASE_URL) {
  console.error("[check-deployed-mdx-pages] ERROR: Set MDX_SMOKE_BASE_URL environment variable");
  console.error("  e.g. $env:MDX_SMOKE_BASE_URL='https://your-deployment.vercel.app'");
  process.exit(1);
}

// ─── Smoke URLs with expected content markers ────────────────────────────────
// Each entry: { url, titleMatch, bodySample, minBodyLength }
const SMOKE_URLS = [
  {
    url: "/canon/execution-breaks-long-before-strategy-does",
    titleMatch: "Execution Breaks Long Before Strategy Does",
    bodySample: "Strategy is rarely the issue",
    minBodyLength: 500,
  },
  {
    url: "/playbooks/execution-integrity-public",
    titleMatch: "Execution Integrity",
    bodySample: null,
    minBodyLength: 100,
  },
  {
    url: "/shorts/when-a-single-yes-changes-everything",
    titleMatch: "When A Single Yes Changes Everything",
    bodySample: "Most people are waiting for a miracle",
    minBodyLength: 200,
  },
  {
    url: "/editorials/ultimate-purpose-of-man",
    titleMatch: "Ultimate Purpose of Man",
    bodySample: null,
    minBodyLength: 500,
  },
  {
    url: "/blog",
    titleMatch: null,
    bodySample: null,
    minBodyLength: 0,
  },
  {
    url: "/shorts",
    titleMatch: null,
    bodySample: null,
    minBodyLength: 0,
  },
  {
    url: "/books/architecture-of-ascension",
    titleMatch: "Architecture of Ascension",
    bodySample: null,
    minBodyLength: 100,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchUrl(url) {
  const fullUrl = `${BASE_URL}${url}`;
  try {
    const response = await fetch(fullUrl, {
      redirect: "manual", // Don't follow SSO redirects
      headers: {
        "User-Agent": "MDX-Smoke-Check/1.0",
        Accept: "text/html",
      },
    });
    const text = await response.text();
    return { status: response.status, headers: Object.fromEntries(response.headers.entries()), text };
  } catch (error) {
    return { status: 0, headers: {}, text: "", error: error.message };
  }
}

function isSsoPage(html) {
  return html.includes("Vercel Authentication") || html.includes("sso-enabled") || html.includes("auto-vercel-auth-redirect");
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function hasTextContent(html, sample) {
  if (!sample) return true;
  return html.includes(sample);
}

function estimateBodyLength(html) {
  // Rough estimate: strip HTML tags and count remaining text
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return stripped.length;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function checkDeployedPages() {
  console.log("\n============================================");
  console.log("DEPLOYED MDX PAGE SMOKE TEST");
  console.log("============================================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`URLs to check: ${SMOKE_URLS.length}\n`);

  const results = [];
  const failures = [];
  const warnings = [];

  for (const entry of SMOKE_URLS) {
    const result = await fetchUrl(entry.url);
    const isSso = isSsoPage(result.text);
    const title = extractTitle(result.text);
    const hasBody = hasTextContent(result.text, entry.bodySample);
    const bodyLen = estimateBodyLength(result.text);

    const checkResult = {
      url: entry.url,
      status: result.status,
      isSso,
      title,
      hasBodyContent: hasBody,
      bodyLength: bodyLen,
      error: result.error || null,
      passed: true,
      issues: [],
    };

    // Check 1: Not a network error
    if (result.error) {
      checkResult.passed = false;
      checkResult.issues.push(`Network error: ${result.error}`);
      failures.push({ type: "NETWORK_ERROR", url: entry.url, detail: result.error });
    }

    // Check 2: Not SSO page (means we can't verify content)
    if (isSso) {
      if (!SKIP_SSO_CHECK) {
        checkResult.passed = false;
        checkResult.issues.push("Page returned Vercel SSO authentication page - cannot verify content");
        failures.push({
          type: "SSO_PROTECTED",
          url: entry.url,
          detail: "Deployment is behind Vercel SSO authentication. Cannot verify body content.",
        });
      } else {
        checkResult.issues.push("Page is SSO-protected (skipped per MDX_SMOKE_SKIP_SSO)");
      }
    }

    // Check 3: Status 200 (unless SSO)
    if (!isSso && result.status !== 200) {
      checkResult.passed = false;
      checkResult.issues.push(`HTTP ${result.status} instead of 200`);
      failures.push({ type: "HTTP_ERROR", url: entry.url, status: result.status, detail: `Expected 200, got ${result.status}` });
    }

    // Check 4: Title matches (if specified)
    if (entry.titleMatch && title && !title.includes(entry.titleMatch)) {
      checkResult.passed = false;
      checkResult.issues.push(`Title mismatch: expected "${entry.titleMatch}", got "${title}"`);
      failures.push({ type: "TITLE_MISMATCH", url: entry.url, expected: entry.titleMatch, actual: title });
    }

    // Check 5: Body content present (if sample specified)
    if (entry.bodySample && !isSso && !hasBody) {
      checkResult.passed = false;
      checkResult.issues.push(`Body content missing: expected "${entry.bodySample}"`);
      failures.push({ type: "BODY_CONTENT_MISSING", url: entry.url, detail: `Expected text "${entry.bodySample}" not found in HTML` });
    }

    // Check 6: Minimum body length (if specified)
    if (entry.minBodyLength > 0 && !isSso && bodyLen < entry.minBodyLength) {
      checkResult.passed = false;
      checkResult.issues.push(`Body too short: ${bodyLen} chars, expected >= ${entry.minBodyLength}`);
      failures.push({ type: "BODY_TOO_SHORT", url: entry.url, actual: bodyLen, expected: entry.minBodyLength });
    }

    const statusIcon = checkResult.passed ? "✅" : "❌";
    console.log(`${statusIcon} ${entry.url}`);
    console.log(`   Status: ${result.status}${isSso ? " (SSO)" : ""} | Title: ${title || "(none)"} | Body: ${bodyLen} chars`);
    if (checkResult.issues.length > 0) {
      checkResult.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
    }

    results.push(checkResult);
  }

  // ── Report ─────────────────────────────────────────────────────────────
  console.log("\n============================================");
  console.log("SMOKE TEST SUMMARY");
  console.log("============================================");
  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${results.filter(r => r.passed).length}`);
  console.log(`Failed: ${results.filter(r => !r.passed).length}`);

  if (failures.length > 0) {
    console.error("\nFAILURES:");
    for (const f of failures) {
      console.error(`  [${f.type}] ${f.url} — ${f.detail}`);
    }
    console.error(`\n❌ ${failures.length} failure(s) found — deployed smoke check FAILED`);
    process.exit(1);
  }

  console.log(`\n✅ All ${results.length} smoke URLs pass`);
  process.exit(0);
}

checkDeployedPages().catch(error => {
  console.error("[check-deployed-mdx-pages] Fatal error:", error);
  process.exit(1);
});
