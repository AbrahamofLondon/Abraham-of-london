export type CategoryReadinessScope =
  | "pattern_demonstrated_on_selected_routes"
  | "product_group_demonstrated"
  | "estate_partially_governed"
  | "estate_authority_visible_with_findings"
  | "estate_category_demonstrated"
  | "not_category_ready";

export interface EstateAuthorityIntegrityResult {
  totalProducts: number;
  productsClassified: number;

  directAuthorityContracts: number;
  productsMissingAuthorityContract: string[];

  routesAudited: number;
  routesDemonstratingAuthority: number;

  checkoutFailures: string[];
  adminSurfaceFailures: string[];
  reportSurfaceFailures: string[];
  publicClaimFailures: string[];

  staticReferenceExemptions: Array<{
    productCode: string;
    explicit: boolean;
    reason: string;
    canClaimIntelligence: boolean;
    canClaimJudgement: boolean;
  }>;

  internalOnlyExemptions: Array<{
    productCode: string;
    explicit: boolean;
    reason: string;
  }>;

  localPassesThatCannotImplyEstateReadiness: string[];

  readinessScope: CategoryReadinessScope;
  gatePassed: boolean;
  blockingReasons: string[];
}

export interface EstateAuthorityIntegrityInput {
  totalProducts: number;
  productsClassified: number;
  directAuthorityContracts: number;
  productsMissingAuthorityContract: string[];
  routesAudited: number;
  routesDemonstratingAuthority: number;
  checkoutFailures: string[];
  adminSurfaceFailures: string[];
  reportSurfaceFailures: string[];
  publicClaimFailures: string[];
  staticReferenceExemptions: EstateAuthorityIntegrityResult["staticReferenceExemptions"];
  internalOnlyExemptions: EstateAuthorityIntegrityResult["internalOnlyExemptions"];
  localPassesThatCannotImplyEstateReadiness: string[];
}

export function evaluateEstateAuthorityIntegrity(
  input: EstateAuthorityIntegrityInput,
): EstateAuthorityIntegrityResult {
  const blockingReasons: string[] = [];

  if (input.totalProducts !== 43 || input.productsClassified !== input.totalProducts) {
    blockingReasons.push("43/43 products are not classified.");
  }
  if (input.publicClaimFailures.length > 0) {
    blockingReasons.push(`${input.publicClaimFailures.length} unsupported public claim failure(s).`);
  }
  if (input.checkoutFailures.length > 0) {
    blockingReasons.push(`${input.checkoutFailures.length} checkout / fulfilment authority failure(s).`);
  }
  if (input.adminSurfaceFailures.length > 0) {
    blockingReasons.push(`${input.adminSurfaceFailures.length} admin release authority failure(s).`);
  }
  if (input.reportSurfaceFailures.length > 0) {
    blockingReasons.push(`${input.reportSurfaceFailures.length} report-surface authority failure(s).`);
  }
  if (input.productsMissingAuthorityContract.length > 0) {
    blockingReasons.push(`${input.productsMissingAuthorityContract.length} product(s) missing direct ProductAuthorityContract coverage.`);
  }
  if (input.staticReferenceExemptions.some((exemption) => !exemption.explicit)) {
    blockingReasons.push("One or more static/reference exemptions are not explicit.");
  }
  if (input.internalOnlyExemptions.some((exemption) => !exemption.explicit)) {
    blockingReasons.push("One or more internal-only exemptions are not explicit.");
  }

  const gatePassed = blockingReasons.length === 0;
  const readinessScope = deriveReadinessScope(input, gatePassed);

  return {
    ...input,
    readinessScope,
    gatePassed,
    blockingReasons,
  };
}

function deriveReadinessScope(
  input: EstateAuthorityIntegrityInput,
  gatePassed: boolean,
): CategoryReadinessScope {
  if (gatePassed) return "estate_category_demonstrated";
  if (input.productsClassified === 43 && input.routesDemonstratingAuthority >= 8) {
    return "estate_authority_visible_with_findings";
  }
  if (input.productsClassified === 43) return "estate_partially_governed";
  if (input.routesDemonstratingAuthority >= 6) return "product_group_demonstrated";
  if (input.routesDemonstratingAuthority >= 3) return "pattern_demonstrated_on_selected_routes";
  return "not_category_ready";
}
