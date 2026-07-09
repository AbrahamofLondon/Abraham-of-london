import {
  getProduct,
  type CatalogProduct,
  type CommercialStatus,
  type ProductCategory,
} from "../commercial/catalog";
import {
  PRODUCT_FULFILMENT_CONTRACTS,
  type FulfilmentType,
  type ProductFulfilmentContract,
} from "../product/product-fulfilment-contract";

export const PRODUCT_INTELLIGENCE_CLASSES = [
  "originator",
  "derivative",
  "wrapper",
  "infrastructure",
  "fulfilment",
  "proof_surface",
] as const;

export type ProductIntelligenceClass = (typeof PRODUCT_INTELLIGENCE_CLASSES)[number];

export interface ProductIntelligenceClassification {
  productCode: string;
  displayName: string;
  category: ProductCategory;
  commercialStatus: CommercialStatus | null;
  fulfilmentType: FulfilmentType;
  classification: ProductIntelligenceClass;
  rationale: string;
}

export interface ProductIntelligenceCoverageGap {
  productCode: string;
  displayName: string;
  matchedClasses: ProductIntelligenceClass[];
  reason: string;
}

export interface ProductIntelligenceClassificationReport {
  generatedAt: string;
  expectedProductCount: number;
  uniqueProductCount: number;
  classifiedProductCount: number;
  completeCoverage: boolean;
  canonicalProductCodes: string[];
  duplicateRegistryProductCodes: string[];
  unclassifiedProducts: ProductIntelligenceCoverageGap[];
  multiplyClassifiedProducts: ProductIntelligenceCoverageGap[];
  countsByClass: Record<ProductIntelligenceClass, number>;
  classifications: ProductIntelligenceClassification[];
}

type EstateProductRow = {
  productCode: string;
  displayName: string;
  contract: ProductFulfilmentContract;
  product: CatalogProduct | null;
};

const FULFILMENT_CLASS_TYPES = new Set<FulfilmentType>([
  "human_reviewed_dossier",
  "scheduled_session",
]);

const WRAPPER_CATEGORIES = new Set<ProductCategory>(["bundle"]);
const INFRASTRUCTURE_CATEGORIES = new Set<ProductCategory>(["membership", "retainer"]);
const PROOF_SURFACE_CATEGORIES = new Set<ProductCategory>(["evidence", "intelligence"]);
const DERIVATIVE_CATEGORIES = new Set<ProductCategory>(["reporting", "reporting_premium"]);
const ORIGINATOR_CATEGORIES = new Set<ProductCategory>(["decision_tools", "governed_playbook"]);

const DERIVATIVE_PRODUCT_CODES = new Set<string>([
  "board_brief_builder",
  "boardroom_mode",
]);

const FULFILMENT_PRODUCT_CODES = new Set<string>([
  "reporting_custom",
]);

function listEstateRows(): EstateProductRow[] {
  return PRODUCT_FULFILMENT_CONTRACTS.map((contract) => ({
    productCode: contract.productCode,
    displayName: contract.displayName,
    contract,
    product: getProduct(contract.productCode),
  }));
}

function findDuplicateProductCodes(productCodes: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const productCode of productCodes) {
    if (seen.has(productCode)) {
      duplicates.add(productCode);
      continue;
    }
    seen.add(productCode);
  }

  return [...duplicates].sort();
}

function buildCountsByClass(): Record<ProductIntelligenceClass, number> {
  return {
    originator: 0,
    derivative: 0,
    wrapper: 0,
    infrastructure: 0,
    fulfilment: 0,
    proof_surface: 0,
  };
}

function getMatchedClasses(row: EstateProductRow): ProductIntelligenceClass[] {
  if (!row.product) {
    return [];
  }

  const matches: ProductIntelligenceClass[] = [];
  const { category, code } = row.product;

  if (WRAPPER_CATEGORIES.has(category)) {
    matches.push("wrapper");
  }

  if (INFRASTRUCTURE_CATEGORIES.has(category)) {
    matches.push("infrastructure");
  }

  if (PROOF_SURFACE_CATEGORIES.has(category)) {
    matches.push("proof_surface");
  }

  const isFulfilmentLedProduct = FULFILMENT_CLASS_TYPES.has(row.contract.fulfilmentType) || FULFILMENT_PRODUCT_CODES.has(code);

  if (isFulfilmentLedProduct) {
    matches.push("fulfilment");
  }

  if (!isFulfilmentLedProduct && (DERIVATIVE_CATEGORIES.has(category) || DERIVATIVE_PRODUCT_CODES.has(code))) {
    matches.push("derivative");
  }

  if (
    ORIGINATOR_CATEGORIES.has(category) &&
    !FULFILMENT_CLASS_TYPES.has(row.contract.fulfilmentType) &&
    !DERIVATIVE_CATEGORIES.has(category) &&
    !DERIVATIVE_PRODUCT_CODES.has(code)
  ) {
    matches.push("originator");
  }

  return matches;
}

function buildClassificationRationale(
  classification: ProductIntelligenceClass,
  row: EstateProductRow,
): string {
  switch (classification) {
    case "originator":
      return `Originates first-order intelligence through a live ${row.contract.fulfilmentType} run in the ${row.product?.category ?? "unknown"} product line.`;
    case "derivative":
      return "Transforms prior evidence or existing decision records into secondary board/report intelligence rather than originating a new intake.";
    case "wrapper":
      return "Packages underlying products as a bundle wrapper and does not act as a standalone intelligence origin.";
    case "infrastructure":
      return "Governs access, continuity, seats, or retained operating posture rather than acting as a direct intelligence surface.";
    case "fulfilment":
      return `Depends on ${row.contract.fulfilmentType} delivery, so the intelligence promise is inseparable from operator or session fulfilment.`;
    case "proof_surface":
      return "Acts as a published proof or evidence surface whose primary job is to expose reference intelligence rather than collect fresh case input.";
  }
}

