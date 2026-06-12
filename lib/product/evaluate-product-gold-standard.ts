import {
  customerCostRequiresStrongerProof,
  respectsFreeProductTime,
} from "@/lib/product/customer-cost-model";
import {
  type ProductGoldStandardContract,
  getProductGoldStandardContract,
} from "@/lib/product/product-gold-standard-contracts";
import type {
  ProductGoldScore,
  ProductGoldStandardDimension,
} from "@/lib/product/universal-product-gold-standard";

export interface ProductGoldStandardResult {
  productCode: string;
  productName: string;
  commercialTier: string;
  overallScore: number;
  dimensionScores: Partial<Record<ProductGoldStandardDimension, ProductGoldScore>>;
  meetsMarketExpectation: boolean;
  exceedsMarketExpectation: boolean;
  categoryLeadingSignal: boolean;
  releaseAllowed: boolean;
  reasonsBlocked: string[];
  improvementRequired: string[];
  customerCostRespected: boolean;
  verdict:
    | "category_leading"
    | "exceeds_market"
    | "meets_market"
    | "below_market"
    | "not_fit_for_release";
}

export interface ProductGoldStandardEvidence {
  artefactValueScore?: number;
  contentInspectionPassed?: boolean;
  userJourneyPassed?: boolean;
  fulfilmentIntegrityPassed?: boolean;
  reportExperienceStatus?: "PASSED" | "PASSED_STRUCTURALLY" | "AMBER" | "FAILED";
  marketExpectationPassed?: boolean;
}

export function evaluateProductGoldStandard(
  productCode: string,
  evidence: ProductGoldStandardEvidence = {},
  contract: ProductGoldStandardContract | null = getProductGoldStandardContract(productCode),
): ProductGoldStandardResult {
  if (!contract) {
    return {
      productCode,
      productName: productCode,
      commercialTier: "unknown",
      overallScore: 0,
      dimensionScores: {},
      meetsMarketExpectation: false,
      exceedsMarketExpectation: false,
      categoryLeadingSignal: false,
      releaseAllowed: false,
      reasonsBlocked: ["Product has no gold standard contract."],
      improvementRequired: ["Create ProductGoldStandardContract."],
      customerCostRespected: false,
      verdict: "not_fit_for_release",
    };
  }

  const dimensionScores = scoreDimensions(contract, evidence);
  const overallScore = Object.values(dimensionScores).reduce<number>((sum, score) => sum + (score ?? 0), 0);
  const customerCostRespected = respectsCustomerCost(contract, dimensionScores);
  const reasonsBlocked: string[] = [];
  const improvementRequired: string[] = [];

  for (const [dimension, minimum] of Object.entries(contract.minimumDimensionScores) as Array<[ProductGoldStandardDimension, ProductGoldScore]>) {
    const score = dimensionScores[dimension] ?? 0;
    if (score < minimum) {
      reasonsBlocked.push(`${dimension} scored ${score}; minimum is ${minimum}`);
      improvementRequired.push(`Improve ${dimension} to at least ${minimum}.`);
    }
  }

  if (overallScore < contract.minimumOverallScore) {
    reasonsBlocked.push(`Overall score ${overallScore} below minimum ${contract.minimumOverallScore}.`);
    improvementRequired.push("Raise aggregate customer-value proof above product-class threshold.");
  }

  if (!customerCostRespected) {
    reasonsBlocked.push("Customer engagement cost is not respected.");
    improvementRequired.push("Reduce time/cognitive burden or increase clarity/actionability proof.");
  }

  if (contract.priceValueSurplus && (dimensionScores.price_value_surplus ?? 0) < 2) {
    reasonsBlocked.push("Paid product lacks price-value surplus.");
  }

  const categoryLeadingSignal = Object.values(dimensionScores).some((score) => score === 4);
  const requiredAverage = contract.requiredGoldDimensions.length === 0
    ? 0
    : overallScore / contract.requiredGoldDimensions.length;
  const meetsMarketExpectation = reasonsBlocked.length === 0 && requiredAverage >= 2;
  const exceedsMarketExpectation = meetsMarketExpectation && requiredAverage >= 3;
  const releaseAllowed = contract.releaseBlockedBelowStandard ? reasonsBlocked.length === 0 : true;

  return {
    productCode: contract.productCode,
    productName: contract.productName,
    commercialTier: contract.commercialTier,
    overallScore,
    dimensionScores,
    meetsMarketExpectation,
    exceedsMarketExpectation,
    categoryLeadingSignal,
    releaseAllowed,
    reasonsBlocked,
    improvementRequired,
    customerCostRespected,
    verdict: deriveVerdict(releaseAllowed, requiredAverage, categoryLeadingSignal),
  };
}

