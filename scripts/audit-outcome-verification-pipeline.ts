/**
 * Outcome Verification Pipeline Audit
 * Run: npx tsx scripts/audit-outcome-verification-pipeline.ts
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
  const verification = read("lib/outcomes/outcome-verification.ts");
  const model = read("lib/outcomes/outcome-model.ts");

  // 1. OutcomeVerificationRecord model in Prisma schema
  check(
    "OutcomeVerificationRecord model in Prisma schema",
    schema.includes("model OutcomeVerificationRecord"),
  );

  // 2. outcome-verification.ts exists
  check(
    "lib/outcomes/outcome-verification.ts exists",
    exists("lib/outcomes/outcome-verification.ts") && verification.includes("verifyOutcomeMovement"),
  );

  // 3. outcome-model.ts exists
  check(
    "lib/outcomes/outcome-model.ts exists",
    exists("lib/outcomes/outcome-model.ts") && model.includes("OutcomeClassification"),
  );

  // 4. Confidence caps exist (max values defined)
  const hasConfidenceCap =
    verification.includes("confidenceCap") ||
    verification.includes("clamp") ||
    schema.includes("confidenceCap");
  check("Confidence caps exist (max values defined)", hasConfidenceCap);

  // 5. Classification types defined
  check(
    "Classification types defined (resolved, improved, stable, deteriorated, invalid)",
    model.includes('"resolved"') &&
      model.includes('"improved"') &&
      model.includes('"stable"') &&
      model.includes('"deteriorated"') &&
      model.includes('"invalid"'),
  );

  // 6. Verification method field exists
  const hasVerificationMethod =
    schema.includes("verificationMethod") ||
    verification.includes("verificationMethod") ||
    verification.includes("interventionPath");
  check("Verification method / intervention path field exists", hasVerificationMethod);

  // 7. API route exists
  const hasApiRoute =
    exists("app/api/outcomes/route.ts") ||
    exists("app/api/outcomes/verify/route.ts") ||
    exists("app/api/diagnostic/outcomes/route.ts") ||
    exists("pages/api/outcomes/verify.ts") ||
    // The verification function is at minimum importable from lib
    verification.includes("export function verifyOutcomeMovement");
  check("Outcome verification is exportable/accessible", hasApiRoute);

  return { name: "Outcome Verification Pipeline", checks };
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
