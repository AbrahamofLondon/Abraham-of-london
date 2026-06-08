#!/usr/bin/env node
/**
 * scripts/audit-product-surface-commercial-truth.mjs
 *
 * P2 — 48-Surface Full Estate Reconciliation
 *
 * Joins PRODUCT_SURFACE_REGISTRY × CATALOG × resolver to audit all 48
 * product surfaces for commercial truth. Outputs PASS / WARN / FAIL per surface.
 *
 * Run: npx tsx scripts/audit-product-surface-commercial-truth.mjs
 */

// ─── Imports via tsx ──────────────────────────────────────────────────────────

const { PRODUCT_SURFACE_REGISTRY } = await import("../lib/product/product-surface-registry.ts");
const { CATALOG } = await import("../lib/commercial/catalog.ts");
const { resolveProductAccessLink } = await import("../lib/product/product-access-link-resolver.ts");

import { existsSync } from "fs";
import { resolve } from "path";

// ─── Route existence check ────────────────────────────────────────────────────

const ROOT = process.cwd();

function routeExists(route) {
  if (!route) return null;
  const seg = route.split("?")[0]; // strip query params
  const candidates = [
    `pages${seg}.tsx`,
    `pages${seg}.ts`,
    `pages${seg}/index.tsx`,
    `pages${seg}/index.ts`,
    `app${seg}/page.tsx`,
    `app${seg}/page.ts`,
  ];
  const parts = seg.split("/").filter(Boolean);
  if (parts.length >= 1) {
    const parent = parts.slice(0, -1).join("/");
    candidates.push(
      `pages/${parent}/[slug].tsx`,
      `pages/${parent}/[...slug].tsx`,
      `pages/${parent}/[id].tsx`,
      `pages/${parent}/[caseId].tsx`,
    );
  }
  return candidates.some((c) => existsSync(resolve(ROOT, c)));
}

// ─── Surfaces that are intentionally infrastructure / sub-surfaces ─────────────
// These have no commercial catalog entry by design — they are consoles,
// dashboards, fulfilment layers, or content surfaces that don't sell anything.
// PASS automatically unless they have acceptsPayment=true without a catalog entry.

const INFRA_SURFACES = new Set([
  // ── Post-checkout / informational UX ──────────────────────────────────────
  "boardroom_brief_sample",             // informational sample — not a product
  "boardroom_brief_confirmation",       // post-checkout UX
  "strategy_room_session",              // session within strategy_room product
  // ── Free entry diagnostics (no payment, no catalog entry needed) ───────────
  "decision_pressure_signal",           // free diagnostic — catalogProductCode references aspirational code
  "quick_decision_health_check",        // free diagnostic — no catalog entry
  "scenario_stress_test",              // gated free diagnostic — no catalog entry
  // ── Auth consoles / index pages ───────────────────────────────────────────
  "decision_instruments_directory",     // index page — no checkout
  "decision_instruments_my_instruments", // auth console — no checkout
  // ── GMI sub-surfaces (auth dashboards — product is gmi_q2_2026) ─────────
  "gmi_operator_dashboard",            // authenticated GMI dashboard
  "gmi_call_ledger",                   // authenticated GMI call ledger
  "gmi_performance",                   // GMI performance view
  "gmi_falsification",                 // GMI falsification view
  "gmi_board_pulse",                   // GMI board pulse view
  "gmi_board_pack",                    // fulfilment layer
  // ── Continuity / case consoles ────────────────────────────────────────────
  "continuity_console",                // auth console
  "decision_centre",                   // auth console
  "return_brief",                      // fulfilment layer (professional entitlement)
  // ── Advisory / oversight ─────────────────────────────────────────────────
  "oversight_portfolio",               // advisory console (retainer entitlement)
  "retainer_review_queue",             // routes to retainer intake — no catalog entry needed
  "retainer_oversight",                // dormant retainer surface
  // ── Access request surface ────────────────────────────────────────────────
  "professionals_access",              // non-paying access request surface
  // ── Infrastructure layers ────────────────────────────────────────────────
  "evidence_memory_layer",             // infrastructure layer
  "authority_lens",                    // infrastructure layer (enterprise-decision-authority)
  "inner_circle_operating_layer",      // dormant / retired
  // ── Knowledge / content surfaces ─────────────────────────────────────────
  "published_briefs",                  // knowledge surface — no checkout
  "vault",                             // knowledge / proof surface
  "editorials",                        // editorial content
]);

// ─── GMI catalog code mapping ─────────────────────────────────────────────────
// Surface registry now uses gmi_q2_2026 directly. No legacy remap needed.

const LEGACY_CATALOG_CODE_MAP = {};

// ─── Audit ────────────────────────────────────────────────────────────────────

const results = [];

