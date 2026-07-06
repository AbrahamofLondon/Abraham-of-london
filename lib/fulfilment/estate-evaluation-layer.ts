/**
 * lib/fulfilment/estate-evaluation-layer.ts
 *
 * LAYER B — EVALUATION
 *
 * Rules evaluate observations from Layer A.
 * No final product verdicts here. No reading from evidence records.
 * Evaluation must not read the desired final verdict.
 */

import { type ProductObservations, observeAll, observeRouteExists, observeFileExists, observeDirectoryHasFiles, observeTestFileExists } from "./estate-observation-layer";
import { CATALOG } from "../commercial/catalog";
import { getContractByProductCode } from "../product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "../product/product-fulfilment-assurance";

// ── Evaluation result types ────────────────────────────────────────────────

export type EvaluationResult = {
  passed: boolean;
  rule: string;
  detail: string;
};

export type ProductEvaluation = {
  productCode: string;
  productName: string;
  evaluations: EvaluationResult[];
  allPassed: boolean;
};

// ── Commercial evaluation rules ────────────────────────────────────────────

export function evaluateCommercialIdentity(obs: ProductObservations): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  results.push({
    passed: obs.inCatalog,
    rule: "PRODUCT_IN_CATALOG",
    detail: obs.inCatalog
      ? `Product ${obs.productCode} exists in catalog`
      : `Product ${obs.productCode} NOT found in catalog`,
  });

  if (obs.commercialStatus === "paid") {
    results.push({
      passed: obs.hasStripePriceId,
      rule: "PAID_PRODUCT_HAS_STRIPE_PRICE",
      detail: obs.hasStripePriceId
        ? `Product ${obs.productCode} has Stripe Price ID`
        : `Product ${obs.productCode} is paid but has NO Stripe Price ID`,
    });
  }

  if (obs.commercialStatus === "free_controlled" || obs.commercialStatus === "evidence_gated") {
    results.push({
      passed: !obs.hasStripePriceId,
      rule: "FREE_PRODUCT_NO_STRIPE_PRICE",
      detail: !obs.hasStripePriceId
        ? `Free/evidence-gated product ${obs.productCode} correctly has no Stripe Price ID`
        : `Free/evidence-gated product ${obs.productCode} unexpectedly has Stripe Price ID`,
    });
  }

  return results;
}

export function evaluateFulfilmentStructure(obs: ProductObservations): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  results.push({
    passed: obs.fulfilmentContractExists,
    rule: "FULFILMENT_CONTRACT_EXISTS",
    detail: obs.fulfilmentContractExists
      ? `Fulfilment contract exists for ${obs.productCode}`
      : `No fulfilment contract for ${obs.productCode}`,
  });

  results.push({
    passed: obs.assuranceRecordExists,
    rule: "ASSURANCE_RECORD_EXISTS",
    detail: obs.assuranceRecordExists
      ? `Assurance record exists for ${obs.productCode}`
      : `No assurance record for ${obs.productCode}`,
  });

  if (obs.commercialStatus === "paid") {
    results.push({
      passed: obs.contractHasHandler,
      rule: "CONTRACT_HAS_HANDLER",
      detail: obs.contractHasHandler
        ? `Contract for ${obs.productCode} has fulfilment handler`
        : `Contract for ${obs.productCode} has NO fulfilment handler`,
    });

    results.push({
      passed: obs.contractHasCustomerAccessRoute,
      rule: "HAS_CUSTOMER_ACCESS_ROUTE",
      detail: obs.contractHasCustomerAccessRoute
        ? `Contract for ${obs.productCode} has customer access route`
        : `Contract for ${obs.productCode} has NO customer access route`,
    });
  }

  return results;
}

export function evaluateRouteResolution(productCode: string): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Try the product's own route
  const directRoute = `/${productCode.replace(/_/g, "-")}`;
  const routeObs = observeRouteExists(directRoute);
  results.push({
    passed: routeObs.exists,
    rule: "PRODUCT_ROUTE_RESOLVES",
    detail: routeObs.exists
      ? `Route ${directRoute} resolves to ${routeObs.implementationPath}`
      : `Route ${directRoute} does NOT resolve to a real implementation`,
  });

  // Check contract-specified routes
  const contract = getContractByProductCode(productCode);
  if (contract) {
    const routesToCheck = [
      { name: "intakeRoute", path: contract.intakeRoute },
      { name: "successRoute", path: contract.successRoute },
      { name: "customerAccessRoute", path: contract.customerAccessRoute },
    ];

    for (const r of routesToCheck) {
      if (r.path) {
        const obs = observeRouteExists(r.path);
        results.push({
          passed: obs.exists,
          rule: `CONTRACT_ROUTE_${r.name.toUpperCase()}`,
          detail: obs.exists
            ? `Contract ${r.name} ${r.path} resolves to ${obs.implementationPath}`
            : `Contract ${r.name} ${r.path} does NOT resolve`,
        });
      }
    }
  }

  return results;
}

export function evaluateTestCoverage(productCode: string): EvaluationResult[] {
  const results: EvaluationResult[] = [];

  // Check if product estate test directory has tests
  const testDirExists = observeDirectoryHasFiles("tests/product-estate");
  results.push({
    passed: testDirExists,
    rule: "PRODUCT_ESTATE_TESTS_EXIST",
    detail: testDirExists
      ? "tests/product-estate/ contains test files"
      : "tests/product-estate/ is empty or missing",
  });

  // Check if commercial tests exist
  const commercialTestsExist = observeDirectoryHasFiles("tests/commercial");
  results.push({
    passed: commercialTestsExist,
    rule: "COMMERCIAL_TESTS_EXIST",
    detail: commercialTestsExist
      ? "tests/commercial/ contains test files"
      : "tests/commercial/ is empty or missing",
  });

  return results;
}

export function evaluatePricing(productCode: string): EvaluationResult[] {
  const results: EvaluationResult[] = [];
  const product = CATALOG[productCode];

  if (!product) {
    results.push({ passed: false, rule: "PRODUCT_FOR_PRICING", detail: `Product ${productCode} not in catalog` });
    return results;
  }

  results.push({
    passed: product.displayPrice !== undefined && product.displayPrice !== null,
    rule: "PRODUCT_HAS_DISPLAY_PRICE",
    detail: product.displayPrice
      ? `Display price: ${product.displayPrice}`
      : `No display price for ${productCode}`,
  });

  if (product.commercialStatus === "paid") {
    results.push({
      passed: product.amount > 0,
      rule: "PAID_PRODUCT_HAS_AMOUNT",
      detail: product.amount > 0
        ? `Amount: ${product.amount} (${product.displayPrice})`
        : `Paid product ${productCode} has amount 0 or missing`,
    });
  }

  return results;
}

// ── Aggregate evaluation ───────────────────────────────────────────────────

export function evaluateProduct(productCode: string): ProductEvaluation {
  const obs = observeAll(productCode);
  const product = CATALOG[productCode];

  const allEvaluations: EvaluationResult[] = [
    ...evaluateCommercialIdentity(obs),
    ...evaluateFulfilmentStructure(obs),
    ...evaluateRouteResolution(productCode),
    ...evaluateTestCoverage(productCode),
    ...evaluatePricing(productCode),
  ];

  return {
    productCode,
    productName: product?.displayName ?? "Unknown",
    evaluations: allEvaluations,
    allPassed: allEvaluations.every((e) => e.passed),
  };
}

export function evaluateAllProducts(): ProductEvaluation[] {
  const codes = Object.keys(CATALOG);
  return codes.map(evaluateProduct);
}
