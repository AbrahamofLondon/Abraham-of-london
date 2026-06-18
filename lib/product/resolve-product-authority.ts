import {
  resolveEffectiveAuthorityState,
  type AuthorityProofCheck,
  type EffectiveAuthorityStateResult,
} from "./authority-grant-firewall";
import {
  canMakePublicClaim,
  getPublicClaimLanguage,
  type EvidenceSourceType,
  type ProductAuthorityContract,
  type ProductAuthorityState,
} from "./product-authority-contract";
import {
  getProductAuthorityEstateProducts,
  resolveProductAuthorityBackbone,
  type ProductAuthorityBackboneRecord,
} from "./product-qualification-backbone";
import { getExternalEvidenceGeneratedAt } from "./external-product-value-evidence";

const PRIOR_HISTORICAL_PRODUCTS = new Set([
  "fast_diagnostic",
  "team_assessment",
  "enterprise_assessment",
]);

const MEASUREMENT_INCONCLUSIVE_PRODUCTS = new Set(["personal_decision_audit"]);

const V2_BLOCKED_PRODUCTS = new Set([
  "boardroom_brief",
  "executive_reporting",
  "boardroom_mode",
]);

export interface ProductAuthorityResolverInput {
  productCode: string;
  currentClassification?: string;
  derivedEvidenceState?: unknown;
  policyState?: Exclude<
    ProductAuthorityState,
    "externally_proven_gold_product" | "diagnostic_product" | "judgement_product"
  >;
  policyReason?: string;
  v2EvidencePath?: string;
  priorV1Evidence?: {
    sourceType: "wave2g" | "historical" | "none";
    status?: string;
  };
  validationResults?: {
    antiToyPassed?: boolean;
    redTeamPassed?: boolean;
    genericAiComparisonPassed?: boolean;
    marketComparisonPassed?: boolean;
    releaseFirewallPassed?: boolean;
    constitutionPassed?: boolean;
    noMockAuthorityPassed?: boolean;
    antiGamingPassed?: boolean;
    adversarialValidationPassed?: boolean;
  };
  boundary?: {
    productChangedThisPass?: boolean;
    scorerChangedThisPass?: boolean;
    scenarioChangedThisPass?: boolean;
    benchmarkChangedThisPass?: boolean;
    validationInfrastructureChangedThisPass?: boolean;
    gateLogicChangedThisPass?: boolean;
    mockAuthorityUsed?: boolean;
  };
}

export interface EffectiveProductAuthorityResolution {
  contract: ProductAuthorityContract;
  declaredAuthorityState: ProductAuthorityState;
  effectiveAuthorityState: ProductAuthorityState;
  authoritySuppressionReason: string | null;
  evidenceProofStatus: EffectiveAuthorityStateResult["evidenceProofStatus"];
  missingChecks: AuthorityProofCheck[];
  canMakePublicClaims: boolean;
  publicLanguage: string;
}

function mapBackboneToAuthorityState(backbone: ProductAuthorityBackboneRecord): ProductAuthorityState {
  if (backbone.authorityClearance.state === "authority_cleared") {
    return "diagnostic_product";
  }
  if (backbone.productId === "team_assessment") {
    return "legacy_validated_pending_v2_revalidation";
  }
  if (backbone.productId === "enterprise_assessment" && !backbone.evidence.evidenceLedgerEntryExists) {
    return "legacy_validated_pending_v2_revalidation";
  }
  if (V2_BLOCKED_PRODUCTS.has(backbone.productId) || backbone.authorityClearance.state === "revalidation_required") {
    return "blocked_until_v2_revalidation";
  }
  if (MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(backbone.productId)) {
    return "blocked_until_claim_evidenced";
  }
  if (backbone.evidence.evidenceState === "verified" || backbone.evidence.evidenceState === "source_backed") {
    return "pending_reconciliation";
  }
  return "blocked_until_claim_evidenced";
}