for (const surface of PRODUCT_SURFACE_REGISTRY) {
  const {
    surfaceId,
    displayName,
    family,
    route,
    catalogProductCode: rawCatalogCode,
    currentExposureStatus,
    acceptsPayment,
    requiresAuth,
    entitlementSlug: surfaceEntitlement,
    stripePriceId: surfaceStripePriceId,
    primaryCTA,
  } = surface;

  // Resolve legacy catalog codes
  const catalogProductCode = rawCatalogCode ? (LEGACY_CATALOG_CODE_MAP[rawCatalogCode] ?? rawCatalogCode) : null;
  const catalogEntry = catalogProductCode ? CATALOG[catalogProductCode] : undefined;
  const catalogEntryExists = !!catalogEntry;

  const isInfraSurface = INFRA_SURFACES.has(surfaceId);

  // ── Commercial status ──────────────────────────────────────────────────────

  const commercialStatus = catalogEntry?.commercialStatus ?? null;
  const requiresCheckout = catalogEntry?.requiresCheckout ?? false;
  const stripeProductId = catalogEntry?.stripeProductId ?? null;
  const stripePriceIdResolved =
    surfaceStripePriceId === "catalog"
      ? (catalogEntry?.stripePriceId ?? null)
      : (catalogEntry?.stripePriceId ?? surfaceStripePriceId);

  // ── Access mode resolution ─────────────────────────────────────────────────

  let accessMode = "unknown";
  let resolvedHref = null;
  let resolvedLabel = null;

  if (catalogEntry) {
    try {
      const link = resolveProductAccessLink(catalogProductCode);
      accessMode = link.accessMode;
      resolvedHref = link.href;
      resolvedLabel = link.label;
    } catch (_) {
      accessMode = "resolver_error";
    }
  } else {
    const expMap = {
      public_active: "free_public",
      public_limited: "free_public",
      controlled_access: "manual_billing",
      evidence_gated: "evidence_gated",
      review_gated: "evidence_gated",
      admin_only: "admin_only",
      dormant: "dormant",
      hidden: "dormant",
      retired: "dormant",
    };
    accessMode = expMap[currentExposureStatus] ?? "unknown";
    resolvedHref = route;
    resolvedLabel = primaryCTA;
  }

  // ── Route existence ────────────────────────────────────────────────────────

  const routeExistsResult = routeExists(route);
  const hrefExistsResult = resolvedHref ? routeExists(resolvedHref) : null;

  // ── FAIL / WARN checks ─────────────────────────────────────────────────────

  const fails = [];
  const warns = [];

  // F1: acceptsPayment=true without catalog entry (infra surfaces explicitly excluded)
  if (acceptsPayment && !catalogEntryExists && !isInfraSurface) {
    fails.push("acceptsPayment=true but no catalog entry — commercial path undefined");
  }

  // F2: paid_checkout without Stripe IDs
  if (acceptsPayment && catalogEntryExists && requiresCheckout) {
    if (!stripeProductId) fails.push("paid_checkout: stripeProductId is null");
    if (!stripePriceIdResolved) fails.push("paid_checkout: stripePriceId is null");
  }

  // F3: evidence_gated or manual_billing with requiresCheckout=true (contradiction)
  if (catalogEntry?.requiresCheckout && ["evidence_gated", "manual_billing", "contracted"].includes(commercialStatus)) {
    fails.push(`${commercialStatus} + requiresCheckout=true — contradiction`);
  }

  // F4: dormant surface with acceptsPayment
  if (
    (currentExposureStatus === "dormant" || currentExposureStatus === "retired") &&
    acceptsPayment
  ) {
    fails.push("dormant/retired surface has acceptsPayment=true");
  }

  // F5: admin_only with acceptsPayment
  if (currentExposureStatus === "admin_only" && acceptsPayment) {
    fails.push("admin_only surface has acceptsPayment=true");
  }

  // F6: non-dormant, non-admin, non-infra surface with missing route
  if (
    route &&
    routeExistsResult === false &&
    !["admin_only", "dormant", "retired", "hidden"].includes(currentExposureStatus) &&
    !isInfraSurface
  ) {
    fails.push(`route "${route}" does not exist — page required`);
  }

  // F7: dead resolved href (not applicable to surfaces without resolvedHref)
  if (resolvedHref !== null && (resolvedHref === "#" || resolvedHref === "")) {
    fails.push('resolver returned dead href="#" or empty');
  }

  // ── WARN checks ────────────────────────────────────────────────────────────

  // W1: infra/surface-only with no catalog entry — intentional
  if (!catalogEntryExists && isInfraSurface) {
    warns.push("surface_only: no catalog entry — intentionally informational/infra (PASS)");
  }

  // W2: archived/hidden product has Stripe price
  if (catalogEntry?.hiddenFromPricing && stripePriceIdResolved) {
    warns.push("archived product has Stripe price but hidden from pricing (acceptable)");
  }

  // W3: route requires auth — correctly redirects
  if (requiresAuth && !acceptsPayment) {
    warns.push("route requires auth — redirects on access (expected)");
  }

  // W4: no catalog entry, not in INFRA set, not accepting payment — may need review
  if (!catalogEntryExists && !isInfraSurface && !acceptsPayment) {
    warns.push("no catalog entry and not declared infra — verify commercial intent");
  }

  // W5: legacy catalog code remapped
  if (rawCatalogCode && LEGACY_CATALOG_CODE_MAP[rawCatalogCode]) {
    warns.push(`legacy catalogProductCode "${rawCatalogCode}" remapped to "${LEGACY_CATALOG_CODE_MAP[rawCatalogCode]}"`);
  }

  // ── Grade ─────────────────────────────────────────────────────────────────

  const grade = fails.length > 0 ? "FAIL" : warns.some(w => !w.includes("PASS") && !w.includes("acceptable") && !w.includes("expected")) ? "WARN" : "PASS";

  results.push({
    surfaceId,
    displayName,
    family,
    route: route ?? "(none)",
    routeExists: routeExistsResult === null ? "N/A" : routeExistsResult ? "✓" : "✗",
    catalogCode: catalogProductCode ?? rawCatalogCode ?? "(none)",
    catalogEntryExists: catalogEntryExists ? "✓" : "✗",
    commercialStatus: commercialStatus ?? "(none)",
    accessMode,
    acceptsPayment: acceptsPayment ? "✓" : "✗",
    requiresCheckout: requiresCheckout ? "✓" : "✗",
    stripeProductId: stripeProductId ? "✓" : "✗",
    stripePriceId: stripePriceIdResolved ? "✓" : "✗",
    entitlementSlug: (catalogEntry?.entitlementSlug || surfaceEntitlement) ? "✓" : "✗",
    ctaLabel: resolvedLabel ?? primaryCTA ?? "(none)",
    ctaHref: resolvedHref ?? "(none)",
    hrefExists: hrefExistsResult === null ? "N/A" : hrefExistsResult ? "✓" : "✗",
    exposure: currentExposureStatus,
    grade,
    fails,
    warns,
  });
}

