import { describe, expect, it } from "vitest";

import {
  getAppliesTo,
  getBandLabel,
  getConfidencePostureForReport,
  getHighConfidenceItems,
  getMonitoringItems,
  getPostureItemsByBand,
  GMI_Q1_2026_CONFIDENCE_POSTURE,
} from "./market-intelligence-confidence-posture";

describe("GMI Q1 2026 confidence posture", () => {
  it("contains exactly four bands", () => {
    expect(GMI_Q1_2026_CONFIDENCE_POSTURE.items).toHaveLength(4);
  });

  it("includes HIGH, MEDIUM, LOW, and MONITORING bands", () => {
    const bands = GMI_Q1_2026_CONFIDENCE_POSTURE.items.map((i) => i.band);
    expect(bands).toContain("HIGH");
    expect(bands).toContain("MEDIUM");
    expect(bands).toContain("LOW");
    expect(bands).toContain("MONITORING");
  });

  it("belongs to GMI-Q1-2026", () => {
    expect(GMI_Q1_2026_CONFIDENCE_POSTURE.reportId).toBe("GMI-Q1-2026");
  });

  it("every item has a non-empty rationale", () => {
    for (const item of GMI_Q1_2026_CONFIDENCE_POSTURE.items) {
      expect(item.rationale.length).toBeGreaterThan(0);
    }
  });

  it("every item has at least one appliesTo entry", () => {
    for (const item of GMI_Q1_2026_CONFIDENCE_POSTURE.items) {
      expect(item.appliesTo.length).toBeGreaterThan(0);
    }
  });
});

describe("getConfidencePostureForReport", () => {
  it("resolves GMI-Q1-2026", () => {
    const posture = getConfidencePostureForReport("GMI-Q1-2026");
    expect(posture).not.toBeNull();
    expect(posture?.reportId).toBe("GMI-Q1-2026");
  });

  it("returns null for an unknown report", () => {
    expect(getConfidencePostureForReport("GMI-Q9-9999")).toBeNull();
  });
});

describe("getPostureItemsByBand", () => {
  it("returns the HIGH band item", () => {
    const items = getPostureItemsByBand(GMI_Q1_2026_CONFIDENCE_POSTURE, "HIGH");
    expect(items).toHaveLength(1);
    expect(items[0]?.band).toBe("HIGH");
  });

  it("returns the MONITORING band item", () => {
    const items = getPostureItemsByBand(
      GMI_Q1_2026_CONFIDENCE_POSTURE,
      "MONITORING",
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.band).toBe("MONITORING");
  });

  it("returns empty for a band not in posture", () => {
    const items = getPostureItemsByBand(
      { reportId: "NONE", items: [] },
      "HIGH",
    );
    expect(items).toHaveLength(0);
  });
});

describe("getHighConfidenceItems", () => {
  it("returns the structural thesis in HIGH confidence items", () => {
    const items = getHighConfidenceItems(GMI_Q1_2026_CONFIDENCE_POSTURE);
    const allApplies = items.flatMap((i) => i.appliesTo);
    expect(
      allApplies.some((a) => a.toLowerCase().includes("fragmentation")),
    ).toBe(true);
  });
});

describe("getMonitoringItems", () => {
  it("returns dollar weakness in MONITORING items", () => {
    const items = getMonitoringItems(GMI_Q1_2026_CONFIDENCE_POSTURE);
    const allApplies = items.flatMap((i) => i.appliesTo);
    expect(allApplies.some((a) => a.toLowerCase().includes("dollar"))).toBe(
      true,
    );
  });
});

describe("HIGH confidence rationale does not contain scenario assumption language", () => {
  it("HIGH rationale references observed conditions, not modelled projections", () => {
    const items = getPostureItemsByBand(GMI_Q1_2026_CONFIDENCE_POSTURE, "HIGH");
    for (const item of items) {
      expect(item.rationale.toLowerCase()).not.toContain("scenario assumption");
      expect(item.rationale.toLowerCase()).not.toContain("probability model");
    }
  });
});

describe("LOW band rationale acknowledges scenario nature", () => {
  it("LOW rationale contains scenario assumption language", () => {
    const items = getPostureItemsByBand(GMI_Q1_2026_CONFIDENCE_POSTURE, "LOW");
    const rationale = items.map((i) => i.rationale).join(" ").toLowerCase();
    expect(
      rationale.includes("scenario") || rationale.includes("assumption"),
    ).toBe(true);
  });

  it("LOW band appliesTo includes tail scenario probabilities", () => {
    const tail = getAppliesTo(GMI_Q1_2026_CONFIDENCE_POSTURE, "LOW");
    expect(tail.some((t) => t.toLowerCase().includes("%"))).toBe(true);
  });
});

describe("getBandLabel", () => {
  it("returns readable labels for all four bands", () => {
    expect(getBandLabel("HIGH")).toBe("High Confidence");
    expect(getBandLabel("MEDIUM")).toBe("Medium Confidence");
    expect(getBandLabel("LOW")).toBe("Low / Scenario-sensitive");
    expect(getBandLabel("MONITORING")).toBe("Monitoring");
  });
});

describe("getAppliesTo", () => {
  it("returns all HIGH band appliesTo items", () => {
    const items = getAppliesTo(GMI_Q1_2026_CONFIDENCE_POSTURE, "HIGH");
    expect(items.length).toBeGreaterThan(0);
  });

  it("returns empty for a band with no items", () => {
    const items = getAppliesTo({ reportId: "NONE", items: [] }, "HIGH");
    expect(items).toHaveLength(0);
  });
});