function mapBackboneToEvidenceSourceType(
  backbone: ProductAuthorityBackboneRecord,
): EvidenceSourceType {
  if (backbone.evidence.evidenceLedgerEntryExists) {
    return "generated_evidence";
  }
  switch (backbone.evidence.evidenceState) {
    case "verified":
    case "source_backed":
    case "insufficient":
      return "structured_external_evidence";
    case "missing":
      return "explicit_missing_evidence";
    case "blocked":
    case "not_applicable":
      return "explicit_blocked_evidence";
    case "proxy_backed":
      return "reported_summary_only";
  }
}

function buildBoundary(input: ProductAuthorityResolverInput) {
  return {
    productChangedThisPass: input.boundary?.productChangedThisPass ?? false,
    scorerChangedThisPass:
      input.boundary?.scorerChangedThisPass ??
      MEASUREMENT_INCONCLUSIVE_PRODUCTS.has(input.productCode),
    scenarioChangedThisPass: input.boundary?.scenarioChangedThisPass ?? false,
    benchmarkChangedThisPass: input.boundary?.benchmarkChangedThisPass ?? false,
    validationInfrastructureChangedThisPass:
      input.boundary?.validationInfrastructureChangedThisPass ?? false,
    gateLogicChangedThisPass: input.boundary?.gateLogicChangedThisPass ?? false,
    mockAuthorityUsed: input.boundary?.mockAuthorityUsed ?? false,
  };
}

function renderedOutputCaptured(backbone: ProductAuthorityBackboneRecord): boolean {
  return backbone.evidence.evidenceSources.some((source) =>
    source.sourceType === "rendered_output_review" ||
    source.sourceType === "live_route_capture" ||
    source.sourceType === "evidence_ledger"
  );
}

function buildEvidenceSupportedClaim(
  state: ProductAuthorityState,
  backbone: ProductAuthorityBackboneRecord,
): string {
  if (backbone.authorityClearance.state === "authority_cleared") {
    return `${backbone.productId} is authority-cleared under source-backed evidence.`;
  }
  switch (state) {
    case "legacy_validated_pending_v2_revalidation":
      return `${backbone.productId} retains legacy evidence only; v2 revalidation remains incomplete.`;
    case "blocked_until_v2_revalidation":
      return `${backbone.productId} requires v2 revalidation before authority can progress.`;
    case "pending_reconciliation":
      return `${backbone.productId} has structured evidence, but authority remains unresolved without full clearance.`;
    default:
      return `${backbone.productId} authority is not granted.`;
  }
}

