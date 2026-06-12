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
  ProductGoldScoreResult,
  ProductGoldStandardDimension,
} from "@/lib/product/universal-product-gold-standard";

export interface ProductGoldStandardResult extends ProductGoldScoreResult {
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
    | "gold_standard"
    | "blocked_from_release"
    | "internal_only";
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
      scoreOutOf100: 0,
      scoreOutOf10: 0,
      releaseStatus: "blocked_from_release",
      dimensionScores: {},
      meetsMarketExpectation: false,
      exceedsMarketExpectation: false,
      categoryLeadingSignal: false,
      releaseAllowed: false,
      reasonsBlocked: ["Product has no gold standard contract."],
      blockingReasons: ["Product has no gold standard contract."],
      improvementRequired: ["Create ProductGoldStandardContract."],
      upgradeRequired: ["Create ProductGoldStandardContract."],
      customerCostRespected: false,
      verdict: "blocked_from_release",
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

  if (contract.scoreOutOf100 < 98 && contract.releaseStatus !== "internal_only") {
    reasonsBlocked.push(`9.8 score ${contract.scoreOutOf10.toFixed(1)} is below the 9.8 release threshold.`);
    improvementRequired.push("Raise the product to 98/100 or keep it blocked from public release.");
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
  const releaseAllowed = contract.releaseStatus === "gold_standard" && reasonsBlocked.length === 0;

  return {
    productCode: contract.productCode,
    productName: contract.productName,
    commercialTier: contract.commercialTier,
    overallScore,
    scoreOutOf100: contract.scoreOutOf100,
    scoreOutOf10: contract.scoreOutOf10,
    releaseStatus: contract.releaseStatus,
    dimensionScores,
    meetsMarketExpectation,
    exceedsMarketExpectation,
    categoryLeadingSignal,
    releaseAllowed,
    reasonsBlocked,
    blockingReasons: reasonsBlocked,
    improvementRequired,
    upgradeRequired: improvementRequired,
    customerCostRespected,
    verdict: contract.releaseStatus,
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

  if (contract.releaseStatus === "gold_standard") {
    scores.category_distinction = 4;
    scores.trust_and_authority = 4;
  }

  if (contract.releaseStatus === "blocked_from_release") {
    for (const dimension of contract.requiredGoldDimensions) {
      scores[dimension] = Math.min(scores[dimension] ?? 2, 2) as ProductGoldScore;
    }
  }

  return scores;
}

function baseScoreForContract(
  contract: ProductGoldStandardContract,
  evidence: ProductGoldStandardEvidence,
): ProductGoldScore {
  if (contract.releaseStatus === "internal_only") return 1;
  if (contract.releaseStatus === "blocked_from_release") return 2;
  if (contract.releaseStatus === "gold_standard") return 4;

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
