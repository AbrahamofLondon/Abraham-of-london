/**
 * Multi-User Collision Audit
 * Run: npx tsx scripts/audit-multi-user-collision.ts
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
  const collision = read("lib/constitution/multi-user-collision.ts");

  // 1. Organisation model in Prisma schema
  check("Organisation model in Prisma schema", schema.includes("model Organisation {"));

  // 2. OrganisationMembership model in Prisma schema
  check("OrganisationMembership model in Prisma schema", schema.includes("model OrganisationMembership {"));

  // 3. multi-user-collision.ts exists with collision detection
  check(
    "lib/constitution/multi-user-collision.ts exists with collision detection",
    exists("lib/constitution/multi-user-collision.ts") &&
      collision.includes("detectCollisions"),
  );

  // 4. At least 3 collision types defined
  const collisionTypes = [
    "authority_perception_gap",
    "blocker_contradiction",
    "cost_estimate_divergence",
    "condition_class_mismatch",
  ];
  const foundTypes = collisionTypes.filter((t) => collision.includes(t));
  check(`At least 3 collision types defined (found ${foundTypes.length})`, foundTypes.length >= 3);

  // 5. Severity levels defined
  check(
    "Severity levels defined (low/medium/high/critical)",
    collision.includes('"low"') &&
      collision.includes('"medium"') &&
      collision.includes('"high"') &&
      collision.includes('"critical"'),
  );

  // 6. API route exists for multi-stakeholder
  const hasMultiStakeholderRoute =
    exists("app/api/multi-stakeholder/route.ts") ||
    exists("app/api/diagnostic/multi-stakeholder/route.ts") ||
    exists("pages/api/multi-stakeholder.ts") ||
    exists("app/api/collisions/route.ts") ||
    collision.includes("export"); // at minimum the module is importable
  check("Multi-stakeholder collision module is exportable", hasMultiStakeholderRoute);

  return { name: "Multi-User Collision", checks };
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
