#!/usr/bin/env node
/**
 * scripts/migration/apply-vercel-env.mjs
 *
 * Resolves all blocking Vercel environment variable gaps identified by
 * verify-vercel-env-names.mjs, then sets up a working preview environment
 * for smoke testing.
 *
 * SECURITY CONTRACT:
 *   - Never prints or logs any variable value.
 *   - Values are piped directly to `vercel env add` via child_process.
 *   - Generated secrets are created via crypto.randomBytes and used immediately.
 *   - All .env.* files used are excluded by .gitignore.
 *
 * What this script does:
 *   1. Adds 9 missing blocking vars to Production (generated secure values where
 *      the var is new to this deployment; flags MONGODB_URI as requiring human input)
 *   2. Sets up Preview environment: promotes required production vars + preview overrides
 *   3. Adds critical config vars: SECURITY_LOCKDOWN_MODE, OVERSIGHT emails, IC config, etc.
 *   4. Sets up Development environment with the same base (for local dev)
 *
 * Reads:
 *   .env.vercel.check.local   (pulled from Vercel — contains production values)
 *   .env.vercel.migration.local (migration source — contains Netlify-sourced values)
 *
 * Usage:
 *   node scripts/migration/apply-vercel-env.mjs [--dry-run]
 *
 *   --dry-run   Print what would be added (names only) without calling Vercel CLI
 *
 * Exit codes: 0 success, 1 error
 */

import { execSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { randomBytes } from "crypto";
import { homedir } from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CHECK_ENV = path.join(ROOT, ".env.vercel.check.local");
const MIGRATION_ENV = path.join(ROOT, ".env.vercel.migration.local");

const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) {
  console.log("⚠️  DRY RUN mode — no API calls will be made.\n");
}

// ─── Vercel API credentials ───────────────────────────────────────────────────
// Read from local CLI auth store — never hardcoded, never printed.

const VERCEL_AUTH_LOCATIONS = [
  path.join(homedir(), "AppData", "Roaming", "com.vercel.cli", "Data", "auth.json"),
  path.join(homedir(), ".local", "share", "com.vercel.cli", "auth.json"),
  path.join(homedir(), ".vercel", "auth.json"),
];

let VERCEL_TOKEN = null;
for (const loc of VERCEL_AUTH_LOCATIONS) {
  if (existsSync(loc)) {
    try {
      const auth = JSON.parse(readFileSync(loc, "utf-8"));
      VERCEL_TOKEN = auth.token;
      if (VERCEL_TOKEN) break;
    } catch {}
  }
}

if (!VERCEL_TOKEN && !DRY_RUN) {
  console.error("❌ Could not find Vercel auth token. Run `vercel login` first.");
  process.exit(1);
}

const VERCEL_PROJECT = JSON.parse(readFileSync(path.join(ROOT, ".vercel", "project.json"), "utf-8"));
const PROJECT_ID = VERCEL_PROJECT.projectId;
const TEAM_ID = VERCEL_PROJECT.orgId;

// ─── Parse env file (names + values) — values never printed ──────────────────
function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return new Map();
  const raw = readFileSync(filePath, "utf-8");
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1);
    if (key) map.set(key, val);
  }
  return map;
}

function isUsable(val) {
  if (!val) return false;
  const v = val.trim();
  // Reject empty string, double-quoted empty string (""), and placeholder patterns
  if (v.length === 0) return false;
  if (v === '""' || v === "''") return false;
  return !/^(NEEDS_MANUAL_FILL|CHANGE_?ME|your[-_]|placeholder|\*+)/i.test(v);
}

const prodVars = parseEnvFile(CHECK_ENV);
const migrationVars = parseEnvFile(MIGRATION_ENV);

// ─── Generated values registry ───────────────────────────────────────────────
// Values generated at runtime are stored here so they can be re-used when
// promoting to preview/development without regenerating.
const generatedValues = new Map();

// ─── Vercel environment name → API target mapping ────────────────────────────

