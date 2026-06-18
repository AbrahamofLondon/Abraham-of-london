import {
  getProductEvidenceLedgerEntry,
  type ProductEvidenceLedgerEntry,
  type ProductEvidenceLedgerSource,
  type ProductJudgementRunRole,
} from "@/lib/intelligence/product-evidence-ledger";

export type RunEvidenceConfidence = "exploratory" | "bounded" | "confident";

export type RunEvidenceLedgerDecision =
  | "originator_allowed"
  | "bounded_originator_allowed"
  | "blocked_missing_source_sets"
  | "blocked_unknown_product"
  | "blocked_non_originator_product"
  | "blocked_insufficient_product_evidence"
  | "blocked_authority_not_cleared";

export type RunEvidenceSourceSetStatus = "valid" | "missing" | "empty";

export interface RunEvidenceSourceRef {
  sourceId: string;
  sourceType: ProductEvidenceLedgerSource["sourceType"];
  location: string;
  note?: string;
}

export interface RunEvidenceSourceSet {
  sourceSetId: string;
  label: string;
  sources: RunEvidenceSourceRef[];
}

export interface RunEvidenceSourceSetEvaluation {
  status: RunEvidenceSourceSetStatus;
  totalSets: number;
  totalSources: number;
  blockers: string[];
}

export interface RunEvidenceLedgerInput {
  productId: string;
  requestedConfidence: RunEvidenceConfidence;
  sourceSets: RunEvidenceSourceSet[];
  runLabel?: string;
}

