import type { CatalogProduct } from "@/lib/commercial/catalog";
import { getAllProducts } from "@/lib/commercial/catalog";
import { getProductGoldStandardContract } from "@/lib/product/product-gold-standard-contracts";
import type { ProductGoldReleaseStatus } from "@/lib/product/universal-product-gold-standard";

export type ProductGoldUpgradeFamily =
  | "free_public_signal"
  | "decision_instrument"
  | "strategy_room"
  | "boardroom_premium"
  | "executive_reporting"
  | "diagnostic"
  | "global_market_intelligence"
  | "professional_subscription"
  | "retainer_oversight"
  | "bundle_product"
  | "internal_or_inactive";

export type ProductGoldUpgradeWorkstream =
  | "intake"
  | "analysis_engine"
  | "artefact_composition"
  | "experience_design"
  | "fulfilment_proof"
  | "report_experience"
  | "live_cycle_proof"
  | "webhook_authority"
  | "admin_preview"
  | "customer_access"
  | "pricing_value_proof";

export interface ProductGoldUpgradePlan {
  productCode: string;
  productFamily: ProductGoldUpgradeFamily;
  currentScoreOutOf10: number;
  targetScoreOutOf10: 9.8 | 9.9 | 10;
  currentReleaseStatus: ProductGoldReleaseStatus;
  missingCapabilities: string[];
  requiredUpgradeWorkstreams: ProductGoldUpgradeWorkstream[];
  upgradePriority: "P0" | "P1" | "P2" | "P3";
  owner: "system" | "operator" | "Abraham";
  releaseConditions: string[];
}

export const PRODUCT_FAMILY_COMPOSERS: Record<ProductGoldUpgradeFamily, string[]> = {
  free_public_signal: ["lib/product/free-public-signal-composer.ts"],
  decision_instrument: ["lib/decision-instruments/gold-standard-decision-instrument-composer.ts"],
  strategy_room: ["lib/strategy-room/gold-standard-session-composer.ts"],
  boardroom_premium: [
    "lib/boardroom/boardroom-intake-contract.ts",
    "lib/boardroom/boardroom-brief-composer.ts",
    "lib/boardroom/boardroom-value-readiness.ts",
  ],
  executive_reporting: ["lib/reporting/gold-standard-report-composer.ts"],
  diagnostic: ["lib/reporting/gold-standard-report-composer.ts"],
  global_market_intelligence: ["lib/gmi/gmi-gold-standard-composer.ts"],
  professional_subscription: ["lib/subscriptions/professional-cycle-composer.ts"],
  retainer_oversight: ["lib/subscriptions/professional-cycle-composer.ts"],
  bundle_product: ["lib/products/bundle-guidance-composer.ts"],
  internal_or_inactive: [],
};

export function getAllProductGoldUpgradePlans(): ProductGoldUpgradePlan[] {
  return getAllProducts().map(buildProductGoldUpgradePlan);
}

export function buildProductGoldUpgradePlan(product: CatalogProduct): ProductGoldUpgradePlan {
  const contract = getProductGoldStandardContract(product.code);
  const productFamily = productFamilyFor(product);
  const currentScoreOutOf10 = contract?.scoreOutOf10 ?? 0;
  const currentReleaseStatus = contract?.releaseStatus ?? "blocked_from_release";

  return {
    productCode: product.code,
    productFamily,
    currentScoreOutOf10,
    targetScoreOutOf10: targetScoreFor(productFamily),
    currentReleaseStatus,
    missingCapabilities: missingCapabilitiesFor(productFamily, product, currentScoreOutOf10),
    requiredUpgradeWorkstreams: workstreamsFor(productFamily, product),
    upgradePriority: priorityFor(productFamily, product),
    owner: ownerFor(productFamily),
    releaseConditions: releaseConditionsFor(productFamily, product),
  };
}

export function productFamilyFor(product: CatalogProduct): ProductGoldUpgradeFamily {
  if (!product.active || product.commercialStatus === "inactive" || product.commercialStatus === "retired" || product.commercialStatus === "dormant") {
    return "internal_or_inactive";
  }
  if (product.accessType === "free" || product.commercialStatus === "free_controlled") return "free_public_signal";
  if (product.code === "operator_decision_pack") return "decision_instrument";
  if (product.code === "enterprise") return "retainer_oversight";
  if (product.includes.length > 0 || product.category === "bundle") return "bundle_product";
  if (product.category === "intelligence") return "global_market_intelligence";
  if (product.category === "retainer") return "retainer_oversight";
  if (product.accessType === "subscription" || product.code.includes("professional") || product.code === "additional_collaborator") {
    return "professional_subscription";
  }
  if (product.code.includes("strategy_room")) return "strategy_room";
  if (product.code.includes("boardroom") || product.code.includes("board_brief")) return "boardroom_premium";
  if (product.category === "reporting" || product.category === "reporting_premium") return "executive_reporting";
  if (product.code.startsWith("diagnostic_report")) return "diagnostic";
  return "decision_instrument";
}

