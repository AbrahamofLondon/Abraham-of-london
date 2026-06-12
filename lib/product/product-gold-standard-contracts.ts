import type { CatalogProduct } from "@/lib/commercial/catalog";
import { getAllProducts } from "@/lib/commercial/catalog";
import {
  deriveCustomerEngagementCost,
  type CustomerEngagementCost,
} from "@/lib/product/customer-cost-model";
import {
  ARCHIVE_GOLD_DIMENSIONS,
  BUNDLE_GOLD_DIMENSIONS,
  FREE_PRODUCT_GOLD_DIMENSIONS,
  PAID_ENTRY_GOLD_DIMENSIONS,
  PREMIUM_GOLD_DIMENSIONS,
  SUBSCRIPTION_GOLD_DIMENSIONS,
  type ProductGoldScore,
  type ProductGoldStandardDimension,
  type ProductReleaseQualityStatus,
} from "@/lib/product/universal-product-gold-standard";
import {
  type CommercialTier,
  getProductValueContract,
} from "@/lib/product/product-value-contracts";

export interface ProductGoldStandardContract {
  productCode: string;
  productName: string;
  deliveryClass: string;
  commercialTier:
    | "free"
    | "paid_entry"
    | "paid_premium"
    | "subscription"
    | "retainer"
    | "enterprise"
    | "internal";
  customerCost: CustomerEngagementCost;
  marketExpectation: {
    expectedOutcome: string;
    comparableMarketStandard: string;
    minimumCustomerWin: string;
    unacceptableOutcome: string;
  };
  requiredGoldDimensions: ProductGoldStandardDimension[];
  criticalDimensions: ProductGoldStandardDimension[];
  minimumDimensionScores: Partial<Record<ProductGoldStandardDimension, ProductGoldScore>>;
  minimumOverallScore: number;
  mustExceedMarketOn?: ProductGoldStandardDimension[];
  releaseBlockedBelowStandard: boolean;
  releaseQualityStatus: ProductReleaseQualityStatus;
  customerOutcomeStatement: string;
  priceValueSurplus?: {
    whyWorthMoreThanPrice: string;
    alternativeCost: string;
    helpsAvoid: string;
    helpsDecideOrExecute: string;
  };
}

const BLOCKED_CODES = new Set([
  "gmi_q3_2026",
  "operator_essentials_pack",
  "command_pack",
  "governance_suite",
  "inner_circle",
  "diagnostic_report_basic",
  "diagnostic_report_pro",
  "executive_reporting_priority",
]);

const OWNED_UPGRADE_CODES = new Set([
  "fast_diagnostic",
  "team_assessment",
  "enterprise_assessment",
  "boardroom_mode",
  "additional_collaborator",
]);

export function getProductGoldStandardContract(productCode: string): ProductGoldStandardContract | null {
  const product = getAllProducts().find((entry) => entry.code === productCode);
  if (!product) return null;
  return buildProductGoldStandardContract(product);
}

export function getAllProductGoldStandardContracts(): ProductGoldStandardContract[] {
  return getAllProducts().map(buildProductGoldStandardContract);
}

export function buildProductGoldStandardContract(product: CatalogProduct): ProductGoldStandardContract {
  const valueContract = getProductValueContract(product.code);
  const commercialTier = deriveGoldCommercialTier(product, valueContract?.commercialTier);
  const deliveryClass = valueContract?.deliveryClass ?? deriveDeliveryClass(product);
  const customerCost = deriveCustomerEngagementCost(product, valueContract);
  const requiredGoldDimensions = requiredDimensionsFor(product, commercialTier, deliveryClass);
  const criticalDimensions = criticalDimensionsFor(commercialTier, deliveryClass);
  const minimumDimensionScores = minimumScoresFor(commercialTier, criticalDimensions);
  const releaseQualityStatus = classifyReleaseQuality(product, commercialTier, deliveryClass);

  return {
    productCode: product.code,
    productName: product.displayName,
    deliveryClass,
    commercialTier,
    customerCost,
    marketExpectation: marketExpectationFor(product, commercialTier, deliveryClass),
    requiredGoldDimensions,
    criticalDimensions,
    minimumDimensionScores,
    minimumOverallScore: minimumOverallFor(commercialTier, requiredGoldDimensions.length),
    mustExceedMarketOn: mustExceedMarketOnFor(commercialTier, deliveryClass),
    releaseBlockedBelowStandard: product.active && releaseQualityStatus !== "owned_upgrade_required",
    releaseQualityStatus,
    customerOutcomeStatement: customerOutcomeStatementFor(product, commercialTier, deliveryClass),
    priceValueSurplus: commercialTier === "free" || commercialTier === "internal"
      ? undefined
      : priceValueSurplusFor(product, commercialTier),
  };
}

