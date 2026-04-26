/**
 * Paid Product Trust Audit — master gate for market entry.
 *
 * Run: npx tsx scripts/audit-paid-product-trust.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function exists(p: string): boolean { return fs.existsSync(path.join(ROOT, p)); }
function read(p: string): string { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : ""; }

console.log("\n========================================");
console.log("  PAID PRODUCT TRUST AUDIT");
console.log("========================================\n");

// 1. PDF delivery
console.log("─── PDF delivery ───\n");
check("PDF API route exists", exists("pages/api/downloads/instrument-pdf.ts"));
for (const slug of ["decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector"]) {
  check(`${slug}: PDF file on disk`, exists(`private/assets/paid-instruments/${slug}.pdf`));
}

// 2. Purchase email triggered from webhook
console.log("\n─── Purchase email ───\n");
const webhook = read("pages/api/webhooks/stripe.ts");
check("Webhook triggers purchase email for instruments", webhook.includes("send-purchase-email"));
check("Email trigger is non-blocking", webhook.includes("non-blocking") || webhook.includes("catch"));

// 3. Downstream context consumed
console.log("\n─── Context consumption ───\n");
const erRun = read("pages/diagnostics/executive-reporting/run.tsx");
check("ER reads instrumentResultId", erRun.includes("instrumentResultId"));
check("ER reads marketContextId", erRun.includes("marketContextId"));
const srIndex = read("pages/strategy-room/index.tsx");
check("Strategy Room reads instrumentResultId", srIndex.includes("instrumentResultId"));

// 4. Strategy Room session persistence
console.log("\n─── Session persistence ───\n");
const sessionService = read("lib/strategy-room/session-service.ts");
check("Session service uses Postgres (createStrategyRoomSession)", sessionService.includes("createStrategyRoomSession"));
check("Session service no Math.random()", !sessionService.includes("Math.random"));
check("Session service no TODO", !sessionService.includes("later →") && !sessionService.includes("TODO"));

// 5. No 503 in paid routes
console.log("\n─── No 503 ───\n");
const erApi = read("app/api/analytics/executive-report/route.ts");
check("ER API: no 503 in primary path", !erApi.includes("status: 503") || erApi.indexOf("status: 503") > erApi.indexOf("_legacyMarketDataHandler"));

// 6. No "coming soon" in paid journeys
console.log("\n─── No false promises ───\n");
const paidFiles = [
  "pages/decision-instruments/decision-exposure-instrument/run.tsx",
  "pages/decision-instruments/mandate-clarity-framework/run.tsx",
  "pages/decision-instruments/intervention-path-selector/run.tsx",
  "pages/decision-instruments/operator-decision-pack/run.tsx",
  "pages/diagnostics/executive-reporting.tsx",
];
for (const f of paidFiles) {
  const content = read(f);
  const name = f.split("/").pop()!;
  check(`${name}: no "coming soon"`, !content.toLowerCase().includes("coming soon"));
}

// 7. No swallowed catches in paid flows
console.log("\n─── No swallowed errors ───\n");
for (const f of paidFiles) {
  const content = read(f);
  const name = f.split("/").pop()!;
  check(`${name}: no .catch(() => {})`, !/\.catch\(\(\)\s*=>\s*\{\s*\}\)/.test(content));
}

// 8. Checkout success paths
console.log("\n─── Checkout routing ───\n");
const catalog = read("lib/commercial/catalog.ts");
for (const slug of ["decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector", "operator-decision-pack"]) {
  const match = catalog.match(new RegExp(`successPath:\\s*"([^"]*${slug.replace(/-/g, ".")}[^"]*)"`));
  const successPath = match?.[1] ?? "";
  check(`${slug}: routes to /start`, successPath.includes("/start"));
}

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("PAID PRODUCT TRUST GAPS REMAIN.\n"); process.exit(1); }
else { console.log("PAID PRODUCT TRUST VERIFIED.\n"); }
