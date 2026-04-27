/**
 * PRODUCT ENGINEERING MOAT — Master Audit
 * Run: npx tsx scripts/audit-product-engineering-moat.ts
 *
 * Runs all 8 component audits and produces a final pass/fail verdict.
 */

import { runAudit as auditDiagnosticEngine } from "./audit-diagnostic-engine-moat";
import { runAudit as auditMultiUserCollision } from "./audit-multi-user-collision";
import { runAudit as auditEnforcementEngine } from "./audit-enforcement-engine-complete";
import { runAudit as auditDecisionLedger } from "./audit-decision-ledger";
import { runAudit as auditStrategyRoom } from "./audit-strategy-room-product";
import { runAudit as auditOutcomeVerification } from "./audit-outcome-verification-pipeline";
import { runAudit as auditBoardroom } from "./audit-boardroom-mode";
import { runAudit as auditCaseStudy } from "./audit-case-study-pipeline";

type AuditResult = {
  name: string;
  checks: { label: string; pass: boolean }[];
  passed: number;
  failed: number;
};

async function main() {
  const audits = [
    auditDiagnosticEngine,
    auditMultiUserCollision,
    auditEnforcementEngine,
    auditDecisionLedger,
    auditStrategyRoom,
    auditOutcomeVerification,
    auditBoardroom,
    auditCaseStudy,
  ];

  const results: AuditResult[] = [];
  let totalPassed = 0;
  let totalFailed = 0;

  console.log("\n================================================================");
  console.log("  PRODUCT ENGINEERING MOAT — FULL AUDIT");
  console.log("================================================================\n");

  for (const audit of audits) {
    const result = await audit();
    const passed = result.checks.filter((c) => c.pass).length;
    const failed = result.checks.filter((c) => !c.pass).length;

    results.push({ ...result, passed, failed });
    totalPassed += passed;
    totalFailed += failed;

    // Print section
    console.log(`\n── ${result.name.toUpperCase()} ──`);
    for (const c of result.checks) {
      const icon = c.pass ? "\x1b[32m PASS\x1b[0m" : "\x1b[31m FAIL\x1b[0m";
      console.log(`  ${icon}  ${c.label}`);
    }
    console.log(`  (${passed}/${passed + failed})`);
  }

  // Final summary table
  console.log("\n================================================================");
  console.log("  SUMMARY");
  console.log("================================================================\n");

  const maxNameLen = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const status = r.failed === 0 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
    const name = r.name.padEnd(maxNameLen);
    console.log(`  ${status}  ${name}  ${r.passed}/${r.passed + r.failed}`);
  }

  console.log("");
  console.log(`  Total: ${totalPassed} passed, ${totalFailed} failed`);
  console.log("");

  if (totalFailed === 0) {
    console.log("\x1b[32m  PRODUCT ENGINEERING MOAT: PASS\x1b[0m\n");
  } else {
    console.log("\x1b[31m  PRODUCT ENGINEERING MOAT: FAIL\x1b[0m\n");
  }

  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Audit runner failed:", err);
  process.exit(1);
});
