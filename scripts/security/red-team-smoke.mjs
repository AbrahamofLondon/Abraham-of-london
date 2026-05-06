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

results.push(await request(
  "cron-without-secret",
  `${targetUrl}/api/cron/decision-state`,
  { method: "POST" },
  [401, 403],
));

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

results.push(await request(
  "return-brief-unauthorized",
  `${targetUrl}/api/strategy-room/briefing/return/test-session-id`,
  { method: "GET" },
  [403, 404],
));

results.push(scanStaticBundles());

const passed = results.filter(Boolean).length;
const failed = results.length - passed;
console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