function deriveGoldCommercialTier(
  product: CatalogProduct,
  valueTier: CommercialTier | undefined,
): ProductGoldStandardContract["commercialTier"] {
  if (product.commercialStatus === "internal_only" || product.commercialStatus === "dormant" || product.commercialStatus === "inactive" || product.commercialStatus === "retired") {
    return "internal";
  }
  if (valueTier) return valueTier;
  if (product.accessType === "free" || product.amount <= 0 && product.commercialStatus === "free_controlled") return "free";
  if (product.accessType === "subscription") return "subscription";
  return product.amount >= 9900 ? "paid_premium" : "paid_entry";
}

function deriveDeliveryClass(product: CatalogProduct): string {
  if (product.includes.length > 0) return "bundle_grant";
  if (product.category === "intelligence") return "archived_digital_reference";
  if (product.accessType === "subscription") return "subscription_retainer_cycle";
  if (product.requiresContract) return "enterprise_manual_scoping";
  return product.deliveryFormat ?? "generated_digital_artifact";
}

function requiredDimensionsFor(
  product: CatalogProduct,
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
): ProductGoldStandardDimension[] {
  if (deliveryClass === "bundle_grant") return BUNDLE_GOLD_DIMENSIONS;
  if (deliveryClass === "archived_digital_reference" || product.category === "intelligence") return ARCHIVE_GOLD_DIMENSIONS;
  if (tier === "subscription" || tier === "retainer") return SUBSCRIPTION_GOLD_DIMENSIONS;
  if (tier === "paid_premium" || tier === "enterprise") return PREMIUM_GOLD_DIMENSIONS;
  if (tier === "paid_entry") return PAID_ENTRY_GOLD_DIMENSIONS;
  return FREE_PRODUCT_GOLD_DIMENSIONS;
}

function criticalDimensionsFor(
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
): ProductGoldStandardDimension[] {
  if (deliveryClass === "archived_digital_reference") return ["archive_context", "time_respect", "trust_and_authority"];
  if (deliveryClass === "bundle_grant") return ["clarity_gain", "actionability", "experience_quality"];
  if (tier === "free") return ["time_respect", "clarity_gain", "actionability", "trust_and_authority"];
  if (tier === "subscription" || tier === "retainer") return ["continuity", "trust_and_authority", "price_value_surplus"];
  if (tier === "enterprise") return ["category_distinction", "trust_and_authority", "commercial_consequence"];
  if (tier === "paid_premium") return ["decision_usefulness", "defensibility", "price_value_surplus"];
  return ["decision_usefulness", "actionability", "price_value_surplus"];
}

function minimumScoresFor(
  tier: ProductGoldStandardContract["commercialTier"],
  criticalDimensions: ProductGoldStandardDimension[],
): Partial<Record<ProductGoldStandardDimension, ProductGoldScore>> {
  const minimum = tier === "paid_premium" || tier === "enterprise" || tier === "retainer" ? 3 : 2;
  return Object.fromEntries(criticalDimensions.map((dimension) => [dimension, minimum])) as Partial<Record<ProductGoldStandardDimension, ProductGoldScore>>;
}

function minimumOverallFor(
  tier: ProductGoldStandardContract["commercialTier"],
  dimensionCount: number,
): number {
  const perDimension = tier === "paid_premium" || tier === "enterprise" || tier === "retainer" ? 3 : 2;
  return dimensionCount * perDimension;
}

function mustExceedMarketOnFor(
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
): ProductGoldStandardDimension[] | undefined {
  if (tier === "enterprise") return ["category_distinction", "trust_and_authority"];
  if (tier === "paid_premium") return ["price_value_surplus"];
  if (tier === "subscription" || tier === "retainer") return ["continuity"];
  if (deliveryClass === "bundle_grant") return ["experience_quality"];
  return undefined;
}

function classifyReleaseQuality(
  product: CatalogProduct,
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
): ProductReleaseQualityStatus {
  if (BLOCKED_CODES.has(product.code) || !product.active || tier === "internal") return "blocked_from_release";
  if (OWNED_UPGRADE_CODES.has(product.code)) return "owned_upgrade_required";
  if (tier === "enterprise") return "category_leading";
  if (tier === "paid_premium" || tier === "subscription" || tier === "retainer") return "market_exceeding";
  if (deliveryClass === "archived_digital_reference") return "market_ready";
  return "market_ready";
}

