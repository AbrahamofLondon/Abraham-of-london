import { describe, expect, it } from "vitest";

import {
  confidenceBasisBadge,
  validateGmiSourceConfidenceClaims,
  type GmiSourceConfidenceClaim,
} from "@/lib/intelligence/gmi-control-plane";

function claim(overrides: Partial<GmiSourceConfidenceClaim>): GmiSourceConfidenceClaim {
  return {
    id: "CLAIM-1",
    claim: "Material claim.",
    confidenceBasis: "observed",
    evidencePosture: "MEDIUM",
    sourceCategories: ["primary"],
    ...overrides,
  };
}

describe("GMI source confidence labels", () => {
  it("renders controlled vocabulary badges", () => {
    expect(confidenceBasisBadge("observed")).toBe("OBSERVED");
    expect(confidenceBasisBadge("institutionally_sourced")).toBe("INSTITUTIONAL");
    expect(confidenceBasisBadge("modelled_estimate")).toBe("MODELLED");
    expect(confidenceBasisBadge("scenario_assumption")).toBe("SCENARIO");
    expect(confidenceBasisBadge("operator_judgement")).toBe("JUDGEMENT");
  });

  it("prevents scenario assumptions from rendering as facts", () => {
    const issues = validateGmiSourceConfidenceClaims([
      claim({ id: "SCENARIO-1", confidenceBasis: "scenario_assumption", writtenAsFact: true }),
    ]);

    expect(issues).toContain("Scenario assumption cannot render as fact: SCENARIO-1");
  });

  it("requires a method note for modelled estimates", () => {
    const issues = validateGmiSourceConfidenceClaims([
      claim({ id: "MODEL-1", confidenceBasis: "modelled_estimate", methodNote: "" }),
    ]);

    expect(issues).toContain("Modelled estimate requires method note: MODEL-1");
  });

  it("requires source support for HIGH evidence posture", () => {
    const issues = validateGmiSourceConfidenceClaims([
      claim({ id: "HIGH-1", evidencePosture: "HIGH", sourceCategories: ["institutional"] }),
    ]);

    expect(issues).toContain("HIGH evidence posture requires at least two source categories: HIGH-1");
  });

  it("prevents hard factual claims from relying on operator judgement alone", () => {
    const issues = validateGmiSourceConfidenceClaims([
      claim({
        id: "FACT-1",
        hardFactualClaim: true,
        confidenceBasis: "operator_judgement",
        sourceCategories: [],
      }),
    ]);

    expect(issues).toContain("Hard factual claim cannot use operator judgement alone: FACT-1");
  });
});
