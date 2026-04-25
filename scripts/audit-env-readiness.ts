/**
 * Environment Readiness Audit
 *
 * Checks required env vars by feature.
 * Missing optional features = DISABLED.
 * Missing core = BLOCKED.
 * No secrets printed.
 *
 * Run: npx tsx scripts/audit-env-readiness.ts
 */

const PASS = "\x1b[32m READY\x1b[0m";
const DISABLED = "\x1b[33m DISABLED\x1b[0m";
const BLOCKED = "\x1b[31m BLOCKED\x1b[0m";
let ready = 0;
let disabled = 0;
let blocked = 0;

function checkCore(name: string, envKey: string) {
  const val = process.env[envKey];
  if (val && val.length > 0) {
    console.log(`${PASS}  ${name} (${envKey})`);
    ready++;
  } else {
    console.log(`${BLOCKED}  ${name} (${envKey}) — REQUIRED`);
    blocked++;
  }
}

function checkOptional(feature: string, envKey: string) {
  const val = process.env[envKey];
  if (val && val.length > 0) {
    console.log(`${PASS}  ${feature} (${envKey})`);
    ready++;
  } else {
    console.log(`${DISABLED}  ${feature} (${envKey}) — feature disabled`);
    disabled++;
  }
}

console.log("\n========================================");
console.log("  ENVIRONMENT READINESS AUDIT");
console.log("========================================\n");

console.log("─── CORE (required for operation) ───\n");
checkCore("Database", "DATABASE_URL");
checkCore("NextAuth Secret", "NEXTAUTH_SECRET");
checkCore("NextAuth URL", "NEXTAUTH_URL");
checkCore("Site URL", "NEXT_PUBLIC_SITE_URL");

console.log("\n─── STRIPE (required for payments) ───\n");
checkOptional("Stripe Secret Key", "STRIPE_SECRET_KEY");
checkOptional("Stripe Webhook Secret", "STRIPE_WEBHOOK_SECRET");

console.log("\n─── EMAIL (required for follow-up) ───\n");
checkOptional("Resend API Key", "RESEND_API_KEY");

console.log("\n─── OAUTH (required for integrations) ───\n");
checkOptional("Google OAuth Client ID", "GOOGLE_OAUTH_CLIENT_ID");
checkOptional("Google OAuth Client Secret", "GOOGLE_OAUTH_CLIENT_SECRET");
checkOptional("Slack Client ID", "SLACK_CLIENT_ID");
checkOptional("Slack Client Secret", "SLACK_CLIENT_SECRET");
checkOptional("OAuth Token Encryption Key", "OAUTH_TOKEN_ENCRYPTION_KEY");

console.log("\n─── CRON (required for pressure loops) ───\n");
checkOptional("Cron Secret", "CRON_SECRET");

console.log("\n─── AI (required for synthesis) ───\n");
checkOptional("OpenAI / Anthropic Key", "OPENAI_API_KEY");

console.log("\n========================================");
console.log(`  ${ready} READY, ${disabled} DISABLED, ${blocked} BLOCKED`);
console.log("========================================\n");

if (blocked > 0) {
  console.log("CORE BLOCKED. Fix before deployment.\n");
  process.exit(1);
} else if (disabled > 0) {
  console.log(`CORE_READY. ${disabled} optional features disabled by config.\n`);
} else {
  console.log("FULLY_READY. All features configured.\n");
}
