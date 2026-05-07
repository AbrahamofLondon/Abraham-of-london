#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const targetUrl = (process.env.TARGET_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(label, url, init, expectedStatuses) {
  try {
    const res = await fetch(url, init);
    const ok = expectedStatuses.includes(res.status);
    console.log(`${ok ? "PASS" : "FAIL"} ${label} -> ${res.status}`);
    return ok;
  } catch (error) {
    console.log(`FAIL ${label} -> ${error instanceof Error ? error.message : "request failed"}`);
    return false;
  }
}

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function scanStaticBundles() {
  const roots = [".next/static", ".next/server/app", ".next/server/pages"];
  const banned = [
    /CRON_SECRET/,
    /DOWNLOAD_SECRET/,
    /NEXTAUTH_SECRET/,
    /DecisionAnchors?/,
    /AnchorContradiction/,
    /SOVEREIGN_KEYS?/,
  ];

  let found = 0;
  for (const root of roots) {
    for (const file of walk(root)) {
      const content = fs.readFileSync(file, "utf8");
      for (const pattern of banned) {
        if (pattern.test(content)) {
          found += 1;
          console.log(`FAIL bundle-scan ${file} matched ${pattern}`);
        }
      }
    }
  }

  if (found === 0) {
    console.log("PASS bundle-scan");
    return true;
  }

  return false;
}

const results = [];

// 1. cron-without-secret — POST without Bearer token
results.push(await request(
  "cron-without-secret",
  `${targetUrl}/api/cron/decision-state`,
  { method: "POST" },
  [401, 403],
));

// 2. delete-without-proof — POST with email but no proof
results.push(await request(
  "delete-without-proof",
  `${targetUrl}/api/user/delete`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "redteam@example.com" }),
  },
  [403],
));

// 3. unsubscribe-malformed — POST with bad email
results.push(await request(
  "unsubscribe-malformed",
  `${targetUrl}/api/user/unsubscribe`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  },
  [400, 403],
));

// 4. score-malformed — POST with bad body
results.push(await request(
  "score-malformed",
  `${targetUrl}/api/diagnostics/score`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ bad: true }),
  },
  [400],
));

// 5. challenge-malformed — POST with bad body
results.push(await request(
  "challenge-malformed",
  `${targetUrl}/api/diagnostics/challenge`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ assessmentType: "fast" }),
  },
  [400],
));

// 6. return-brief-unauthorized — GET without auth
results.push(await request(
  "return-brief-unauthorized",
  `${targetUrl}/api/strategy-room/briefing/return/test-session-id`,
  { method: "GET" },
  [403, 404],
));

// 7. bundle-scan — scan .next bundles for banned secrets
results.push(scanStaticBundles());

// 8. cron-get — GET should reject non-POST
results.push(await request(
  "cron-get",
  `${targetUrl}/api/cron/decision-state`,
  { method: "GET" },
  [405, 401, 403],
));

// 9. cron-dryrun-no-send — POST with x-dry-run header but no secret
results.push(await request(
  "cron-dryrun-no-send",
  `${targetUrl}/api/cron/decision-state`,
  {
    method: "POST",
    headers: { "x-dry-run": "true" },
  },
  [401, 403],
));

// 10. diagnostics-evidence-unauthenticated — GET without auth
results.push(await request(
  "diagnostics-evidence-unauthenticated",
  `${targetUrl}/api/admin/proof/evidence`,
  { method: "GET" },
  [401, 403],
));

// 11. strategy-room-init-anonymous — POST with empty body, no auth
results.push(await request(
  "strategy-room-init-anonymous",
  `${targetUrl}/api/strategy-room/session/init`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  },
  [400, 401, 403],
));

// 12. admin-route-non-admin — GET without admin auth
results.push(await request(
  "admin-route-non-admin",
  `${targetUrl}/api/admin/members/list`,
  { method: "GET" },
  [401, 403],
));

// 13. diagnostics-capture-spam — POST with empty body
results.push(await request(
  "diagnostics-capture-spam",
  `${targetUrl}/api/diagnostics/capture`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
  },
  [400],
));

// 14. malformed-score-payload — POST with out-of-range scores
results.push(await request(
  "malformed-score-payload",
  `${targetUrl}/api/diagnostics/score`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scores: [999, 999, 999] }),
  },
  [400],
));

// 15. return-brief-session-tamper — path traversal attempt
results.push(await request(
  "return-brief-session-tamper",
  `${targetUrl}/api/strategy-room/briefing/return/..%2F..%2Fetc%2Fpasswd`,
  { method: "GET" },
  [400, 403, 404],
));

// 16. download-without-entitlement — GET without auth
results.push(await request(
  "download-without-entitlement",
  `${targetUrl}/api/downloads/decision-exposure-instrument`,
  { method: "GET" },
  [401, 403],
));

// 17. checkout-product-tamper — POST with fake product code
results.push(await request(
  "checkout-product-tamper",
  `${targetUrl}/api/billing/checkout`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", productCode: "FAKE_PRODUCT_999" }),
  },
  [400],
));

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
