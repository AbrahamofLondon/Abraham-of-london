import { getProduct } from "@/lib/commercial/catalog";
import { getCorridorRecord, type OverclaimRisk, type ReadinessStatus } from "@/lib/product/paid-corridor-contract";
import { getSurfaceById, type SurfaceExposureStatus } from "@/lib/product/product-surface-registry";

export const DELIVERY_TRUTH_SURFACES = [
  "team_assessment",
  "enterprise_assessment",
  "executive_reporting",
  "boardroom_mode",
  "strategy_room",
] as const;

export type DeliveryTruthSurface = (typeof DELIVERY_TRUTH_SURFACES)[number];

export interface DeliverySurfaceContract {
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

function buildDeliverySurfaceContract(surface: DeliveryTruthSurface): DeliverySurfaceContract {
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

export const DELIVERY_SURFACE_CONTRACTS: DeliverySurfaceContract[] =
  DELIVERY_TRUTH_SURFACES.map(buildDeliverySurfaceContract);

export function getDeliverySurfaceContract(
  surface: DeliveryTruthSurface,
): DeliverySurfaceContract | undefined {
  return DELIVERY_SURFACE_CONTRACTS.find((contract) => contract.surface === surface);
}

export function getDeliverySurfaceTruthCeiling(surface: DeliveryTruthSurface): number {
  return getDeliverySurfaceContract(surface)?.deliveryCeiling ?? 0;
}
