#!/usr/bin/env node
/**
 * scripts/migration/populate-migration-env.mjs
 *
 * Reads .netlify-env.json and writes .env.vercel.migration.local.
 *
 * SECURITY CONTRACT:
 *   - Values are read from .netlify-env.json but NEVER printed to console.
 *   - Output file is excluded by .gitignore (.env.* wildcard).
 *   - Redacted values and empty values are replaced with NEEDS_MANUAL_FILL markers.
 *   - Corrects known mis-configurations (EMAIL_PROVIDER: buttondown → resend).
 *   - Skips Netlify-specific or build-only variables.
 *
 * Usage:
 *   node scripts/migration/populate-migration-env.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const NETLIFY_JSON = path.join(ROOT, ".netlify-env.json");
const OUTPUT = path.join(ROOT, ".env.vercel.migration.local");

if (!fs.existsSync(NETLIFY_JSON)) {
  console.error("❌ .netlify-env.json not found at project root.");
  process.exit(1);
}

const netlify = JSON.parse(fs.readFileSync(NETLIFY_JSON, "utf-8"));

// Resolve a value from the Netlify export object
function getValue(key) {
  const raw = netlify[key];
  if (raw === undefined || raw === null) return null;
  const val = typeof raw === "string" ? raw : (raw && typeof raw === "object" && "value" in raw ? String(raw.value) : "");
  return val;
}

function isRedacted(val) {
  return typeof val === "string" && /^\*+$/.test(val.trim());
}

function isPresent(val) {
  return typeof val === "string" && val.trim().length > 0 && !isRedacted(val);
}

// ─── Netlify-specific vars: skip entirely ────────────────────────────────────
// These are build/CI/Netlify-platform vars that must not be copied to Vercel.

const NETLIFY_SKIP = new Set([
  // Netlify platform
  "NODE_VERSION", "NETLIFY_EMAILS_PROVIDER_API_KEY", "NEXT_BUILDER", "SECRETS_SCAN_ENABLED",
  // CI / build
  "HUSKY", "CI", "CI_LAX", "NPM_FLAGS", "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD",
  "NEXT_TELEMETRY_DISABLED", "PDF_ON_CI", "CONTENTLAYER_FAIL_ON_INVALID",
  "CONTENTLAYER_LOG_LEVEL", "CONTENTLAYER_DISABLE_WARNINGS", "NEXT_DISABLE_SOURCEMAPS",
  "NODE_OPTIONS",
  // DB components (DATABASE_URL is the combined var)
  "DATABASE_PASSWORD", "DB_PASSWORD", "DB_HOST", "DB_PORT", "DB_NAME", "DB_SSL",
  // Netlify-only artifact
  "Abraham",
  // Third-party features not in catalogue
  "BUTTONDOWN_API_KEY", "ALPHA_VANTAGE_API_KEY", "FINNHUB_API_KEY",
  "RECAPTCHA_SECRET", "NEXT_PUBLIC_RECAPTCHA_SITE_KEY", "RECAPTCHA_SECRET_KEY",
  "RECAPTCHA_TIMEOUT_MS", "RECAPTCHA_ALLOWED_HOSTNAMES", "RECAPTCHA_ENABLED",
  "RECAPTCHA_MIN_SCORE", "RECAPTCHA_REQUIRED_ACTIONS",
  "CONTACT_PROVIDER", "GA_TRACKING_ID",
  "ENABLE_API_V2", "ENABLE_APP_ROUTER",
  "HEALTH_CHECK_FULL", "KV_RATE_LIMIT_ENABLED", "MAX_BODY_BYTES",
  "NEXT_PUBLIC_ALOMARADA_URL", "NEXT_PUBLIC_API_V1_URL",
  "NEXT_PUBLIC_API_V2_URL", "NEXT_PUBLIC_API_V2_ALT_URL",
  "NEXT_PUBLIC_EMAIL_PROVIDER", "EMAIL_SERVICE",
  "NEXT_PUBLIC_GISCUS_CATEGORY", "NEXT_PUBLIC_GISCUS_CATEGORY_ID",
  "NEXT_PUBLIC_GISCUS_REPO", "NEXT_PUBLIC_GISCUS_REPO_ID",
  "RATE_LIMIT_ENABLED",
  "TEST_EMAILS_SECRET", "ADMIN_REVOKE_KEY", "CLEAR_CACHE_SECRET", "HEALTH_CHECK_TOKEN",
  "INNER_CIRCLE_ADMIN_TOKEN", "INNER_CIRCLE_ADMIN_KEY",
  "ACCESS_KEY_PEPPER", "REDIS_PASSWORD",
  // Vercel auto-sets — never add manually
  "NODE_ENV", "VERCEL_URL", "VERCEL_ENV",
  // Forbidden in production
  "INTERNAL_BYPASS_KEY", "PREMIUM_DEV_BYPASS", "ALLOW_RECAPTCHA_BYPASS",
  "BYPASS_SOVEREIGN", "SKIP_ASSET_AUDIT", "DEV_ADMIN_PASSWORD",
  // Dev-only
  "SKIP_AUTH_IN_DEV", "ENABLE_DEV_LOGIN", "DEBUG_CONTENTLAYER", "IS_WINDOWS", "PREMIUM_ASSET_BACKEND",
  // Mailchimp — not active
  "MAILCHIMP_API_KEY", "MAILCHIMP_API_SERVER", "MAILCHIMP_AUDIENCE_ID",
]);

// ─── Name corrections: Netlify key → Catalogue key ───────────────────────────
// Some vars have different names in Netlify vs. the Vercel catalogue.

const NETLIFY_RENAME = {
  "FROM_EMAIL": "EMAIL_FROM",
};

// ─── Value corrections: force a specific value regardless of Netlify source ──
// Use only when the Netlify value is known-wrong and the correct value is known.

const VALUE_CORRECTIONS = {
  // Netlify had "buttondown" — code uses Resend. Set to "resend".
  "EMAIL_PROVIDER": "resend",
};

// ─── Catalogue of all vars that should appear in the migration file ───────────
// Sourced from prepare-vercel-env-migration.mjs VARIABLES (action === COPY)
// This ensures every COPY var has an entry (even if NEEDS_MANUAL_FILL).

const CATALOGUE_COPY_VARS = [
  // Core / domain
  "NEXT_PUBLIC_APP_ENV", "NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_APP_URL",
  "SITE_URL", "SITE_DOMAIN", "ALLOWED_ORIGINS",
  // Auth
  "NEXTAUTH_URL", "NEXTAUTH_SECRET", "JWT_SECRET", "JWT_ALGORITHM", "JWT_EXPIRES_IN",
  "ENCRYPTION_KEY", "CSRF_SECRET", "ACCESS_COOKIE_SECRET", "SECURE_CLIENT_STATE_SECRET",
  "SESSION_COOKIE_PREFIX",
  // Admin
  "ADMIN_JWT_SECRET", "ADMIN_API_KEY", "ADMIN_SECRET_TOKEN", "ADMIN_SECRET",
  "ADMIN_USER_EMAIL", "ADMIN_USER_EMAILS", "ADMIN_ALLOWED_EMAILS", "ADMIN_PASSWORD_HASH",
  "BOOTSTRAP_ADMIN_EMAILS",
  // Oversight roles
  "OVERSIGHT_SUPER_ADMIN_EMAILS", "OVERSIGHT_OPERATOR_EMAILS", "OVERSIGHT_REVIEWER_EMAILS",
  "OVERSIGHT_COUNSEL_EMAILS", "OVERSIGHT_FINANCE_EMAILS",
  // Cron / internal
  "CRON_SECRET", "OVERSIGHT_CRON_SECRET", "AUDIT_EDGE_SECRET", "ACTION_TOKEN_SECRET",
  // Database
  "DATABASE_URL", "DIRECT_URL", "MONGODB_URI", "INNER_CIRCLE_DB_URL", "INNER_CIRCLE_STORE",
  // Redis
  "REDIS_DISABLED", "USE_REDIS", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN",
  // Payments
  "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  // Email
  "EMAIL_PROVIDER", "RESEND_API_KEY", "RESEND_WEBHOOK_SECRET", "EMAIL_FROM", "EMAIL_REPLY_TO",
  "MAIL_FROM", "MAIL_TO", "MAIL_TO_PRIMARY", "MAIL_TO_FALLBACK", "CONTACT_RECEIVER_EMAIL",
  // Brand / salts
  "AOL_BRAND_NAME", "AOL_ISSUER_ID", "AOL_HASH_SALT", "AOL_SESSION_TTL_DAYS",
  "AOL_TOKENSTORE_BACKEND", "AOL_TOKEN_TTL_HOURS", "SYSTEM_INTEGRITY_SALT",
  "ANONYMITY_SALT", "DENYLIST_PEPPER", "DYNAMIC_THRESHOLD_SALT",
  // OAuth
  "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET",
  "OAUTH_TOKEN_ENCRYPTION_KEY", "SLACK_CLIENT_ID", "SLACK_CLIENT_SECRET",
  // LinkedIn
  "LINKEDIN_ACTIVE_PROFILE", "LINKEDIN_LEGACY_CLIENT_ID", "LINKEDIN_LEGACY_CLIENT_SECRET",
  "LINKEDIN_LEGACY_REDIRECT_URI", "LINKEDIN_COMMUNITY_CLIENT_ID", "LINKEDIN_COMMUNITY_CLIENT_SECRET",
  "LINKEDIN_COMMUNITY_REDIRECT_URI", "LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET",
  "LINKEDIN_REDIRECT_URI", "LINKEDIN_TOKEN_ENCRYPTION_KEY", "LINKEDIN_OAUTH_SCOPES",
  "LINKEDIN_DEFAULT_OWNER_TYPE", "LINKEDIN_ORGANIZATION_URN", "LINKEDIN_PUBLISHING_ENABLED",
  // Facebook
  "FACEBOOK_APP_ID", "FACEBOOK_APP_SECRET", "FACEBOOK_REDIRECT_URI",
  "FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN", "FACEBOOK_TOKEN_ENCRYPTION_KEY",
  // X
  "X_CLIENT_ID", "X_CLIENT_SECRET", "X_REDIRECT_URI", "X_TOKEN_ENCRYPTION_KEY",
  // AI
  "OPENAI_API_KEY",
  // Inner Circle
  "INNER_CIRCLE_JWT_SECRET", "INNER_CIRCLE_KEY_SECRET", "INNER_CIRCLE_JWT_EXPIRY_HOURS",
  "INNER_CIRCLE_CACHE_TTL", "INNER_CIRCLE_RATE_LIMIT_EMAIL", "INNER_CIRCLE_RATE_LIMIT_IP",
  "INNER_CIRCLE_FROM_EMAIL",
  // Enterprise / diagnostics
  "ENTERPRISE_ALIGNMENT_INVITE_SECRET", "DIAGNOSTIC_HMAC_SECRET", "DIAGNOSTIC_WATERMARK_SECRET",
  "DIAGNOSTIC_STORAGE_PROVIDER", "DIAGNOSTIC_DEFAULT_CURRENCY",
  // Sovereign
  "OGR_SESSION_SECRET", "OGR_SOVEREIGN_KEY", "SOVEREIGN_ACCESS_KEY",
  // PDF
  "ARTIFACT_ACCESS_SECRET", "DOWNLOAD_TOKEN_SECRET", "DOWNLOAD_SIGNING_SECRET",
  "COMMERCIAL_COOKIE_SECRET", "PDF_OUTPUT_DIR", "PDF_TEMP_DIR", "ENABLE_PDF_GENERATION",
  // Feature flags
  "SECURITY_LOCKDOWN_MODE", "ENABLE_ANALYTICS", "ENABLE_EMAIL_NOTIFICATIONS",
  "LOG_LEVEL", "VAULT_CACHE_SECONDS", "RATE_LIMIT_MAX_REQUESTS", "RATE_LIMIT_WINDOW_MS",
  // Analytics
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
];

// ─── Build the migration file ─────────────────────────────────────────────────

const lines = [
  "# .env.vercel.migration.local",
  "# Generated by scripts/migration/populate-migration-env.mjs",
  "# SECURITY: This file is excluded by .gitignore (.env.* wildcard)",
  "# DO NOT COMMIT. DO NOT SHARE.",
  "# Values marked NEEDS_MANUAL_FILL must be sourced from Netlify dashboard or secret store.",
  `# Generated: ${new Date().toISOString()}`,
  "",
];

let fromNetlify = 0;
let corrected = 0;
let redactedCount = 0;
let emptyCount = 0;
let manualFillCount = 0;

// Build reverse map: catalogue name → source key name
// (for vars that were renamed from Netlify)
const catalogueToNetlifyKey = Object.fromEntries(
  Object.entries(NETLIFY_RENAME).map(([netlifyKey, catalogueKey]) => [catalogueKey, netlifyKey])
);

for (const catalogueKey of CATALOGUE_COPY_VARS) {
  // Forced correction — use hardcoded value
  if (VALUE_CORRECTIONS[catalogueKey] !== undefined) {
    lines.push(`${catalogueKey}=${VALUE_CORRECTIONS[catalogueKey]}`);
    corrected++;
    continue;
  }

  // Look up in Netlify export — try catalogue key directly, then reverse rename
  const netlifyKey = catalogueToNetlifyKey[catalogueKey] ?? catalogueKey;
  const rawVal = getValue(netlifyKey);

  if (rawVal === null) {
    // Not in Netlify export at all
    lines.push(`${catalogueKey}=NEEDS_MANUAL_FILL`);
    manualFillCount++;
  } else if (isRedacted(rawVal)) {
    lines.push(`${catalogueKey}=NEEDS_MANUAL_FILL_REDACTED_IN_NETLIFY`);
    redactedCount++;
  } else if (!isPresent(rawVal)) {
    lines.push(`${catalogueKey}=NEEDS_MANUAL_FILL_EMPTY_IN_NETLIFY`);
    emptyCount++;
  } else {
    // Value is present — write it (never echo to console)
    lines.push(`${catalogueKey}=${rawVal}`);
    fromNetlify++;
  }
}

fs.writeFileSync(OUTPUT, lines.join("\n") + "\n", "utf-8");

// ─── Console summary (names and counts only, zero values) ─────────────────────

console.log("");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║     MIGRATION ENV POPULATED                                  ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`  Output:   .env.vercel.migration.local`);
console.log(`  Total catalogue COPY vars: ${CATALOGUE_COPY_VARS.length}`);
console.log("");
console.log(`  ✅ From Netlify export (plaintext):   ${fromNetlify}`);
console.log(`  ✅ Corrected (known mis-config):       ${corrected}`);
console.log(`  ⚠️  Redacted in Netlify (manual fill): ${redactedCount}`);
console.log(`  ⚠️  Empty in Netlify (manual fill):    ${emptyCount}`);
console.log(`  ⚠️  Not in Netlify (manual fill):      ${manualFillCount}`);
console.log("");
console.log("  NEEDS_MANUAL_FILL entries (names only):");
for (const catalogueKey of CATALOGUE_COPY_VARS) {
  const netlifyKey = catalogueToNetlifyKey[catalogueKey] ?? catalogueKey;
  const rawVal = getValue(netlifyKey);
  const isForced = VALUE_CORRECTIONS[catalogueKey] !== undefined;
  if (isForced) continue;
  if (rawVal === null || !isPresent(rawVal) || isRedacted(rawVal)) {
    const tag = rawVal === null ? "not in Netlify"
      : isRedacted(rawVal) ? "redacted in Netlify"
      : "empty in Netlify";
    console.log(`    ⚠️  ${catalogueKey}  [${tag}]`);
  }
}
console.log("");
console.log("  Next: node scripts/migration/prepare-vercel-env-migration.mjs");
