import "server-only";

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma.server";

export const MINIMUM_PUBLIC_DECISION_REGISTRY_AGGREGATION_THRESHOLD = 5;

export const SECTOR_TAXONOMY = [
  "professional_services",
  "financial_services",
  "technology",
  "healthcare",
  "education",
  "manufacturing",
  "public_sector",
  "other",
] as const;

export const COMPANY_SIZE_TAXONOMY = [
  "solo",
  "micro_2_10",
  "small_11_50",
  "mid_51_250",
  "large_251_1000",
  "enterprise_1000_plus",
] as const;

export const COST_OF_DELAY_METHODOLOGIES = [
  "self_reported_band",
  "revenue_at_risk",
  "operational_delay_cost",
  "governance_exposure_band",
  "admin_verified_estimate",
] as const;

export type RegistryAnonymisationInput = {
  email?: string | null;
  sectorTaxonomy?: string | null;
  companySizeBand?: string | null;
  regionTaxonomy?: string | null;
};

export function hashRegistryEmail(email: string): string {
  return crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function validateRegistryAnonymisation(input: RegistryAnonymisationInput): {
  valid: boolean;
  violations: string[];
  userEmailHash: string | null;
} {
  const violations: string[] = [];
  if (input.sectorTaxonomy && !SECTOR_TAXONOMY.includes(input.sectorTaxonomy as never)) {
    violations.push("Unknown sector taxonomy.");
  }
  if (input.companySizeBand && !COMPANY_SIZE_TAXONOMY.includes(input.companySizeBand as never)) {
    violations.push("Unknown company-size taxonomy.");
  }

  return {
    valid: violations.length === 0,
    violations,
    userEmailHash: input.email ? hashRegistryEmail(input.email) : null,
  };
}

export async function createInternalRegistryEntry(input: {
  sourceOutcomeRecordId?: string | null;
  sourceArtifactId?: string | null;
  productCode: string;
  email?: string | null;
  optInStatus?: "NOT_OPTED_IN" | "OPTED_IN" | "WITHDRAWN";
  sectorTaxonomy?: string | null;
  companySizeBand?: string | null;
  regionTaxonomy?: string | null;
  outcomeClass?: string | null;
  costOfDelayMethodology?: string | null;
  costOfDelayBand?: string | null;
}) {
  const anonymisation = validateRegistryAnonymisation(input);
  if (!anonymisation.valid) {
    throw new Error(`REGISTRY_ANONYMISATION_REJECTED: ${anonymisation.violations.join("; ")}`);
  }
  if (
    input.costOfDelayMethodology &&
    !COST_OF_DELAY_METHODOLOGIES.includes(input.costOfDelayMethodology as never)
  ) {
    throw new Error("REGISTRY_COST_OF_DELAY_REJECTED: Unknown methodology.");
  }

  const aggregationBucket = [
    input.productCode,
    input.sectorTaxonomy ?? "sector_unknown",
    input.companySizeBand ?? "size_unknown",
    input.outcomeClass ?? "outcome_unknown",
  ].join(":");

  return prisma.publicDecisionRegistryEntry.create({
    data: {
      sourceOutcomeRecordId: input.sourceOutcomeRecordId ?? null,
      sourceArtifactId: input.sourceArtifactId ?? null,
      productCode: input.productCode,
      optInStatus: input.optInStatus ?? "NOT_OPTED_IN",
      anonymisationStatus: "PENDING",
      adminReviewStatus: "PENDING",
      userEmailHash: anonymisation.userEmailHash,
      sectorTaxonomy: input.sectorTaxonomy ?? null,
      companySizeBand: input.companySizeBand ?? null,
      regionTaxonomy: input.regionTaxonomy ?? null,
      outcomeClass: input.outcomeClass ?? null,
      costOfDelayMethodology: input.costOfDelayMethodology ?? null,
      costOfDelayBand: input.costOfDelayBand ?? null,
      aggregationBucket,
      minimumAggregationThreshold: MINIMUM_PUBLIC_DECISION_REGISTRY_AGGREGATION_THRESHOLD,
      publishable: false,
    },
  });
}

export function canPublishRegistryAggregate(entry: {
  optInStatus: string;
  anonymisationStatus: string;
  adminReviewStatus: string;
  currentAggregationCount: number;
  minimumAggregationThreshold: number;
}): boolean {
  return (
    entry.optInStatus === "OPTED_IN" &&
    entry.anonymisationStatus === "APPROVED" &&
    entry.adminReviewStatus === "APPROVED" &&
    entry.currentAggregationCount >= entry.minimumAggregationThreshold
  );
}
