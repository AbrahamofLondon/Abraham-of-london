/**
 * scripts/audit-netlify-env-budget.mjs
 *
 * Estimates the runtime env var byte size that will be attached to each
 * Netlify Lambda function. AWS Lambda's hard limit is 4096 bytes total for
 * key=value pairs. Netlify injects all site env vars into every function.
 *
 * Exits 1 if estimated size exceeds FAIL_THRESHOLD.
 * Prints a warning if size exceeds WARN_THRESHOLD.
 *
 * Usage:
 *   node scripts/audit-netlify-env-budget.mjs
 *   node scripts/audit-netlify-env-budget.mjs --from-netlify-env-json
 */

const FAIL_THRESHOLD = 3500; // bytes — hard stop
const WARN_THRESHOLD = 3000; // bytes — advisory

// Minimum required fallback env vars and their approximate value lengths.
// Update this list if you add vars to the Netlify dashboard.
const REQUIRED_FALLBACK_ENV = [
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "APP_URL",
  "BASE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
];

// Vars injected by netlify.toml [build.environment] that are build-only.
// These are NOT attached to functions if scoped correctly.
const BUILD_ONLY_ENV = [
  "CI",
  "NETLIFY_USE_PNPM",
  "PNPM_FLAGS",
  "PNPM_VERSION",
  "NEXT_TELEMETRY_DISABLED",
  "NEXT_SKIP_TYPE_CHECK",
  "NODE_VERSION",
];

const args = process.argv.slice(2);
const fromFile = args.includes("--from-netlify-env-json");

let vars = {};

if (fromFile) {
  // Load from .netlify-env.json (must not contain real secrets — use masked values)
  const { readFileSync } = await import("fs");
  const { resolve } = await import("path");
  try {
    const raw = readFileSync(resolve(process.cwd(), ".netlify-env.json"), "utf8");
    vars = JSON.parse(raw);
  } catch (e) {
    console.error("[env-budget] Could not read .netlify-env.json:", e.message);
    process.exit(1);
  }
} else {
  // Estimate from current process.env (useful in CI)
  vars = process.env;
}

// Compute byte size: each var contributes key.length + 1 (=) + value.length + 1 (\0)
let totalBytes = 0;
const entries = [];

for (const [key, value] of Object.entries(vars)) {
  if (BUILD_ONLY_ENV.includes(key)) continue; // build-only, not attached to functions
  const v = String(value ?? "");
  const bytes = key.length + 1 + v.length + 1;
  totalBytes += bytes;
  entries.push({ key, bytes, value: v.length > 40 ? v.slice(0, 37) + "..." : v });
}

// Sort largest first
entries.sort((a, b) => b.bytes - a.bytes);

console.log("\n=== Netlify Lambda Env Budget Audit ===\n");
console.log(`Total estimated env size: ${totalBytes} bytes`);
console.log(`Fail threshold:           ${FAIL_THRESHOLD} bytes`);
console.log(`Warn threshold:           ${WARN_THRESHOLD} bytes`);
console.log(`AWS Lambda hard limit:    4096 bytes\n`);

if (entries.length > 0) {
  console.log("Top 15 largest variables:");
  for (const e of entries.slice(0, 15)) {
    const marker = e.bytes > 100 ? " ⚠" : "";
    console.log(`  ${e.bytes.toString().padStart(4)}B  ${e.key}${marker}`);
  }
}

console.log("\nRequired fallback vars — presence check:");
const missing = [];
for (const key of REQUIRED_FALLBACK_ENV) {
  const present = key in vars;
  const empty = present && !vars[key];
  const status = !present ? "MISSING" : empty ? "EMPTY  " : "OK     ";
  if (!present) missing.push(key);
  console.log(`  [${status}] ${key}`);
}

console.log("");

if (totalBytes > FAIL_THRESHOLD) {
  console.error(
    `[FAIL] Env size ${totalBytes}B exceeds ${FAIL_THRESHOLD}B limit.\n` +
    `       Remove non-essential vars from the Netlify dashboard before deploying.`
  );
  process.exit(1);
} else if (totalBytes > WARN_THRESHOLD) {
  console.warn(
    `[WARN] Env size ${totalBytes}B is above ${WARN_THRESHOLD}B advisory threshold.\n` +
    `       Consider trimming before adding more vars.`
  );
} else {
  console.log(`[OK] Env size ${totalBytes}B is within budget.`);
}

if (missing.length > 0) {
  console.warn(`\n[WARN] Missing required fallback vars: ${missing.join(", ")}`);
}

process.exit(totalBytes > FAIL_THRESHOLD ? 1 : 0);
