/**
 * Boardroom Mode Audit
 * Run: npx tsx scripts/audit-boardroom-mode.ts
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

  const dossierTypes = read("lib/boardroom/dossier-types.ts");

  // 1. dossier-types.ts exists
  check("lib/boardroom/dossier-types.ts exists", exists("lib/boardroom/dossier-types.ts"));

  // 2. dossier-builder.ts exists
  check(
    "lib/boardroom/dossier-builder.ts exists",
    exists("lib/boardroom/dossier-builder.ts"),
  );

  // 3. dossier-pdf.tsx exists
  check(
    "lib/boardroom/dossier-pdf.tsx exists",
    exists("lib/boardroom/dossier-pdf.tsx"),
  );

  // 4. app/api/boardroom/dossier/route.ts exists
  check(
    "app/api/boardroom/dossier/route.ts exists",
    exists("app/api/boardroom/dossier/route.ts"),
  );

  // 5. app/api/boardroom/dossier/pdf/route.ts exists
  check(
    "app/api/boardroom/dossier/pdf/route.ts exists",
    exists("app/api/boardroom/dossier/pdf/route.ts"),
  );

  // 6. Dossier includes financial impact field
  check(
    "Dossier includes financial impact field",
    dossierTypes.includes("financialImpact") || dossierTypes.includes("financial_impact"),
  );

  // 7. Dossier includes data completeness field
  check(
    "Dossier includes data completeness field",
    dossierTypes.includes("dataCompleteness") || dossierTypes.includes("data_completeness"),
  );

  return { name: "Boardroom Mode", checks };
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
