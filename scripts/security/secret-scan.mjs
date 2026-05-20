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

const allowedTrackedEnvFiles = new Set([
  ".env.example",
  ".env.schema",
  ".env.local.example",
]);

const ignoredPathPatterns = [
  /^scripts\/environment\//,
  /^scripts\/setup-env\.(?:ts|js|mjs)$/,
];

const placeholderValuePatterns = [
  /CHANGE_ME/i,
  /\$\{/,
  /^["']?$/i,
  /placeholder/i,
  /your-/i,
  /localhost/i,
  /example/i,
  /file:/i,
  /dev\.db/i,
  /USER/i,
  /PASSWORD/i,
  /change-this-in-production/i,
  /change-in-production/i,
  /random-secret/i,
  /random-64-char-secret/i,
  /any-32-char-string/i,
  /local-dev-/i,
  /user:password/i,
  /postgres(?:ql)?:\/\/(?:user|username|\$\{)/i,
  /<[^>]+>/,
];

function shouldIgnorePath(path) {
  return ignoredPathPatterns.some((pattern) => pattern.test(path));
}

function isPlaceholderAssignment(line) {
  const match = line.match(/^[^=]+=\s*(.*)$/);
  const value = match?.[1] ?? "";
  return placeholderValuePatterns.some((pattern) => pattern.test(value.trim()));
}

for (const path of getTrackedFiles()) {
  if (/^\.env(?:\.|$)/.test(path) && !allowedTrackedEnvFiles.has(path)) {
    record(`Tracked secret file: ${path}`);
  }

  if (shouldIgnorePath(path)) continue;

  if (!/\.(ts|tsx|js|mjs|cjs|json|md|mdx|yml|yaml|env|txt)$/i.test(path)) continue;

  const fullPath = join(ROOT, path);
  let content = "";
  try {
    content = readFileSync(fullPath, "utf8");
  } catch {
    continue;
  }

  const assignmentPattern =
    /^\s*(GITHUB_SECRET|GITHUB_CLIENT_SECRET|AUTH_GITHUB_SECRET|NEXTAUTH_SECRET|AUTH_SECRET|JWT_SECRET|DOWNLOAD_TOKEN_SECRET|ACTION_TOKEN_SECRET|ENCRYPTION_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|RESEND_API_KEY|RESEND_WEBHOOK_SECRET|ADMIN_API_KEY|INTERNAL_BYPASS_KEY|PRIVATE_KEY|DATABASE_URL|DIRECT_URL|NETLIFY_AUTH_TOKEN)\s*=\s*(.+)$/i;

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(assignmentPattern);
    if (!match) continue;
    if (isPlaceholderAssignment(line)) continue;
    record(`Possible committed secret assignment in ${path}: ${match[1]}`);
  }

  for (const pattern of [/sk_live_[A-Za-z0-9]+/, /rk_live_[A-Za-z0-9]+/, /whsec_[A-Za-z0-9]+/]) {
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