function targetScoreFor(productFamily: ProductGoldUpgradeFamily): 9.8 | 9.9 | 10 {
  if (productFamily === "boardroom_premium" || productFamily === "retainer_oversight") return 9.9;
  if (productFamily === "global_market_intelligence") return 9.9;
  if (productFamily === "internal_or_inactive") return 9.8;
  return 9.8;
}

function missingCapabilitiesFor(
  productFamily: ProductGoldUpgradeFamily,
  product: CatalogProduct,
  currentScoreOutOf10: number,
): string[] {
  const missing = [
    "9.8 evidence package",
    "live-cycle proof",
    "gold-standard customer journey proof",
  ];
  if (product.requiresCheckout) missing.push("Stripe/webhook authority");
  if (productFamily !== "free_public_signal" && productFamily !== "internal_or_inactive") missing.push("price-value proof");
  if (productFamily === "free_public_signal") missing.push("time-value proof");
  if (productFamily === "boardroom_premium") missing.push("mandatory boardroom intake and 13-section premium artefact proof");
  if (productFamily === "global_market_intelligence") missing.push("traceable material-call package and archive/current status proof");
  if (productFamily === "bundle_product") missing.push("guided sequence and child entitlement verification");
  if (productFamily === "professional_subscription" || productFamily === "retainer_oversight") missing.push("continuity and compounding memory proof");
  if (currentScoreOutOf10 < 9.8) missing.push("score below 9.8");
  return [...new Set(missing)];
}

function workstreamsFor(
  productFamily: ProductGoldUpgradeFamily,
  product: CatalogProduct,
): ProductGoldUpgradeWorkstream[] {
  const workstreams: ProductGoldUpgradeWorkstream[] = [
    "analysis_engine",
    "artefact_composition",
    "experience_design",
    "fulfilment_proof",
    "live_cycle_proof",
    "customer_access",
  ];
  if (product.requiresCheckout) workstreams.push("webhook_authority", "pricing_value_proof");
  if (requiresIntake(productFamily)) workstreams.push("intake");
  if (requiresReportExperience(productFamily)) workstreams.push("report_experience", "admin_preview");
  return [...new Set(workstreams)];
}

function priorityFor(productFamily: ProductGoldUpgradeFamily, product: CatalogProduct): ProductGoldUpgradePlan["upgradePriority"] {
  if (product.code === "operator_decision_pack") return "P1";
  if (product.code === "enterprise") return "P3";
  if (productFamily === "free_public_signal" || productFamily === "decision_instrument") return "P0";
  if (productFamily === "strategy_room" || productFamily === "executive_reporting") return "P1";
  if (productFamily === "boardroom_premium" || productFamily === "professional_subscription" || productFamily === "retainer_oversight") return "P2";
  if (productFamily === "global_market_intelligence") return "P2";
  if (productFamily === "bundle_product" || productFamily === "internal_or_inactive") return "P3";
  return product.active ? "P1" : "P3";
}

function ownerFor(productFamily: ProductGoldUpgradeFamily): ProductGoldUpgradePlan["owner"] {
  if (productFamily === "boardroom_premium" || productFamily === "global_market_intelligence" || productFamily === "retainer_oversight") return "Abraham";
  if (productFamily === "internal_or_inactive") return "operator";
  return "system";
}

function releaseConditionsFor(productFamily: ProductGoldUpgradeFamily, product: CatalogProduct): string[] {
  const conditions = [
    "Score is at least 9.8/10.",
    "Gold release readiness gate passes.",
    "Universal value gate blocks weak artefacts.",
    "Fulfilment integrity gate passes.",
    "Customer journey and delivery route are clear.",
  ];
  if (product.requiresCheckout) conditions.push("Stripe/webhook authority is confirmed.");
  if (requiresReportExperience(productFamily)) conditions.push("Report experience has no hard failure and AMBER items are owned or resolved.");
  if (requiresIntake(productFamily)) conditions.push("Required intake is complete before generation.");
  if (productFamily === "bundle_product") conditions.push("All child entitlements verify before customer access.");
  if (productFamily === "global_market_intelligence") conditions.push("Archive/current status and material calls are traceable.");
  return conditions;
}

function requiresIntake(productFamily: ProductGoldUpgradeFamily): boolean {
  return productFamily !== "free_public_signal" && productFamily !== "internal_or_inactive";
}

function requiresReportExperience(productFamily: ProductGoldUpgradeFamily): boolean {
  return [
    "boardroom_premium",
    "executive_reporting",
    "diagnostic",
    "global_market_intelligence",
    "professional_subscription",
    "retainer_oversight",
  ].includes(productFamily);
}
