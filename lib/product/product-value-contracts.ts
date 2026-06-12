/**
 * Universal product value contracts.
 *
 * A contract defines what a paid product must contain before it can be approved
 * or delivered. These contracts are derived from the commercial catalog and
 * delivery-class spine, with explicit overrides for products whose value chain
 * differs from the class default.
 */

import type { CatalogProduct } from "@/lib/commercial/catalog";
import { getAllProducts } from "@/lib/commercial/catalog";
import type { DeliveryClass } from "@/lib/product/universal-fulfilment-state";
import { getDeliveryClass } from "@/lib/product/universal-fulfilment-state";

export type CommercialTier =
  | "free"
  | "paid_entry"
  | "paid_premium"
  | "subscription"
  | "retainer"
  | "enterprise";

export type ValueDimension =
  | "input_basis"
  | "problem_definition"
  | "context_specificity"
  | "diagnosis"
  | "evidence_interpretation"
  | "commercial_consequence"
  | "decision_options"
  | "recommended_next_move"
  | "falsification_or_challenge"
  | "risk_and_dependency_map"
  | "execution_sequence"
  | "customer_specificity"
  | "commercial_value_claim";

export type ValueInputRequirementKey =
  | "decision_or_issue"
  | "commercial_context"
  | "current_constraint"
  | "desired_outcome"
  | "available_evidence"
  | "urgency_or_deadline"
  | "stakeholders"
  | "options_considered"
  | "previous_attempts"
  | "consequence_of_delay"
  | "definition_of_success"
  | "usage_context";

export interface ValueInputRequirement {
  key: ValueInputRequirementKey;
  label: string;
  required: boolean;
  appliesWhen?: string;
}

export interface ValueOutputSection {
  key:
    | "input_basis"
    | "interpretation"
    | "diagnosis"
    | "consequence"
    | "options"
    | "recommendation"
    | "execution_next_step"
    | "continuity_value"
    | "child_artifact_value"
    | "usage_context"
    | "archive_warning";
  label: string;
  required: boolean;
  skippedReason?: string;
}

export interface ProductValueContract {
  productCode: string;
  deliveryClass: DeliveryClass | "enterprise_manual_scoping" | "unknown";
  commercialTier: CommercialTier;
  requiredInputBasis: ValueInputRequirement[];
  requiredOutputSections: ValueOutputSection[];
  requiredValueDimensions: ValueDimension[];
  minimumValueScore: number;
  approvalBlockedBelowScore: boolean;
  deliveryBlockedBelowScore: boolean;
  allowsMetadataOnlyOutput: boolean;
  allowsGenericOutput: boolean;
}

export const UNIVERSAL_VALUE_CHAIN: ValueOutputSection[] = [
  { key: "input_basis", label: "Customer / input / data basis", required: true },
  { key: "interpretation", label: "Interpretation", required: true },
  { key: "diagnosis", label: "Diagnosis", required: true },
  { key: "consequence", label: "Consequence", required: true },
  { key: "options", label: "Options", required: true },
  { key: "recommendation", label: "Recommendation", required: true },
  { key: "execution_next_step", label: "Execution next step", required: true },
];

export const UNIVERSAL_VALUE_DIMENSIONS: ValueDimension[] = [
  "input_basis",
  "problem_definition",
  "context_specificity",
  "diagnosis",
  "evidence_interpretation",
  "commercial_consequence",
  "decision_options",
  "recommended_next_move",
  "falsification_or_challenge",
  "risk_and_dependency_map",
  "execution_sequence",
  "customer_specificity",
  "commercial_value_claim",
];

