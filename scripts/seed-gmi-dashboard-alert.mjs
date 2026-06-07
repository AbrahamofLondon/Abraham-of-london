/**
 * GMI Dashboard Alert Rule Seed
 * ───────────────────────────────
 * Creates the first real alert rule: edition_published for GMI-Q2-2026.
 * deliveryMode: dashboard_only (no email risk).
 * status: active.
 *
 * Usage:
 *   node scripts/seed-gmi-dashboard-alert.mjs [--write]
 */

import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const args = new Set(process.argv.slice(2));
const WRITE_MODE = args.has("--write");
const EDITION_ID = "GMI-Q2-2026";

if (process.env.NODE_ENV === "production" && !args.has("--confirm-production-seed")) {
  console.error("Refusing production alert seed without --confirm-production-seed.");
  process.exit(1);
}

const prisma = WRITE_MODE ? new PrismaClient() : null;

function log(msg) { console.log(`[ALERT-SEED] ${msg}`); }

const ALERT_RULE = {
  id: `alert_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
  editionId: EDITION_ID,
  linkedCallId: null,
  linkedFalsificationRuleId: null,
  alertType: "edition_published",
  triggerCondition: `GMI edition ${EDITION_ID} has been published and is publicly accessible`,
  severity: "medium",
  status: "active",
  deliveryMode: "dashboard_only",
};

async function run() {
  log(`Alert rule: ${ALERT_RULE.alertType}`);
  log(`  editionId:    ${ALERT_RULE.editionId}`);
  log(`  deliveryMode: ${ALERT_RULE.deliveryMode}`);
  log(`  status:       ${ALERT_RULE.status}`);
  log(`  severity:     ${ALERT_RULE.severity}`);
  log(`  Mode: ${WRITE_MODE ? "WRITE" : "DRY-RUN"}`);

  if (WRITE_MODE && prisma) {
    const existing = await prisma.gmiAlertRule.findFirst({
      where: { editionId: EDITION_ID, alertType: "edition_published" },
    });

    if (existing) {
      log(`  Alert rule already exists (id: ${existing.id}) — skipping`);
    } else {
      const created = await prisma.gmiAlertRule.create({ data: ALERT_RULE });
      log(`  Created alert rule: ${created.id}`);
    }
  } else {
    log("  DRY-RUN: no writes performed");
  }

  if (prisma) await prisma.$disconnect();
}

run().catch((err) => {
  console.error("[ALERT-SEED] Fatal:", err);
  process.exit(1);
});
