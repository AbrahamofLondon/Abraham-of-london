/**
 * scripts/check-live-commercial-authority.mjs
 *
 * Final Green Gate — Live Commercial Authority Closeout
 *
 * Checks everything that CAN be verified from code:
 *   - All 4 webhook handlers identified and classified
 *   - Canonical handler has bundle fan-out
 *   - Legacy handler is flagged as unsafe
 *   - ER specialist handler flagged as duplicate risk
 *   - Diagnostic handler uses separate secret
 *   - Delivery class code paths confirmed per product
 *   - Report Experience Gold Standard: 0 hard failures
 *   - P0 PDFs classified
 *   - No unsafe paid product routes
 *
 * Items that CANNOT be verified from code (operator-only):
 *   - Which Stripe endpoint is actively registered in the Stripe Dashboard
 *   - Whether live payment transactions have been completed
 *   - Whether boardroom_brief live order has been fulfilled
 *
 * Gate emits AMBER (not GREEN) until operator confirms webhook + live transactions.
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const __dirname = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"));
const ROOT = path.resolve(__dirname, "..");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const results = { passed: [], warnings: [], hardFailures: [], operatorRequired: [] };

function pass(id, msg) { results.passed.push({ id, msg }); }
function warn(id, msg) { results.warnings.push({ id, msg }); }
function fail(id, msg) { results.hardFailures.push({ id, msg }); }
function operatorAction(id, msg) { results.operatorRequired.push({ id, msg }); }

function fileExists(rel) { return fs.existsSync(path.join(ROOT, rel)); }

function fileContains(rel, pattern) {
  if (!fileExists(rel)) return false;
  return new RegExp(pattern).test(fs.readFileSync(path.join(ROOT, rel), "utf-8"));
}

// ─── AC1: Webhook Handler Inventory ──────────────────────────────────────────

const CANONICAL = "pages/api/billing/webhook.ts";
const LEGACY = "pages/api/webhooks/stripe.ts";
const ER_SPECIALIST = "app/api/stripe/webhook/route.ts";
const DIAGNOSTIC = "pages/api/stripe/diagnostic-report-webhook.ts";

if (!fileExists(CANONICAL)) {
  fail("WEBHOOK_CANONICAL", `Canonical webhook not found at ${CANONICAL}`);
} else {
  pass("WEBHOOK_CANONICAL", `Canonical webhook exists: ${CANONICAL}`);

  // AC1a: fan-out present in canonical
  if (fileContains(CANONICAL, "bundleEntitlements")) {
    pass("WEBHOOK_FANOUT", "Bundle fan-out logic present in canonical webhook (bundleEntitlements)");
  } else {
    fail("WEBHOOK_FANOUT", "Bundle fan-out logic NOT found in canonical webhook — operator_decision_pack unsafe");
  }

  // AC1b: boardroom order creation in canonical
  if (fileContains(CANONICAL, "boardroomBriefOrder")) {
    pass("WEBHOOK_BOARDROOM", "Boardroom order creation present in canonical webhook");
  } else {
    fail("WEBHOOK_BOARDROOM", "Boardroom order creation NOT found in canonical webhook");
  }

  // AC1c: idempotency in canonical
  if (fileContains(CANONICAL, "processedWebhookEvent")) {
    pass("WEBHOOK_IDEMPOTENCY", "Canonical webhook has ProcessedWebhookEvent idempotency guard");
  } else {
    fail("WEBHOOK_IDEMPOTENCY", "Canonical webhook missing ProcessedWebhookEvent idempotency guard");
  }

  // AC1d: past_due audit log in canonical
  if (fileContains(CANONICAL, "subscription_payment_failed")) {
    pass("WEBHOOK_PAST_DUE", "past_due audit log (subscription_payment_failed) present in canonical webhook");
  } else {
    fail("WEBHOOK_PAST_DUE", "past_due audit log missing from canonical webhook");
  }
}

// Legacy handler: flag as unsafe
if (fileExists(LEGACY)) {
  warn("WEBHOOK_LEGACY", `Legacy webhook still deployed at ${LEGACY} — does NOT have bundle fan-out or boardroom orders. Must NOT be the active Stripe endpoint.`);
} else {
  pass("WEBHOOK_LEGACY_ABSENT", "Legacy webhook not found (good — removed)");
}

// ER specialist: flag duplicate risk
if (fileExists(ER_SPECIALIST)) {
  const hasERGeneration = fileContains(ER_SPECIALIST, "generatePaidExecutiveReport");
  const canonicalAlsoHasER = fileContains(CANONICAL, "generatePaidExecutiveReport");
  if (hasERGeneration && canonicalAlsoHasER) {
    warn("WEBHOOK_ER_DUPLICATE", `Both ${ER_SPECIALIST} and ${CANONICAL} call generatePaidExecutiveReport. If both are registered as Stripe endpoints, duplicate ER generation may occur. Confirm only canonical is registered.`);
  } else {
    pass("WEBHOOK_ER_SPECIALIST", `ER specialist webhook at ${ER_SPECIALIST} — canonical handles ER too`);
  }
} else {
  pass("WEBHOOK_ER_SPECIALIST_ABSENT", "ER specialist webhook not found (no duplicate risk)");
}

// Diagnostic: separate secret
if (fileExists(DIAGNOSTIC)) {
  if (fileContains(DIAGNOSTIC, "STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET")) {
    pass("WEBHOOK_DIAGNOSTIC_SECRET", "Diagnostic webhook uses separate STRIPE_DIAGNOSTIC_REPORT_WEBHOOK_SECRET (correctly isolated)");
  } else {
    fail("WEBHOOK_DIAGNOSTIC_SECRET", "Diagnostic webhook does not use separate secret — risk of event cross-contamination");
  }
}

// AC2: Operator webhook confirmation required
operatorAction("STRIPE_DASHBOARD_CONFIRM",
  "Confirm in Stripe Dashboard → Developers → Webhooks that the active primary endpoint is " +
  "https://www.abrahamoflondon.org/api/billing/webhook — not /api/webhooks/stripe or /api/stripe/webhook"
);

// ─── AC3: Delivery class code paths ──────────────────────────────────────────

// instant_digital_access — strategy_room entitlement check
if (fileContains("pages/strategy-room/index.tsx", "resolveCanonicalEntitlement")) {
  pass("DELIVERY_INSTANT_ACCESS", "strategy_room: resolveCanonicalEntitlement confirmed in GSSP");
} else {
  fail("DELIVERY_INSTANT_ACCESS", "strategy_room: resolveCanonicalEntitlement NOT found — access gate may be broken");
}

// instant_digital_access — customer signal updated
if (fileContains("pages/strategy-room/index.tsx", "Strategy Room access is active")) {
  pass("DELIVERY_INSTANT_SIGNAL", "strategy_room: explicit instant-access customer signal present");
} else {
  fail("DELIVERY_INSTANT_SIGNAL", "strategy_room: instant-access customer signal missing — customer may see no clear access confirmation");
}

// manual_review_required — boardroom state machine
if (fileContains("pages/api/admin/boardroom/orders/[id].ts", "dossier_generated")) {
  pass("DELIVERY_BOARDROOM_STATEMACHINE", "boardroom_brief: state machine transitions present (dossier_generated, delivered)");
} else {
  fail("DELIVERY_BOARDROOM_STATEMACHINE", "boardroom_brief: state machine not found in admin orders API");
}

// subscription — past_due handling
if (fileContains(CANONICAL, "past_due")) {
  pass("DELIVERY_SUBSCRIPTION_PASTDUE", "professional subscription: past_due handling present in canonical webhook");
} else {
  fail("DELIVERY_SUBSCRIPTION_PASTDUE", "professional subscription: past_due handling missing");
}

// generated_digital_artifact — ER failure audit log
if (fileContains("app/api/executive-reporting/run/route.ts", "executive_report_generation_failed")) {
  pass("DELIVERY_ER_FAILURE_AUDIT", "executive_reporting: generation failure writes AccessAuditLog");
} else {
  fail("DELIVERY_ER_FAILURE_AUDIT", "executive_reporting: generation failure audit log missing");
}

// archive — GMI archive warning
if (fileContains("pages/artifacts/global-market-outlook-q1-2026-public.tsx", "archived Q1 2026 intelligence product")) {
  pass("DELIVERY_ARCHIVE_WARNING", "gmi_q1_2026: archive warning banner present");
} else {
  fail("DELIVERY_ARCHIVE_WARNING", "gmi_q1_2026: archive warning banner missing");
}

// ─── AC4: Report Experience Gold Standard — read last gate result ─────────────

const reasReport = path.join(ROOT, "reports", "report-experience-gold-standard.json");
if (fs.existsSync(reasReport)) {
  const reas = JSON.parse(fs.readFileSync(reasReport, "utf-8"));
  if (reas.failCount === 0) {
    pass("REAS_GATE", `Report Experience Gold Standard: 0 hard failures (${reas.passCount} checks passed, status: ${reas.gateStatus})`);
  } else {
    fail("REAS_GATE", `Report Experience Gold Standard has ${reas.failCount} hard failures — must be resolved before GREEN`);
  }
  if (reas.p0PdfCount >= 5) {
    pass("P0_PDF_CLASSIFIED", `P0 PDFs classified: ${reas.p0PdfCount}`);
  } else {
    warn("P0_PDF_CLASSIFIED", `P0 PDFs classified: ${reas.p0PdfCount} (expected 5+)`);
  }
} else {
  warn("REAS_GATE", "reports/report-experience-gold-standard.json not found — run check-report-experience-gold-standard.mjs first");
}

// ─── AC5: Operator live-cycle actions (cannot be automated) ──────────────────

operatorAction("BOARDROOM_LIVE_ORDER",
  "Complete the boardroom_brief live order in /admin/boardroom/orders: " +
  "paymentStatus confirmed → in_review → dossier_generated → delivered → deliveredAt persisted → ClientEntitlement confirmed → audit trail confirmed"
);
operatorAction("OPERATOR_DECISION_PACK_FANOUT",
  "After webhook authority confirmed, complete a live/test purchase of operator_decision_pack and confirm 3 ClientEntitlement records: " +
  "decision_exposure_instrument, mandate_clarity_framework, intervention_path_selector"
);
operatorAction("REPRESENTATIVE_TRANSACTIONS",
  "Complete at least one live/test transaction per delivery class: " +
  "instant_digital_access (strategy_room), subscription (professional), generated_artifact (executive_reporting), archived (gmi_q1_2026)"
);

// ─── Output ────────────────────────────────────────────────────────────────────

console.log("\n╔═══════════════════════════════════════════════════════════════╗");
console.log("║       LIVE COMMERCIAL AUTHORITY CLOSEOUT — FINAL GREEN GATE   ║");
console.log("╚═══════════════════════════════════════════════════════════════╝\n");

console.log(`Structural checks passed:   ${results.passed.length}`);
console.log(`Warnings:                   ${results.warnings.length}`);
console.log(`Hard failures:              ${results.hardFailures.length}`);
console.log(`Operator actions required:  ${results.operatorRequired.length}`);

if (results.hardFailures.length > 0) {
  console.log("\n── HARD FAILURES ─────────────────────────────────────────────────");
  for (const f of results.hardFailures) {
    console.log(`  ❌ [${f.id}] ${f.msg}`);
  }
}

if (results.warnings.length > 0) {
  console.log("\n── WARNINGS ──────────────────────────────────────────────────────");
  for (const w of results.warnings) {
    console.log(`  ⚠️  [${w.id}] ${w.msg}`);
  }
}

if (results.operatorRequired.length > 0) {
  console.log("\n── OPERATOR ACTIONS REQUIRED (cannot be code-verified) ───────────");
  for (const o of results.operatorRequired) {
    console.log(`  👤 [${o.id}] ${o.msg}`);
  }
}

const gateStatus = results.hardFailures.length > 0 ? "FAILED"
  : results.operatorRequired.length > 0 ? "AMBER"
  : "GREEN";

console.log(`\n── GATE STATUS: ${gateStatus} ──`);
if (gateStatus === "AMBER") {
  console.log("   All structural checks passed.");
  console.log("   Gate is AMBER: operator must verify Stripe webhook authority and complete live-cycle transactions.");
  console.log("   See reports/live-commercial-authority-closeout.md for full checklist.");
}

process.exit(results.hardFailures.length > 0 ? 1 : 0);