function buildCoverageReason(row: EstateProductRow, matchedClasses: ProductIntelligenceClass[]): string {
  if (!row.product) {
    return "Product exists in the canonical fulfilment estate but is missing from the commercial catalog.";
  }

  if (matchedClasses.length === 0) {
    return `No product-intelligence class matched category "${row.product.category}" and fulfilmentType "${row.contract.fulfilmentType}".`;
  }

  return `Matched multiple classes from category "${row.product.category}" and fulfilmentType "${row.contract.fulfilmentType}".`;
}

export function buildProductIntelligenceClassificationReport(): ProductIntelligenceClassificationReport {
  const rows = listEstateRows();
  const duplicateRegistryProductCodes = findDuplicateProductCodes(
    rows.map((row) => row.productCode),
  );
  const canonicalProductCodes = [...new Set(rows.map((row) => row.productCode))];
  const rowsByProductCode = new Map<string, EstateProductRow>();

  for (const row of rows) {
    if (!rowsByProductCode.has(row.productCode)) {
      rowsByProductCode.set(row.productCode, row);
    }
  }

  const classifications: ProductIntelligenceClassification[] = [];
  const unclassifiedProducts: ProductIntelligenceCoverageGap[] = [];
  const multiplyClassifiedProducts: ProductIntelligenceCoverageGap[] = [];
  const countsByClass = buildCountsByClass();

  for (const productCode of canonicalProductCodes) {
    const row = rowsByProductCode.get(productCode);
    if (!row) {
      continue;
    }

    const matchedClasses = getMatchedClasses(row);

    if (matchedClasses.length === 0) {
      unclassifiedProducts.push({
        productCode,
        displayName: row.displayName,
        matchedClasses,
        reason: buildCoverageReason(row, matchedClasses),
      });
      continue;
    }

    if (matchedClasses.length > 1) {
      multiplyClassifiedProducts.push({
        productCode,
        displayName: row.displayName,
        matchedClasses,
        reason: buildCoverageReason(row, matchedClasses),
      });
      continue;
    }

    const classification = matchedClasses[0]!;
    countsByClass[classification] += 1;
    classifications.push({
      productCode,
      displayName: row.product?.displayName ?? row.displayName,
      category: row.product!.category,
      commercialStatus: row.product?.commercialStatus ?? null,
      fulfilmentType: row.contract.fulfilmentType,
      classification,
      rationale: buildClassificationRationale(classification, row),
    });
  }

  classifications.sort((left, right) => left.productCode.localeCompare(right.productCode));
  unclassifiedProducts.sort((left, right) => left.productCode.localeCompare(right.productCode));
  multiplyClassifiedProducts.sort((left, right) => left.productCode.localeCompare(right.productCode));

  const completeCoverage =
    duplicateRegistryProductCodes.length === 0 &&
    unclassifiedProducts.length === 0 &&
    multiplyClassifiedProducts.length === 0 &&
    classifications.length === canonicalProductCodes.length;

  return {
    generatedAt: new Date().toISOString(),
    expectedProductCount: rows.length,
    uniqueProductCount: canonicalProductCodes.length,
    classifiedProductCount: classifications.length,
    completeCoverage,
    canonicalProductCodes: [...canonicalProductCodes].sort(),
    duplicateRegistryProductCodes,
    unclassifiedProducts,
    multiplyClassifiedProducts,
    countsByClass,
    classifications,
  };
}

export function assertCompleteProductIntelligenceClassificationCoverage(): void {
  const report = buildProductIntelligenceClassificationReport();
  const failures: string[] = [];

  if (report.duplicateRegistryProductCodes.length > 0) {
    failures.push(
      `Duplicate product codes in canonical estate: ${report.duplicateRegistryProductCodes.join(", ")}`,
    );
  }

  if (report.unclassifiedProducts.length > 0) {
    failures.push(
      `Unclassified products: ${report.unclassifiedProducts
        .map((entry) => entry.productCode)
        .join(", ")}`,
    );
  }

  if (report.multiplyClassifiedProducts.length > 0) {
    failures.push(
      `Multiply classified products: ${report.multiplyClassifiedProducts
        .map((entry) => `${entry.productCode} (${entry.matchedClasses.join("|")})`)
        .join(", ")}`,
    );
  }

  if (failures.length > 0) {
    throw new Error(
      `Product intelligence classification coverage is incomplete.\n${failures.join("\n")}`,
    );
  }
}

export function listAllProductIntelligenceClassifications(): ProductIntelligenceClassification[] {
  const report = buildProductIntelligenceClassificationReport();
  assertCompleteProductIntelligenceClassificationCoverage();
  return report.classifications;
}

export function getProductIntelligenceClassification(
  productCode: string,
): ProductIntelligenceClassification {
  const report = buildProductIntelligenceClassificationReport();

  if (!report.canonicalProductCodes.includes(productCode)) {
    throw new Error(
      `Unknown or out-of-scope product "${productCode}". Product intelligence classification fails closed outside the canonical product estate.`,
    );
  }

  const classification = report.classifications.find((entry) => entry.productCode === productCode);

  if (!classification) {
    throw new Error(
      `Product "${productCode}" is not safely classified. Run assertCompleteProductIntelligenceClassificationCoverage() to inspect coverage failures.`,
    );
  }

  return classification;
}

export function getProductIntelligenceClass(productCode: string): ProductIntelligenceClass {
  return getProductIntelligenceClassification(productCode).classification;
}
