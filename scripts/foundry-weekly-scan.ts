/**
 * scripts/foundry-weekly-scan.ts
 *
 * Weekly Foundry scan — identifies stale runs, pattern recurrences, and
 * module health issues. Run via: npx tsx scripts/foundry-weekly-scan.ts
 *
 * This script is read-only: it emits a report but does not write to the database.
 * Pipe output to a file or use the findings to populate the trash-day queue manually.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const now = Date.now();
  const ago = (days: number) => new Date(now - days * 86_400_000);

  console.log("\n=== FOUNDRY WEEKLY SCAN ===");
  console.log(`Date: ${new Date().toISOString()}\n`);

  // 1. Unresolved CRITICAL/HIGH runs
  const criticalUnresolved = await prisma.researchRun.findMany({
    where: {
      archivedAt: null,
      severity: { in: ["CRITICAL", "HIGH"] },
      status: { notIn: ["IMPLEMENTED", "ARCHIVED"] },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "asc" }],
    select: { id: true, title: true, severity: true, status: true, module: true, createdAt: true },
  });

  console.log(`--- CRITICAL/HIGH Unresolved (${criticalUnresolved.length}) ---`);
  for (const r of criticalUnresolved) {
    const ageDays = Math.floor((now - r.createdAt.getTime()) / 86_400_000);
    console.log(`  [${r.severity}] ${r.title} (${r.status}) — ${ageDays}d old — ${r.id}`);
  }

  // 2. Stale ACTION_REQUIRED (>30 days)
  const staleAction = await prisma.researchRun.findMany({
    where: { status: "ACTION_REQUIRED", createdAt: { lte: ago(30) }, archivedAt: null },
    select: { id: true, title: true, severity: true, createdAt: true, module: true },
  });

  console.log(`\n--- Stale ACTION_REQUIRED >30 days (${staleAction.length}) ---`);
  for (const r of staleAction) {
    const ageDays = Math.floor((now - r.createdAt.getTime()) / 86_400_000);
    console.log(`  [${r.severity}] ${r.title} — ${ageDays}d — module: ${r.module}`);
  }

  // 3. DEFERRED without reason
  const weakDeferrals = await prisma.researchRun.findMany({
    where: {
      status: "DEFERRED",
      archivedAt: null,
      OR: [{ deferredReason: null }, { deferredReason: "" }],
    },
    select: { id: true, title: true, severity: true, module: true },
  });

  console.log(`\n--- DEFERRED Without Reason (${weakDeferrals.length}) ---`);
  for (const r of weakDeferrals) {
    console.log(`  [${r.severity}] ${r.title} — ${r.id}`);
  }

  // 4. Runs with no findings (possible incomplete captures)
  const noFindings = await prisma.researchRun.findMany({
    where: {
      archivedAt: null,
      status: { in: ["COMPLETE", "RECORDED", "ACTION_REQUIRED"] },
      OR: [{ findingsJson: null }, { findingsJson: "" }, { findingsJson: "[]" }],
    },
    select: { id: true, title: true, status: true, module: true },
  });

  console.log(`\n--- Active Runs With No Findings (${noFindings.length}) ---`);
  for (const r of noFindings) {
    console.log(`  [${r.status}] ${r.title} — module: ${r.module}`);
  }

  // 5. Module recurrence: modules with 3+ unresolved runs
  const moduleGroups = await prisma.researchRun.groupBy({
    by: ["module"],
    where: { archivedAt: null, status: { notIn: ["IMPLEMENTED", "ARCHIVED"] } },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
    orderBy: { _count: { id: "desc" } },
  });

  console.log(`\n--- Modules with 3+ Unresolved Runs (${moduleGroups.length}) ---`);
  for (const g of moduleGroups) {
    console.log(`  ${g.module}: ${g._count.id} unresolved`);
  }

  // 6. Summary
  const total = await prisma.researchRun.count({ where: { archivedAt: null } });
  console.log(`\n--- Summary ---`);
  console.log(`  Total active runs: ${total}`);
  console.log(`  Critical/High unresolved: ${criticalUnresolved.length}`);
  console.log(`  Stale action required: ${staleAction.length}`);
  console.log(`  Weak deferrals: ${weakDeferrals.length}`);
  console.log(`  Missing findings: ${noFindings.length}`);
  console.log(`  Recurrent modules: ${moduleGroups.length}`);
  console.log(`\n=== SCAN COMPLETE ===\n`);

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error("Scan failed:", e);
  process.exit(1);
});
