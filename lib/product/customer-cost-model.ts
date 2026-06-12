import type { CatalogProduct } from "@/lib/commercial/catalog";
import type { ProductValueContract } from "@/lib/product/product-value-contracts";

export interface CustomerEngagementCost {
  moneyCost: number | "free" | "variable";
  timeCostMinutes: number;
  cognitiveLoad: "low" | "medium" | "high";
  trustRequired: "low" | "medium" | "high";
  opportunityCost: "low" | "medium" | "high";
  decisionConsequence: "low" | "medium" | "high" | "critical";
}

export function deriveCustomerEngagementCost(
  product: CatalogProduct,
  valueContract: ProductValueContract | null,
): CustomerEngagementCost {
  const tier = valueContract?.commercialTier ?? "free";
  const moneyCost =
    product.commercialStatus === "contracted" || product.commercialStatus === "manual_billing"
      ? "variable"
      : product.amount > 0
        ? product.amount
        : "free";

  if (tier === "enterprise" || tier === "retainer") {
    return {
      moneyCost,
      timeCostMinutes: 60,
      cognitiveLoad: "high",
      trustRequired: "high",
      opportunityCost: "high",
      decisionConsequence: "critical",
    };
  }

  if (tier === "paid_premium") {
    return {
      moneyCost,
      timeCostMinutes: product.estimatedCompletionMinutes ?? 25,
      cognitiveLoad: "high",
      trustRequired: "high",
      opportunityCost: "high",
      decisionConsequence: "high",
    };
  }

  if (tier === "subscription") {
    return {
      moneyCost,
      timeCostMinutes: 20,
      cognitiveLoad: "medium",
      trustRequired: "high",
      opportunityCost: "medium",
      decisionConsequence: "high",
    };
  }

  if (tier === "paid_entry") {
    return {
      moneyCost,
      timeCostMinutes: product.estimatedCompletionMinutes ?? 12,
      cognitiveLoad: "medium",
      trustRequired: "medium",
      opportunityCost: "medium",
      decisionConsequence: "medium",
    };
  }

  return {
    moneyCost: "free",
    timeCostMinutes: product.estimatedCompletionMinutes ?? 5,
    cognitiveLoad: product.category === "intelligence" ? "medium" : "low",
    trustRequired: "medium",
    opportunityCost: "medium",
    decisionConsequence: product.category === "decision_tools" ? "medium" : "low",
  };
}

export function customerCostRequiresStrongerProof(cost: CustomerEngagementCost): boolean {
  return cost.trustRequired === "high" ||
    cost.opportunityCost === "high" ||
    cost.decisionConsequence === "high" ||
    cost.decisionConsequence === "critical" ||
    cost.cognitiveLoad === "high" ||
    cost.timeCostMinutes >= 20;
}

export function respectsFreeProductTime(cost: CustomerEngagementCost): boolean {
  return cost.moneyCost === "free" && cost.timeCostMinutes <= 10 && cost.cognitiveLoad !== "high";
}
