import { getProduct, type ProductCategory } from "@/lib/commercial/catalog";
import {
  buildProductAuthorityBackboneReport,
  type ProductAuthorityBackboneRecord,
  type ProductAuthorityBackboneReport,
} from "@/lib/product/product-qualification-backbone";
import {
  PRODUCT_SURFACE_REGISTRY,
  type ProductSurface,
  type SurfaceType,
} from "@/lib/product/product-surface-registry";

type EvidenceSource =
  ProductAuthorityBackboneRecord["evidence"]["evidenceSources"][number];

type EvidenceState = ProductAuthorityBackboneRecord["evidence"]["evidenceState"];
type LedgerStatus = ProductAuthorityBackboneRecord["ledger"]["ledgerStatus"];
type AuthorityState = ProductAuthorityBackboneRecord["authorityClearance"]["state"];
type ValidationState = ProductAuthorityBackboneRecord["validationState"];
type SourceCoverageLevel = ProductAuthorityBackboneRecord["evidence"]["sourceCoverageLevel"];
type SourceApplicability = ProductAuthorityBackboneRecord["evidence"]["sourceApplicability"];
type SourceFreshness = ProductAuthorityBackboneRecord["evidence"]["sourceFreshness"];

const WRAPPER_CATEGORIES = new Set<ProductCategory>([
  "bundle",
  "membership",
  "retainer",
]);

const DERIVATIVE_CATEGORIES = new Set<ProductCategory>([
  "intelligence",
  "reporting",
  "reporting_premium",
]);

const ORIGINATOR_CATEGORIES = new Set<ProductCategory>([
  "decision_tools",
  "execution",
  "execution_premium",
  "governed_playbook",
]);

const ORIGINATOR_SURFACE_TYPES = new Set<SurfaceType>([
  "diagnostic",
  "instrument",
  "corridor_stage",
  "product",
]);

export type ProductJudgementRunRole =
  | "originator"
  | "derivative"
  | "wrapper"
  | "proof_surface"
  | "fulfilment"
  | "unsupported";

export interface ProductEvidenceLedgerSource {
  sourceId: string;
  sourceType: EvidenceSource["sourceType"];
  location: string;
  applicability: EvidenceSource["applicability"];
  freshness: EvidenceSource["freshness"];
  note?: string;
}

export interface ProductJudgementRunPolicy {
  role: ProductJudgementRunRole;
  mayOriginateJudgementRuns: boolean;
  primarySurfaceType: SurfaceType | "no_surface";
  surfaceTypes: Array<SurfaceType | "no_surface">;
  blockers: string[];
  rationale: string[];
}

export interface ProductEvidenceLedgerEntry {
  productId: string;
  productName: string;
  productFamily: string;
  category: ProductCategory | "unclassified";
  evidenceState: EvidenceState;
  ledgerStatus: LedgerStatus;
  authorityState: AuthorityState;
  validationState: ValidationState;
  publicClaimPermission: boolean;
  evidenceLedgerEntryExists: boolean;
  evidenceLedgerEntryId: string | null;
  sourceCoverageLevel: SourceCoverageLevel;
  sourceApplicability: SourceApplicability;
  sourceFreshness: SourceFreshness;
  sourceIds: string[];
  evidenceSources: ProductEvidenceLedgerSource[];
  blockReasons: string[];
  nextRequiredEvidence: string[];
  judgementRunPolicy: ProductJudgementRunPolicy;
}

export interface ProductEvidenceLedgerSummary {
  totalProducts: number;
  productsWithLedgerEntries: number;
  ledgerStates: Record<LedgerStatus, number>;
  evidenceStates: Record<EvidenceState, number>;
  authorityStates: Record<AuthorityState, number>;
  validationStates: Record<ValidationState, number>;
  runRoles: Record<ProductJudgementRunRole, number>;
}

export interface ProductEvidenceLedgerReport {
  generatedAt: string;
  sourceReportGeneratedAt: string;
  source: "phase_8b_product_authority_backbone";
  totalProducts: number;
  summary: ProductEvidenceLedgerSummary;
  entries: ProductEvidenceLedgerEntry[];
}

let cachedLedger: ProductEvidenceLedgerReport | null = null;