export interface RunEvidenceLedgerEntry {
  productId: string;
  productName: string;
  requestedConfidence: RunEvidenceConfidence;
  maximumPermittedConfidence: RunEvidenceConfidence | "none";
  decision: RunEvidenceLedgerDecision;
  mayRun: boolean;
  confidentOriginatorAllowed: boolean;
  sourceSetStatus: RunEvidenceSourceSetStatus;
  sourceSets: RunEvidenceSourceSet[];
  productEvidence: Pick<
    ProductEvidenceLedgerEntry,
    | "evidenceState"
    | "ledgerStatus"
    | "authorityState"
    | "evidenceLedgerEntryExists"
    | "evidenceLedgerEntryId"
  > | null;
  productRunRole: ProductJudgementRunRole | "unknown_product";
  blockers: string[];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function isSourceBackedEnough(product: ProductEvidenceLedgerEntry): boolean {
  return product.evidenceState === "verified" || product.evidenceState === "source_backed";
}

function resolveMaximumPermittedConfidence(
  product: ProductEvidenceLedgerEntry,
  sourceSetStatus: RunEvidenceSourceSetStatus,
): RunEvidenceConfidence | "none" {
  if (sourceSetStatus !== "valid") {
    return "none";
  }

  if (!product.judgementRunPolicy.mayOriginateJudgementRuns) {
    return "none";
  }

  if (!isSourceBackedEnough(product)) {
    return "none";
  }

  if (product.evidenceState === "verified" && product.authorityState === "authority_cleared") {
    return "confident";
  }

  return "bounded";
}

function buildInsufficientEvidenceBlockers(product: ProductEvidenceLedgerEntry): string[] {
  return uniqueStrings([
    `Product evidence state ${product.evidenceState} does not support originating a judgement run.`,
    `Ledger status ${product.ledgerStatus} is not strong enough for originator judgement.`,
    ...product.blockReasons,
  ]);
}

export function evaluateRunEvidenceSourceSets(
  sourceSets: RunEvidenceSourceSet[],
): RunEvidenceSourceSetEvaluation {
  if (sourceSets.length === 0) {
    return {
      status: "missing",
      totalSets: 0,
      totalSources: 0,
      blockers: ["Run evidence ledger requires at least one named source set."],
    };
  }

  const emptySets = sourceSets.filter((sourceSet) => sourceSet.sources.length === 0);
  if (emptySets.length > 0) {
    return {
      status: "empty",
      totalSets: sourceSets.length,
      totalSources: 0,
      blockers: emptySets.map(
        (sourceSet) => `Source set ${sourceSet.sourceSetId} is empty and cannot support a judgement run.`,
      ),
    };
  }

  return {
    status: "valid",
    totalSets: sourceSets.length,
    totalSources: sourceSets.reduce((total, sourceSet) => total + sourceSet.sources.length, 0),
    blockers: [],
  };
}

export function createProductEvidenceSourceSet(
  productId: string,
  options: { sourceSetId?: string; label?: string } = {},
): RunEvidenceSourceSet | null {
  const product = getProductEvidenceLedgerEntry(productId);
  if (!product) {
    return null;
  }

  return {
    sourceSetId: options.sourceSetId ?? `product-evidence:${productId}`,
    label: options.label ?? `${product.productName} evidence`,
    sources: product.evidenceSources.map((source) => ({
      sourceId: source.sourceId,
      sourceType: source.sourceType,
      location: source.location,
      note: source.note,
    })),
  };
}

export function buildRunEvidenceLedgerEntry(input: RunEvidenceLedgerInput): RunEvidenceLedgerEntry {
  const product = getProductEvidenceLedgerEntry(input.productId);
  const sourceSetEvaluation = evaluateRunEvidenceSourceSets(input.sourceSets);

  if (!product) {
    return {
      productId: input.productId,
      productName: input.productId,
      requestedConfidence: input.requestedConfidence,
      maximumPermittedConfidence: "none",
      decision: "blocked_unknown_product",
      mayRun: false,
      confidentOriginatorAllowed: false,
      sourceSetStatus: sourceSetEvaluation.status,
      sourceSets: input.sourceSets,
      productEvidence: null,
      productRunRole: "unknown_product",
      blockers: uniqueStrings([
        "Product does not exist in the Phase 8C.3 product evidence ledger.",
        ...sourceSetEvaluation.blockers,
      ]),
    };
  }

  const maximumPermittedConfidence = resolveMaximumPermittedConfidence(
    product,
    sourceSetEvaluation.status,
  );

  const baseEntry = {
    productId: product.productId,
    productName: product.productName,
    requestedConfidence: input.requestedConfidence,
    maximumPermittedConfidence,
    sourceSetStatus: sourceSetEvaluation.status,
    sourceSets: input.sourceSets,
    productEvidence: {
      evidenceState: product.evidenceState,
      ledgerStatus: product.ledgerStatus,
      authorityState: product.authorityState,
      evidenceLedgerEntryExists: product.evidenceLedgerEntryExists,
      evidenceLedgerEntryId: product.evidenceLedgerEntryId,
    },
    productRunRole: product.judgementRunPolicy.role,
  } satisfies Omit<
    RunEvidenceLedgerEntry,
    "decision" | "mayRun" | "confidentOriginatorAllowed" | "blockers"
  >;

  if (sourceSetEvaluation.status !== "valid") {
    return {
      ...baseEntry,
      decision: "blocked_missing_source_sets",
      mayRun: false,
      confidentOriginatorAllowed: false,
      blockers: sourceSetEvaluation.blockers,
    };
  }

  if (!product.judgementRunPolicy.mayOriginateJudgementRuns) {
    return {
      ...baseEntry,
      decision: "blocked_non_originator_product",
      mayRun: false,
      confidentOriginatorAllowed: false,
      blockers: product.judgementRunPolicy.blockers,
    };
  }

  if (maximumPermittedConfidence === "none") {
    return {
      ...baseEntry,
      decision: "blocked_insufficient_product_evidence",
      mayRun: false,
      confidentOriginatorAllowed: false,
      blockers: buildInsufficientEvidenceBlockers(product),
    };
  }

  if (input.requestedConfidence === "confident" && maximumPermittedConfidence !== "confident") {
    return {
      ...baseEntry,
      decision: "blocked_authority_not_cleared",
      mayRun: false,
      confidentOriginatorAllowed: false,
      blockers: uniqueStrings([
        "Confident originator judgement requires a verified product evidence state and authority_cleared posture.",
        `Product evidence state is ${product.evidenceState} and authority state is ${product.authorityState}.`,
        ...product.blockReasons,
      ]),
    };
  }

  return {
    ...baseEntry,
    decision:
      maximumPermittedConfidence === "confident" && input.requestedConfidence === "confident"
        ? "originator_allowed"
        : "bounded_originator_allowed",
    mayRun: true,
    confidentOriginatorAllowed:
      maximumPermittedConfidence === "confident" && input.requestedConfidence === "confident",
    blockers: [],
  };
}