const ENV_TARGET_MAP = {
  production: "production",
  preview: "preview",
  development: "development",
};

// ─── Add a var to Vercel via REST API ────────────────────────────────────────
// Uses the Vercel REST API v10 to upsert env vars.
// Values are passed as JSON body — not via shell, not via args.
// Never printed or logged.

let added = 0;
let skipped = 0;
let failed = 0;

async function addVar(name, value, ...environments) {
  if (!isUsable(value)) {
    console.log(`  ⚠️  SKIP ${name} — no usable value`);
    skipped++;
    return false;
  }

  const targets = environments.map((e) => ENV_TARGET_MAP[e]).filter(Boolean);
  if (targets.length === 0) {
    console.log(`  ⚠️  SKIP ${name} — no valid environment targets`);
    skipped++;
    return false;
  }

  const label = environments.join(", ");

  if (DRY_RUN) {
    console.log(`  [DRY RUN] would add: ${name}  →  ${label}`);
    added++;
    return true;
  }

  // Determine sensitivity: NEXT_PUBLIC_ vars are plain, all others encrypted
  const isSensitive = !name.startsWith("NEXT_PUBLIC_");

  try {
    const url = `https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}&upsert=true`;
    const body = JSON.stringify({
      key: name,
      value,
      type: isSensitive ? "encrypted" : "plain",
      target: targets,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`  ✅ ${name}  →  ${label}`);
      added++;
    } else if (data.error?.code === "ENV_ALREADY_EXISTS" || res.status === 409) {
      // Conflict = already exists; upsert should handle this but handle anyway
      console.log(`  ↩️  ${name}  →  ${label} (already set)`);
      skipped++;
    } else {
      const errMsg = data.error?.message ?? JSON.stringify(data).slice(0, 120);
      console.error(`  ❌ ${name}  →  ${label}: ${errMsg}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ ${name}  →  ${label}: ${err.message}`);
    failed++;
  }
  return true;
}

// Get a value: try production pull first, then migration file, then generated registry
function resolveValue(name) {
  const fromProd = prodVars.get(name);
  if (isUsable(fromProd)) return fromProd;
  const fromMigration = migrationVars.get(name);
  if (isUsable(fromMigration)) return fromMigration;
  const fromGenerated = generatedValues.get(name);
  if (isUsable(fromGenerated)) return fromGenerated;
  return null;
}

// Generate a cryptographically secure hex secret
function genHex(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

// Generate a base64url secret
function genB64(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

// ─── Step 1: Add the 9 missing blocking vars to Production ───────────────────

// ─── Main (async) ─────────────────────────────────────────────────────────────

(async () => {

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║     APPLYING VERCEL ENV — BLOCKING GAPS                      ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log("Step 1: Adding 9 missing blocking vars to Production...\n");

// Each of these must be present in production.
// For new deployments, fresh cryptographic values are generated.
// If Netlify had these vars, those values should be used instead to preserve
// compatibility with any existing data hashed/encrypted with them.
// NOTE: MONGODB_URI must be provided by the operator — we skip it here.

const MISSING_BLOCKING = [
  {
    name: "SECURE_CLIENT_STATE_SECRET",
    note: "Auth secret. New value safe — existing sessions will expire.",
    value: () => genHex(32),
  },
  {
    name: "ACTION_TOKEN_SECRET",
    note: "Auth token signing secret. New value safe — existing tokens invalidated.",
    value: () => genHex(32),
  },
  {
    name: "AOL_HASH_SALT",
    note: "Hashing salt. New value is safe for a fresh deployment. If migrating existing users, use Netlify value.",
    value: () => genHex(32),
  },
  {
    name: "DYNAMIC_THRESHOLD_SALT",
    note: "Analytics threshold salt. New value safe.",
    value: () => genHex(32),
  },
  {
    name: "OAUTH_TOKEN_ENCRYPTION_KEY",
    note: "AES-256 key. New value safe unless OAuth tokens are stored encrypted in DB. Must be 32 bytes hex.",
    value: () => genHex(32),
  },
  {
    name: "INNER_CIRCLE_JWT_SECRET",
    note: "IC JWT secret. New value safe — existing IC tokens expire and users re-authenticate.",
    value: () => genHex(32),
  },
  {
    name: "DOWNLOAD_SIGNING_SECRET",
    note: "Download URL signing secret. New value safe — existing download links invalidated, can be regenerated.",
    value: () => genHex(32),
  },
  {
    name: "COMMERCIAL_COOKIE_SECRET",
    note: "Commercial cookie signing secret. New value safe.",
    value: () => genHex(32),
  },
];

for (const { name, note, value } of MISSING_BLOCKING) {
  const existing = resolveValue(name);
  if (existing) {
    console.log(`  ✅ ${name} — using existing value from migration/pull`);
    generatedValues.set(name, existing); // cache for preview promotion
    await addVar(name, existing, "production");
  } else {
    const generated = value();
    generatedValues.set(name, generated); // cache for preview promotion
    console.log(`  🔑 ${name} — generating fresh cryptographic value`);
    console.log(`     Note: ${note}`);
    await addVar(name, generated, "production");
  }
}

// MONGODB_URI — requires the actual connection string from operator
const mongoUri = resolveValue("MONGODB_URI");
if (mongoUri) {
  console.log(`  ✅ MONGODB_URI — using value from pull`);
  await addVar("MONGODB_URI", mongoUri, "production");
} else {
  console.log(`  ⚠️  MONGODB_URI — NOT ADDED. Must be set manually.`);
  console.log(`     This is a BLOCKING var. Production will crash on startup without it.`);
  console.log(`     Set via: vercel env add MONGODB_URI production`);
  skipped++;
}

// ─── Step 2: Set critical config vars on Production ──────────────────────────

console.log("\nStep 2: Adding critical config vars to Production...\n");

// Pre-populate alias fallbacks so PROMOTE_TO_PREVIEW can find them via resolveValue
const EMAIL_FROM = resolveValue("EMAIL_FROM") || resolveValue("FROM_EMAIL");
if (EMAIL_FROM) generatedValues.set("EMAIL_FROM", EMAIL_FROM);
// MAIL_TO_PRIMARY falls back to MAIL_TO
const MAIL_TO_PRIMARY = resolveValue("MAIL_TO_PRIMARY") || resolveValue("MAIL_TO");
if (MAIL_TO_PRIMARY) generatedValues.set("MAIL_TO_PRIMARY", MAIL_TO_PRIMARY);
// INNER_CIRCLE_FROM_EMAIL falls back to EMAIL_FROM
const IC_FROM = resolveValue("INNER_CIRCLE_FROM_EMAIL") || EMAIL_FROM;
if (IC_FROM) generatedValues.set("INNER_CIRCLE_FROM_EMAIL", IC_FROM);

const CONFIG_VARS_PROD = [
  // Circuit breaker — explicitly false
  ["SECURITY_LOCKDOWN_MODE", "false"],
  // Email corrections
  ["EMAIL_PROVIDER", "resend"],
  // Pull remaining email vars from migration/pull (MAIL_TO_PRIMARY falls back to MAIL_TO)
  ["MAIL_TO_PRIMARY", resolveValue("MAIL_TO_PRIMARY") || resolveValue("MAIL_TO")],
  ["MAIL_TO_FALLBACK", resolveValue("MAIL_TO_FALLBACK")],
  ["EMAIL_FROM", EMAIL_FROM],
  // Redis config (Upstash already set; also confirm flags)
  ["REDIS_DISABLED", "false"],
  ["USE_REDIS", "true"],
  // Feature flags
  ["ENABLE_ANALYTICS", "true"],
  ["ENABLE_EMAIL_NOTIFICATIONS", "true"],
  ["ENABLE_PDF_GENERATION", "true"],
  ["LOG_LEVEL", "warn"],
  // Non-secret auth config
  ["JWT_ALGORITHM", "HS256"],
  ["JWT_EXPIRES_IN", "7d"],
  ["SESSION_COOKIE_PREFIX", "aol"],
  // AOL brand config
  ["AOL_BRAND_NAME", "Abraham of London"],
  ["AOL_ISSUER_ID", "abrahamoflondon.org"],
  ["AOL_SESSION_TTL_DAYS", "7"],
  ["AOL_TOKENSTORE_BACKEND", "postgres"],
  ["AOL_TOKEN_TTL_HOURS", "168"],
  // Inner Circle config
  ["INNER_CIRCLE_STORE", resolveValue("INNER_CIRCLE_STORE") || "postgres"],
  ["INNER_CIRCLE_JWT_EXPIRY_HOURS", resolveValue("INNER_CIRCLE_JWT_EXPIRY_HOURS") || "168"],
  ["INNER_CIRCLE_CACHE_TTL", resolveValue("INNER_CIRCLE_CACHE_TTL") || "3600"],
  ["INNER_CIRCLE_RATE_LIMIT_EMAIL", resolveValue("INNER_CIRCLE_RATE_LIMIT_EMAIL") || "5"],
  ["INNER_CIRCLE_RATE_LIMIT_IP", resolveValue("INNER_CIRCLE_RATE_LIMIT_IP") || "20"],
  ["INNER_CIRCLE_FROM_EMAIL", resolveValue("INNER_CIRCLE_FROM_EMAIL") || EMAIL_FROM],
  // PDF dirs (Vercel: /tmp)
  ["PDF_OUTPUT_DIR", "/tmp/aol-pdfs"],
  ["PDF_TEMP_DIR", "/tmp/aol-pdf-temp"],
  // Analytics
  ["NEXT_PUBLIC_GA_MEASUREMENT_ID", resolveValue("NEXT_PUBLIC_GA_MEASUREMENT_ID")],
];

for (const [name, value] of CONFIG_VARS_PROD) {
  if (value) await addVar(name, value, "production");
  else console.log(`  ⚠️  SKIP ${name} — no value available`);
}

// ─── Step 3: Oversight / admin access vars ────────────────────────────────────
//
// BOOTSTRAP_ADMIN_EMAILS + OVERSIGHT_*_EMAILS ensure admin access after migration.
// INVESTIGATE decision: if admin users are already seeded in DB, omit BOOTSTRAP.
// For a new Vercel deployment, seeding bootstrap emails is safe.

console.log("\nStep 3: Oversight / admin access vars (Production)...\n");
console.log("  NOTE: Set these to your operator email addresses.");
console.log("  These are not secrets — they're email strings used for role resolution.");
console.log("  If admin users are already seeded in DB, BOOTSTRAP_ADMIN_EMAILS can be empty.\n");

const oversightVars = [
  "BOOTSTRAP_ADMIN_EMAILS",
  "OVERSIGHT_SUPER_ADMIN_EMAILS",
  "OVERSIGHT_OPERATOR_EMAILS",
  "OVERSIGHT_REVIEWER_EMAILS",
  "OVERSIGHT_COUNSEL_EMAILS",
  "OVERSIGHT_FINANCE_EMAILS",
];

let oversightMissing = 0;
for (const name of oversightVars) {
  const v = resolveValue(name);
  if (v) {
    await addVar(name, v, "production");
  } else {
    console.log(`  ⚠️  ${name} — no value in migration file`);
    console.log(`     Add manually: vercel env add ${name} production`);
    oversightMissing++;
  }
}

if (oversightMissing > 0) {
  console.log(`\n  ⚠️  ${oversightMissing} oversight vars need manual values.`);
  console.log(`  Without OVERSIGHT_*_EMAILS, operator roles will fall back to BOOTSTRAP_ADMIN_EMAILS.`);
  console.log(`  Without BOOTSTRAP_ADMIN_EMAILS, admin access requires DB-seeded admin users.\n`);
}

// ─── Step 4: Set up Preview environment ──────────────────────────────────────
//
// Preview gets all the vars that Production has, except:
//   - NEXTAUTH_URL: must be set (Zod requires it); use production URL for preview
//     (preview traffic is internal/test only — using prod URL in NEXTAUTH_URL is
//     acceptable for smoke testing; switch to VERCEL_URL-based URL if needed)
//   - NEXT_PUBLIC_APP_ENV: "preview"
//   - STRIPE_SECRET_KEY: should use TEST key in preview — but this script uses the
//     same key as production for now (operator should update to test key if needed)
//   - DATABASE_URL: for smoke test, promote production DB temporarily
//     (preview is read-heavy; no writes expected during smoke test)
//
// The preview environment is isolated — it won't be reached by production DNS.

console.log("Step 4: Setting up Preview environment...\n");
console.log("  Promoting required vars from production to preview...");
console.log("  NOTE: Preview DATABASE_URL = production DB (read-only smoke test).");
console.log("  Update to a separate preview/staging DB before sustained preview usage.\n");

// Vars to copy from production to preview
const PROMOTE_TO_PREVIEW = [
  "NEXTAUTH_SECRET", "JWT_SECRET", "DATABASE_URL", "DIRECT_URL",
  "ENCRYPTION_KEY", "CSRF_SECRET", "ACCESS_COOKIE_SECRET", "SECURE_CLIENT_STATE_SECRET",
  "ACTION_TOKEN_SECRET", "ADMIN_JWT_SECRET", "CRON_SECRET", "AUDIT_EDGE_SECRET",
  "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "EMAIL_FROM", "EMAIL_REPLY_TO",
  "MAIL_FROM", "MAIL_TO", "MAIL_TO_PRIMARY", "MAIL_TO_FALLBACK", "CONTACT_RECEIVER_EMAIL",
  "AOL_HASH_SALT", "SYSTEM_INTEGRITY_SALT", "DYNAMIC_THRESHOLD_SALT", "ANONYMITY_SALT",
  "DENYLIST_PEPPER", "OAUTH_TOKEN_ENCRYPTION_KEY",
  "INNER_CIRCLE_JWT_SECRET", "INNER_CIRCLE_KEY_SECRET",
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  "ARTIFACT_ACCESS_SECRET", "DOWNLOAD_TOKEN_SECRET", "DOWNLOAD_SIGNING_SECRET",
  "COMMERCIAL_COOKIE_SECRET",
  "DIAGNOSTIC_HMAC_SECRET", "DIAGNOSTIC_WATERMARK_SECRET",
  "OGR_SESSION_SECRET", "ENTERPRISE_ALIGNMENT_INVITE_SECRET",
  "ADMIN_SECRET", "ADMIN_SECRET_TOKEN", "ADMIN_API_KEY",
];

for (const name of PROMOTE_TO_PREVIEW) {
  const v = resolveValue(name);
  if (v) await addVar(name, v, "preview");
  else console.log(`  ⚠️  SKIP preview:${name} — no value`);
}

// Preview-specific overrides
const PREVIEW_OVERRIDES = [
  ["NEXT_PUBLIC_APP_ENV", "preview"],
  ["SECURITY_LOCKDOWN_MODE", "false"],
  ["EMAIL_PROVIDER", "resend"],
  ["LOG_LEVEL", "info"],
  ["REDIS_DISABLED", "true"],   // disable Redis in preview unless Upstash preview project
  ["USE_REDIS", "false"],
  ["ENABLE_PDF_GENERATION", "false"],  // disable PDF gen in preview
  ["PDF_OUTPUT_DIR", "/tmp/aol-pdfs"],
  ["PDF_TEMP_DIR", "/tmp/aol-pdf-temp"],
  ["INNER_CIRCLE_STORE", "postgres"],
  ["AOL_BRAND_NAME", "Abraham of London"],
  ["AOL_ISSUER_ID", "abrahamoflondon.org"],
  ["JWT_ALGORITHM", "HS256"],
  ["JWT_EXPIRES_IN", "1d"],
  ["SESSION_COOKIE_PREFIX", "aol"],
  // NEXTAUTH_URL for preview — use production URL for smoke test
  // (preview branch is not public; swap to actual preview URL if running extended tests)
  ["NEXTAUTH_URL", resolveValue("NEXTAUTH_URL") || "https://www.abrahamoflondon.org"],
  ["NEXT_PUBLIC_SITE_URL", resolveValue("NEXT_PUBLIC_SITE_URL") || "https://www.abrahamoflondon.org"],
  ["NEXT_PUBLIC_APP_URL", resolveValue("NEXT_PUBLIC_APP_URL") || "https://www.abrahamoflondon.org"],
  ["ALLOWED_ORIGINS", resolveValue("ALLOWED_ORIGINS")],
  ["SITE_URL", resolveValue("SITE_URL") || resolveValue("NEXT_PUBLIC_SITE_URL") || "https://www.abrahamoflondon.org"],
];

console.log("\n  Adding preview-specific overrides...\n");
for (const [name, value] of PREVIEW_OVERRIDES) {
  if (value) await addVar(name, value, "preview");
  else console.log(`  ⚠️  SKIP preview:${name} — no value`);
}

// ─── Step 5: Development environment ─────────────────────────────────────────

console.log("\nStep 5: Setting up Development environment...\n");

const DEV_VARS = [
  ["NEXT_PUBLIC_APP_ENV", "development"],
  ["SECURITY_LOCKDOWN_MODE", "false"],
  ["EMAIL_PROVIDER", "resend"],
  ["LOG_LEVEL", "debug"],
  ["REDIS_DISABLED", "true"],
  ["USE_REDIS", "false"],
  ["ENABLE_PDF_GENERATION", "false"],
  ["NEXT_PUBLIC_SITE_URL", "http://localhost:3000"],
  ["NEXT_PUBLIC_APP_URL", "http://localhost:3000"],
  ["NEXTAUTH_URL", "http://localhost:3000"],
  ["PDF_OUTPUT_DIR", "/tmp/aol-pdfs"],
  ["PDF_TEMP_DIR", "/tmp/aol-pdf-temp"],
  ["AOL_BRAND_NAME", "Abraham of London"],
  ["AOL_ISSUER_ID", "abrahamoflondon.org"],
  ["JWT_ALGORITHM", "HS256"],
  ["JWT_EXPIRES_IN", "7d"],
  ["SESSION_COOKIE_PREFIX", "aol-dev"],
];

for (const [name, value] of DEV_VARS) {
  if (value) await addVar(name, value, "development");
}

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("\n── Summary ─────────────────────────────────────────────────────");
console.log(`  Added/updated: ${added}`);
console.log(`  Skipped (no value): ${skipped}`);
console.log(`  Failed: ${failed}`);

if (failed > 0) {
  console.log("\n❌ Some vars failed to add. Review errors above.");
  process.exitCode = 1;
} else if (skipped > 0) {
  console.log("\n⚠️  Some vars were skipped. Review warnings above.");
  console.log("   Most important: MONGODB_URI must be set manually if not already present.");
}

console.log("\n── Next steps ──────────────────────────────────────────────────");
console.log("  1. Manually add MONGODB_URI if not present: vercel env add MONGODB_URI production");
console.log("  2. Add BOOTSTRAP_ADMIN_EMAILS / OVERSIGHT_*_EMAILS with operator email addresses");
console.log("  3. vercel env pull .env.vercel.check.local");
console.log("  4. node scripts/migration/verify-vercel-env-names.mjs");
console.log("  5. Deploy preview: git push origin HEAD:preview (or vercel deploy)");
console.log("");

})();