export function resolveProductAuthority(
  input: ProductAuthorityResolverInput,
): ProductAuthorityContract {
  const backbone = resolveProductAuthorityBackbone(input.productCode);
  const state = input.policyState ?? mapBackboneToAuthorityState(backbone);
  const evidenceSourceType = mapBackboneToEvidenceSourceType(backbone);
  const boundary = buildBoundary(input);
  const publicClaimAllowed = backbone.authorityClearance.publicClaimPermission;
  const publicClaimLanguage = publicClaimAllowed
    ? getPublicClaimLanguage(state, input.productCode)
    : buildEvidenceSupportedClaim(state, backbone);

  return {
    productCode: input.productCode,
    targetClaim: `${backbone.productName} is a validated product.`,
    evidenceSupportedClaim: buildEvidenceSupportedClaim(state, backbone),
    currentAuthorityState: state,
    evidenceSource: {
      sourceType: evidenceSourceType,
      canGrantAuthority: publicClaimAllowed,
      canonicalLocation: backbone.evidence.evidenceLedgerEntryExists
        ? "reports/product-value-evidence-ledger-v2.json"
        : backbone.evidence.evidenceSources[0]?.location,
    },
    validation: {
      evidenceLedgerV2Present: backbone.evidence.evidenceLedgerEntryExists,
      evidenceLedgerHash: backbone.evidence.evidenceLedgerEntryId ?? undefined,
      scenarioSetHash: backbone.evidence.evidenceLedgerEntryExists
        ? "reports/product-value-evidence-ledger-v2.json"
        : undefined,
      outputHash: renderedOutputCaptured(backbone)
        ? backbone.evidence.evidenceSources.find((source) =>
            source.sourceType === "rendered_output_review" ||
            source.sourceType === "live_route_capture"
          )?.location
        : undefined,
      renderedOutputCaptured: renderedOutputCaptured(backbone),
      antiToyPassed: input.validationResults?.antiToyPassed ?? backbone.antiToy.state === "passed",
      redTeamPassed: input.validationResults?.redTeamPassed ?? backbone.redTeam.state === "passed",
      genericAiComparisonPassed:
        input.validationResults?.genericAiComparisonPassed ??
        backbone.genericAiComparison.state === "passed",
      marketComparisonPassed:
        input.validationResults?.marketComparisonPassed ??
        backbone.marketComparison.state === "passed",
      releaseFirewallPassed:
        input.validationResults?.releaseFirewallPassed ?? backbone.releaseFirewall.passed,
      constitutionPassed:
        input.validationResults?.constitutionPassed ??
        backbone.adapterVerification.validationConstitution.state === "passed",
      noMockAuthorityPassed:
        input.validationResults?.noMockAuthorityPassed ?? backbone.noMockAuthority.state === "passed",
      antiGamingPassed:
        input.validationResults?.antiGamingPassed ??
        backbone.adapterVerification.antiGaming.state === "passed",
      adversarialValidationPassed:
        input.validationResults?.adversarialValidationPassed ??
        backbone.adapterVerification.adversarialValidation.state === "passed",
    },
    boundary,
    blockingReasons: [
      ...backbone.blockerSummary,
      ...(input.policyReason ? [input.policyReason] : []),
    ],
    nextEvidenceAction:
      backbone.nextRequiredEvidence[0] ??
      "No next evidence action recorded.",
    publicClaimAllowed,
    publicClaimLanguage,
    contractVersion: "v2",
    lastValidatedAt: backbone.evidence.evidenceSources[0]?.freshness === "current"
      ? new Date().toISOString()
      : getExternalEvidenceDate(),
    authorityClearanceState: backbone.authorityClearance.state,
    authorityBackbone: backbone,
  };
}

function getExternalEvidenceDate(): string | undefined {
  return getExternalEvidenceGeneratedAt() ?? undefined;
}

export function resolveEffectiveProductAuthority(
  input: ProductAuthorityResolverInput,
  proofChecks: Partial<Record<AuthorityProofCheck, boolean>>,
  options: { boardFacingProduct?: boolean } = {},
): EffectiveProductAuthorityResolution {
  const contract = resolveProductAuthority(input);
  const effective = resolveEffectiveAuthorityState({
    productCode: contract.productCode,
    declaredAuthorityState: contract.currentAuthorityState,
    requiredChecks: proofChecks,
    boardFacingProduct: options.boardFacingProduct,
  });

  return {
    contract,
    declaredAuthorityState: effective.declaredAuthorityState,
    effectiveAuthorityState: effective.effectiveAuthorityState,
    authoritySuppressionReason: effective.authoritySuppressionReason,
    evidenceProofStatus: effective.evidenceProofStatus,
    missingChecks: effective.missingChecks,
    canMakePublicClaims: canMakePublicClaim(effective.effectiveAuthorityState),
    publicLanguage: getPublicClaimLanguage(effective.effectiveAuthorityState, contract.productCode),
  };
}

export function getDefaultProductConfigurations(): ProductAuthorityResolverInput[] {
  return getProductAuthorityEstateProducts().map((product) => ({ productCode: product.code }));
}

export const PUBLIC_NON_EXEMPT_PRODUCT_AUTHORITY_CONFIGS: ProductAuthorityResolverInput[] =
  getDefaultProductConfigurations();
