/**
 * Decision Instruments Post-Purchase Audit
 *
 * Run: npx tsx scripts/audit-decision-instruments-postpurchase.ts
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

function exists(relPath: string): boolean { return fs.existsSync(path.join(ROOT, relPath)); }
function readFile(relPath: string): string { const f = path.join(ROOT, relPath); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : ""; }

console.log("\n========================================");
console.log("  POST-PURCHASE TRUST AUDIT");
console.log("========================================\n");

const slugs = ["decision-exposure-instrument", "mandate-clarity-framework", "intervention-path-selector"];

// 1. PDF links use controlled delivery route
console.log("─── PDF delivery ───\n");
for (const slug of slugs) {
  const startPage = readFile(`pages/decision-instruments/${slug}/start.tsx`);
  const usesApi = startPage.includes("/api/downloads/instrument-pdf");
  const usesOldPath = startPage.includes("/assets/downloads/");
  check(`${slug}: PDF via API route`, usesApi && !usesOldPath, usesOldPath ? "Still uses /assets/downloads/" : undefined);
}
check("PDF API route exists", exists("pages/api/downloads/instrument-pdf.ts"));

// Check actual PDFs exist on disk
for (const slug of slugs) {
  check(`${slug}: PDF file exists`, exists(`private/assets/paid-instruments/${slug}.pdf`));
}

// 2. Intervention Path playbook
console.log("\n─── Playbook ───\n");
check("Intervention Path playbook exists", exists("content/playbooks/intervention-path-public.mdx"));

// 3. Purchase email route
console.log("\n─── Purchase email ───\n");
check("Purchase email API exists", exists("pages/api/decision-instruments/send-purchase-email.ts"));
const emailRoute = readFile("pages/api/decision-instruments/send-purchase-email.ts");
check("Email uses sendEmail()", emailRoute.includes("sendEmail"));
check("Email includes instrument link", emailRoute.includes("/run"));
check("Email includes PDF link", emailRoute.includes("instrument-pdf"));

// 4. Downstream result ID
console.log("\n─── Result context downstream ───\n");
for (const slug of slugs) {
  const runPage = readFile(`pages/decision-instruments/${slug}/run.tsx`);
  check(`${slug}: captures resultKey`, runPage.includes("setResultKey"));
  check(`${slug}: passes instrumentResultId`, runPage.includes("instrumentResultId"));
}
const opRun = readFile("pages/decision-instruments/operator-decision-pack/run.tsx");
check("operator-pack: captures resultKey", opRun.includes("setResultKey"));
check("operator-pack: passes instrumentResultId", opRun.includes("instrumentResultId"));

// 5. No old manual path for entitled
console.log("\n─── Legacy isolation ───\n");
const slugPage = readFile("pages/decision-instruments/[slug].tsx");
check("No InstrumentEnvironment for entitled", !(/hasAccess[\s\S]{0,100}InstrumentEnvironment/.test(slugPage)));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("POST-PURCHASE GAPS REMAIN.\n"); process.exit(1); }
else { console.log("POST-PURCHASE TRUST CLOSED.\n"); }
