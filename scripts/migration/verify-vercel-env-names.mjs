#!/usr/bin/env node
/**
 * scripts/migration/verify-vercel-env-names.mjs
 *
 * Part 5 — Vercel post-import name verification.
 *
 * After running `vercel env pull .env.vercel.check.local`, this script
 * compares the variable NAMES in the pulled file against the migration
 * catalogue to confirm all required variables are present, no forbidden
 * variables are set, and no unexpected DO_NOT_COPY variables slipped in.
 *
 * SECURITY CONTRACT:
 *   - Variable values are parsed from the file but NEVER read, stored in
 *     variables, logged, printed, or included in any output.
 *   - All comparisons are name-only.
 *   - The .env.vercel.check.local file is excluded by .gitignore (.env.*).
 *
 * Usage:
 *   vercel env pull .env.vercel.check.local
 *   node scripts/migration/verify-vercel-env-names.mjs
 *
 * Reads:
 *   .env.vercel.check.local         (output of vercel env pull)
 *   reports/vercel-env-required.json (output of prepare-vercel-env-migration.mjs)
 *
 * Exit codes:
 *   0 — all blocking variables present; no forbidden variables detected
 *   1 — blocking gaps or forbidden variables found (must resolve before cutover)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CHECK_ENV = path.join(ROOT, ".env.vercel.check.local");
const REQUIRED_JSON = path.join(ROOT, "reports", "vercel-env-required.json");

// ─── Parse env file — extract names only; values are discarded immediately ───
//
// Values are read solely to locate the `=` delimiter and identify the key.
// They are never stored in a named variable, never concatenated, never logged.

function parseEnvNames(filePath) {
  const names = new Set();
  const raw = fs.readFileSync(filePath, "utf-8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue; // skip malformed or empty key lines
    const key = trimmed.slice(0, eqIdx).trim();
    if (key) names.add(key);
  }
  return names;
}

// ─── Vercel system vars injected by `env pull` (always present, never manually set) ──
//
// `vercel env pull` always injects these into the output file for local dev context.
// They are NOT user-set variables and must be excluded from all checks (forbidden,
// DO_NOT_COPY, and unrecognised). Their presence in the pull file is expected and
// harmless — they cannot be removed by the operator.

const VERCEL_ALWAYS_INJECTED = new Set([
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_TARGET_ENV",
  "VERCEL_OIDC_TOKEN",
  "VERCEL_GIT_COMMIT_AUTHOR_LOGIN",
  "VERCEL_GIT_COMMIT_AUTHOR_NAME",
  "VERCEL_GIT_COMMIT_MESSAGE",
  "VERCEL_GIT_COMMIT_REF",
  "VERCEL_GIT_COMMIT_SHA",
  "VERCEL_GIT_PREVIOUS_SHA",
  "VERCEL_GIT_PROVIDER",
  "VERCEL_GIT_PULL_REQUEST_ID",
  "VERCEL_GIT_REPO_ID",
  "VERCEL_GIT_REPO_OWNER",
  "VERCEL_GIT_REPO_SLUG",
]);

// ─── Forbidden names ──────────────────────────────────────────────────────────
//
// Variables that must NOT appear in a Vercel production environment pull.
// Presence of any of these is a hard failure.
// Note: VERCEL_URL and VERCEL_ENV are NOT listed here — they're always injected
// by `vercel env pull` regardless of whether they're manually set. Use
// `vercel env ls production` to confirm they are not manually overridden.

const FORBIDDEN_IN_PRODUCTION = new Map([
  // Vercel auto-sets — never set manually (signals bad Netlify copy-paste)
  ["NODE_ENV",              "Vercel auto-sets NODE_ENV. If present, it was set manually — remove it."],
  // lib/env.ts FORBIDDEN_IN_PRODUCTION list — setting any of these blocks production boot
  ["INTERNAL_BYPASS_KEY",   "Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  ["PREMIUM_DEV_BYPASS",    "Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  ["ALLOW_RECAPTCHA_BYPASS","Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  ["BYPASS_SOVEREIGN",      "Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  ["SKIP_ASSET_AUDIT",      "Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  ["DEV_ADMIN_PASSWORD",    "Blocked by lib/env.ts FORBIDDEN_IN_PRODUCTION guard — production will refuse to start."],
  // Dev-only variables — dangerous or meaningless on Vercel Linux
  ["SKIP_AUTH_IN_DEV",      "Dev-only auth bypass. Forbidden in production — remove immediately."],
  ["ENABLE_DEV_LOGIN",      "Not referenced anywhere in the codebase. Netlify artifact — remove."],
  ["DEBUG_CONTENTLAYER",    "Dev-only debug flag. No production effect — remove."],
  ["IS_WINDOWS",            "Dev-only OS detection. Irrelevant on Vercel Linux — remove."],
  ["PREMIUM_ASSET_BACKEND", "Dev-only local asset backend. No production effect — remove."],
]);

// ─── Fallback blocking list ───────────────────────────────────────────────────
//
// Used when reports/vercel-env-required.json has not yet been generated.
// Derived from the prepare-vercel-env-migration.mjs VARIABLES catalogue
// (blocking: true entries). Run the prepare script first for full catalogue checks.

const FALLBACK_BLOCKING = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "CSRF_SECRET",
  "ACCESS_COOKIE_SECRET",
  "SECURE_CLIENT_STATE_SECRET",
  "ADMIN_JWT_SECRET",
  "CRON_SECRET",
  "ACTION_TOKEN_SECRET",
  "DATABASE_URL",
  "MONGODB_URI",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "AOL_HASH_SALT",
  "SYSTEM_INTEGRITY_SALT",
  "DYNAMIC_THRESHOLD_SALT",
  "OAUTH_TOKEN_ENCRYPTION_KEY",
  "INNER_CIRCLE_JWT_SECRET",
  "DIAGNOSTIC_HMAC_SECRET",
  "DIAGNOSTIC_WATERMARK_SECRET",
  "OGR_SESSION_SECRET",
  "ARTIFACT_ACCESS_SECRET",
  "DOWNLOAD_TOKEN_SECRET",
  "DOWNLOAD_SIGNING_SECRET",
  "COMMERCIAL_COOKIE_SECRET",
];

// ─── Preflight checks ─────────────────────────────────────────────────────────

if (!fs.existsSync(CHECK_ENV)) {
  console.error("❌ .env.vercel.check.local not found.");
  console.error("");
  console.error("   This file is the output of: vercel env pull .env.vercel.check.local");
  console.error("   Run that command first, then re-run this script.");
  console.error("");
  process.exit(1);
}

// ─── Load pulled environment names ───────────────────────────────────────────

const pulledNames = parseEnvNames(CHECK_ENV);

// ─── Load catalogue from JSON report (if available) ──────────────────────────

let catalogueToCopy = [];      // { name, blocking, environments, sensitive, group, note }
let catalogueDoNotCopy = [];   // { name, reason, group }
let catalogueConditional = []; // { name, ... } — present when certain conditions hold
let blockingNames = FALLBACK_BLOCKING;
let usingFullCatalogue = false;

if (fs.existsSync(REQUIRED_JSON)) {
  const report = JSON.parse(fs.readFileSync(REQUIRED_JSON, "utf-8"));
  catalogueToCopy = report.toCopy || [];
  catalogueDoNotCopy = report.doNotCopy || [];
  catalogueConditional = report.conditionalVars || [];
  blockingNames = (report.blocking || []).map((v) => v.name);
  usingFullCatalogue = true;
}

// ─── Checks ───────────────────────────────────────────────────────────────────

// Check 1: Blocking gaps — variables whose absence breaks production
const blockingGaps = blockingNames.filter((name) => !pulledNames.has(name));
const blockingPresent = blockingNames.filter((name) => pulledNames.has(name));

// Check 2: Forbidden names present in pulled environment
// Exclude VERCEL_ALWAYS_INJECTED — those appear in every env pull by design.
const forbiddenFound = [...FORBIDDEN_IN_PRODUCTION.keys()].filter(
  (name) => pulledNames.has(name) && !VERCEL_ALWAYS_INJECTED.has(name)
);

// Check 3: Full COPY catalogue gaps (only if JSON report loaded)
const copyGaps = usingFullCatalogue
  ? catalogueToCopy.filter((v) => !pulledNames.has(v.name))
  : [];
const copyGapsBlocking = copyGaps.filter((v) => v.blocking);
const copyGapsNonBlocking = copyGaps.filter((v) => !v.blocking);

// Check 4: DO_NOT_COPY variables present (Netlify artifacts that shouldn't be copied)
// Exclude VERCEL_ALWAYS_INJECTED — those appear in every pull by design.
const doNotCopyFound = usingFullCatalogue
  ? catalogueDoNotCopy.filter((v) => pulledNames.has(v.name) && !VERCEL_ALWAYS_INJECTED.has(v.name))
  : [];

// Check 5: Unrecognised variables (present in pull but not in any catalogue list)
// Exclude VERCEL_ALWAYS_INJECTED — those appear in every pull by design and are
// not operator-controlled; they don't need to be in any catalogue.
const unrecognised = usingFullCatalogue
  ? (() => {
      const allKnownNames = new Set([
        ...catalogueToCopy.map((v) => v.name),
        ...catalogueDoNotCopy.map((v) => v.name),
        ...catalogueConditional.map((v) => v.name),
        ...[...FORBIDDEN_IN_PRODUCTION.keys()],
        ...VERCEL_ALWAYS_INJECTED,
      ]);
      return [...pulledNames].filter((name) => !allKnownNames.has(name));
    })()
  : [];

// ─── Output ───────────────────────────────────────────────────────────────────

console.log("");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║     VERCEL ENV — POST-IMPORT NAME VERIFICATION               ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");

console.log(`  Verified at:   ${new Date().toISOString()}`);
console.log(`  Source file:   .env.vercel.check.local`);
console.log(`  Variables detected in pull: ${pulledNames.size}`);
console.log(
  `  Catalogue:     ${
    usingFullCatalogue
      ? "✅ reports/vercel-env-required.json (full catalogue)"
      : "⚠️  Fallback list only — run prepare-vercel-env-migration.mjs first for full checks"
  }`
);
console.log("");

// ── Check 1: Blocking variables ──────────────────────────────────────────────

console.log("── BLOCKING VARIABLES ─────────────────────────────────────────");
if (blockingGaps.length === 0) {
  console.log(`  ✅ All ${blockingNames.length} blocking variables confirmed present.`);
} else {
  console.log(`  ❌ ${blockingGaps.length} blocking variable(s) missing — production CANNOT proceed:`);
  for (const name of blockingGaps) {
    console.log(`     ❌ ${name}`);
  }
  if (blockingPresent.length > 0) {
    console.log(`  ✅ ${blockingPresent.length} of ${blockingNames.length} blocking variables present.`);
  }
}
console.log("");

// ── Check 2: Forbidden names ─────────────────────────────────────────────────

console.log("── FORBIDDEN VARIABLES ────────────────────────────────────────");
if (forbiddenFound.length === 0) {
  console.log(`  ✅ No forbidden variables detected in pulled environment.`);
} else {
  console.log(`  ❌ ${forbiddenFound.length} forbidden variable(s) present — must be removed:`);
  for (const name of forbiddenFound) {
    const reason = FORBIDDEN_IN_PRODUCTION.get(name);
    console.log(`     ❌ ${name}`);
    console.log(`        Reason: ${reason}`);
  }
}
console.log("");

// ── Check 3: Full COPY catalogue (if loaded) ─────────────────────────────────

if (usingFullCatalogue) {
  console.log("── FULL CATALOGUE COPY CHECK ───────────────────────────────────");
  if (copyGaps.length === 0) {
    console.log(`  ✅ All ${catalogueToCopy.length} catalogue COPY variables confirmed present.`);
  } else {
    console.log(
      `  ⚠️  ${copyGaps.length} of ${catalogueToCopy.length} COPY variable(s) not found in pulled environment:`
    );
    if (copyGapsBlocking.length > 0) {
      console.log(`\n     ❌ Blocking (resolve before cutover):`);
      for (const v of copyGapsBlocking) {
        console.log(`        ❌ ${v.name}  [${v.environments?.join(", ") ?? "production"}]`);
        if (v.note) console.log(`           Note: ${v.note.slice(0, 120)}`);
      }
    }
    if (copyGapsNonBlocking.length > 0) {
      console.log(`\n     ⚠️  Non-blocking (review — may be conditional or environment-specific):`);
      for (const v of copyGapsNonBlocking) {
        const envLabel = v.environments?.join(", ") ?? "production";
        console.log(`        ⚠️  ${v.name}  [${envLabel}]`);
      }
    }
  }
  console.log("");
}

// ── Check 4: DO_NOT_COPY presence ────────────────────────────────────────────

if (usingFullCatalogue) {
  console.log("── DO_NOT_COPY PRESENCE CHECK ──────────────────────────────────");
  if (doNotCopyFound.length === 0) {
    console.log(`  ✅ No DO_NOT_COPY variables detected in pulled environment.`);
  } else {
    console.log(
      `  ⚠️  ${doNotCopyFound.length} DO_NOT_COPY variable(s) unexpectedly present:`
    );
    for (const v of doNotCopyFound) {
      console.log(`     ⚠️  ${v.name}`);
      if (v.reason) console.log(`        Reason they should not be here: ${v.reason.slice(0, 120)}`);
    }
    console.log(`  Action: Remove these from Vercel environment settings.`);
  }
  console.log("");
}

// ── Check 5: Unrecognised variables ─────────────────────────────────────────

if (usingFullCatalogue && unrecognised.length > 0) {
  console.log("── UNRECOGNISED VARIABLES ──────────────────────────────────────");
  console.log(
    `  ⚠️  ${unrecognised.length} variable(s) not in any catalogue list — review for legitimacy:`
  );
  for (const name of unrecognised.sort()) {
    console.log(`     ?  ${name}`);
  }
  console.log(`  These may be legitimate (new vars added after the catalogue was generated)`);
  console.log(`  or Netlify artifacts. Add them to prepare-vercel-env-migration.mjs if needed.`);
  console.log("");
}

// ── Verdict ───────────────────────────────────────────────────────────────────

console.log("── VERDICT ─────────────────────────────────────────────────────");

const hasFatalIssues = blockingGaps.length > 0 || forbiddenFound.length > 0;
const hasWarnings =
  copyGapsNonBlocking.length > 0 ||
  doNotCopyFound.length > 0 ||
  unrecognised.length > 0;

if (hasFatalIssues) {
  console.log("  ❌ VERIFICATION FAILED");
  console.log("");
  if (blockingGaps.length > 0) {
    console.log(`  → Resolve ${blockingGaps.length} blocking gap(s) by adding missing variables to Vercel.`);
  }
  if (forbiddenFound.length > 0) {
    console.log(`  → Remove ${forbiddenFound.length} forbidden variable(s) from Vercel environment settings.`);
  }
  console.log("");
  console.log("  Do NOT proceed to DNS cutover until this script exits 0.");
  console.log("");
  process.exit(1);
} else if (hasWarnings) {
  console.log("  ✅ PASSED with warnings");
  console.log("");
  console.log("  All blocking variables are present and no forbidden variables detected.");
  if (copyGapsNonBlocking.length > 0) {
    console.log(`  Review ${copyGapsNonBlocking.length} non-blocking COPY gap(s) before cutover.`);
  }
  if (doNotCopyFound.length > 0) {
    console.log(`  Remove ${doNotCopyFound.length} DO_NOT_COPY variable(s) from Vercel for hygiene.`);
  }
  if (unrecognised.length > 0) {
    console.log(`  Review ${unrecognised.length} unrecognised variable(s) against catalogue.`);
  }
  console.log("");
  process.exit(0);
} else {
  console.log("  ✅ VERIFICATION PASSED — all checks clean.");
  console.log("");
  console.log("  All blocking variables confirmed. No forbidden names. No unexpected DO_NOT_COPY vars.");
  if (usingFullCatalogue) {
    console.log("  Full catalogue verified against pulled environment.");
  }
  console.log("");
  process.exit(0);
}