function increment<T extends string>(bucket: Record<T, number>, key: T): void {
  bucket[key] += 1;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function getCatalogSurfaces(productId: string): ProductSurface[] {
  return PRODUCT_SURFACE_REGISTRY.filter((surface) => surface.catalogProductCode === productId);
}

function getSurfaceTypes(surfaces: ProductSurface[]): Array<SurfaceType | "no_surface"> {
  const surfaceTypes = [...new Set(surfaces.map((surface) => surface.surfaceType))];
  return surfaceTypes.length > 0 ? surfaceTypes : ["no_surface"];
}

function getPrimarySurfaceType(surfaceTypes: Array<SurfaceType | "no_surface">): SurfaceType | "no_surface" {
  const preferred = surfaceTypes.find((surfaceType) =>
    surfaceType !== "no_surface" && ORIGINATOR_SURFACE_TYPES.has(surfaceType),
  );
  return preferred ?? surfaceTypes[0] ?? "no_surface";
}

function buildRunPolicy(
  backboneProduct: ProductAuthorityBackboneRecord,
  category: ProductCategory | undefined,
  surfaces: ProductSurface[],
): ProductJudgementRunPolicy {
  const surfaceTypes = getSurfaceTypes(surfaces);
  const primarySurfaceType = getPrimarySurfaceType(surfaceTypes);

  if (category === "evidence") {
    return {
      role: "proof_surface",
      mayOriginateJudgementRuns: false,
      primarySurfaceType,
      surfaceTypes,
      blockers: ["Evidence and proof products may display or verify judgement outputs, but they must not originate them."],
      rationale: ["Catalog category is evidence, so the surface is treated as a proof surface."],
    };
  }

  if (category && WRAPPER_CATEGORIES.has(category)) {
    return {
      role: "wrapper",
      mayOriginateJudgementRuns: false,
      primarySurfaceType,
      surfaceTypes,
      blockers: ["Wrapper, bundle, membership, and retainer products may route or entitle access, but they must not originate judgement runs."],
      rationale: [`Catalog category ${category} is a wrapper-style commercial surface.`],
    };
  }

  if (category && DERIVATIVE_CATEGORIES.has(category)) {
    return {
      role: "derivative",
      mayOriginateJudgementRuns: false,
      primarySurfaceType,
      surfaceTypes,
      blockers: ["Derivative report and intelligence products may package findings, but they must not originate judgement runs."],
      rationale: [`Catalog category ${category} is a derivative output surface.`],
    };
  }

  if (
    surfaceTypes.length > 0 &&
    surfaceTypes.every((surfaceType) => surfaceType === "proof_surface")
  ) {
    return {
      role: "proof_surface",
      mayOriginateJudgementRuns: false,
      primarySurfaceType,
      surfaceTypes,
      blockers: ["Proof surfaces are evidence-review surfaces and must not originate judgement runs."],
      rationale: ["All mapped product surfaces are proof surfaces."],
    };
  }

  if (
    surfaceTypes.length > 0 &&
    surfaceTypes.every((surfaceType) => surfaceType === "fulfilment_layer")
  ) {
    return {
      role: "fulfilment",
      mayOriginateJudgementRuns: false,
      primarySurfaceType,
      surfaceTypes,
      blockers: ["Fulfilment surfaces may deliver an existing judgement artifact, but they must not originate judgement runs."],
      rationale: ["All mapped product surfaces are fulfilment layers."],
    };
  }

  if (category && ORIGINATOR_CATEGORIES.has(category)) {
    return {
      role: "originator",
      mayOriginateJudgementRuns: true,
      primarySurfaceType,
      surfaceTypes,
      blockers: [],
      rationale: [`Catalog category ${category} is permitted to originate judgement runs.`],
    };
  }

  return {
    role: "unsupported",
    mayOriginateJudgementRuns: false,
    primarySurfaceType,
    surfaceTypes,
    blockers: [
      `No explicit judgement-run origination contract exists for product category ${category ?? "unclassified"}.`,
    ],
    rationale: ["The product does not match an originator, wrapper, derivative, fulfilment, or proof-surface contract."],
  };
}

function toLedgerSource(source: EvidenceSource): ProductEvidenceLedgerSource {
  return {
    sourceId: source.sourceId,
    sourceType: source.sourceType,
    location: source.location,
    applicability: source.applicability,
    freshness: source.freshness,
    note: source.note,
  };
}

function toLedgerEntry(backboneProduct: ProductAuthorityBackboneRecord): ProductEvidenceLedgerEntry {
  const catalogProduct = getProduct(backboneProduct.productId);
  const category = catalogProduct?.category ?? "unclassified";
  const surfaces = getCatalogSurfaces(backboneProduct.productId);
  const judgementRunPolicy = buildRunPolicy(backboneProduct, catalogProduct?.category, surfaces);

  return {
    productId: backboneProduct.productId,
    productName: backboneProduct.productName,
    productFamily: backboneProduct.productFamily,
    category,
    evidenceState: backboneProduct.evidence.evidenceState,
    ledgerStatus: backboneProduct.ledger.ledgerStatus,
    authorityState: backboneProduct.authorityClearance.state,
    validationState: backboneProduct.validationState,
    publicClaimPermission: backboneProduct.authorityClearance.publicClaimPermission,
    evidenceLedgerEntryExists: backboneProduct.evidence.evidenceLedgerEntryExists,
    evidenceLedgerEntryId: backboneProduct.evidence.evidenceLedgerEntryId,
    sourceCoverageLevel: backboneProduct.evidence.sourceCoverageLevel,
    sourceApplicability: backboneProduct.evidence.sourceApplicability,
    sourceFreshness: backboneProduct.evidence.sourceFreshness,
    sourceIds: backboneProduct.evidence.evidenceSources.map((source) => source.sourceId),
    evidenceSources: backboneProduct.evidence.evidenceSources.map(toLedgerSource),
    blockReasons: uniqueStrings([
      ...backboneProduct.evidence.blockers,
      ...backboneProduct.authorityClearance.blockers,
      ...backboneProduct.blockerSummary,
    ]),
    nextRequiredEvidence: uniqueStrings([
      ...backboneProduct.evidence.nextRequiredEvidence,
      ...backboneProduct.nextRequiredEvidence,
      ...backboneProduct.ledger.missingSources,
    ]),
    judgementRunPolicy,
  };
}

function buildSummary(entries: ProductEvidenceLedgerEntry[]): ProductEvidenceLedgerSummary {
  const ledgerStates: Record<LedgerStatus, number> = {
    real_entry: 0,
    missing_entry: 0,
    not_applicable: 0,
    blocked_until_source: 0,
  };
  const evidenceStates: Record<EvidenceState, number> = {
    verified: 0,
    source_backed: 0,
    proxy_backed: 0,
    insufficient: 0,
    missing: 0,
    blocked: 0,
    not_applicable: 0,
  };
  const authorityStates: Record<AuthorityState, number> = {
    authority_cleared: 0,
    blocked: 0,
    evidence_incomplete: 0,
    revalidation_required: 0,
    not_release_eligible: 0,
    not_claim_eligible: 0,
  };
  const validationStates: Record<ValidationState, number> = {
    passed: 0,
    failed: 0,
    missing_source: 0,
    blocked: 0,
    insufficient: 0,
    not_applicable: 0,
    requires_product_review: 0,
  };
  const runRoles: Record<ProductJudgementRunRole, number> = {
    originator: 0,
    derivative: 0,
    wrapper: 0,
    proof_surface: 0,
    fulfilment: 0,
    unsupported: 0,
  };

  for (const entry of entries) {
    increment(ledgerStates, entry.ledgerStatus);
    increment(evidenceStates, entry.evidenceState);
    increment(authorityStates, entry.authorityState);
    increment(validationStates, entry.validationState);
    increment(runRoles, entry.judgementRunPolicy.role);
  }

  return {
    totalProducts: entries.length,
    productsWithLedgerEntries: entries.filter((entry) => entry.evidenceLedgerEntryExists).length,
    ledgerStates,
    evidenceStates,
    authorityStates,
    validationStates,
    runRoles,
  };
}

function buildLedgerReportFromBackbone(
  backboneReport: ProductAuthorityBackboneReport,
): ProductEvidenceLedgerReport {
  const entries = backboneReport.products
    .map(toLedgerEntry)
    .sort((left, right) => left.productId.localeCompare(right.productId));

  return {
    generatedAt: new Date().toISOString(),
    sourceReportGeneratedAt: backboneReport.generatedAt,
    source: "phase_8b_product_authority_backbone",
    totalProducts: entries.length,
    summary: buildSummary(entries),
    entries,
  };
}

export function buildProductEvidenceLedger(): ProductEvidenceLedgerReport {
  if (!cachedLedger) {
    cachedLedger = buildLedgerReportFromBackbone(buildProductAuthorityBackboneReport());
  }
  return cachedLedger;
}

export function listProductEvidenceLedgerEntries(): ProductEvidenceLedgerEntry[] {
  return buildProductEvidenceLedger().entries;
}

export function getProductEvidenceLedgerEntry(productId: string): ProductEvidenceLedgerEntry | null {
  return buildProductEvidenceLedger().entries.find((entry) => entry.productId === productId) ?? null;
}

export function getProductEvidenceLedgerSummary(): ProductEvidenceLedgerSummary {
  return buildProductEvidenceLedger().summary;
}
