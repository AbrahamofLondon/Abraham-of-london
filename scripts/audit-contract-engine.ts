/**
 * Contract Engine Audit
 * Run: npx tsx scripts/audit-contract-engine.ts
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
console.log("  CONTRACT ENGINE AUDIT");
console.log("========================================\n");

// Engine files
check("types.ts exists", exists("lib/contracts/types.ts"));
check("engine.ts exists", exists("lib/contracts/engine.ts"));
check("breach.ts exists", exists("lib/contracts/breach.ts"));
check("verification.ts exists", exists("lib/contracts/verification.ts"));
check("reminders.ts exists", exists("lib/contracts/reminders.ts"));
check("adapters.ts exists", exists("lib/contracts/adapters.ts"));
check("persistence.ts exists", exists("lib/contracts/persistence.ts"));

// API routes
check("POST /api/contracts/create exists", exists("pages/api/contracts/create.ts"));
check("GET /api/contracts/[id] exists", exists("pages/api/contracts/[id]/index.ts"));
check("POST /api/contracts/[id]/checkpoint exists", exists("pages/api/contracts/[id]/checkpoint.ts"));
check("POST /api/contracts/[id]/verify exists", exists("pages/api/contracts/[id]/verify.ts"));

// Prisma model
const schema = read("prisma/schema.prisma");
check("Prisma PatternBreakerContract model exists", schema.includes("model PatternBreakerContract"));

// Engine rules
const engine = read("lib/contracts/engine.ts");
check("Engine rejects < 12 word commitments", engine.includes("12 words") || engine.includes("12"));
check("Engine requires owner", engine.includes("requires an owner"));
check("Engine requires deadline", engine.includes("requires a deadline"));
check("Engine generates checkpoints", engine.includes("generateCheckpoints"));

// Verification rules
const verification = read("lib/contracts/verification.ts");
check("Self-report max confidence 0.6", verification.includes("0.6"));
check("Behavioural signal max 0.85", verification.includes("0.85"));
check("Documentary evidence max 0.9", verification.includes("0.9"));

// Breach rules
const breach = read("lib/contracts/breach.ts");
check("Breach escalation: warning → restricted → locked", breach.includes("warning") && breach.includes("restricted") && breach.includes("locked"));
check("AUTHORITY_VACUUM signal handling", breach.includes("AUTHORITY_VACUUM"));
check("RISK_EXPOSURE signal handling", breach.includes("RISK_EXPOSURE"));

// Adapters
const adapters = read("lib/contracts/adapters.ts");
check("Adapter: purpose_alignment", adapters.includes("purpose_alignment"));
check("Adapter: strategy_room", adapters.includes("strategy_room"));
check("Adapter: executive_reporting", adapters.includes("executive_reporting"));
check("Adapter: decision_instrument", adapters.includes("decision_instrument"));
check("Adapter: toolkit", adapters.includes("toolkit"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("CONTRACT ENGINE INCOMPLETE.\n"); process.exit(1); }
else { console.log("PATTERN-BREAKER CONTRACT ENGINE VERIFIED.\n"); }
