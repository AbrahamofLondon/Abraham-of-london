import fs from "fs";
import path from "path";

import { adaptEstateDispositionToReleaseGovernance } from "@/lib/product/product-release-governance-schema";
import type { ProductReleaseGovernance } from "@/lib/product/product-release-governance";

export type AssessmentReleaseState = "PUBLIC" | "CONTROLLED" | "INTERNAL" | "RETIRED";
export type AssessmentProgressionState =
  | "ENTRY"
  | "AVAILABLE"
  | "RECOMMENDED_AFTER_PRIOR_EVIDENCE"
  | "EARNED"
  | "COMPLETED";
export type AssessmentClaimBoundary =
  | "BOUNDED_OPERATIONAL_CLAIMS"
  | "EVIDENCE_LIMITED"
  | "CONTROLLED_HUMAN_REVIEW"
  | "AUTHORITY_CLEARED";
export type AssessmentRuntimeState = "HEALTHY" | "DEGRADED" | "UNAVAILABLE";

export type AssessmentSurfaceProjection = {
  productCode: string;
  releaseState: AssessmentReleaseState;
  progressionState: AssessmentProgressionState;
  claimBoundary: AssessmentClaimBoundary;
  runtimeState: AssessmentRuntimeState;
  publicLabel: string;
  publicExplanation: string;
  href: string | null;
  actionLabel: string | null;
};

type AssessmentProjectionConfig = {
  href: string | null;
  entry?: boolean;
  recommendedAfter?: string;
  controlled?: boolean;
};

const ASSESSMENT_PROJECTION_CONFIG: Record<string, AssessmentProjectionConfig> = {
  fast_diagnostic: { href: "/foundry/decision-test", entry: true },
  constitutional_diagnostic: { href: "/diagnostics/constitutional-diagnostic" },
  personal_decision_audit: { href: "/diagnostics/personal-decision-audit" },
  team_assessment: {
    href: "/diagnostics/team-assessment",
    recommendedAfter: "Best used after a Constitutional reading.",
  },
  enterprise_assessment: {
    href: "/diagnostics/enterprise-assessment",
    recommendedAfter: "Best used after a team or constitutional evidence reading.",
  },
  executive_reporting: { href: "/diagnostics/executive-reporting", controlled: true },
};

function loadGovernanceRecord(productCode: string): ProductReleaseGovernance | null {
  const matrixPath = path.join(process.cwd(), "reports", "product-release-governance-matrix.json");
  if (!fs.existsSync(matrixPath)) return null;
  const matrix = JSON.parse(fs.readFileSync(matrixPath, "utf8")) as Record<string, unknown>;
  const raw = matrix[productCode];
  if (!raw) return null;
  return adaptEstateDispositionToReleaseGovernance(raw);
}

function mapReleaseState(governance: ProductReleaseGovernance | null, config: AssessmentProjectionConfig): AssessmentReleaseState {
  if (!governance) return "INTERNAL";
  if (governance.releaseMode === "internal_only") return "INTERNAL";
  if (governance.releaseMode === "blocked") return "RETIRED";
  if (config.controlled || governance.releaseMode === "manual_fulfilment_only") return "CONTROLLED";
  return "PUBLIC";
}

function mapProgressionState(config: AssessmentProjectionConfig, releaseState: AssessmentReleaseState): AssessmentProgressionState {
  if (config.entry) return "ENTRY";
  if (config.controlled) return "EARNED";
  if (config.recommendedAfter) return "RECOMMENDED_AFTER_PRIOR_EVIDENCE";
  if (releaseState === "CONTROLLED") return "EARNED";
  return "AVAILABLE";
}

function mapClaimBoundary(governance: ProductReleaseGovernance | null, releaseState: AssessmentReleaseState): AssessmentClaimBoundary {
  if (!governance) return "EVIDENCE_LIMITED";
  if (releaseState === "CONTROLLED" || governance.manualReviewRequired) return "CONTROLLED_HUMAN_REVIEW";
  if (governance.effectiveAuthorityState === "granted" && governance.requiredBoundaryVariant === "validated_authority_instrument") {
    return "AUTHORITY_CLEARED";
  }
  if (governance.requiredBoundaryVariant === "decision_support") return "BOUNDED_OPERATIONAL_CLAIMS";
  return "EVIDENCE_LIMITED";
}

function labelFor(projection: Pick<AssessmentSurfaceProjection, "releaseState" | "progressionState">): string {
  if (projection.releaseState === "CONTROLLED") return "CONTROLLED ACCESS";
  if (projection.progressionState === "ENTRY") return "OPEN ENTRY";
  return "AVAILABLE";
}

function actionLabelFor(releaseState: AssessmentReleaseState, progressionState: AssessmentProgressionState): string | null {
  if (releaseState === "INTERNAL" || releaseState === "RETIRED") return null;
  if (releaseState === "CONTROLLED") return "Request controlled access";
  if (progressionState === "ENTRY") return "Start entry instrument";
  return "Open assessment";
}

function explanationFor(productCode: string, config: AssessmentProjectionConfig, claimBoundary: AssessmentClaimBoundary): string {
  if (productCode === "fast_diagnostic") {
    return "Public decision signal. Provides a structured perception check from user-supplied context. It does not certify outcomes or independently verify the underlying facts.";
  }
  if (config.recommendedAfter) return config.recommendedAfter;
  if (claimBoundary === "CONTROLLED_HUMAN_REVIEW") {
    return "Controlled access is governed by human review and product-release governance.";
  }
  return "Public assessment surface with bounded operational claims and governed next-step routing.";
}

export function resolveAssessmentSurfaceProjection(productCode: string): AssessmentSurfaceProjection {
  const config = ASSESSMENT_PROJECTION_CONFIG[productCode] ?? { href: null };
  const governance = loadGovernanceRecord(productCode);
  const releaseState = mapReleaseState(governance, config);
  const progressionState = mapProgressionState(config, releaseState);
  const claimBoundary = mapClaimBoundary(governance, releaseState);
  const base = {
    productCode,
    releaseState,
    progressionState,
    claimBoundary,
    runtimeState: governance ? "HEALTHY" : "UNAVAILABLE",
    href: releaseState === "INTERNAL" || releaseState === "RETIRED" ? null : config.href,
  } satisfies Omit<AssessmentSurfaceProjection, "publicLabel" | "publicExplanation" | "actionLabel">;

  return {
    ...base,
    publicLabel: labelFor(base),
    publicExplanation: explanationFor(productCode, config, claimBoundary),
    actionLabel: actionLabelFor(releaseState, progressionState),
  };
}

export function listAssessmentSurfaceProjections(): AssessmentSurfaceProjection[] {
  return Object.keys(ASSESSMENT_PROJECTION_CONFIG).map(resolveAssessmentSurfaceProjection);
}