function marketExpectationFor(
  product: CatalogProduct,
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
) {
  if (deliveryClass === "archived_digital_reference") {
    return {
      expectedOutcome: "The customer understands what the intelligence said, what was time-bound, what remains useful, and how to interpret it today.",
      comparableMarketStandard: "Archived paid intelligence with dated context, source basis, and current-use warning.",
      minimumCustomerWin: "The customer can use the report as historical strategic context without mistaking it for current intelligence.",
      unacceptableOutcome: "A dated report sold as if it were live market intelligence.",
    };
  }
  if (deliveryClass === "bundle_grant") {
    return {
      expectedOutcome: "The customer receives a guided sequence of value, not merely multiple entitlements.",
      comparableMarketStandard: "A bundled workflow with clear first step, sequence, and outcome for each component.",
      minimumCustomerWin: "The customer knows what to use first, why it matters, and what each part supports.",
      unacceptableOutcome: "A discount wrapper around disconnected tools.",
    };
  }
  if (tier === "free") {
    return {
      expectedOutcome: "The user leaves with a sharper understanding of their decision state and one useful next move.",
      comparableMarketStandard: "A useful public diagnostic that respects time and does not rely on vague marketing bait.",
      minimumCustomerWin: "A clearer decision state and next action within the promised time cost.",
      unacceptableOutcome: "High-friction lead capture with generic output.",
    };
  }
  if (tier === "paid_premium" || tier === "enterprise") {
    return {
      expectedOutcome: "The customer receives a consequential decision artifact or execution framework usable in a serious commercial, operational, or leadership context.",
      comparableMarketStandard: "Senior advisory diagnostic, board pack, or execution framework.",
      minimumCustomerWin: "A defensible artifact that helps decide, challenge, sequence, or execute a consequential move.",
      unacceptableOutcome: "Generic analysis that feels interchangeable with a basic AI answer.",
    };
  }
  if (tier === "subscription" || tier === "retainer") {
    return {
      expectedOutcome: "The customer receives continuity, oversight, memory, escalation, and cumulative decision improvement.",
      comparableMarketStandard: "Ongoing advisory workspace or retained oversight service.",
      minimumCustomerWin: "The product compounds value across cases or cycles.",
      unacceptableOutcome: "Repeated static reports without memory or escalation value.",
    };
  }
  return {
    expectedOutcome: "The customer receives a reusable insight, diagnostic result, decision interpretation, or next-step guide worth more than the price paid.",
    comparableMarketStandard: "Paid specialist diagnostic or practical decision tool.",
    minimumCustomerWin: "The output outperforms a generic template or basic AI response.",
    unacceptableOutcome: "A paid template with no specific diagnosis, consequence, or action.",
  };
}

function customerOutcomeStatementFor(
  product: CatalogProduct,
  tier: ProductGoldStandardContract["commercialTier"],
  deliveryClass: string,
): string {
  if (product.code === "fast_diagnostic") {
    return "After using Fast Diagnostic, the customer can identify the dominant decision friction in under five minutes and choose one corrective next move.";
  }
  if (product.code === "boardroom_brief") {
    return "After using Boardroom Brief, the customer can defend a high-consequence decision with structured judgement, falsification challenge, risk map, and 72-hour execution sequence.";
  }
  if (product.code.startsWith("gmi_q")) {
    return `After using ${product.displayName}, the customer can distinguish the edition's time-bound market thesis from current intelligence and use it as dated strategic context.`;
  }
  if (deliveryClass === "bundle_grant") {
    return `After using ${product.displayName}, the customer can follow a guided sequence of tools and understand which decision outcome each component supports.`;
  }
  if (tier === "subscription") {
    return `After using ${product.displayName}, the customer can preserve governed decision continuity and return to case memory, evidence, and next actions over time.`;
  }
  if (tier === "enterprise" || tier === "retainer") {
    return `After using ${product.displayName}, the customer can move serious organisational decisions through clearer governance, evidence, and escalation control.`;
  }
  if (tier === "free") {
    return `After using ${product.displayName}, the customer can gain a clearer decision signal and decide the next useful action without wasting time.`;
  }
  return `After using ${product.displayName}, the customer can turn a decision problem into a more specific diagnosis, consequence view, and practical next move.`;
}

function priceValueSurplusFor(
  product: CatalogProduct,
  tier: ProductGoldStandardContract["commercialTier"],
) {
  const price = product.displayPrice || (product.amount ? `GBP ${(product.amount / 100).toFixed(0)}` : "variable");
  return {
    whyWorthMoreThanPrice: `${product.displayName} is worth more than ${price} because it converts customer context into a reusable decision asset rather than leaving the customer with generic advice.`,
    alternativeCost: "The customer would otherwise need to spend founder, operator, analyst, or advisor time assembling evidence, interpreting risk, and creating a defensible sequence.",
    helpsAvoid: tier === "paid_premium" || tier === "enterprise"
      ? "It helps avoid premature approval, hidden execution risk, weak governance, and commercially expensive delay."
      : "It helps avoid vague diagnosis, wasted effort, and low-quality next steps.",
    helpsDecideOrExecute: "It helps the customer decide what condition they are in, what matters commercially, and what next move is defensible.",
  };
}
