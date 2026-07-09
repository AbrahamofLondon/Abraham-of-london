import { describe, expect, it } from "vitest";

import { mapConstitutionalToAssessmentResult } from "@/lib/diagnostics/assessment-result-mappers";
import { ConstitutionalPublicResponseSchema } from "@/lib/diagnostics/constitutional-public-contract";

describe("constitutional public response contract", () => {
  it("parses the API fixture, maps to the public result surface, and carries handoff tokens", () => {
    const response = ConstitutionalPublicResponseSchema.parse({
      ok: true,
      reportId: "constitutional-report-test-1",
      stateToken: "constitutional-token-test-1",
      bundle: {
        report: {
          authorityScore: 72,
          coherenceScore: 66,
          pressureScore: 68,
          frictionScore: 61,
          trustScore: 64,
          seriousnessScore: 70,
          governanceDiscipline: 67,
          interventionReadiness: 69,
          narrativeCoherence: 65,
          failureModeCount: 2,
          failureModeSeverity: 3,
          authorityType: "MIXED",
          posture: "STRUCTURAL_STRAIN",
          readinessTier: "STABILIZING",
          mandateFit: true,
          summary: "The decision has enough constitutional signal to justify a governed next reading.",
          keyFindings: [
            "Authority is present but not yet cleanly carried across the decision route.",
            "The evidence posture supports diagnostic continuation before intervention.",
          ],
          answeredCount: 10,
          totalQuestions: 10,
          completionPercent: 100,
        },
        decision: {
          route: "DIAGNOSTIC",
          confidence: 0.72,
          disqualifiersTriggered: [],
          recommendedInterventions: ["Continue to Team Assessment"],
          rationale: ["The constitutional reading supports more evidence, not direct escalation."],
          escalationAllowed: true,
        },
        routeSummary: {
          route: "DIAGNOSTIC",
          title: "Additional evidence required",
          description: "The structure is material enough to continue, but not yet strong enough for intervention.",
          href: "/diagnostics/team-assessment",
          cta: "Continue to Team Assessment",
          tone: "amber",
        },
      },
      bridge: {
        teamAssessment: {
          hypotheses: ["Authority and operating reality may diverge."],
          prompts: ["Test whether the leadership map matches team experience."],
        },
      },
    });

    const result = mapConstitutionalToAssessmentResult(response.bundle);

    expect(response.reportId).toBeTruthy();
    expect(response.stateToken).toBeTruthy();
    expect(result.title).toBe("Additional evidence required");
    expect(result.earnedRoute?.href).toBe("/diagnostics/team-assessment");
    expect(result.governanceImplication).toContain("not yet strong enough");
  });
});