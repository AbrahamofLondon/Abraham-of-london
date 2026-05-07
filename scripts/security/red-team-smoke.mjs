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

// ── AUTH / ACCESS ────────────────────────────────────────────────────────────

// 18. forged-session-id — access Strategy Room with fabricated session ID
results.push(await request(
  "forged-session-id",
  `${targetUrl}/api/strategy-room/results?sessionKey=forged_abc123_nonexistent&type=session`,
  { method: "GET" },
  [401, 403, 404],
));

// 19. expired-token — use a clearly invalid signed token
results.push(await request(
  "expired-token",
  `${targetUrl}/api/strategy-room/briefing/return/sr_test123`,
  {
    method: "GET",
    headers: { authorization: "Bearer expired.fake.token.value" },
  },
  [401, 403, 404],
));

// 20. cross-session-access — try accessing execution with wrong session
results.push(await request(
  "cross-session-access",
  `${targetUrl}/api/strategy-room/execution/nonexistent-session-id`,
  {
    method: "GET",
    headers: { authorization: "Bearer wrong_user_token_abc" },
  },
  [401, 403, 404],
));

// ── TOKEN REPLAY ─────────────────────────────────────────────────────────────

// 21. reused-download-token — attempt download with forged token
results.push(await request(
  "reused-download-token",
  `${targetUrl}/api/dl/fake_expired_download_token_123`,
  { method: "GET" },
  [400, 401, 403, 404],
));

// ── CHECKOUT ABUSE ───────────────────────────────────────────────────────────

// 22. checkout-price-injection — attempt to set price via body
results.push(await request(
  "checkout-price-injection",
  `${targetUrl}/api/billing/checkout`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "attacker@test.com",
      productCode: "decision_exposure_instrument",
      amount: 1,
      price: 1,
      priceId: "price_ATTACKER_INJECTED",
    }),
  },
  [400, 403],
));

// 23. checkout-entitlement-injection — attempt to set entitlement slug
results.push(await request(
  "checkout-entitlement-injection",
  `${targetUrl}/api/billing/checkout`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "attacker@test.com",
      entitlementSlug: "executive_reporting",
    }),
  },
  [400, 403],
));

// ── DOWNLOAD BYPASS ──────────────────────────────────────────────────────────

// 24. download-old-public-url — attempt old public PDF path
results.push(await request(
  "download-old-public-url",
  `${targetUrl}/assets/downloads/decision-exposure-instrument.pdf`,
  { method: "GET" },
  [401, 403, 404],
));

// 25. download-slug-traversal — path traversal in download slug
results.push(await request(
  "download-slug-traversal",
  `${targetUrl}/api/downloads/..%2F..%2F..%2Fetc%2Fpasswd`,
  { method: "GET" },
  [400, 403, 404],
));

// ── MALFORMED INPUT ──────────────────────────────────────────────────────────

// 26. oversized-payload — send very large body to strategy room init
results.push(await request(
  "oversized-payload",
  `${targetUrl}/api/strategy-room/session/init`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ intake: { fullName: "A".repeat(50000) } }),
  },
  [400, 413],
));

// 27. invalid-json — send malformed JSON
results.push(await request(
  "invalid-json",
  `${targetUrl}/api/strategy-room/session/init`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{invalid json!!!",
  },
  [400],
));

// 28. unexpected-fields — strict schema rejects extra fields
results.push(await request(
  "unexpected-fields",
  `${targetUrl}/api/strategy-room/session/init`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      intake: { fullName: "Test", __proto__: { admin: true } },
      _inject: true,
      admin: true,
    }),
  },
  [400, 403],
));

// ── RATE LIMIT ABUSE ─────────────────────────────────────────────────────────

// 29. rapid-fire-capture — burst 12 capture requests, last should be limited
{
  let lastStatus = 0;
  for (let i = 0; i < 12; i++) {
    try {
      const res = await fetch(`${targetUrl}/api/diagnostics/capture`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resultRef: `burst-${i}`, email: "burst@test.com" }),
      });
      lastStatus = res.status;
    } catch { lastStatus = 0; }
  }
  const ok = lastStatus === 429 || lastStatus === 400;
  console.log(`${ok ? "PASS" : "FAIL"} rapid-fire-capture -> ${lastStatus} (expect 429 or 400 after burst)`);
  results.push(ok);
}

// ── WEBHOOK REPLAY ───────────────────────────────────────────────────────────

// 30. webhook-no-signature — POST to webhook without Stripe signature
results.push(await request(
  "webhook-no-signature",
  `${targetUrl}/api/billing/webhook`,
  {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ type: "checkout.session.completed", id: "evt_fake" }),
  },
  [400],
));

// ── CLIENT BUNDLE SCAN ───────────────────────────────────────────────────────

// 31. client-bundle-scan (static only — the real security check)
{
  const clientRoots = [".next/static"];
  const clientBanned = [
    /CRON_SECRET/, /DOWNLOAD_SECRET/, /NEXTAUTH_SECRET/,
    /DecisionAnchors?/, /AnchorContradiction/, /SOVEREIGN_KEYS?/,
    /STRIPE_SECRET_KEY/, /STRIPE_WEBHOOK_SECRET/, /ADMIN_API_KEY/,
    /ADMIN_PASSWORD_HASH/, /MFA_ENCRYPTION_KEY/,
  ];
  let clientFound = 0;
  for (const root of clientRoots) {
    for (const file of walk(root)) {
      const content = fs.readFileSync(file, "utf8");
      for (const pat of clientBanned) {
        if (pat.test(content)) {
          clientFound++;
          console.log(`FAIL client-bundle-secrets ${file} matched ${pat}`);
        }
      }
    }
  }
  if (clientFound === 0) {
    console.log("PASS client-bundle-secrets (zero findings in .next/static)");
    results.push(true);
  } else {
    results.push(false);
  }
}

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`\nSummary: ${passed} passed, ${failed} failed out of ${results.length} tests`);
process.exit(failed > 0 ? 1 : 0);
