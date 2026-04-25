/**
 * Live Route Smoke Test
 *
 * Tests routes against the production URL.
 * Public routes should return 200.
 * Admin routes should redirect when unauthenticated.
 * APIs should return controlled responses.
 *
 * Run: npx tsx scripts/smoke-live-routes.ts
 * Or:  npx tsx scripts/smoke-live-routes.ts https://custom-url.com
 */

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
const SKIP = "\x1b[33m SKIP\x1b[0m";
let passed = 0;
let failed = 0;
let skipped = 0;

async function checkRoute(label: string, path: string, expected: { status?: number; statusRange?: [number, number]; notStatus?: number; bodyContains?: string }) {
  try {
    const url = `${BASE_URL}${path}`;
    const res = await fetch(url, { redirect: "manual", headers: { "User-Agent": "AoL-SmokeTest/1.0" } });
    const status = res.status;

    let pass = true;
    let detail = `${status}`;

    if (expected.status && status !== expected.status) {
      pass = false;
      detail = `expected ${expected.status}, got ${status}`;
    }
    if (expected.statusRange) {
      const [min, max] = expected.statusRange;
      if (status < min || status > max) {
        pass = false;
        detail = `expected ${min}-${max}, got ${status}`;
      }
    }
    if (expected.notStatus && status === expected.notStatus) {
      pass = false;
      detail = `got unexpected ${status}`;
    }

    if (expected.bodyContains && pass) {
      const body = await res.text();
      if (!body.includes(expected.bodyContains)) {
        pass = false;
        detail += ` (missing: "${expected.bodyContains}")`;
      }
    }

    if (pass) {
      console.log(`${PASS}  ${label} [${status}]`);
      passed++;
    } else {
      console.log(`${FAIL}  ${label} — ${detail}`);
      failed++;
    }
  } catch (err: any) {
    console.log(`${FAIL}  ${label} — ${err.message || "fetch error"}`);
    failed++;
  }
}

async function run() {
  console.log(`\n========================================`);
  console.log(`  LIVE ROUTE SMOKE TEST`);
  console.log(`  Target: ${BASE_URL}`);
  console.log(`========================================\n`);

  // Check if base URL is reachable
  try {
    await fetch(BASE_URL, { redirect: "manual" });
  } catch {
    console.log(`${FAIL}  Base URL unreachable: ${BASE_URL}`);
    console.log(`${SKIP}  Skipping all route checks\n`);
    process.exit(1);
  }

  console.log("─── PUBLIC ROUTES ───\n");
  await checkRoute("Homepage", "/", { status: 200 });
  await checkRoute("Fast Diagnostic", "/diagnostics/fast", { status: 200 });
  await checkRoute("Diagnostics Index", "/diagnostics", { status: 200 });
  await checkRoute("Constitutional Diagnostic", "/diagnostics/constitutional-diagnostic", { status: 200 });
  await checkRoute("Purpose Alignment", "/diagnostics/purpose-alignment", { status: 200 });
  await checkRoute("Executive Reporting Gate", "/diagnostics/executive-reporting", { statusRange: [200, 307] });
  await checkRoute("Outcome Check", "/outcome/check", { status: 200 });

  console.log("\n─── DYNAMIC ROUTES (may be 200 or SSR) ───\n");
  await checkRoute("Team Assessment", "/diagnostics/team-assessment", { statusRange: [200, 302] });
  await checkRoute("Enterprise Assessment", "/diagnostics/enterprise-assessment", { statusRange: [200, 302] });
  await checkRoute("Strategy Room", "/strategy-room", { statusRange: [200, 302] });

  console.log("\n─── ADMIN ROUTES (expect redirect) ───\n");
  await checkRoute("Admin Login", "/admin/login", { status: 200 });

  console.log("\n─── API HEALTH ───\n");
  await checkRoute("API: billing/checkout rejects GET", "/api/billing/checkout", { statusRange: [400, 405] });
  await checkRoute("API: follow-up/process rejects GET", "/api/follow-up/process", { statusRange: [400, 405] });
  await checkRoute("API: no raw 500 on diagnostics/submit GET", "/api/diagnostics/submit", { notStatus: 500 });

  console.log(`\n========================================`);
  console.log(`  RESULTS: ${passed} pass, ${failed} fail, ${skipped} skip`);
  console.log(`========================================\n`);

  if (failed > 0) {
    console.log("SMOKE TEST FAILED. Investigate before outreach.\n");
    process.exit(1);
  } else {
    console.log("SMOKE TEST PASSED. Routes are responding correctly.\n");
  }
}

run().catch((err) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