export const CONTEXTUAL_INPUT_REQUIREMENTS: ValueInputRequirement[] = [
  { key: "decision_or_issue", label: "Decision / issue being reviewed", required: true },
  { key: "commercial_context", label: "Commercial context", required: true },
  { key: "current_constraint", label: "Current constraint", required: true },
  { key: "desired_outcome", label: "Desired outcome", required: true },
  { key: "available_evidence", label: "Available evidence", required: true },
  { key: "urgency_or_deadline", label: "Urgency / deadline", required: true },
  { key: "stakeholders", label: "Stakeholders", required: true },
  { key: "options_considered", label: "Options already considered", required: false },
  { key: "previous_attempts", label: "What has already been tried", required: false },
  { key: "consequence_of_delay", label: "Consequence of delay", required: true },
  { key: "definition_of_success", label: "Definition of success", required: true },
];

const ARCHIVE_INPUT_REQUIREMENTS: ValueInputRequirement[] = [
  { key: "usage_context", label: "Usage context for archived intelligence", required: true },
];

const DEFAULT_MINIMUM_SCORE_BY_TIER: Record<CommercialTier, number> = {
  free: 35,
  paid_entry: 55,
  paid_premium: 70,
  subscription: 60,
  retainer: 75,
  enterprise: 80,
};

const CONTRACT_OVERRIDES: Record<string, Partial<ProductValueContract>> = {
  operator_decision_pack: {
    deliveryClass: "bundle_grant",
    requiredOutputSections: [
      ...UNIVERSAL_VALUE_CHAIN,
      { key: "child_artifact_value", label: "Value verification of every child artifact", required: true },
    ],
    requiredValueDimensions: [
      ...UNIVERSAL_VALUE_DIMENSIONS,
      "customer_specificity",
    ],
  },
  professional: {
    commercialTier: "subscription",
    requiredOutputSections: [
      ...UNIVERSAL_VALUE_CHAIN.map((section) => ({
        ...section,
        required: section.key !== "options",
        skippedReason: section.key === "options" ? "Subscription access may unlock tools rather than prescribe a single decision option." : undefined,
      })),
      { key: "continuity_value", label: "Continuity value requirement", required: true },
    ],
  },
  professional_annual: {
    commercialTier: "subscription",
    requiredOutputSections: [
      ...UNIVERSAL_VALUE_CHAIN.map((section) => ({
        ...section,
        required: section.key !== "options",
        skippedReason: section.key === "options" ? "Subscription access may unlock tools rather than prescribe a single decision option." : undefined,
      })),
      { key: "continuity_value", label: "Continuity value requirement", required: true },
    ],
  },
};

export function deriveCommercialTier(product: CatalogProduct): CommercialTier {
  if (product.accessType === "free" || product.amount <= 0 && product.commercialStatus === "free_controlled") {
    return "free";
  }
  if (product.category === "retainer") return "retainer";
  if (product.requiresContract || product.commercialStatus === "contracted" || product.tier === "enterprise") {
    return "enterprise";
  }
  if (product.accessType === "subscription") return "subscription";
  if (
    product.amount >= 9900 ||
    product.tier.includes("premium") ||
    product.tier.includes("boardroom") ||
    product.category === "reporting_premium" ||
    product.category === "execution_premium"
  ) {
    return "paid_premium";
  }
  return "paid_entry";
}

export function defaultRequiredOutputSections(deliveryClass: ProductValueContract["deliveryClass"]): ValueOutputSection[] {
  if (deliveryClass === "archived_digital_reference") {
    return [
      { key: "input_basis", label: "Source and publication basis", required: true },
      { key: "interpretation", label: "Interpretation", required: true },
      { key: "consequence", label: "Decision consequence", required: true },
      { key: "usage_context", label: "Usage context", required: true },
      { key: "archive_warning", label: "Archive warning", required: true },
      { key: "recommendation", label: "Recommended use / non-use", required: true },
    ];
  }

  if (deliveryClass === "bundle_grant") {
    return [
      ...UNIVERSAL_VALUE_CHAIN,
      { key: "child_artifact_value", label: "Value verification of every child artifact", required: true },
    ];
  }

  if (deliveryClass === "subscription_retainer_cycle") {
    return [
      ...UNIVERSAL_VALUE_CHAIN.map((section) => ({
        ...section,
        required: section.key !== "options",
        skippedReason: section.key === "options" ? "Continuity products may support repeated case work rather than a single decision-option set." : undefined,
      })),
      { key: "continuity_value", label: "Continuity value requirement", required: true },
    ];
  }

  if (deliveryClass === "enterprise_manual_scoping") {
    return [
      ...UNIVERSAL_VALUE_CHAIN,
      { key: "usage_context", label: "Scoping context and acceptance basis", required: true },
    ];
  }

  return UNIVERSAL_VALUE_CHAIN;
}

