/**
 * scripts/gtm/chain-report.ts
 *
 * PR D1 — Production-derived GTM chain report.
 *
 * Generates one row per local commercial product with:
 *   - canonical product code
 *   - static or dynamic origin
 *   - governance known/unknown
 *   - governance release state
 *   - resolver action
 *   - public surface
 *   - Stripe binding completeness
 *   - reconciliation primary outcome
 *   - anomaly flags
 *   - checkout eligibility
 *   - purchasable true/false
 *   - fulfilment registration status
 *   - output validation status
 *   - delivery proof status
 *   - final evidence status
 *
 * Run: npx tsx scripts/gtm/chain-report.ts
 * Output: reports/gtm/gtm-chain-report.json
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolveCommercialAction } from "../../lib/commercial/commercial-action-resolver";
import { CATALOG, getAllProducts } from "../../lib/commercial/catalog";
import { reconcile } from "../../lib/commercial/stripe/stripe-reconciliation";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "reports", "gtm");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── Load governance state ──────────────────────────────────────────────────
const readinessPath = join(ROOT, "reports", "product-release-readiness-matrix.json");
const governancePath = join(ROOT, "reports", "product-release-governance-matrix.json");

function loadGovernanceState(code: string) {
  let readiness: Record<string, any> = {}, governance: Record<string, any> = {};
  try { readiness = JSON.parse(readFileSync(readinessPath, "utf8")); } catch {}
  try { governance = JSON.parse(readFileSync(governancePath, "utf8")); } catch {}
  const r = readiness[code] || null;
  const g = governance[code] || null;
  const b = (v: any) => (typeof v === "boolean" ? v : null);
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

// ── Load Stripe snapshot ───────────────────────────────────────────────────
const snapshotPath = join(ROOT, "reports/gtm/stripe-catalog-snapshot.json");
const snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));

// ── Build locals ───────────────────────────────────────────────────────────
const locals = getAllProducts().map((p) => ({
  code: p.code,
  name: p.displayName,
  amount: p.amount,
  currency: "gbp" as const,
  stripeProductId: p.stripeProductId,
  stripePriceId: p.stripePriceId,
  active: p.active,
  commercialStatus: p.commercialStatus || "paid",
  recurringInterval: p.duration === "monthly" ? "month" as const : p.duration === "annual" ? "year" as const : null,
}));

// ── Run reconciliation ────────────────────────────────────────────────────
const results = reconcile(snapshot, locals);
const localResults = results.filter((r) => r.code !== null);

// ── Build chain report ─────────────────────────────────────────────────────
const chainRows = localResults.map((r) => {
  const product = CATALOG[r.code!];
  const governance = loadGovernanceState(r.code!);
  const action = product ? resolveCommercialAction(product, governance) : null;

  // Determine origin
  const isDynamic = r.code!.startsWith("gmi_q") && r.code !== "gmi_quarterly";

  // Determine fulfilment registration status
  let fulfilmentStatus: string;
  if (!product || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    fulfilmentStatus = "NOT_APPLICABLE";
  } else if (product.commercialStatus === "free_controlled" || product.commercialStatus === "evidence_gated") {
    fulfilmentStatus = "NOT_IMPLEMENTED";
  } else if (product.commercialStatus === "manual_billing") {
    fulfilmentStatus = "MANUAL_ONLY";
  } else if (product.commercialStatus === "contracted") {
    fulfilmentStatus = "MANUAL_ONLY";
  } else if (product.commercialStatus === "paid" && product.requiresCheckout) {
    fulfilmentStatus = "IMPLEMENTED_NOT_WIRED";
  } else {
    fulfilmentStatus = "NOT_IMPLEMENTED";
  }

  // Determine output validation status
  let outputValidationStatus: string;
  if (!product || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    outputValidationStatus = "NOT_APPLICABLE";
  } else if (product.commercialStatus === "free_controlled") {
    outputValidationStatus = "PROVEN_CONTROLLED_LIVE";
  } else if (product.commercialStatus === "manual_billing" || product.commercialStatus === "contracted") {
    outputValidationStatus = "WIRED_NOT_PROVEN";
  } else if (product.commercialStatus === "paid") {
    outputValidationStatus = "BLOCKED_GOVERNANCE";
  } else {
    outputValidationStatus = "NOT_IMPLEMENTED";
  }

  // Determine delivery proof status
  let deliveryProofStatus: string;
  if (!product || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    deliveryProofStatus = "NOT_APPLICABLE";
  } else if (product.commercialStatus === "free_controlled") {
    deliveryProofStatus = "PROVEN_CONTROLLED_LIVE";
  } else {
    deliveryProofStatus = "NOT_IMPLEMENTED";
  }

  // Determine final evidence status
  let evidenceStatus: string;
  if (!product) {
    evidenceStatus = "NOT_APPLICABLE";
  } else if (product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    evidenceStatus = "ARCHIVED";
  } else if (governance.known && governance.releaseReadyNow) {
    evidenceStatus = "PROVEN_CONTROLLED_LIVE";
  } else if (governance.known) {
    evidenceStatus = "WIRED_NOT_PROVEN";
  } else {
    evidenceStatus = "BLOCKED_GOVERNANCE";
  }

  return {
    code: r.code,
    displayName: product?.displayName || r.code,
    origin: isDynamic ? "dynamic" : "static",
    governanceKnown: governance.known,
    governanceReleaseState: governance.releaseMode || governance.readinessStatus || "unknown",
    resolverAction: action?.state || "unknown",
    resolverPurchasable: action?.purchasable ?? false,
    publicSurface: action?.state === "blocked" ? "hidden_by_governance" : "visible",
    stripeProductBinding: r.remoteProductId || "none",
    stripePriceBinding: r.remotePriceId || "none",
    stripeBindingComplete: Boolean(r.remoteProductId && r.remotePriceId),
    reconciliationPrimaryOutcome: r.primaryOutcome,
    reconciliationAnomalyFlags: r.anomalyFlags,
    checkoutEligible: action?.state === "checkout",
    purchasable: action?.purchasable ?? false,
    fulfilmentStatus,
    outputValidationStatus,
    deliveryProofStatus,
    evidenceStatus,
  };
});

// ── Write report ───────────────────────────────────────────────────────────
const report = {
  generatedAt: new Date().toISOString(),
  snapshotRef: "reports/gtm/stripe-catalog-snapshot.json",
  productCount: chainRows.length,
  remoteProductCount: snapshot.productCount,
  remotePriceCount: snapshot.priceCount,
  products: chainRows,
  summary: {
    byPrimaryOutcome: {} as Record<string, number>,
    byResolverAction: {} as Record<string, number>,
    byFulfilmentStatus: {} as Record<string, number>,
    byEvidenceStatus: {} as Record<string, number>,
    purchasable: chainRows.filter((r) => r.purchasable).length,
    checkoutEligible: chainRows.filter((r) => r.checkoutEligible).length,
    governanceKnown: chainRows.filter((r) => r.governanceKnown).length,
    governanceUnknown: chainRows.filter((r) => !r.governanceKnown).length,
    stripeComplete: chainRows.filter((r) => r.stripeBindingComplete).length,
  },
};

for (const r of chainRows) {
  report.summary.byPrimaryOutcome[r.reconciliationPrimaryOutcome] = (report.summary.byPrimaryOutcome[r.reconciliationPrimaryOutcome] || 0) + 1;
  report.summary.byResolverAction[r.resolverAction] = (report.summary.byResolverAction[r.resolverAction] || 0) + 1;
  report.summary.byFulfilmentStatus[r.fulfilmentStatus] = (report.summary.byFulfilmentStatus[r.fulfilmentStatus] || 0) + 1;
  report.summary.byEvidenceStatus[r.evidenceStatus] = (report.summary.byEvidenceStatus[r.evidenceStatus] || 0) + 1;
}

writeFileSync(join(OUT_DIR, "gtm-chain-report.json"), JSON.stringify(report, null, 2));
console.log(`GTM chain report written: reports/gtm/gtm-chain-report.json`);
console.log(`Products: ${chainRows.length}`);
console.log(`Purchasable: ${report.summary.purchasable}`);
console.log(`Checkout eligible: ${report.summary.checkoutEligible}`);
console.log(`Governance known: ${report.summary.governanceKnown}`);
console.log(`Governance unknown: ${report.summary.governanceUnknown}`);
console.log(`Stripe complete: ${report.summary.stripeComplete}`);
