/**
 * Decision Ledger Audit
 * Run: npx tsx scripts/audit-decision-ledger.ts
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
  const creditScore = read("lib/follow-up/decision-credit-score.ts");
  const ledgerService = read("lib/decision-ledger/ledger-service.ts");

  // 1. Credit score exists
  check(
    "Decision credit score exists (lib/follow-up/decision-credit-score.ts)",
    exists("lib/follow-up/decision-credit-score.ts") &&
      creditScore.includes("computeDecisionCreditScore"),
  );

  // 2. Score components defined
  check(
    "Score components defined (followThrough, breachPenalty, impactQuality, consistency)",
    creditScore.includes("followThrough") &&
      creditScore.includes("breachPenalty") &&
      creditScore.includes("impactQuality") &&
      creditScore.includes("consistency"),
  );

  // 3. DiagnosticJourney model exists
  check("DiagnosticJourney model exists in schema", schema.includes("model DiagnosticJourney {"));

  // 4. DiagnosticDecisionObject model exists
  check("DiagnosticDecisionObject model exists in schema", schema.includes("model DiagnosticDecisionObject {"));

  // 5. DiagnosticEvidenceNode model exists
  check("DiagnosticEvidenceNode model exists in schema", schema.includes("model DiagnosticEvidenceNode {"));

  // 6. Ledger service exists
  check(
    "lib/decision-ledger/ledger-service.ts exists",
    exists("lib/decision-ledger/ledger-service.ts") &&
      ledgerService.includes("LedgerEntry") &&
      ledgerService.includes("CreditProfile"),
  );

  // 7. History query function exists
  check(
    "Ledger history query function exists (getLedgerHistory)",
    ledgerService.includes("getLedgerHistory") &&
      ledgerService.includes("getCreditProfile"),
  );

  return { name: "Decision Ledger", checks };
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
