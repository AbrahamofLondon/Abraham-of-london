import { getProduct } from "@/lib/commercial/catalog";
import {
  getCorridorRecord,
  type OverclaimRisk,
  type ReadinessStatus,
} from "@/lib/product/paid-corridor-contract";
import {
  getSurfaceById,
  type SurfaceExposureStatus,
} from "@/lib/product/product-surface-registry";

export const DELIVERY_TRUTH_SURFACES = [
  "team_assessment",
  "enterprise_assessment",
  "executive_reporting",
  "boardroom_mode",
  "strategy_room",
] as const;

export type DeliveryTruthSurface = (typeof DELIVERY_TRUTH_SURFACES)[number];

export type DeliveryReadabilityClass =
  | "board"
  | "executive"
  | "professional"
  | "basic"
  | "poor";

export interface DeliverySurfaceTemplate {
  surface: DeliveryTruthSurface;
  displayName: string;
  deliveryCeiling: number;
  currentReadiness: ReadinessStatus;
  riskOfOverclaiming: OverclaimRisk;
  exposureStatus: SurfaceExposureStatus;
  commercialStatus: string;
  primaryOutput: string;
  authorityGaps: string[];
  sourceRefs: string[];
}

export interface DeliverySurfaceContract {
  artifactId: string;
  productId: string;
  orderId?: string;
  hasStructuredSections: boolean;
  hasExecutiveSummary: boolean;
  hasForensicLayer: boolean;
  hasEvidenceReferences: boolean;
  hasProvenanceReference: boolean;
  hasConfidenceDisclosure: boolean;
  mobileParity: boolean;
  readabilityClass: DeliveryReadabilityClass;
  deliverySurfaceScore: 0 | 1 | 2 | 3 | 4 | 5;
}

export type DeliverySurfaceContractInput = Omit<
  DeliverySurfaceContract,
  "deliverySurfaceScore"
>;

function assertNever(_: never): never {
  throw new Error("Unhandled delivery readability class.");
}

function buildDeliverySurfaceTemplate(
  surface: DeliveryTruthSurface,
): DeliverySurfaceTemplate {
  const registry = getSurfaceById(surface);
  const corridor = getCorridorRecord(surface);
  const catalog = getProduct(surface);

  if (!registry) {
    throw new Error(`Missing product surface registry record for "${surface}".`);
  }
  if (!corridor) {
    throw new Error(`Missing paid corridor record for "${surface}".`);
  }
  if (!catalog) {
    throw new Error(`Missing catalog record for "${surface}".`);
  }

  return {
    surface,
    displayName: registry.displayName,
    deliveryCeiling: registry.currentScore,
    currentReadiness: corridor.currentReadiness,
    riskOfOverclaiming: corridor.riskOfOverclaiming,
    exposureStatus: registry.currentExposureStatus,
    commercialStatus: catalog.commercialStatus ?? "unknown",
    primaryOutput: corridor.primaryOutput,
    authorityGaps: registry.authorityGaps,
    sourceRefs: [
      "lib/product/product-surface-registry.ts",
      "lib/product/paid-corridor-contract.ts",
      "lib/commercial/catalog.ts",
    ],
  };
}

function getReadabilityWeight(readabilityClass: DeliveryReadabilityClass): number {
  switch (readabilityClass) {
    case "board":
      return 2;
    case "executive":
      return 2;
    case "professional":
      return 1;
    case "basic":
      return 0;
    case "poor":
      return -1;
    default:
      return assertNever(readabilityClass);
  }
}

function clampDeliverySurfaceScore(value: number): 0 | 1 | 2 | 3 | 4 | 5 {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return rounded as 0 | 1 | 2 | 3 | 4 | 5;
}

export const DELIVERY_SURFACE_TEMPLATES: DeliverySurfaceTemplate[] =
  DELIVERY_TRUTH_SURFACES.map(buildDeliverySurfaceTemplate);

export function getDeliverySurfaceTemplate(
  surface: DeliveryTruthSurface,
): DeliverySurfaceTemplate | undefined {
  return DELIVERY_SURFACE_TEMPLATES.find((template) => template.surface === surface);
}

export function getDeliverySurfaceTruthCeiling(surface: DeliveryTruthSurface): number {
  return getDeliverySurfaceTemplate(surface)?.deliveryCeiling ?? 0;
}

export function evaluateDeliverySurfaceContract(
  input: DeliverySurfaceContractInput,
): DeliverySurfaceContract {
  let rawScore = 0;

  if (input.hasStructuredSections) rawScore += 1;
  if (input.hasExecutiveSummary) rawScore += 1;
  if (input.hasForensicLayer) rawScore += 1;
  if (input.hasEvidenceReferences) rawScore += 1;
  if (input.hasProvenanceReference) rawScore += 1;
  if (input.hasConfidenceDisclosure) rawScore += 1;
  if (input.mobileParity) rawScore += 1;

  rawScore += getReadabilityWeight(input.readabilityClass);

  return {
    ...input,
    deliverySurfaceScore: clampDeliverySurfaceScore(rawScore / 2),
  };
}
