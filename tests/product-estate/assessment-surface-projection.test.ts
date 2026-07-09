import fs from "fs";

import { describe, expect, it } from "vitest";

import { resolveAssessmentSurfaceProjection } from "@/lib/assessment/assessment-surface-projection";
import {
  ProductReleaseGovernanceSchema,
  adaptEstateDispositionToReleaseGovernance,
} from "@/lib/product/product-release-governance-schema";

const matrix = JSON.parse(
  fs.readFileSync("reports/product-release-governance-matrix.json", "utf8"),
) as Record<string, unknown>;

describe("assessment estate public governance projection", () => {
  it("adapts estate disposition records to canonical release governance DTOs", () => {
    const governance = adaptEstateDispositionToReleaseGovernance(matrix.fast_diagnostic);
    const parsed = ProductReleaseGovernanceSchema.parse(governance);

    expect(parsed.productCode).toBe("fast_diagnostic");
    expect(parsed.releaseMode).toBe("review_only");
    expect(parsed.requiredBoundaryVariant).toBe("decision_support");
    expect(parsed.forbiddenClaims).toEqual(expect.any(Array));
    expect(parsed.allowedClaims).toEqual(expect.any(Array));
    expect(parsed.allowedClaims).toContain("Bounded operational claims");
  });

  it("projects Fast Diagnostic as a public entry instrument, not an internal blocker", () => {
    expect(resolveAssessmentSurfaceProjection("fast_diagnostic")).toMatchObject({
      releaseState: "PUBLIC",
      progressionState: "ENTRY",
      claimBoundary: "BOUNDED_OPERATIONAL_CLAIMS",
      runtimeState: "HEALTHY",
      publicLabel: "OPEN ENTRY",
      href: "/foundry/decision-test",
      actionLabel: "Start entry instrument",
    });
  });

  it("projects Team Assessment as available after prior evidence, not falsely locked", () => {
    expect(resolveAssessmentSurfaceProjection("team_assessment")).toMatchObject({
      releaseState: "PUBLIC",
      progressionState: "RECOMMENDED_AFTER_PRIOR_EVIDENCE",
      publicLabel: "AVAILABLE",
      href: "/diagnostics/team-assessment",
    });
  });

  it("projects Executive Reporting as controlled access", () => {
    expect(resolveAssessmentSurfaceProjection("executive_reporting")).toMatchObject({
      releaseState: "CONTROLLED",
      progressionState: "EARNED",
      claimBoundary: "CONTROLLED_HUMAN_REVIEW",
      publicLabel: "CONTROLLED ACCESS",
      actionLabel: "Request controlled access",
    });
  });
});