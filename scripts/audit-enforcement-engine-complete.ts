/**
 * Enforcement Engine Complete Audit
 * Run: npx tsx scripts/audit-enforcement-engine-complete.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function exists(p: string): boolean {
  return fs.existsSync(path.join(ROOT, p));
}
function read(p: string): string {
  const f = path.join(ROOT, p);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : "";
}

type CheckResult = { label: string; pass: boolean };

export async function runAudit(): Promise<{ name: string; checks: CheckResult[] }> {
  const checks: CheckResult[] = [];

  function check(label: string, condition: boolean) {
    checks.push({ label, pass: condition });
  }

  const schema = read("prisma/schema.prisma");
  const engine = read("lib/contracts/engine.ts");
  const breach = read("lib/contracts/breach.ts");
  const escalation = read("lib/follow-up/escalation-engine.ts");

  // 1. PatternBreakerContract model in Prisma schema
  check("PatternBreakerContract model in Prisma schema", schema.includes("model PatternBreakerContract"));

  // 2. engine.ts exports contract creation
  check(
    "lib/contracts/engine.ts exports contract creation",
    exists("lib/contracts/engine.ts") &&
      (engine.includes("export function validateContract") ||
        engine.includes("export function createContract")),
  );

  // 3. breach.ts exists
  check("lib/contracts/breach.ts exists", exists("lib/contracts/breach.ts"));

  // 4. Escalation levels defined (24h, 48h, 72h, 5d, 7d pattern)
  check(
    "Escalation levels defined (24h/48h/72h/5d/7d)",
    escalation.includes('"24h"') &&
      escalation.includes('"48h"') &&
      escalation.includes('"72h"') &&
      escalation.includes('"5d"') &&
      escalation.includes('"7d"'),
  );

  // 5. Contract requires owner + deadline + consequence
  check(
    "Contract requires owner + deadline + consequence",
    engine.includes("requires an owner") &&
      engine.includes("requires a deadline") &&
      (engine.includes("Consequence") || engine.includes("consequence")),
  );

  // 6. Breach detection function exists
  check(
    "Breach detection function exists",
    breach.includes("processCheckpointMiss") || breach.includes("getOverdueCheckpoints"),
  );

  // 7. escalation-engine.ts exists
  check("lib/follow-up/escalation-engine.ts exists", exists("lib/follow-up/escalation-engine.ts"));

  return { name: "Enforcement Engine Complete", checks };
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────
if (require.main === module) {
  runAudit().then(({ name, checks }) => {
    console.log(`\n========================================`);
    console.log(`  ${name.toUpperCase()} AUDIT`);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;
    for (const c of checks) {
      if (c.pass) {
        console.log(`\x1b[32m PASS\x1b[0m  ${c.label}`);
        passed++;
      } else {
        console.log(`\x1b[31m FAIL\x1b[0m  ${c.label}`);
        failed++;
      }
    }

    console.log(`\n── ${passed} passed, ${failed} failed ──\n`);
    process.exit(failed > 0 ? 1 : 0);
  });
}
