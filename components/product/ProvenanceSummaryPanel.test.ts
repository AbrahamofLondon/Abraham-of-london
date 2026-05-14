import { describe, expect, it } from "vitest";

import type { ClientSafeProvenanceSummary } from "@/lib/product/client-safe-provenance-contract";
import { buildProvenanceSummaryPanelModel } from "./ProvenanceSummaryPanel";

function summary(overrides: Partial<ClientSafeProvenanceSummary> = {}): ClientSafeProvenanceSummary {
  return {
    version: 1,
    subjectId: "cycle_001",
    accountabilityStatement:
      "3 evidence inputs captured; 1 operator review completed; delivery sent; outcome recorded.",
    provenanceHash: "deadbeef1234567890abcdef",
    deliveryPosture: "DELIVERED",
    outcomePosture: "RECORDED",
    gapCount: 0,
    gapClasses: [],
    confidenceBands: [
      { level: "OPERATOR_VERIFIED", count: 2 },
      { level: "USER_REPORTED", count: 1 },
    ],
    timelineSummary: [
      { milestone: "EVIDENCE_CAPTURED", label: "Evidence captured", occurredAt: "2026-05-01T09:00:00.000Z" },
      { milestone: "REVIEW_COMPLETED", label: "Governance review completed", occurredAt: "2026-05-03T09:00:00.000Z" },
      { milestone: "DELIVERY_SENT", label: "Oversight brief delivered", occurredAt: "2026-05-04T09:00:00.000Z" },
      { milestone: "OUTCOME_RECORDED", label: "Outcome verified", occurredAt: "2026-05-05T09:00:00.000Z" },
    ],
    composedAt: "2026-05-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildProvenanceSummaryPanelModel — accountability statement", () => {
  it("model preserves accountability statement verbatim", () => {
    const model = buildProvenanceSummaryPanelModel(summary());
    expect(model.accountabilityStatement).toBe(
      "3 evidence inputs captured; 1 operator review completed; delivery sent; outcome recorded.",
    );
  });

  it("empty model returns restrained unavailable message, not operator text", () => {
    const model = buildProvenanceSummaryPanelModel(null);
    expect(model.empty).toBe(true);
    expect(model.accountabilityStatement).toBe("Provenance summary is not available for this cycle.");
    expect(model.accountabilityStatement.toLowerCase()).not.toContain("operator");
    expect(model.accountabilityStatement.toLowerCase()).not.toContain("admin");
  });
});

describe("buildProvenanceSummaryPanelModel — hash display", () => {
  it("shows first 12 chars of provenanceHash with ellipsis", () => {
    const model = buildProvenanceSummaryPanelModel(summary({ provenanceHash: "deadbeef1234567890abcdef" }));
    expect(model.hashDisplay).toBe("deadbeef1234…");
  });

  it("model does not expose full hash — only display-truncated form", () => {
    const hash = "deadbeef1234567890abcdef";
    const model = buildProvenanceSummaryPanelModel(summary({ provenanceHash: hash }));
    expect(model.hashDisplay).not.toBe(hash);
    expect(model.hashDisplay.length).toBeLessThan(hash.length);
  });

  it("model does not contain governanceEvents field", () => {
    const model = buildProvenanceSummaryPanelModel(summary()) as Record<string, unknown>;
    expect(model["governanceEvents"]).toBeUndefined();
  });

  it("model does not contain evidenceInputs field", () => {
    const model = buildProvenanceSummaryPanelModel(summary()) as Record<string, unknown>;
    expect(model["evidenceInputs"]).toBeUndefined();
  });
});

describe("buildProvenanceSummaryPanelModel — suppression and actor isolation", () => {
  it("model JSON does not contain suppression field names from the source record", () => {
    const src = summary({
      accountabilityStatement: "2 evidence inputs captured; 1 field suppressed for safety; delivery sent; outcome recorded.",
    });
    const model = buildProvenanceSummaryPanelModel(src);
    const json = JSON.stringify(model);
    expect(json).not.toContain("commercialExposure");
    expect(json).not.toContain("legalRisk");
    expect(json).not.toContain("suppressionRule");
    expect(json).not.toContain("fieldName");
  });

  it("model JSON does not contain internal actor identifiers", () => {
    const src = summary({
      accountabilityStatement: "1 operator review completed; delivery sent.",
    });
    const model = buildProvenanceSummaryPanelModel(src);
    const json = JSON.stringify(model);
    expect(json).not.toContain("op_001");
    expect(json).not.toContain("operatorId");
    expect(json).not.toContain("reviewedByOperator");
    expect(json).not.toContain("actor");
  });
});

describe("buildProvenanceSummaryPanelModel — confidence bands", () => {
  it("maps confidence bands with human-readable labels", () => {
    const model = buildProvenanceSummaryPanelModel(summary({
      confidenceBands: [
        { level: "OPERATOR_VERIFIED", count: 3 },
        { level: "USER_REPORTED", count: 1 },
      ],
    }));
    const opBand = model.confidenceBands.find((b) => b.level === "OPERATOR_VERIFIED");
    const userBand = model.confidenceBands.find((b) => b.level === "USER_REPORTED");
    expect(opBand?.label).toBe("Operator-verified");
    expect(opBand?.count).toBe(3);
    expect(userBand?.label).toBe("User-reported");
    expect(userBand?.count).toBe(1);
  });

  it("empty confidence bands produce empty array, not error", () => {
    const model = buildProvenanceSummaryPanelModel(summary({ confidenceBands: [] }));
    expect(model.confidenceBands).toEqual([]);
  });
});

describe("buildProvenanceSummaryPanelModel — gap counts", () => {
  it("counts critical, warning, and info gaps separately", () => {
    const model = buildProvenanceSummaryPanelModel(summary({
      gapCount: 3,
      gapClasses: ["CRITICAL", "WARNING", "INFO"],
    }));
    expect(model.gapCount).toBe(3);
    expect(model.criticalGaps).toBe(1);
    expect(model.warningGaps).toBe(1);
    expect(model.infoGaps).toBe(1);
  });
});

describe("buildProvenanceSummaryPanelModel — empty/unavailable state", () => {
  it("null input produces empty model without crashing", () => {
    const model = buildProvenanceSummaryPanelModel(null);
    expect(model.empty).toBe(true);
    expect(model.confidenceBands).toEqual([]);
    expect(model.timeline).toEqual([]);
    expect(model.gapCount).toBe(0);
  });

  it("empty model includes the caveat explaining what is not exposed", () => {
    const model = buildProvenanceSummaryPanelModel(null);
    expect(model.caveat).toContain("chain of custody");
    expect(model.caveat).toContain("Internal review notes");
  });

  it("empty model hashDisplay is empty string, not a fake hash", () => {
    const model = buildProvenanceSummaryPanelModel(null);
    expect(model.hashDisplay).toBe("");
  });
});