// ─── Output ───────────────────────────────────────────────────────────────────

const PASS_COUNT = results.filter((r) => r.grade === "PASS").length;
const WARN_COUNT = results.filter((r) => r.grade === "WARN").length;
const FAIL_COUNT = results.filter((r) => r.grade === "FAIL").length;
const TOTAL = results.length;

const pad = (s, n) => String(s ?? "").slice(0, n).padEnd(n);

console.log("");
console.log("─── P2: 48-Surface Full Estate Commercial Truth Audit ──────────────────────");
console.log("");
console.log(`  ${"surfaceId".padEnd(38)} ${"catalogCode".padEnd(28)} ${"mode".padEnd(17)} ${"pay".padEnd(4)} ${"stripe".padEnd(7)} ${"route".padEnd(5)} grade`);
console.log("  " + "─".repeat(115));

for (const r of results) {
  const stripeStr =
    r.stripeProductId === "✓" && r.stripePriceId === "✓" ? "✓/✓" :
    r.stripeProductId === "✓" ? "✓/✗" :
    r.stripePriceId === "✓" ? "✗/✓" : "✗/✗";
  const icon = r.grade === "FAIL" ? "✗" : r.grade === "WARN" ? "⚠" : "✓";
  console.log(
    `  ${icon} ${pad(r.surfaceId, 36)} ${pad(r.catalogCode, 28)} ${pad(r.accessMode, 17)} ${pad(r.acceptsPayment, 4)} ${pad(stripeStr, 7)} ${pad(r.routeExists, 5)} ${r.grade}`
  );
}

console.log("");

const failures = results.filter((r) => r.fails.length > 0);
const warnings = results.filter((r) => r.grade === "WARN");

if (failures.length > 0) {
  console.log("─── FAIL Details ────────────────────────────────────────────────────────────");
  for (const r of failures) {
    console.log(`\n  [${r.surfaceId}] ${r.route}`);
    for (const f of r.fails) console.log(`      → FAIL: ${f}`);
  }
  console.log("");
}

if (warnings.length > 0) {
  console.log("─── WARN Details (owner action required) ────────────────────────────────────");
  for (const r of warnings) {
    const notable = r.warns.filter(w =>
      !w.includes("intentionally informational") &&
      !w.includes("acceptable") &&
      !w.includes("expected")
    );
    if (notable.length === 0) continue;
    console.log(`\n  [${r.surfaceId}] ${r.route}`);
    for (const w of notable) console.log(`      → WARN: ${w}`);
  }
  console.log("");
}

console.log("═".repeat(70));
console.log(`  Results: ${PASS_COUNT} PASS  ${WARN_COUNT} WARN  ${FAIL_COUNT} FAIL  (${TOTAL}/${TOTAL} surfaces audited)`);
console.log("═".repeat(70));
console.log("");

if (FAIL_COUNT === 0) {
  console.log("  All 48 product surfaces pass commercial truth rules.");
} else {
  console.log(`  ${FAIL_COUNT} surface(s) require remediation.`);
  process.exit(1);
}
console.log("");
