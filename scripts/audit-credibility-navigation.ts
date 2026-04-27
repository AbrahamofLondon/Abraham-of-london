/**
 * Credibility Navigation Audit — every trust page must be discoverable.
 * Run: npx tsx scripts/audit-credibility-navigation.ts
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

function read(p: string): string { const f = path.join(ROOT, p); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : ""; }

console.log("\n========================================");
console.log("  CREDIBILITY NAVIGATION AUDIT");
console.log("========================================\n");

// Footer links
const footer = read("components/EnhancedFooter.tsx");
console.log("─── Footer links ───\n");
check("Footer: /verification", footer.includes("/verification"));
check("Footer: /trust", footer.includes("/trust"));
check("Footer: /foundations", footer.includes("/foundations"));
check("Footer: /evidence", footer.includes("/evidence"));
check("Footer: /playbooks", footer.includes("/playbooks"));
check("Footer: /about/founder", footer.includes("/about/founder"));

// About page links
const about = read("pages/about.tsx");
console.log("\n─── About page ───\n");
check("About → /verification", about.includes("/verification"));
check("About → /trust", about.includes("/trust"));
check("About → /foundations", about.includes("/foundations"));
check("About → /evidence", about.includes("/evidence"));
check("About → /playbooks", about.includes("/playbooks"));
check("About → /founders", about.includes("/founders"));

// Founder page links
const founder = read("pages/about/founder.tsx");
console.log("\n─── Founder page ───\n");
check("Founder → /verification", founder.includes("/verification"));
check("Founder → /trust", founder.includes("/trust"));
check("Founder → /evidence", founder.includes("/evidence"));
check("Founder → /foundations", founder.includes("/foundations"));
check("Founder → Companies House 11549053", founder.includes("11549053"));

// Verification cross-links
const verification = read("pages/verification.tsx");
console.log("\n─── Verification page ───\n");
check("Verification → /trust", verification.includes("/trust"));
check("Verification → /evidence", verification.includes("/evidence"));
check("Verification → /foundations", verification.includes("/foundations"));
check("Verification → Companies House 11549053", verification.includes("11549053"));

// Trust cross-links
const trust = read("pages/trust.tsx");
console.log("\n─── Trust page ───\n");
check("Trust → /verification", trust.includes("/verification"));
check("Trust → /foundations", trust.includes("/foundations"));
check("Trust → /evidence", trust.includes("/evidence"));
check("Trust → /playbooks", trust.includes("/playbooks"));

// Foundations cross-links
const foundations = read("pages/foundations.tsx");
console.log("\n─── Foundations page ───\n");
check("Foundations → /evidence", foundations.includes("/evidence"));
check("Foundations → /playbooks", foundations.includes("/playbooks"));
check("Foundations → /verification", foundations.includes("/verification"));
check("Foundations → /canon/glossary", foundations.includes("/canon/glossary"));

// Homepage trust strip
const homepage = read("pages/index.tsx");
console.log("\n─── Homepage ───\n");
const homeTrustLinks = ["/verification", "/trust", "/evidence", "/foundations"].filter((l) => homepage.includes(l));
check("Homepage: at least 3 credibility links", homeTrustLinks.length >= 3, `Found ${homeTrustLinks.length}`);

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("CREDIBILITY NAVIGATION INCOMPLETE.\n"); process.exit(1); }
else { console.log("CREDIBILITY LAYER DISCOVERABLE.\n"); }