function scoreDimensions(
  contract: ProductGoldStandardContract,
  evidence: ProductGoldStandardEvidence,
): Partial<Record<ProductGoldStandardDimension, ProductGoldScore>> {
  const scores: Partial<Record<ProductGoldStandardDimension, ProductGoldScore>> = {};
  const baseScore = baseScoreForContract(contract, evidence);

  for (const dimension of contract.requiredGoldDimensions) {
    scores[dimension] = baseScore;
  }

  if (contract.commercialTier === "paid_premium" || contract.commercialTier === "enterprise") {
    for (const dimension of contract.mustExceedMarketOn ?? []) {
      scores[dimension] = Math.max(scores[dimension] ?? 0, contract.commercialTier === "enterprise" ? 4 : 3) as ProductGoldScore;
    }
  }

  if (contract.releaseQualityStatus === "category_leading") {
    scores.category_distinction = 4;
    scores.trust_and_authority = 4;
  }

  if (contract.releaseQualityStatus === "owned_upgrade_required") {
    for (const dimension of contract.criticalDimensions) {
      scores[dimension] = Math.min(scores[dimension] ?? 2, 2) as ProductGoldScore;
    }
  }

  if (contract.releaseQualityStatus === "blocked_from_release") {
    for (const dimension of contract.requiredGoldDimensions) {
      scores[dimension] = Math.min(scores[dimension] ?? 1, 1) as ProductGoldScore;
    }
  }

  return scores;
}

function baseScoreForContract(
  contract: ProductGoldStandardContract,
  evidence: ProductGoldStandardEvidence,
): ProductGoldScore {
  if (contract.releaseQualityStatus === "blocked_from_release") return 1;
  if (contract.releaseQualityStatus === "owned_upgrade_required") return 2;
  if (contract.releaseQualityStatus === "category_leading") return 4;
  if (contract.releaseQualityStatus === "market_exceeding") return 3;

  const externalProofStrong =
    (evidence.artefactValueScore ?? 0) >= 70 ||
    evidence.contentInspectionPassed ||
    evidence.fulfilmentIntegrityPassed ||
    evidence.marketExpectationPassed;

  return externalProofStrong ? 3 : 2;
}

function respectsCustomerCost(
  contract: ProductGoldStandardContract,
  scores: Partial<Record<ProductGoldStandardDimension, ProductGoldScore>>,
): boolean {
  if (contract.commercialTier === "free") {
    return (scores.time_respect ?? 0) >= 2 &&
      (scores.clarity_gain ?? 0) >= 2 &&
      (scores.actionability ?? 0) >= 2 &&
      (scores.trust_and_authority ?? 0) >= 2 &&
      respectsFreeProductTime(contract.customerCost);
  }

  if (customerCostRequiresStrongerProof(contract.customerCost)) {
    return contract.criticalDimensions.every((dimension) => (scores[dimension] ?? 0) >= 3);
  }

  return true;
}

function deriveVerdict(
  releaseAllowed: boolean,
  average: number,
  categoryLeadingSignal: boolean,
): ProductGoldStandardResult["verdict"] {
  if (!releaseAllowed) return "not_fit_for_release";
  if (categoryLeadingSignal && average >= 3.5) return "category_leading";
  if (average >= 3) return "exceeds_market";
  if (average >= 2) return "meets_market";
  return "below_market";
}
