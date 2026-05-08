#!/usr/bin/env node
/**
 * env-integrity-check.mjs
 * ───────────────────────
 * Scans .env and .env.local for:
 *   1. Duplicate keys
 *   2. Placeholder / weak values
 *   3. Fallback-chain patterns in source code
 *   4. Development bypass flags
 *   5. Production-required secrets
 *
 * Usage:  node scripts/security/env-integrity-check.mjs [--ci]
 *   --ci   exits non-zero on any FAIL result
 */

import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, join } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const CI_MODE = process.argv.includes("--ci");

// ─── Helpers ────────────────────────────────────────────────────────────────

const PASS = "PASS";
const WARN = "WARN";
const FAIL = "FAIL";

const results = [];

function record(check, status, details) {
  results.push({ check, status, details });
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return { entries: [], raw: "" };
  const raw = readFileSync(filePath, "utf-8");
  const entries = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    // Match KEY=VALUE or KEY =VALUE (spaces around =)
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_!]*)\s*=\s*(.*)/);
    if (match) {
      const key = match[1].replace(/!$/, ""); // strip trailing ! from keys like ALLOW_RECAPTCHA_BYPASS!
      let value = match[2];
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      entries.push({ key, value, line: trimmed });
    }
  }
  return { entries, raw };
}

function isProductionLike(entries) {
  const map = Object.fromEntries(entries.map((entry) => [entry.key, entry.value]));
  return (
    String(map.NODE_ENV || "").trim().toLowerCase() === "production" ||
    String(map.NEXT_PUBLIC_APP_ENV || "").trim().toLowerCase() === "production"
  );
}

