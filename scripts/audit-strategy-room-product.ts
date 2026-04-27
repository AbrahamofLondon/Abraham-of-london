/**
 * Strategy Room Product Audit
 * Run: npx tsx scripts/audit-strategy-room-product.ts
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
function isDir(p: string): boolean {
  const f = path.join(ROOT, p);
  return fs.existsSync(f) && fs.statSync(f).isDirectory();
}
function countFiles(p: string): number {
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || !fs.statSync(f).isDirectory()) return 0;
  return fs.readdirSync(f).filter((n) => n.endsWith(".ts") || n.endsWith(".tsx")).length;
}

type CheckResult = { label: string; pass: boolean };

export async function runAudit(): Promise<{ name: string; checks: CheckResult[] }> {
  const checks: CheckResult[] = [];

  function check(label: string, condition: boolean) {
    checks.push({ label, pass: condition });
  }

  const schema = read("prisma/schema.prisma");

  // 1. StrategyRoomSession model in Prisma schema
  check("StrategyRoomSession model in Prisma schema", schema.includes("model StrategyRoomSession {"));

  // 2. Session state fields (status, route, readinessTier)
  const sessionModel = schema.slice(schema.indexOf("model StrategyRoomSession {"));
  check(
    "Session state fields exist (status, route, readinessTier)",
    sessionModel.includes("status") &&
      sessionModel.includes("route") &&
      sessionModel.includes("readinessTier"),
  );

  // 3. API routes exist: session/init, execution/decisions, execution/state
  check(
    "API route: session/init exists",
    exists("app/api/strategy-room/session/init/route.ts"),
  );
  check(
    "API route: execution/[id]/decisions exists",
    exists("app/api/strategy-room/execution/[id]/decisions/route.ts"),
  );
  check(
    "API route: execution/[id]/state exists",
    exists("app/api/strategy-room/execution/[id]/state/route.ts"),
  );

  // 4. lib/strategy-room/ has real files (>5 files)
  const fileCount = countFiles("lib/strategy-room");
  check(
    `lib/strategy-room/ directory has >5 files (found ${fileCount})`,
    fileCount > 5,
  );

  // 5. Persistence mechanism exists
  check(
    "Persistence mechanism exists (persistence.ts or session-service.ts)",
    exists("lib/strategy-room/persistence.ts") || exists("lib/strategy-room/session-service.ts"),
  );

  // 6. Canonical snapshot exists
  check(
    "Canonical snapshot exists",
    exists("lib/strategy-room/canonical-snapshot.ts"),
  );

  // 7. Conversion tracking exists
  const hasConversion =
    exists("app/api/strategy-room/session/conversion/route.ts") ||
    exists("app/api/strategy-room/conversion/route.ts") ||
    exists("lib/strategy-room/client-trackers.ts");
  check("Conversion tracking exists", hasConversion);

  return { name: "Strategy Room Product", checks };
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
