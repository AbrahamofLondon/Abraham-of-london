#!/usr/bin/env node
/**
 * scripts/_truth-table.mjs
 *
 * Emit the commercial resolver truth table for owner review.
 * Uses production modules directly via tsx import.
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Production module imports via tsx ──────────────────────────────────────
let resolverModule, catalogModule;
try {
  resolverModule = await import("../lib/commercial/commercial-action-resolver.ts");
  catalogModule = await import("../lib/commercial/catalog.ts");
} catch (e) {
  console.error("FATAL: Cannot import production modules. Ensure tsx is available.");
  console.error(e.message);
  process.exit(2);
}

const { resolveCommercialAction } = resolverModule;
const { CATALOG, getProduct } = catalogModule;

// ── Governance state loader ────────────────────────────────────────────────
const readinessPath = join(ROOT, "reports", "product-release-readiness-matrix.json");
const governancePath = join(ROOT, "reports", "product-release-governance-matrix.json");

function loadGovernanceState(code) {
  let readiness = {}, governance = {};
  try { readiness = JSON.parse(readFileSync(readinessPath, "utf8")); } catch {}
  try { governance = JSON.parse(readFileSync(governancePath, "utf8")); } catch {}
  const r = readiness[code] || null;
  const g = governance[code] || null;
  const b = (v) => (typeof v === "boolean" ? v : null);
  return {
    productCode: code,
    known: Boolean(r || g),
    readinessStatus: r?.readinessStatus ?? null,
    releaseReadyNow: r?.releaseReadyNow === true,
    checkoutSafe: b(r?.checkoutSafe),
    commercialSafe: b(r?.commercialSafe),
    releaseLane: r?.releaseLane ?? g?.releaseLane ?? null,
    releaseMode: r?.releaseMode ?? g?.releaseMode ?? null,
    checkoutAllowed: b(g?.checkoutAllowed),
    manualFulfilmentAllowed: b(g?.manualFulfilmentAllowed),
    commercialClaimAllowed: b(g?.commercialClaimAllowed),
  };
}

const PRODUCTS = [
  "boardroom_brief", "executive_reporting", "strategy_room", "professional", "inner_circle",
  "gmi_quarterly", "gmi_q2_2026", "reporting_monthly", "reporting_custom", "fast_diagnostic", "enterprise_assessment",
];

function ctaFor(action) {
  switch (action.state) {
    case "checkout": return "Buy / checkout";
    case "view_free_surface": return "Start free";
    case "manual_fulfilment": return "Request access (enquiry)";
    case "request_access": return "Request access";
    case "contact_sales": return "Contact / enquire";
    case "review_gated": return "Request review";
    case "evidence_gated": return "Evidence-gated";
    case "blocked": return "Not available (no CTA)";
    case "unavailable": return "Unavailable";
    case "archive_reference_only": return "Archive reference";
    default: return "—";
  }
}

const rows = [];
for (const code of PRODUCTS) {
  const product = getProduct(code);
  const g = loadGovernanceState(code);
  if (!product) { rows.push({ code, missing: true }); continue; }
  const action = resolveCommercialAction(product, g);
  const stripe = Boolean(product.stripeProductId && product.stripePriceId);
  rows.push({
    code,
    readinessStatus: g.readinessStatus ?? "—",
    releaseLane: g.releaseLane ?? "—",
    releaseMode: g.releaseMode ?? "—",
    checkoutSafe: g.checkoutSafe,
    commercialSafe: g.commercialSafe,
    commercialStatus: product.commercialStatus ?? "—",
    stripe,
    action: action.state,
    purchasable: action.purchasable,
    cta: ctaFor(action),
  });
}

// Markdown table
const H = ["product", "readiness", "lane", "mode", "checkoutSafe", "commercialSafe", "commercialStatus", "stripe?", "resolver", "checkout?", "serverCheckout?", "pricing/products CTA"];
console.log("| " + H.join(" | ") + " |");
console.log("|" + H.map(() => "---").join("|") + "|");
for (const r of rows) {
  if (r.missing) { console.log(`| ${r.code} | (not in catalog) |`); continue; }
  console.log("| " + [
    r.code, r.readinessStatus, r.releaseLane, r.releaseMode,
    String(r.checkoutSafe), String(r.commercialSafe), r.commercialStatus,
    r.stripe ? "yes" : "no", r.action,
    r.purchasable ? "YES" : "NO", r.purchasable ? "YES" : "NO", r.cta,
  ].join(" | ") + " |");
}