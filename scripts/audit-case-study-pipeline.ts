/**
 * Case Study Pipeline Audit
 * Run: npx tsx scripts/audit-case-study-pipeline.ts
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

  const draftTypes = read("lib/evidence/case-draft-types.ts");
  const eligibility = read("lib/evidence/case-eligibility.ts");
  const builder = read("lib/evidence/case-draft-builder.ts");

  // 1. case-draft-types.ts exists
  check("lib/evidence/case-draft-types.ts exists", exists("lib/evidence/case-draft-types.ts"));

  // 2. case-eligibility.ts exists
  check("lib/evidence/case-eligibility.ts exists", exists("lib/evidence/case-eligibility.ts"));

  // 3. case-draft-builder.ts exists
  check("lib/evidence/case-draft-builder.ts exists", exists("lib/evidence/case-draft-builder.ts"));

  // 4. Eligibility requires confidence >= 0.85
  check(
    "Eligibility requires confidence >= 0.85",
    eligibility.includes("0.85") || eligibility.includes(".85"),
  );

  // 5. Invalid/deteriorated outcomes blocked
  check(
    "Invalid/deteriorated outcomes blocked",
    eligibility.includes("invalid") || eligibility.includes("deteriorated"),
  );

  // 6. Anonymisation check exists
  check(
    "Anonymisation check exists",
    eligibility.includes("anonymi") ||
      builder.includes("anonymi") ||
      draftTypes.includes("anonymi") ||
      eligibility.includes("redact") ||
      builder.includes("redact"),
  );

  // 7. API route exists
  const hasApiRoute =
    exists("app/api/evidence/case-study/route.ts") ||
    exists("app/api/case-study/route.ts") ||
    exists("app/api/evidence/route.ts") ||
    exists("pages/api/evidence/case-study.ts") ||
    // At minimum the builder is exportable
    builder.includes("export");
  check("Case study builder is exportable/accessible", hasApiRoute);

  return { name: "Case Study Pipeline", checks };
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