export function defaultInputRequirements(deliveryClass: ProductValueContract["deliveryClass"]): ValueInputRequirement[] {
  if (deliveryClass === "archived_digital_reference") return ARCHIVE_INPUT_REQUIREMENTS;
  if (deliveryClass === "instant_digital_access" || deliveryClass === "bundle_grant") {
    return [
      { key: "decision_or_issue", label: "Decision / issue being reviewed", required: true },
      { key: "current_constraint", label: "Current constraint", required: true },
      { key: "consequence_of_delay", label: "Consequence of delay", required: true },
    ];
  }
  if (deliveryClass === "subscription_retainer_cycle") {
    return [
      { key: "decision_or_issue", label: "Active governed case or continuity need", required: true },
      { key: "available_evidence", label: "Available case evidence", required: true },
      { key: "definition_of_success", label: "Definition of successful continuity", required: true },
    ];
  }
  return CONTEXTUAL_INPUT_REQUIREMENTS;
}

export function getProductValueContract(productCode: string): ProductValueContract | null {
  const product = getAllProducts().find((entry) => entry.code === productCode);
  if (!product) return null;

  const commercialTier = deriveCommercialTier(product);
  const deliveryClass =
    product.category === "retainer"
      ? "subscription_retainer_cycle"
      : product.accessType === "subscription" && !product.requiresContract
        ? "subscription_retainer_cycle"
        : product.requiresContract || product.tier === "enterprise" || product.commercialStatus === "manual_billing"
      ? "enterprise_manual_scoping"
      : getDeliveryClass(product.code) ?? "unknown";
  const override = CONTRACT_OVERRIDES[product.code] ?? {};
  const resolvedTier = override.commercialTier ?? commercialTier;
  const resolvedDeliveryClass = override.deliveryClass ?? deliveryClass;
  const requiredOutputSections =
    override.requiredOutputSections ?? defaultRequiredOutputSections(resolvedDeliveryClass);
  const requiredValueDimensions =
    override.requiredValueDimensions ?? UNIVERSAL_VALUE_DIMENSIONS;
  const minimumValueScore =
    override.minimumValueScore ?? DEFAULT_MINIMUM_SCORE_BY_TIER[resolvedTier];

  return {
    productCode: product.code,
    deliveryClass: resolvedDeliveryClass,
    commercialTier: resolvedTier,
    requiredInputBasis: override.requiredInputBasis ?? defaultInputRequirements(resolvedDeliveryClass),
    requiredOutputSections,
    requiredValueDimensions,
    minimumValueScore,
    approvalBlockedBelowScore: override.approvalBlockedBelowScore ?? resolvedTier !== "free",
    deliveryBlockedBelowScore: override.deliveryBlockedBelowScore ?? resolvedTier !== "free",
    allowsMetadataOnlyOutput: override.allowsMetadataOnlyOutput ?? resolvedTier === "free",
    allowsGenericOutput: override.allowsGenericOutput ?? resolvedTier === "free",
  };
}

export function getAllProductValueContracts(): ProductValueContract[] {
  return getAllProducts()
    .map((product) => getProductValueContract(product.code))
    .filter((contract): contract is ProductValueContract => Boolean(contract));
}

export function isPaidContract(contract: ProductValueContract): boolean {
  return contract.commercialTier !== "free";
}

export function isPremiumContract(contract: ProductValueContract): boolean {
  return contract.commercialTier === "paid_premium" ||
    contract.commercialTier === "retainer" ||
    contract.commercialTier === "enterprise";
}
