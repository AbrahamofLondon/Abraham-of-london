/**
 * scripts/validate-netlify-env.mjs
 *
 * Validates required Netlify runtime env vars before the expensive build starts.
 * Prints only safe metadata — never the full value of any secret.
 * Exits 1 on any failure so the build aborts early.
 */

let failed = false;

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  failed = true;
}

function ok(msg) {
  console.log(`[OK]   ${msg}`);
}

function warn(msg) {
  console.warn(`[WARN] ${msg}`);
}

// ── DATABASE_URL ────────────────────────────────────────────────────────────

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  fail("DATABASE_URL is not set");
} else {
  const valid = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");
  if (!valid) {
    fail("DATABASE_URL does not start with postgresql:// or postgres://");
  } else {
    let hostname = "(unparseable)";
    try {
      hostname = new URL(dbUrl).hostname;
    } catch {
      fail("DATABASE_URL is not a valid URL");
    }
    if (hostname !== "(unparseable)") {
      ok(`DATABASE_URL — protocol valid, host: ${hostname}`);
    }
  }
}

// ── NEXTAUTH_URL ─────────────────────────────────────────────────────────────

const nextauthUrl = process.env.NEXTAUTH_URL;

if (!nextauthUrl) {
  fail("NEXTAUTH_URL is not set");
} else {
  try {
    const u = new URL(nextauthUrl);
    ok(`NEXTAUTH_URL — ${u.protocol}//${u.hostname}`);
  } catch {
    fail("NEXTAUTH_URL is not a valid URL");
  }
}

// ── NEXTAUTH_SECRET ──────────────────────────────────────────────────────────

const nextauthSecret = process.env.NEXTAUTH_SECRET;

if (!nextauthSecret) {
  fail("NEXTAUTH_SECRET is not set");
} else if (nextauthSecret.length < 16) {
  fail("NEXTAUTH_SECRET is too short (minimum 16 characters)");
} else {
  ok(`NEXTAUTH_SECRET — present (${nextauthSecret.length} chars)`);
}

// ── NEXT_PUBLIC_SITE_URL ─────────────────────────────────────────────────────

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) {
  warn("NEXT_PUBLIC_SITE_URL is not set — falling back to hardcoded origin");
} else {
  try {
    const u = new URL(siteUrl);
    ok(`NEXT_PUBLIC_SITE_URL — ${u.protocol}//${u.hostname}`);
  } catch {
    fail("NEXT_PUBLIC_SITE_URL is not a valid URL");
  }
}

// ── Result ───────────────────────────────────────────────────────────────────

console.log("");

if (failed) {
  console.error("[ABORT] Env validation failed — fix the above before building.");
  process.exit(1);
} else {
  console.log("[PASS]  Env validation passed. Proceeding with build.");
}
