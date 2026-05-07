#!/usr/bin/env node

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const FAIL = [];

function record(message) {
  FAIL.push(message);
}

function getTrackedFiles() {
  const output = execSync("git ls-files", {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();

  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

const forbiddenTracked = [
  ".env",
  ".env.local",
];

for (const path of getTrackedFiles()) {
  if (forbiddenTracked.includes(path)) {
    record(`Tracked secret file: ${path}`);
  }

  if (!/\.(ts|tsx|js|mjs|cjs|json|md|mdx|yml|yaml|env|txt)$/i.test(path)) continue;

  const fullPath = join(ROOT, path);
  let content = "";
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    continue;
  }

  const secretAssignments = [
    /(^|\n)\s*(NEXTAUTH_SECRET|JWT_SECRET|DOWNLOAD_TOKEN_SECRET|ACTION_TOKEN_SECRET|ENCRYPTION_KEY|STRIPE_WEBHOOK_SECRET|RESEND_WEBHOOK_SECRET|ADMIN_API_KEY|INTERNAL_BYPASS_KEY)\s*=\s*(?!CHANGE_ME|["']?\$\{)/i,
    /sk_live_[A-Za-z0-9]+/,
    /rk_live_[A-Za-z0-9]+/,
    /whsec_[A-Za-z0-9]+/,
  ];

  for (const pattern of secretAssignments) {
    if (pattern.test(content)) {
      record(`Possible committed secret in ${path} matching ${pattern}`);
    }
  }
}

if (FAIL.length > 0) {
  console.error("SECRET SCAN FAIL");
  for (const finding of FAIL) console.error(`- ${finding}`);
  process.exit(1);
}

console.log("SECRET SCAN PASS");
