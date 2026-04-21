// lib/positioning/claim-package-governor.ts
// Prevents offers from advertising capabilities their package cannot deliver.

import type { OfferPackage } from "./package-model";
import type { ClaimEvidence, ClaimDecision } from "@/lib/claims/claim-governor";
import { resolveClaimSet } from "@/lib/claims/claim-governor";

type PackageClaim =
  | "governed_executive_brief"
  | "structural_diagnosis"
  | "consequence_pricing"
  | "financial_exposure"
  | "governed_priority_stack"
  | "trajectory_outlook"
  | "benchmark_position"
  | "team_wide_sentiment"
  | "directional_team_signal"
  | "leadership_team_view"
  | "monitoring_posture"
  | "longitudinal_tracking"
  | "enterprise_signal_integration"
  | "escalation_environment"
  | "respondent_campaign"
  | "continuous_asset_access";

/** Claims each package can potentially make (at maximum capability). */
const PACKAGE_POTENTIAL_CLAIMS: Record<OfferPackage, PackageClaim[]> = {
  executive_report_single: [
    "governed_executive_brief",
    "structural_diagnosis",
    "consequence_pricing",
    "financial_exposure",
    "governed_priority_stack",
    "trajectory_outlook",
    "benchmark_position",
    "team_wide_sentiment",
    "directional_team_signal",
    "leadership_team_view",
    "monitoring_posture",
    "enterprise_signal_integration",
  ],
  executive_report_sponsored: [
    "governed_executive_brief",
    "structural_diagnosis",
    "consequence_pricing",
    "financial_exposure",
    "governed_priority_stack",
    "trajectory_outlook",
    "benchmark_position",
    "team_wide_sentiment",
    "directional_team_signal",
    "leadership_team_view",
    "monitoring_posture",
    "enterprise_signal_integration",
  ],
  team_reality_campaign: [
    "respondent_campaign",
    "team_wide_sentiment",
    "directional_team_signal",
    "leadership_team_view",
  ],
  monitoring_subscription: [
    "monitoring_posture",
    "longitudinal_tracking",
    "trajectory_outlook",
    "governed_executive_brief",
  ],
  strategy_room_escalation: [
    "escalation_environment",
    "governed_executive_brief",
    "structural_diagnosis",
  ],
  asset_access_membership: [
    "continuous_asset_access",
  ],
};

/** Claims that are ALWAYS available without runtime proof. */
const UNCONDITIONAL_CLAIMS: PackageClaim[] = [
  "governed_executive_brief",
  "structural_diagnosis",
  "consequence_pricing",
  "financial_exposure",
  "governed_priority_stack",
  "leadership_team_view",
  "escalation_environment",
  "respondent_campaign",
  "continuous_asset_access",
];

/** Maps package claims to the claim-governor claim names that gate them. */
const CLAIM_GATE_MAP: Partial<Record<PackageClaim, keyof ReturnType<typeof resolveClaimSet>>> = {
  benchmark_position: "benchmarked",
  trajectory_outlook: "predictive",
  team_wide_sentiment: "team-wide sentiment",
  monitoring_posture: "monitoring",
  longitudinal_tracking: "monitoring",
  enterprise_signal_integration: "data-integrated",
};

export type PackageClaimResult = {
  packageId: OfferPackage;
  permittedClaims: PackageClaim[];
  blockedClaims: Array<{ claim: PackageClaim; reason: string }>;
  claimDecisions: Record<string, ClaimDecision>;
};

export function resolvePermittedPackageClaims(
  packageId: OfferPackage,
  runtimeEvidence: ClaimEvidence,
): PackageClaimResult {
  const potential = PACKAGE_POTENTIAL_CLAIMS[packageId] ?? [];
  const claims = resolveClaimSet(runtimeEvidence);

  const permitted: PackageClaim[] = [];
  const blocked: Array<{ claim: PackageClaim; reason: string }> = [];

  for (const claim of potential) {
    if (UNCONDITIONAL_CLAIMS.includes(claim)) {
      permitted.push(claim);
      continue;
    }

    const gateKey = CLAIM_GATE_MAP[claim];
    if (!gateKey) {
      // No explicit gate — allow by default if it's in the package potential
      permitted.push(claim);
      continue;
    }

    const decision = claims[gateKey];
    if (decision?.allowed) {
      permitted.push(claim);
    } else {
      blocked.push({
        claim,
        reason: decision?.reason ?? "Runtime evidence insufficient.",
      });
    }
  }

  return {
    packageId,
    permittedClaims: permitted,
    blockedClaims: blocked,
    claimDecisions: claims as Record<string, ClaimDecision>,
  };
}

/** Check if a specific claim is permitted for a package given runtime evidence. */
export function isClaimPermitted(
  packageId: OfferPackage,
  claim: PackageClaim,
  runtimeEvidence: ClaimEvidence,
): boolean {
  const result = resolvePermittedPackageClaims(packageId, runtimeEvidence);
  return result.permittedClaims.includes(claim);
}