function banner(title) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${"═".repeat(60)}`);
}

// ─── 1. Duplicate keys ─────────────────────────────────────────────────────

function checkDuplicates(label, entries) {
  const seen = {};
  const dupes = [];
  for (const { key } of entries) {
    seen[key] = (seen[key] || 0) + 1;
  }
  for (const [k, count] of Object.entries(seen)) {
    if (count > 1) dupes.push(`${k} (×${count})`);
  }
  if (dupes.length === 0) {
    record(`Duplicate keys [${label}]`, PASS, "No duplicates found.");
  } else {
    record(`Duplicate keys [${label}]`, FAIL, dupes.join(", "));
  }
}

// ─── 2. Placeholder / empty values ─────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /^changeme$/i,
  /^change_me$/i,
  /^your[-_]?secret[-_]?here$/i,
  /^your[-_]?.*[-_]?here$/i,
  /^xxx+$/i,
  /^TODO$/i,
  /^CHANGE[-_]?ME$/i,
  /^replace[-_]?with[-_]/i,
  /^replace[-_]?in[-_]?prod/i,
  /^your[-_]?account$/i,
  /^your[-_]?app[-_]?password$/i,
  /^your[-_]?bucket[-_]?name$/i,
];

function checkPlaceholders(label, entries) {
  const issues = [];
  const prodLike = isProductionLike(entries);
  for (const { key, value } of entries) {
    if (value === "") {
      issues.push(`${key} = (empty)`);
      continue;
    }
    for (const pat of PLACEHOLDER_PATTERNS) {
      if (pat.test(value)) {
        issues.push(`${key} = "${value}"`);
        break;
      }
    }
  }
  if (issues.length === 0) {
    record(`Placeholder values [${label}]`, PASS, "No placeholders detected.");
  } else {
    record(`Placeholder values [${label}]`, prodLike ? FAIL : WARN, issues.join("\n      "));
  }
}

// ─── 3. Weak defaults ──────────────────────────────────────────────────────

const WEAK_EXACT = new Set([
  "secret", "password", "test", "admin", "123456",
  "password123", "default", "mysecret",
]);

const WEAK_PREFIXES = [
  "aol-cookie-secret",
  "aol-csrf-secret",
  "aol-download-token-dev",
  "aol-anon-salt-dev",
  "aol-artifact-secret-dev",
  "aol-audit-edge-dev",
  "aol-denylist-pepper-dev",
  "aol-enterprise-invite-dev",
  "aol-inner-circle-jwt-dev",
  "aol-inner-circle-key-dev",
  "aol-ogr-session-dev",
  "aol-ogr-sovereign-dev",
  "aol-sovereign-access-dev",
];

function isSecretKey(key) {
  const lower = key.toLowerCase();
  return (
    lower.includes("secret") ||
    lower.includes("key") ||
    lower.includes("password") ||
    lower.includes("token") ||
    lower.includes("salt") ||
    lower.includes("pepper") ||
    lower.includes("encryption")
  );
}

function checkWeakDefaults(label, entries) {
  const issues = [];
  const prodLike = isProductionLike(entries);
  for (const { key, value } of entries) {
    if (!isSecretKey(key)) continue;
    const lower = value.toLowerCase();
    if (WEAK_EXACT.has(lower)) {
      issues.push(`${key} = "${value}" (weak exact match)`);
      continue;
    }
    for (const prefix of WEAK_PREFIXES) {
      if (lower === prefix || lower.startsWith(prefix)) {
        issues.push(`${key} = "${value}" (dev-only weak default)`);
        break;
      }
    }
  }
  if (issues.length === 0) {
    record(`Weak defaults [${label}]`, PASS, "No weak secret values found.");
  } else {
    record(`Weak defaults [${label}]`, prodLike ? FAIL : WARN, issues.join("\n      "));
  }
}

// ─── 4. Fallback chain detection ───────────────────────────────────────────

function checkFallbackChains() {
  const dirs = ["lib", "pages", "app"].filter((d) =>
    existsSync(join(ROOT, d))
  );
  const files = ["proxy.ts"].filter((f) => existsSync(join(ROOT, f)));

  if (dirs.length === 0 && files.length === 0) {
    record("Fallback chains", WARN, "No source directories found to scan.");
    return;
  }

  let output = "";
  try {
    const args = [
      "rg",
      "-n",
      "--glob",
      "*.ts",
      "--glob",
      "*.tsx",
      "process\\.env\\.[A-Za-z_][A-Za-z0-9_]*\\s*\\|\\|\\s*process\\.env\\.[A-Za-z_][A-Za-z0-9_]*",
      ...dirs,
      ...files,
    ];
    output = execSync(
      args.map((arg) => `"${arg}"`).join(" "),
      { encoding: "utf-8", cwd: ROOT, timeout: 15000 }
    ).trim();
  } catch (e) {
    // rg returns exit 1 when no matches
    if (e.stdout) output = e.stdout.trim();
  }

  if (!output) {
    record("Fallback chains", PASS, "No process.env.A || process.env.B patterns found.");
    return;
  }

  // Filter to secret-related chains only
  const lines = output.split("\n");
  const secretChains = lines.filter((line) => {
    const envVars = [...line.matchAll(/process\.env\.([A-Z_]+)/g)].map((m) => m[1]);
    return envVars.some((v) => isSecretKey(v));
  });

  if (secretChains.length === 0) {
    record("Fallback chains", PASS, "Fallback chains exist but none involve secrets.");
  } else {
    record(
      "Fallback chains",
      FAIL,
      `${secretChains.length} secret fallback chain(s) found:\n      ` +
        secretChains.map((l) => l.replace(ROOT + "/", "").replace(ROOT + "\\", "")).join("\n      ")
    );
  }
}

// ─── 5. Development / bypass flags ─────────────────────────────────────────

const BYPASS_FLAGS = [
  "BYPASS_SOVEREIGN",
  "DISABLE_DIAGNOSTIC_SCORING",
  "PREMIUM_DEV_BYPASS",
  "ALLOW_RECAPTCHA_BYPASS",
  "NEXT_PUBLIC_ALLOW_RECAPTCHA_BYPASS",
  "SKIP_ASSET_AUDIT",
  "INTERNAL_BYPASS_KEY",
  "DEV_ADMIN_PASSWORD",
  "SECURITY_LOCKDOWN_MODE",
];

function checkDevFlags(label, entries) {
  const found = [];
  const prodLike = isProductionLike(entries);
  for (const { key, value } of entries) {
    // Catch any BYPASS_* or DISABLE_* pattern
    if (/^(BYPASS_|DISABLE_|SKIP_|PREMIUM_DEV_)/.test(key) || BYPASS_FLAGS.includes(key)) {
      if (value && value.toLowerCase() !== "false" && value !== "0") {
        found.push(`${key} = "${value}"`);
      }
    }
  }
  if (found.length === 0) {
    record(`Development bypass flags [${label}]`, PASS, "No active bypass flags.");
  } else {
    record(
      `Development bypass flags [${label}]`,
      prodLike ? FAIL : WARN,
      `Active bypass flags (must be disabled in production):\n      ` + found.join("\n      ")
    );
  }
}

// ─── 6. Production-required secrets ────────────────────────────────────────

const PROD_REQUIRED = [
  "NEXTAUTH_SECRET",
  "ACTION_TOKEN_SECRET",
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_WEBHOOK_SECRET",
  "CRON_SECRET",
  "DOWNLOAD_TOKEN_SECRET",
  "OGR_SESSION_SECRET",
  "RESEND_API_KEY",
  "ENCRYPTION_KEY",
  "SECURE_CLIENT_STATE_SECRET",
  "CSRF_SECRET",
  "JWT_SECRET",
  "ADMIN_JWT_SECRET",
  "INNER_CIRCLE_JWT_SECRET",
  "INNER_CIRCLE_DB_URL",
  "DYNAMIC_THRESHOLD_SALT",
  "OAUTH_TOKEN_ENCRYPTION_KEY",
  "SYSTEM_INTEGRITY_SALT",
  "DIAGNOSTIC_HMAC_SECRET",
  "DIAGNOSTIC_WATERMARK_SECRET",
  "DOWNLOAD_SIGNING_SECRET",
  "COMMERCIAL_COOKIE_SECRET",
];

function checkProdRequired(label, entries) {
  const map = {};
  for (const { key, value } of entries) {
    map[key] = value;
  }
  const missing = [];
  const placeholder = [];
  for (const req of PROD_REQUIRED) {
    if (!(req in map)) {
      missing.push(req);
    } else if (!map[req] || /^(CHANGE_?ME|replace|your[-_])/i.test(map[req])) {
      placeholder.push(`${req} = "${map[req]}"`);
    }
  }
  const issues = [];
  if (missing.length) issues.push(`Missing: ${missing.join(", ")}`);
  if (placeholder.length) issues.push(`Still placeholder:\n      ${placeholder.join("\n      ")}`);

  if (issues.length === 0) {
    record(`Production-required secrets [${label}]`, PASS, "All production secrets present and non-placeholder.");
  } else {
    record(`Production-required secrets [${label}]`, FAIL, issues.join("\n      "));
  }
}

function checkMalformedBooleanKeys(label, entries) {
  const malformed = entries
    .filter((entry) => /!$/.test(entry.line.split("=")[0]?.trim() || ""))
    .map((entry) => entry.line);

  if (malformed.length === 0) {
    record(`Malformed boolean keys [${label}]`, PASS, "No malformed env keys found.");
    return;
  }

  record(
    `Malformed boolean keys [${label}]`,
    FAIL,
    malformed.join("\n      "),
  );
}

function checkSharedSecrets(label, entries) {
  const prodLike = isProductionLike(entries);
  const domainKeys = [
    "NEXTAUTH_SECRET",
    "JWT_SECRET",
    "DOWNLOAD_TOKEN_SECRET",
    "ACTION_TOKEN_SECRET",
    "ENCRYPTION_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESEND_WEBHOOK_SECRET",
    "ADMIN_JWT_SECRET",
    "INNER_CIRCLE_JWT_SECRET",
    "SECURE_CLIENT_STATE_SECRET",
  ];

  const byValue = new Map();
  for (const { key, value } of entries) {
    if (!domainKeys.includes(key)) continue;
    if (!value || /^CHANGE_ME$/i.test(value)) continue;
    const list = byValue.get(value) || [];
    list.push(key);
    byValue.set(value, list);
  }

  const reused = [...byValue.values()]
    .filter((keys) => keys.length > 1)
    .map((keys) => keys.join(", "));

  if (reused.length === 0) {
    record(`Shared secret domains [${label}]`, PASS, "No secret reuse across protected domains.");
    return;
  }

  record(
    `Shared secret domains [${label}]`,
    prodLike ? FAIL : WARN,
    reused.join("\n      "),
  );
}

// ─── Run all checks ────────────────────────────────────────────────────────

banner("ENV INTEGRITY CHECK");
console.log(`  Root: ${ROOT}`);
console.log(`  Date: ${new Date().toISOString()}`);

for (const envFile of [".env", ".env.local"]) {
  const filePath = join(ROOT, envFile);
  const label = envFile;
  if (!existsSync(filePath)) {
    record(`File exists [${label}]`, WARN, `${envFile} not found.`);
    continue;
  }
  record(`File exists [${label}]`, PASS, `${envFile} found.`);
  const { entries } = parseEnvFile(filePath);

  checkDuplicates(label, entries);
  checkMalformedBooleanKeys(label, entries);
  checkPlaceholders(label, entries);
  checkWeakDefaults(label, entries);
  checkDevFlags(label, entries);
  checkSharedSecrets(label, entries);
  checkProdRequired(label, entries);
}

checkFallbackChains();

// ─── Report ─────────────────────────────────────────────────────────────────

banner("RESULTS");

let failCount = 0;
let warnCount = 0;

for (const { check, status, details } of results) {
  const icon = status === PASS ? "[PASS]" : status === WARN ? "[WARN]" : "[FAIL]";
  console.log(`  ${icon} ${check}`);
  if (status !== PASS) {
    console.log(`      ${details}`);
  }
  if (status === FAIL) failCount++;
  if (status === WARN) warnCount++;
}

console.log(`\n${"─".repeat(60)}`);
console.log(`  Total: ${results.length} checks | ${failCount} FAIL | ${warnCount} WARN | ${results.length - failCount - warnCount} PASS`);
console.log(`${"─".repeat(60)}\n`);

if (CI_MODE && failCount > 0) {
  console.error("CI mode: exiting with code 1 due to FAIL results.");
  process.exit(1);
}
