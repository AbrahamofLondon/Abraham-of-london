import { describe, expect, it } from "vitest";
import {
  ENTERPRISE_EXECUTIVE_REPORTING_BOUNDARY,
  buildEnterpriseResultSurfaceSummary,
} from "@/pages/api/diagnostics/enterprise";

describe("Enterprise diagnostic result surface summary", () => {
  it("shows scenario stress only for valid structured scenario responses", () => {
    const withFreeTextOnly = buildEnterpriseResultSurfaceSummary({
      summary: { pct: 65, band: "WATCH", sectionScores: [] },
      metadata: {
        scenarioResponses: [
          { scenarioId: "enterprise_delay_30", explanation: "Free text only." },
        ],
      },
    });

    expect(withFreeTextOnly.scenarioStressRan).toBe(false);
    expect(withFreeTextOnly.scenarioStressFindings).toEqual([]);

    const withStructuredScenario = buildEnterpriseResultSurfaceSummary({
      summary: { pct: 65, band: "WATCH", sectionScores: [] },
      metadata: {
        scenarioResponses: [
          { scenarioId: "enterprise_delay_30", chosenOption: 1, selectedLabel: "External pressure", severity: "medium" },
        ],
      },
    });

    expect(withStructuredScenario.scenarioStressRan).toBe(true);
    expect(withStructuredScenario.scenarioStressFindings).toEqual([
      {
        scenarioId: "enterprise_delay_30",
        chosenOption: 1,
        selectedLabel: "External pressure",
        severity: "medium",
      },
    ]);
  });

  it("summarises dependency and exposure text instead of carrying raw long prose", () => {
    const rawFinancial = "A".repeat(240);
    const result = buildEnterpriseResultSurfaceSummary({
      summary: {
        pct: 48,
        band: "FRAGILE",
        sectionScores: [
          { title: "Governance Reliability", pct: 35 },
          { title: "Execution Variance", pct: 52 },
        ],
      },
      metadata: {
        dependencyMap: " ".repeat(2) + "Dependency owner and platform path ".repeat(12),
        financialExposure: rawFinancial,
        clientExposure: "Key account renewal and market confidence are exposed.",
        regulatoryExposure: "Compliance filing is exposed.",
        boardChallengeReadiness: "Moderate",
      },
    });

    expect(result.firstFailurePoint).toBe("Governance Reliability: 35% structural strength.");
    expect(result.exposureMap.financial.length).toBeLessThan(rawFinancial.length);
    expect(result.exposureMap.financial.endsWith("...")).toBe(true);
    expect(result.dependencyMapSummary.length).toBeLessThan("Dependency owner and platform path ".repeat(12).length);
  });

  it("keeps Enterprise at stress architecture boundary and points to Executive Reporting judgement", () => {
    const result = buildEnterpriseResultSurfaceSummary({
      summary: { pct: 72, band: "WATCH", sectionScores: [] },
      metadata: {},
    });

    expect(result.executiveReportingAdds).toBe(ENTERPRISE_EXECUTIVE_REPORTING_BOUNDARY);
    expect(JSON.stringify(result).toLowerCase()).not.toContain("final board recommendation");
    expect(result.recommendedEscalationPath.toLowerCase()).toContain("watch state");
  });
});
