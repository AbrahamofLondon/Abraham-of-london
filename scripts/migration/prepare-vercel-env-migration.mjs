#!/usr/bin/env node
/**
 * scripts/migration/prepare-vercel-env-migration.mjs
 *
 * Netlify → Vercel environment variable migration planner.
 *
 * SECURITY CONTRACT:
 *   - Never writes secret values to any report, log, or JSON file.
 *   - Reports contain variable NAMES only.
 *   - All value resolution happens in-process and is not persisted.
 *   - The .env.vercel.migration.local input file is excluded by .gitignore (.env.*).
 *
 * Usage:
 *   node scripts/migration/prepare-vercel-env-migration.mjs
 *
 * Reads from: .env.vercel.migration.local  (populate from Netlify; never commit)
 * Writes:
 *   reports/vercel-env-required.json      (names + metadata only)
 *   reports/vercel-env-migration-plan.md  (human-readable plan)
 *
 * Exit code: 0 success, 1 if blocking gaps found.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const REPORTS_DIR = path.join(ROOT, "reports");
const MIGRATION_ENV = path.join(ROOT, ".env.vercel.migration.local");

// ─── Ensure reports directory exists ─────────────────────────────────────────
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// ─── Parse a local env file (names + redacted presence only) ─────────────────

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const raw = fs.readFileSync(filePath, "utf-8");
  const map = new Map();
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) map.set(key, val);
  }
  return map;
}

const sourceEnv = parseEnvFile(MIGRATION_ENV);

function isSet(key) {
  const v = sourceEnv.get(key);
  return Boolean(v && v.length > 0 && !/^(CHANGE_?ME|your[-_]|placeholder)/i.test(v));
}

// ─── Variable catalogue ───────────────────────────────────────────────────────
//
// Each entry defines:
//   name        — env var name
//   environments — which Vercel envs it must be set in
//   sensitive   — whether it's a secret (redacted in all output)
//   action      — COPY | DO_NOT_COPY | INVESTIGATE | CONDITIONAL
//   reason      — why this decision was made
//   domainSensitive — true if it must change when domain changes
//   blocking    — true if omission will break production
//   group       — logical group for the plan
//
// Action codes:
//   COPY        — must be copied to Vercel before cutover
//   DO_NOT_COPY — confirmed safe to omit (Netlify-only, unimplemented, or empty)
//   INVESTIGATE — requires human decision before cutover
//   CONDITIONAL — copy only if feature is live

const VARIABLES = [
  // ──────────────────────── Core Application ────────────────────────────────
  {
    name: "NODE_ENV",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Vercel sets NODE_ENV automatically. Never set manually.",
    blocking: false,
    group: "vercel-managed",
  },
  {
    name: "NEXT_PUBLIC_APP_ENV",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "Client-visible env label. Set 'production' for prod, 'preview' for preview.",
    blocking: false,
    group: "application",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL",
    environments: ["production", "preview", "development"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. Must match final domain after DNS cutover. Preview needs its own preview URL.",
    domainSensitive: true,
    blocking: true,
    group: "domain-sensitive",
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    environments: ["production", "preview", "development"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. Mirrors NEXT_PUBLIC_SITE_URL in most contexts.",
    domainSensitive: true,
    blocking: false,
    group: "domain-sensitive",
  },
  {
    name: "SITE_URL",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "Server-side domain reference. Must match final domain.",
    domainSensitive: true,
    blocking: false,
    group: "domain-sensitive",
  },
  {
    name: "SITE_DOMAIN",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain string only (no protocol). Update after DNS cutover.",
    domainSensitive: true,
    blocking: false,
    group: "domain-sensitive",
  },
  {
    name: "ALLOWED_ORIGINS",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "CORS policy. Must include production domain and any Vercel preview URLs if API is cross-origin.",
    domainSensitive: true,
    blocking: false,
    group: "domain-sensitive",
  },
  // ──────────────────────── Authentication ──────────────────────────────────
  {
    name: "NEXTAUTH_URL",
    environments: ["production", "development"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. Must equal https://www.abrahamoflondon.org in production. Do NOT set for Vercel preview — Vercel auto-detects NEXTAUTH_URL from VERCEL_URL in preview mode when not set.",
    domainSensitive: true,
    blocking: true,
    group: "domain-sensitive",
    note: "IMPORTANT: Omit from preview environment. Only set in production and development.",
  },
  {
    name: "NEXTAUTH_SECRET",
    environments: ["production", "preview"],
    sensitive: true,
    action: "COPY",
    reason: "Required by lib/env.ts schema (min 32 chars). Production + preview need separate values.",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "JWT_SECRET",
    environments: ["production", "preview"],
    sensitive: true,
    action: "COPY",
    reason: "Required by lib/env.ts schema (min 32 chars).",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "JWT_ALGORITHM",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Non-secret config. Defaults to HS256 if absent — copy to be explicit.",
    blocking: false,
    group: "auth-config",
  },
  {
    name: "JWT_EXPIRES_IN",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Non-secret config. Controls token lifetime.",
    blocking: false,
    group: "auth-config",
  },
  {
    name: "ENCRYPTION_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for envelope encryption.",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "CSRF_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for CSRF token generation.",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "ACCESS_COOKIE_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for signed access cookies.",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "SECURE_CLIENT_STATE_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for signed client state tokens.",
    blocking: true,
    group: "auth-secrets",
  },
  {
    name: "SESSION_COOKIE_PREFIX",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Cookie namespace. Defaults to 'aol'. Copy to be explicit.",
    blocking: false,
    group: "auth-config",
  },
  // ──────────────────────── Admin ───────────────────────────────────────────
  {
    name: "ADMIN_JWT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for admin JWT issuance.",
    blocking: true,
    group: "admin",
  },
  {
    name: "ADMIN_API_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Used for admin API authentication.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_SECRET_TOKEN",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Admin-tier secret token.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Admin secret used in various auth guards.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_USER_EMAIL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Owner email address. Non-secret but production-specific.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_USER_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Comma-separated admin emails. Used in admin email resolver.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_ALLOWED_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Comma-separated allowed admin emails.",
    blocking: false,
    group: "admin",
  },
  {
    name: "ADMIN_PASSWORD_HASH",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Hashed admin password. Required if password auth is enabled.",
    blocking: false,
    group: "admin",
  },
  {
    name: "BOOTSTRAP_ADMIN_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "INVESTIGATE",
    reason: "Engineering manual warns to REMOVE after initial setup. Copy only if DB admin users are not yet seeded. If admins already exist in DB: omit or set to empty string. This var is used as OVERSIGHT role fallback in operator-role-access.ts.",
    blocking: false,
    group: "admin",
    note: "ACTION REQUIRED: Confirm whether admin users are already seeded in the Vercel DB. If yes — do not copy. If no — copy temporarily, then clear after first admin login.",
  },
  // ──────────────────────── Oversight / Operator roles ──────────────────────
  {
    name: "OVERSIGHT_SUPER_ADMIN_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Comma-separated super-admin emails for operator role access. Falls back to BOOTSTRAP_ADMIN_EMAILS if absent.",
    blocking: false,
    group: "oversight-roles",
  },
  {
    name: "OVERSIGHT_OPERATOR_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Operator role emails. Falls back to BOOTSTRAP_ADMIN_EMAILS if absent.",
    blocking: false,
    group: "oversight-roles",
  },
  {
    name: "OVERSIGHT_REVIEWER_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Reviewer role emails. No fallback — omitting leaves role empty.",
    blocking: false,
    group: "oversight-roles",
  },
  {
    name: "OVERSIGHT_COUNSEL_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Counsel role emails. No fallback.",
    blocking: false,
    group: "oversight-roles",
  },
  {
    name: "OVERSIGHT_FINANCE_EMAILS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Finance role emails. No fallback.",
    blocking: false,
    group: "oversight-roles",
  },
  // ──────────────────────── Cron / Internal ─────────────────────────────────
  {
    name: "CRON_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Validates inbound cron job calls. Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "cron-internal",
  },
  {
    name: "OVERSIGHT_CRON_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Validates retained-cadence and governed-automation tick endpoints. Falls back from RETAINED_CADENCE_TICK_SECRET.",
    blocking: false,
    group: "cron-internal",
    note: "Canonical cron secret for oversight routes. Copy this OR RETAINED_CADENCE_TICK_SECRET — both act as fallbacks. Recommend copying OVERSIGHT_CRON_SECRET as canonical and omitting RETAINED_CADENCE_TICK_SECRET.",
  },
  {
    name: "RETAINED_CADENCE_TICK_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "Fallback for OVERSIGHT_CRON_SECRET on retained-cadence tick endpoint. If OVERSIGHT_CRON_SECRET is set, this can be omitted.",
    blocking: false,
    group: "cron-internal",
    note: "If OVERSIGHT_CRON_SECRET is set, omit this. If it is the canonical secret on Netlify (and OVERSIGHT_CRON_SECRET is unset), copy it instead.",
  },
  {
    name: "INTERNAL_BYPASS_KEY",
    environments: [],
    sensitive: true,
    action: "DO_NOT_COPY",
    reason: "Forbidden in production by lib/env.ts safety guard. Must never be set in production.",
    blocking: false,
    group: "dev-only",
    note: "lib/env.ts FORBIDDEN_IN_PRODUCTION list — setting this blocks production boot.",
  },
  {
    name: "AUDIT_EDGE_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Secures edge audit path.",
    blocking: false,
    group: "cron-internal",
  },
  {
    name: "ACTION_TOKEN_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "cron-internal",
  },
  // ──────────────────────── Database ────────────────────────────────────────
  {
    name: "DATABASE_URL",
    environments: ["production", "preview"],
    sensitive: true,
    action: "COPY",
    reason: "Required by lib/env.ts schema. Production and preview should use DIFFERENT databases (separate Prisma project connections or separate branches).",
    blocking: true,
    group: "database",
    note: "Preview must NOT point to production DB. Use a separate preview/staging database or Neon branch.",
  },
  {
    name: "DIRECT_URL",
    environments: ["production", "preview"],
    sensitive: true,
    action: "COPY",
    reason: "Non-pooled Prisma direct connection. Required for migrations.",
    blocking: false,
    group: "database",
  },
  {
    name: "MONGODB_URI",
    environments: ["production"],
    sensitive: true,
    action: "LEGACY_UNKNOWN",
    reason: "lib/database/connection.ts and lib/services/UserService.ts reference MongoDB, but static analysis confirms no live route in pages/ or app/ imports this chain. The MongoDB layer appears to be a pre-Prisma legacy migration artifact. connection.ts has a module-level throw, but it is never triggered because the module is unreachable from the production route tree. Classified LEGACY_UNKNOWN — do not treat as a cutover blocker unless a live production path is proven to require it.",
    blocking: false,
    group: "database",
    note: "LEGACY: Not reachable from any live route. Safe to omit unless a feature backed by MongoDB is activated.",
  },
  {
    name: "INNER_CIRCLE_DB_URL",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Inner Circle database. Falls back to DATABASE_URL if absent.",
    blocking: false,
    group: "database",
  },
  {
    name: "INNER_CIRCLE_STORE",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Storage backend type (postgres). Non-secret config.",
    blocking: false,
    group: "database",
  },
  // ──────────────────────── Redis ───────────────────────────────────────────
  {
    name: "REDIS_DISABLED",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "Must be 'true' if Redis is not provisioned on Vercel. Prevents startup failure.",
    blocking: false,
    group: "redis",
  },
  {
    name: "USE_REDIS",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "Feature flag for Redis usage. Set 'false' if not provisioned.",
    blocking: false,
    group: "redis",
  },
  {
    name: "REDIS_URL",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "Primary Redis connection URL. Used by lib/server/redis.ts, lib/redis.ts, lib/server/token-store.ts, lib/server/inner-circle-cache.ts. Required if Redis is enabled (USE_REDIS=true and REDIS_DISABLED=false). Omit if REDIS_DISABLED=true.",
    blocking: false,
    group: "redis",
    note: "Production: set if Redis is active. Preview: omit (REDIS_DISABLED=true). Supports both raw Redis URL and Upstash REST URL patterns.",
  },
  {
    name: "UPSTASH_REDIS_REST_URL",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "Required if Redis is enabled and using Upstash. Omit if REDIS_DISABLED=true.",
    blocking: false,
    group: "redis",
  },
  {
    name: "UPSTASH_REDIS_REST_TOKEN",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "Required if Redis is enabled and using Upstash. Omit if REDIS_DISABLED=true.",
    blocking: false,
    group: "redis",
  },
  // ──────────────────────── Payments (Stripe) ───────────────────────────────
  {
    name: "STRIPE_SECRET_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for payment processing. Production must use LIVE key (sk_live_). Preview must use TEST key (sk_test_). DO NOT copy live key to preview.",
    blocking: true,
    group: "payments",
    note: "Production: sk_live_* only. Preview: sk_test_* only. Verify key prefix before setting.",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Domain-sensitive. Must match the Stripe webhook endpoint registered for the Vercel production URL. Preview needs a separate webhook secret registered at the Vercel preview URL.",
    domainSensitive: true,
    blocking: true,
    group: "payments",
    note: "ACTION REQUIRED: Register a new webhook in Stripe dashboard pointing to https://www.abrahamoflondon.org/api/webhooks/stripe and use the new signing secret here.",
  },
  // ──────────────────────── Email (Resend) ──────────────────────────────────
  {
    name: "EMAIL_PROVIDER",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Email provider name. Referenced in code and docs. Set to 'resend' (not 'buttondown' which was the Netlify value).",
    blocking: false,
    group: "email",
    note: "Netlify had 'buttondown'. Production Vercel value should be 'resend' to match RESEND_API_KEY usage in code.",
  },
  {
    name: "RESEND_API_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for email delivery. env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "email",
  },
  {
    name: "RESEND_WEBHOOK_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Domain-sensitive. Validates inbound Resend webhooks. Must match webhook registered with Resend for the production URL.",
    domainSensitive: true,
    blocking: false,
    group: "email",
    note: "ACTION REQUIRED: Register/update Resend webhook to point to https://www.abrahamoflondon.org/api/webhooks/resend and update this secret.",
  },
  {
    name: "EMAIL_FROM",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Sender email address. Non-secret.",
    blocking: false,
    group: "email",
  },
  {
    name: "EMAIL_REPLY_TO",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Reply-to address. Non-secret.",
    blocking: false,
    group: "email",
  },
  {
    name: "MAIL_FROM",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Display sender name + address. Used as MAIL_TO fallback for sender.",
    blocking: false,
    group: "email",
  },
  {
    name: "MAIL_TO",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Default email recipient. Used as fallback for MAIL_TO_PRIMARY and as MAIL_FROM fallback.",
    blocking: false,
    group: "email",
  },
  {
    name: "MAIL_TO_PRIMARY",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Preferred primary email recipient. Falls back to MAIL_TO.",
    blocking: false,
    group: "email",
  },
  {
    name: "MAIL_TO_FALLBACK",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Safety net recipient. Used in sendInnerCircleEmail non-prod redirect and lib/server/email.ts.",
    blocking: false,
    group: "email",
  },
  {
    name: "CONTACT_RECEIVER_EMAIL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Contact form delivery address.",
    blocking: false,
    group: "email",
  },
  // ──────────────────────── Brand / AOL Salts ───────────────────────────────
  {
    name: "NEXT_PUBLIC_APP_NAME",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Client-facing app display name. Used by scripts/environment/validate-env.ts and setup-env.ts. Non-secret.",
    blocking: false,
    group: "brand",
    note: "Set to 'Abraham of London' for production.",
  },
  {
    name: "AOL_BRAND_NAME",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Brand name string. Non-secret.",
    blocking: false,
    group: "brand",
  },
  {
    name: "AOL_ISSUER_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Issuer identifier. Non-secret.",
    blocking: false,
    group: "brand",
  },
  {
    name: "AOL_HASH_SALT",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Cryptographic salt for hashing. Required for consistent hash output.",
    blocking: true,
    group: "brand",
  },
  {
    name: "AOL_SESSION_TTL_DAYS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Session TTL config.",
    blocking: false,
    group: "brand",
  },
  {
    name: "AOL_TOKENSTORE_BACKEND",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Token store backend type.",
    blocking: false,
    group: "brand",
  },
  {
    name: "AOL_TOKEN_TTL_HOURS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Token TTL config.",
    blocking: false,
    group: "brand",
  },
  {
    name: "SYSTEM_INTEGRITY_SALT",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for PDF watermarking. env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "brand",
  },
  {
    name: "ANONYMITY_SALT",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Identity anonymization salt.",
    blocking: false,
    group: "brand",
  },
  {
    name: "DENYLIST_PEPPER",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Denylist hash pepper.",
    blocking: false,
    group: "brand",
  },
  {
    name: "DYNAMIC_THRESHOLD_SALT",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "brand",
  },
  // ──────────────────────── OAuth / Social ──────────────────────────────────
  {
    name: "GITHUB_CLIENT_ID",
    environments: ["production", "preview"],
    sensitive: false,
    action: "COPY",
    reason: "GitHub OAuth client ID for admin sign-in.",
    blocking: false,
    group: "oauth",
  },
  {
    name: "GITHUB_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "GitHub OAuth secret. DO NOT share with preview.",
    blocking: false,
    group: "oauth",
  },
  {
    name: "GOOGLE_OAUTH_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Google OAuth client ID. Redirect URI must be updated in Google Console to point to Vercel domain.",
    domainSensitive: true,
    blocking: false,
    group: "oauth",
    note: "ACTION REQUIRED: Add https://www.abrahamoflondon.org/api/auth/callback/google to Google OAuth authorized redirect URIs.",
  },
  {
    name: "GOOGLE_OAUTH_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Google OAuth secret.",
    blocking: false,
    group: "oauth",
  },
  {
    name: "OAUTH_TOKEN_ENCRYPTION_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "AES-256-GCM key for OAuth token encryption at rest. Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "oauth",
  },
  {
    name: "SLACK_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Slack OAuth client ID.",
    domainSensitive: true,
    blocking: false,
    group: "oauth",
    note: "ACTION REQUIRED: Add Vercel domain callback URL to Slack app's Redirect URLs.",
  },
  {
    name: "SLACK_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Slack OAuth secret.",
    blocking: false,
    group: "oauth",
  },
  // ──────────────────────── LinkedIn ────────────────────────────────────────
  {
    name: "LINKEDIN_ACTIVE_PROFILE",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "LinkedIn profile selector (legacy/community).",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_LEGACY_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "LinkedIn legacy app client ID.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_LEGACY_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "LinkedIn legacy app secret.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_LEGACY_REDIRECT_URI",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. OAuth redirect URI. Must point to https://www.abrahamoflondon.org/... after cutover.",
    domainSensitive: true,
    blocking: false,
    group: "outbound-linkedin",
    note: "ACTION REQUIRED: Update value to use new domain. Also update LinkedIn app's Authorized Redirect URLs.",
  },
  {
    name: "LINKEDIN_COMMUNITY_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "LinkedIn Community Management app client ID.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_COMMUNITY_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "LinkedIn Community Management app secret.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_COMMUNITY_REDIRECT_URI",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. OAuth redirect URI.",
    domainSensitive: true,
    blocking: false,
    group: "outbound-linkedin",
    note: "ACTION REQUIRED: Update to new domain and update LinkedIn app redirect list.",
  },
  {
    name: "LINKEDIN_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Legacy fallback alias. Keep for backward compatibility.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Legacy fallback alias.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_REDIRECT_URI",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. Legacy redirect URI alias.",
    domainSensitive: true,
    blocking: false,
    group: "outbound-linkedin",
    note: "ACTION REQUIRED: Update to new domain.",
  },
  {
    name: "LINKEDIN_TOKEN_ENCRYPTION_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "AES-256-GCM key for LinkedIn token encryption.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_OAUTH_SCOPES",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "OAuth scopes string. Non-secret.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_DEFAULT_OWNER_TYPE",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Owner type config. Non-secret.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_ORGANIZATION_URN",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "LinkedIn org identifier. Non-secret.",
    blocking: false,
    group: "outbound-linkedin",
  },
  {
    name: "LINKEDIN_PUBLISHING_ENABLED",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Feature flag. Controls whether LinkedIn publishing is live.",
    blocking: false,
    group: "outbound-linkedin",
  },
  // ──────────────────────── Facebook ────────────────────────────────────────
  {
    name: "FACEBOOK_APP_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Meta app ID. Non-secret.",
    blocking: false,
    group: "outbound-facebook",
  },
  {
    name: "FACEBOOK_APP_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Meta app secret.",
    blocking: false,
    group: "outbound-facebook",
  },
  {
    name: "FACEBOOK_REDIRECT_URI",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. OAuth redirect URI. Must point to Vercel domain.",
    domainSensitive: true,
    blocking: false,
    group: "outbound-facebook",
    note: "ACTION REQUIRED: Update to https://www.abrahamoflondon.org/api/admin/outbound/facebook/oauth/callback and add to Facebook app's Valid OAuth Redirect URIs.",
  },
  {
    name: "FACEBOOK_PAGE_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Facebook Page ID. Non-secret.",
    blocking: false,
    group: "outbound-facebook",
  },
  {
    name: "FACEBOOK_PAGE_ACCESS_TOKEN",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Pre-OAuth fallback token. Required if full OAuth flow is not yet connected.",
    blocking: false,
    group: "outbound-facebook",
  },
  {
    name: "FACEBOOK_TOKEN_ENCRYPTION_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "AES-256-GCM key for Facebook token encryption.",
    blocking: false,
    group: "outbound-facebook",
  },
  // ──────────────────────── X (Twitter) ────────────────────────────────────
  {
    name: "X_CLIENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "X OAuth 2.0 client ID.",
    blocking: false,
    group: "outbound-x",
  },
  {
    name: "X_CLIENT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "X OAuth 2.0 secret (for confidential clients).",
    blocking: false,
    group: "outbound-x",
  },
  {
    name: "X_REDIRECT_URI",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Domain-sensitive. X OAuth redirect URI. Must point to Vercel domain.",
    domainSensitive: true,
    blocking: false,
    group: "outbound-x",
    note: "ACTION REQUIRED: Update to https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback and update X Developer Portal app settings.",
  },
  {
    name: "X_TOKEN_ENCRYPTION_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "AES-256-GCM key for X token encryption.",
    blocking: false,
    group: "outbound-x",
  },
  // ──────────────────────── AI ──────────────────────────────────────────────
  {
    name: "OPENAI_API_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "OpenAI API key. Required if any AI features are live.",
    blocking: false,
    group: "ai",
  },
  // ──────────────────────── Inner Circle ────────────────────────────────────
  {
    name: "INNER_CIRCLE_JWT_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for Inner Circle JWT issuance. env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_KEY_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Inner Circle key encryption.",
    blocking: false,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_JWT_EXPIRY_HOURS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "IC JWT expiry config.",
    blocking: false,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_CACHE_TTL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "IC cache TTL config.",
    blocking: false,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_RATE_LIMIT_EMAIL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "IC rate limit config.",
    blocking: false,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_RATE_LIMIT_IP",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "IC rate limit config.",
    blocking: false,
    group: "inner-circle",
  },
  {
    name: "INNER_CIRCLE_FROM_EMAIL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "IC sender email address.",
    blocking: false,
    group: "inner-circle",
  },
  // ──────────────────────── Enterprise / Diagnostics ────────────────────────
  {
    name: "ENTERPRISE_ALIGNMENT_INVITE_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for enterprise invite flow.",
    blocking: false,
    group: "enterprise",
  },
  {
    name: "DIAGNOSTIC_HMAC_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "enterprise",
  },
  {
    name: "DIAGNOSTIC_WATERMARK_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "enterprise",
  },
  {
    name: "DIAGNOSTIC_STORAGE_PROVIDER",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Storage provider type for diagnostics.",
    blocking: false,
    group: "enterprise",
  },
  {
    name: "DIAGNOSTIC_DEFAULT_CURRENCY",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Default currency for diagnostic pricing.",
    blocking: false,
    group: "enterprise",
  },
  // ──────────────────────── Sovereign / OGR ─────────────────────────────────
  {
    name: "OGR_SESSION_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required for OGR session management. env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "sovereign",
  },
  {
    name: "OGR_SOVEREIGN_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "OGR sovereign key.",
    blocking: false,
    group: "sovereign",
  },
  {
    name: "SOVEREIGN_ACCESS_KEY",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Sovereign access authentication.",
    blocking: false,
    group: "sovereign",
  },
  // ──────────────────────── PDF ─────────────────────────────────────────────
  {
    name: "ARTIFACT_ACCESS_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "pdf",
  },
  {
    name: "DOWNLOAD_TOKEN_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "pdf",
  },
  {
    name: "DOWNLOAD_SIGNING_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "pdf",
  },
  {
    name: "COMMERCIAL_COOKIE_SECRET",
    environments: ["production"],
    sensitive: true,
    action: "COPY",
    reason: "Required by env-integrity-check PROD_REQUIRED list.",
    blocking: true,
    group: "pdf",
  },
  {
    name: "PDF_OUTPUT_DIR",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "PDF output directory. Vercel uses ephemeral FS — value may need adjustment.",
    blocking: false,
    group: "pdf",
    note: "NOTE: Vercel serverless functions have read-only FS except /tmp. Ensure PDF generation uses /tmp or a cloud storage bucket.",
  },
  {
    name: "PDF_TEMP_DIR",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "PDF temp directory.",
    blocking: false,
    group: "pdf",
  },
  {
    name: "ENABLE_PDF_GENERATION",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Feature flag for PDF generation.",
    blocking: false,
    group: "pdf",
  },
  // ──────────────────────── Feature Flags ───────────────────────────────────
  {
    name: "SECURITY_LOCKDOWN_MODE",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Production circuit breaker. Referenced in lib/env.ts schema and multiple route guards. Set to 'false' normally. Can be set to 'true' during incidents without redeploying.",
    blocking: false,
    group: "feature-flags",
    note: "Set to 'false'. This is an operational flag — change it in Vercel dashboard during incidents, not in code.",
  },
  {
    name: "ENABLE_ANALYTICS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Analytics feature flag.",
    blocking: false,
    group: "feature-flags",
  },
  {
    name: "ENABLE_EMAIL_NOTIFICATIONS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Email notification feature flag.",
    blocking: false,
    group: "feature-flags",
  },
  {
    name: "LOG_LEVEL",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Logging verbosity. Set to 'warn' or 'error' in production.",
    blocking: false,
    group: "feature-flags",
  },
  {
    name: "VAULT_CACHE_SECONDS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Cache TTL config.",
    blocking: false,
    group: "feature-flags",
  },
  {
    name: "RATE_LIMIT_MAX_REQUESTS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Rate limiting config.",
    blocking: false,
    group: "feature-flags",
  },
  {
    name: "RATE_LIMIT_WINDOW_MS",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Rate limiting window config.",
    blocking: false,
    group: "feature-flags",
  },
  // ──────────────────────── Alerting / Monitoring ───────────────────────────
  {
    name: "DISCORD_ALERT_WEBHOOK",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "Optional Discord alert webhook. Used in lib/server/alerts.ts. Graceful degradation if absent — alerts fall back to email only.",
    blocking: false,
    group: "alerting",
    note: "Copy if Discord alerting is active. Omit if not used.",
  },
  {
    name: "DISCORD_STRATEGY_ROOM_WEBHOOK",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "Optional strategy room notification webhook. Graceful degradation if absent.",
    blocking: false,
    group: "alerting",
    note: "Was empty in Netlify. Only copy if actively configured.",
  },
  {
    name: "SLACK_ALERT_WEBHOOK",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "Optional Slack alert webhook. Fallback for DISCORD_ALERT_WEBHOOK. Graceful degradation if absent.",
    blocking: false,
    group: "alerting",
    note: "Copy if Slack alerting is active. At least one of DISCORD_ALERT_WEBHOOK or SLACK_ALERT_WEBHOOK should be set for production alerting.",
  },
  // ──────────────────────── Analytics ──────────────────────────────────────
  {
    name: "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    environments: ["production"],
    sensitive: false,
    action: "COPY",
    reason: "Google Analytics measurement ID. Client-side.",
    blocking: false,
    group: "analytics",
  },
  // ──────────────────────── CRM ─────────────────────────────────────────────
  {
    name: "CRM_ENDPOINT",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "CRM API endpoint. Referenced in lib/integrations/crm.ts. Graceful degradation if absent.",
    blocking: false,
    group: "crm",
  },
  {
    name: "CRM_API_KEY",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "CRM API key. Used as HubSpot fallback. Graceful degradation if absent.",
    blocking: false,
    group: "crm",
  },
  {
    name: "CRM_WEBHOOK_URL",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "CRM webhook URL. lib/crm/pushToCRM.ts returns skipped:true if absent.",
    blocking: false,
    group: "crm",
  },
  {
    name: "CRM_WEBHOOK_BEARER",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "CRM webhook auth token. Only needed if CRM_WEBHOOK_URL is set.",
    blocking: false,
    group: "crm",
  },
  {
    name: "HUBSPOT_ACCESS_TOKEN",
    environments: ["production"],
    sensitive: true,
    action: "CONDITIONAL",
    reason: "HubSpot API token. Falls back to CRM_API_KEY. Graceful degradation if absent.",
    blocking: false,
    group: "crm",
  },
  {
    name: "HUBSPOT_PORTAL_ID",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "HubSpot portal ID. Non-secret. Only copy if HubSpot integration is live.",
    blocking: false,
    group: "crm",
  },
  {
    name: "DIAGNOSTICS_CRM_WEBHOOK_URL",
    environments: ["production"],
    sensitive: false,
    action: "CONDITIONAL",
    reason: "Diagnostics-specific CRM webhook URL. Only copy if in use.",
    blocking: false,
    group: "crm",
  },
  // ──────────────────────── Mailchimp (not active) ──────────────────────────
  {
    name: "MAILCHIMP_API_KEY",
    environments: [],
    sensitive: true,
    action: "DO_NOT_COPY",
    reason: "Empty in Netlify production. newsletter.tsx has graceful fallback when absent. Mailchimp integration is not active.",
    blocking: false,
    group: "inactive",
  },
  {
    name: "MAILCHIMP_API_SERVER",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Empty in Netlify production. Same as MAILCHIMP_API_KEY — integration not active.",
    blocking: false,
    group: "inactive",
  },
  {
    name: "MAILCHIMP_AUDIENCE_ID",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Empty in Netlify production. Mailchimp integration not active.",
    blocking: false,
    group: "inactive",
  },
  // ──────────────────────── Sentry (not implemented) ───────────────────────
  {
    name: "SENTRY_DSN",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Referenced in lib/security/index.ts but no Sentry SDK (@sentry/nextjs) is installed. No sentry.client.config.ts exists. Copy would have zero effect without SDK installation.",
    blocking: false,
    group: "inactive",
    note: "TO ENABLE: Install @sentry/nextjs, create sentry.client.config.ts and sentry.server.config.ts, then add SENTRY_DSN.",
  },
  // ──────────────────────── Dev-only flags ─────────────────────────────────
  {
    name: "ENABLE_DEV_LOGIN",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Not referenced anywhere in the codebase. Not a known production variable.",
    blocking: false,
    group: "dev-only",
  },
  {
    name: "SKIP_AUTH_IN_DEV",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Dev-only auth bypass. Forbidden in production by lib/env.ts pattern.",
    blocking: false,
    group: "dev-only",
  },
  {
    name: "DEBUG_CONTENTLAYER",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Dev-only debug flag.",
    blocking: false,
    group: "dev-only",
  },
  {
    name: "IS_WINDOWS",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Dev-only OS detection flag. Not relevant on Vercel Linux.",
    blocking: false,
    group: "dev-only",
  },
  {
    name: "PREMIUM_ASSET_BACKEND",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Dev-only local asset backend flag.",
    blocking: false,
    group: "dev-only",
  },
  // ──────────────────────── Vercel-managed ─────────────────────────────────
  {
    name: "VERCEL_URL",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Vercel sets this automatically for every deployment. Never set manually.",
    blocking: false,
    group: "vercel-managed",
  },
  {
    name: "VERCEL_ENV",
    environments: [],
    sensitive: false,
    action: "DO_NOT_COPY",
    reason: "Vercel sets this automatically (production/preview/development).",
    blocking: false,
    group: "vercel-managed",
  },
];

// ─── Derive plan from catalogue ───────────────────────────────────────────────

const toCopy = VARIABLES.filter((v) => v.action === "COPY");
const conditional = VARIABLES.filter((v) => v.action === "CONDITIONAL");
const investigate = VARIABLES.filter((v) => v.action === "INVESTIGATE");
const doNotCopy = VARIABLES.filter((v) => v.action === "DO_NOT_COPY");
const legacyUnknown = VARIABLES.filter((v) => v.action === "LEGACY_UNKNOWN");
const blocking = VARIABLES.filter((v) => v.blocking);
const domainSensitive = VARIABLES.filter((v) => v.domainSensitive);

// Check which COPY vars are present in the source file (name-only check; no values printed)
const missingFromSource = toCopy.filter(
  (v) => !sourceEnv.has(v.name)
);
const presentInSource = toCopy.filter((v) => sourceEnv.has(v.name));
const unsetInSource = toCopy.filter(
  (v) => sourceEnv.has(v.name) && !isSet(v.name)
);

// ─── Write reports/vercel-env-required.json (names only, no values) ───────────

const requiredJson = {
  generatedAt: new Date().toISOString(),
  sourceFile: ".env.vercel.migration.local",
  sourceFilePresent: fs.existsSync(MIGRATION_ENV),
  summary: {
    total: VARIABLES.length,
    toCopy: toCopy.length,
    conditional: conditional.length,
    investigate: investigate.length,
    doNotCopy: doNotCopy.length,
    legacyUnknown: legacyUnknown.length,
    blocking: blocking.length,
    domainSensitive: domainSensitive.length,
    missingFromSource: missingFromSource.length,
    unsetInSource: unsetInSource.length,
  },
  blocking: blocking.map((v) => ({
    name: v.name,
    action: v.action,
    group: v.group,
    presentInSource: sourceEnv.has(v.name),
    valueSet: isSet(v.name),
  })),
  domainSensitiveVars: domainSensitive.map((v) => ({
    name: v.name,
    action: v.action,
    group: v.group,
    note: v.note || null,
  })),
  investigateRequired: investigate.map((v) => ({
    name: v.name,
    reason: v.reason,
    note: v.note || null,
  })),
  conditionalVars: conditional.map((v) => ({
    name: v.name,
    reason: v.reason,
    note: v.note || null,
  })),
  legacyUnknownVars: legacyUnknown.map((v) => ({
    name: v.name,
    reason: v.reason,
    note: v.note || null,
  })),
  toCopy: toCopy.map((v) => ({
    name: v.name,
    environments: v.environments,
    sensitive: v.sensitive,
    group: v.group,
    blocking: v.blocking || false,
    domainSensitive: v.domainSensitive || false,
    presentInSource: sourceEnv.has(v.name),
    valueSet: isSet(v.name),
    note: v.note || null,
  })),
  doNotCopy: doNotCopy.map((v) => ({
    name: v.name,
    reason: v.reason,
    group: v.group,
  })),
};

fs.writeFileSync(
  path.join(REPORTS_DIR, "vercel-env-required.json"),
  JSON.stringify(requiredJson, null, 2),
  "utf-8"
);

// ─── Write reports/vercel-env-migration-plan.md ──────────────────────────────

function envRow(v) {
  const present = sourceEnv.has(v.name) ? (isSet(v.name) ? "✅" : "⚠️ UNSET") : "❌ MISSING";
  return `| \`${v.name}\` | ${v.environments.join(", ") || "—"} | ${v.sensitive ? "SECRET" : "config"} | ${present} | ${(v.note || v.reason).slice(0, 90)} |`;
}

const md = `# Vercel Environment Variable Migration Plan
_Generated: ${new Date().toISOString()}_
_Source: .env.vercel.migration.local (git-ignored — never committed)_

---

## Summary

| Category | Count |
|---|---|
| **COPY** (must migrate) | ${toCopy.length} |
| **CONDITIONAL** (copy if feature active) | ${conditional.length} |
| **INVESTIGATE** (human decision needed) | ${investigate.length} |
| **DO NOT COPY** | ${doNotCopy.length} |
| **Blocking** (production breaks if absent) | ${blocking.length} |
| **Domain-sensitive** (must update for Vercel domain) | ${domainSensitive.length} |

---

## BLOCKING — Must resolve before cutover

These variables will cause production to crash or core features to fail if absent.

| Variable | Status in Source |
|---|---|
${blocking.map((v) => `| \`${v.name}\` | ${sourceEnv.has(v.name) ? (isSet(v.name) ? "✅ present" : "⚠️ UNSET") : "❌ MISSING"} |`).join("\n")}

---

## Part 2 — Environment Classification

### Production-only secrets (must NOT go to preview)

| Variable | Reason |
|---|---|
${toCopy.filter((v) => v.environments.length === 1 && v.environments[0] === "production" && v.sensitive).map((v) => `| \`${v.name}\` | ${v.reason.slice(0, 100)} |`).join("\n")}

### Stripe key rules
- **Production**: \`STRIPE_SECRET_KEY\` must be \`sk_live_*\` — never \`sk_test_*\` in production
- **Preview**: use \`sk_test_*\` key only
- **Webhook**: register a separate Stripe webhook for each domain; use separate \`STRIPE_WEBHOOK_SECRET\` per environment

### Database isolation rules
- **Production** \`DATABASE_URL\` / \`MONGODB_URI\`: live databases only
- **Preview** \`DATABASE_URL\`: separate preview/staging Postgres connection (e.g. Neon branch) — never point preview at production DB
- **Preview** \`MONGODB_URI\`: separate dev/staging MongoDB connection or omit if preview does not use MongoDB paths

---

## Part 3 — Domain-Sensitive Variables (update for Vercel cutover)

These variables contain the current domain and must be updated when www moves to Vercel.

| Variable | Action Required | Note |
|---|---|---|
${domainSensitive.map((v) => `| \`${v.name}\` | Update to \`www.abrahamoflondon.org\` | ${v.note || ""} |`).join("\n")}

### OAuth redirect URI checklist (external service configuration)

After DNS cutover, log into each service and update redirect URIs:

- [ ] **Stripe**: register webhook at \`https://www.abrahamoflondon.org/api/webhooks/stripe\`
- [ ] **Resend**: register webhook at \`https://www.abrahamoflondon.org/api/webhooks/resend\`
- [ ] **LinkedIn (Legacy app)**: add \`https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback\`
- [ ] **LinkedIn (Community app)**: same path update
- [ ] **Facebook / Meta**: add new callback to Valid OAuth Redirect URIs
- [ ] **X Developer Portal**: add \`https://www.abrahamoflondon.org/api/admin/outbound/x/oauth/callback\`
- [ ] **Google OAuth**: add callback to Authorized Redirect URIs in Cloud Console
- [ ] **Slack app**: add Vercel domain to Redirect URLs in Slack App configuration

---

## Part 4 — Vercel import command plan

### Preferred approach: Vercel CLI per variable (production)

The commands below are a TEMPLATE. **Do not run until .env.vercel.migration.local is populated.**
**Never pipe secret values through shell history or logs.**

\`\`\`bash
# Step 1: Verify CLI is authenticated
vercel whoami

# Step 2: Set each COPY variable via CLI
# Replace VALUE with the actual value from .env.vercel.migration.local
# For secrets — use: echo "VALUE" | vercel env add VARIABLE production
# For non-secrets — use: vercel env add VARIABLE production

# Blocking variables (set these first):
vercel env add DATABASE_URL production
vercel env add MONGODB_URI production
vercel env add NEXTAUTH_SECRET production
vercel env add JWT_SECRET production
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add RESEND_API_KEY production
vercel env add CRON_SECRET production
vercel env add NEXTAUTH_URL production

# Then all remaining COPY variables...
# Use Vercel dashboard bulk import for the full list if preferred.
\`\`\`

### Alternative: Vercel dashboard bulk import

1. Go to Vercel project → Settings → Environment Variables
2. Use "Import .env file" — but ONLY import a file with names and values
3. **Import to production only** — do not bulk-import secrets to preview/development
4. Verify each sensitive variable after import (name present, no empty value)

### Local staging file (git-ignored)

\`\`\`bash
# Create .env.vercel.migration.local and populate from Netlify export
# This file is excluded by .gitignore (.env.* wildcard)
touch .env.vercel.migration.local
chmod 600 .env.vercel.migration.local
# Fill in values from Netlify dashboard — do not commit
\`\`\`

---

## Part 5 — Post-import verification

After adding variables to Vercel:

\`\`\`bash
# Pull env variable NAMES only — do not print or log values
vercel env pull .env.vercel.check.local

# Then run the name comparison (never compare values)
node scripts/migration/verify-vercel-env-names.mjs
\`\`\`

Variables to confirm are present (name-only check):
${blocking.map((v) => `- \`${v.name}\``).join("\n")}

Variables that must NOT be present (Vercel auto-sets or forbidden):
- \`NODE_ENV\` (Vercel auto-sets)
- \`VERCEL_URL\` (Vercel auto-sets)
- \`INTERNAL_BYPASS_KEY\` (forbidden in production by lib/env.ts)
- \`SKIP_AUTH_IN_DEV\` (dev-only)
- \`ENABLE_DEV_LOGIN\` (not referenced in codebase)

---

## Part 6 — Preview deployment test

Deploy a Vercel preview branch with migrated env (preview environment only).

Smoke check URLs:
- [ ] \`/\` — homepage loads
- [ ] \`/editorials\` — editorial index
- [ ] \`/shorts/freedom-begins-where-ego-ends\` — public short
- [ ] \`/playbooks/execution-integrity-public\` — public playbook
- [ ] \`/canon/execution-breaks-long-before-strategy-does\` — canon entry
- [ ] \`/api/health\` — health check returns 200
- [ ] Admin login/auth route — sign-in flow works
- [ ] Checkout creation endpoint (test mode) — Stripe test key
- [ ] Client report token route (if test token exists)
- [ ] Boardroom dossier route (if test token exists)

---

## Part 7 — Cutover readiness decision

### Pre-cutover checklist

- [ ] All BLOCKING variables confirmed set in Vercel production
- [ ] Preview deployment passes all smoke tests
- [ ] Stripe production webhook registered and STRIPE_WEBHOOK_SECRET updated
- [ ] Resend webhook registered and RESEND_WEBHOOK_SECRET updated
- [ ] All OAuth redirect URIs updated in external provider dashboards
- [ ] LinkedIn, Facebook, X redirect URIs updated
- [ ] Google OAuth callback URI added to Cloud Console
- [ ] NEXTAUTH_URL set to production domain (not preview domain)
- [ ] DATABASE_URL (production) points to live database (not staging)
- [ ] MONGODB_URI (production) points to live MongoDB
- [ ] BOOTSTRAP_ADMIN_EMAILS decision made (copy or omit — see INVESTIGATE)
- [ ] Netlify rollback prepared (do not tear down until DNS propagates and production smoke passes)

### Do NOT cut over until:
- All 10 smoke check URLs return expected responses on Vercel preview
- Zero RED findings on institutional audit
- Stripe live key confirmed (not test key) on production
- DNS TTL reduced to 60s before switching

---

## INVESTIGATE items (require human decision)

${investigate.map((v) => `### \`${v.name}\`\n${v.reason}\n\n${v.note || ""}\n`).join("\n")}

---

## CONDITIONAL items (copy if feature is active)

${conditional.map((v) => `- \`${v.name}\`: ${v.reason}`).join("\n")}

---

## DO NOT COPY (with reasons)

| Variable | Reason |
|---|---|
${doNotCopy.map((v) => `| \`${v.name}\` | ${v.reason} |`).join("\n")}

---

## Full COPY catalogue

| Variable | Environments | Type | Source Status | Note |
|---|---|---|---|---|
${toCopy.map(envRow).join("\n")}
`;

fs.writeFileSync(
  path.join(REPORTS_DIR, "vercel-env-migration-plan.md"),
  md,
  "utf-8"
);

// ─── Print summary to console (names only, no values) ─────────────────────────

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║     VERCEL ENV MIGRATION — PLAN GENERATED                    ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

console.log(`Source file: ${fs.existsSync(MIGRATION_ENV) ? "✅ .env.vercel.migration.local found" : "⚠️  .env.vercel.migration.local NOT FOUND — status checks show MISSING"}`);
console.log(`Generated:   ${new Date().toISOString()}\n`);

console.log("── Summary ────────────────────────────────────────────────────");
console.log(`  COPY:          ${toCopy.length} variables`);
console.log(`  CONDITIONAL:   ${conditional.length} variables (copy if feature active)`);
console.log(`  INVESTIGATE:   ${investigate.length} variables (human decision required)`);
console.log(`  DO NOT COPY:   ${doNotCopy.length} variables`);
console.log(`  BLOCKING:      ${blocking.length} variables (production breaks if absent)`);
console.log(`  DOMAIN-SENSITIVE: ${domainSensitive.length} variables (must update URL values)`);

if (missingFromSource.length > 0) {
  console.log(`\n── ❌ BLOCKING variables missing from source file ──────────────`);
  for (const v of missingFromSource.filter((v) => v.blocking)) {
    console.log(`  ❌ ${v.name}`);
  }
}

if (unsetInSource.length > 0) {
  console.log(`\n── ⚠️  Variables present in source but have no value ───────────`);
  for (const v of unsetInSource) {
    console.log(`  ⚠️  ${v.name}`);
  }
}

console.log("\n── Outputs ─────────────────────────────────────────────────────");
console.log(`  ✅ reports/vercel-env-required.json`);
console.log(`  ✅ reports/vercel-env-migration-plan.md`);

console.log("\n── INVESTIGATE required ────────────────────────────────────────");
for (const v of investigate) {
  console.log(`  ⚠️  ${v.name}: ${v.note || v.reason}`);
}

const blockingUnresolved = blocking.filter((v) => !isSet(v.name));
if (blockingUnresolved.length > 0) {
  console.log("\n── ❌ BLOCKING GAPS — resolve before cutover ───────────────────");
  for (const v of blockingUnresolved) {
    console.log(`  ❌ ${v.name} — ${v.reason.slice(0, 80)}`);
  }
  console.log("\n❌ Migration plan has blocking gaps. Resolve before cutover.\n");
  process.exitCode = 1;
} else if (!fs.existsSync(MIGRATION_ENV)) {
  console.log("\n⚠️  Source file not present — run after populating .env.vercel.migration.local\n");
} else {
  console.log("\n✅ No blocking gaps detected from source file.\n");
}
