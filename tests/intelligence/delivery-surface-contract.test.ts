import { describe, expect, it } from "vitest";

import {
  DELIVERY_SURFACE_TEMPLATES,
  evaluateDeliverySurfaceContract,
  getDeliverySurfaceTemplate,
  getDeliverySurfaceTruthCeiling,
} from "@/lib/intelligence/delivery-surface-contract";

describe("delivery surface contract", () => {
  it("keeps surface-level delivery templates separate from run-level delivery contracts", () => {
    expect(DELIVERY_SURFACE_TEMPLATES.length).toBe(5);

    const team = getDeliverySurfaceTemplate("team_assessment");
    expect(team).toBeDefined();
    expect(team?.deliveryCeiling).toBe(6);
    expect(team?.currentReadiness).toBe("ACTIVE");
    expect(team?.commercialStatus).toBe("free_controlled");
    expect(team?.authorityGaps.join(" ")).toMatch(/no team response persistence model/i);
    expect(team?.authorityGaps.join(" ")).toMatch(/no admin view/i);
  });

  it("keeps stronger delivery surfaces above weaker team-stage delivery foundations", () => {
    const team = getDeliverySurfaceTruthCeiling("team_assessment");
    const strategy = getDeliverySurfaceTruthCeiling("strategy_room");

    expect(strategy).toBeGreaterThan(team);
    expect(strategy).toBe(8);
  });

  it("evaluates run-level delivery surfaces from actual artifact traits", () => {
    const contract = evaluateDeliverySurfaceContract({
      artifactId: "artifact-team-001",
      productId: "team_assessment",
      orderId: "order-team-001",
      hasStructuredSections: true,
      hasExecutiveSummary: true,
      hasForensicLayer: true,
      hasEvidenceReferences: true,
      hasProvenanceReference: true,
      hasConfidenceDisclosure: true,
      mobileParity: true,
      readabilityClass: "board",
    });

    expect(contract.artifactId).toBe("artifact-team-001");
    expect(contract.productId).toBe("team_assessment");
    expect(contract.deliverySurfaceScore).toBe(5);
  });

  it("carries real source references for audit traceability", () => {
    for (const template of DELIVERY_SURFACE_TEMPLATES) {
      expect(template.sourceRefs.length).toBeGreaterThan(0);
      expect(template.primaryOutput.length).toBeGreaterThan(20);
    }
  });
});
