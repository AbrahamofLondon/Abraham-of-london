import { describe, expect, it } from "vitest";

import {
  DELIVERY_SURFACE_CONTRACTS,
  getDeliverySurfaceContract,
  getDeliverySurfaceTruthCeiling,
} from "@/lib/intelligence/delivery-surface-contract";

describe("delivery surface contract", () => {
  it("builds real contracts for corridor surfaces with delivery ceilings from the surface registry", () => {
    expect(DELIVERY_SURFACE_CONTRACTS.length).toBe(5);

    const team = getDeliverySurfaceContract("team_assessment");
    expect(team).toBeDefined();
    expect(team!.deliveryCeiling).toBe(6);
    expect(team!.currentReadiness).toBe("ACTIVE");
    expect(team!.commercialStatus).toBe("free_controlled");
    expect(team!.authorityGaps.join(" ")).toMatch(/no team response persistence model/i);
    expect(team!.authorityGaps.join(" ")).toMatch(/no admin view/i);
  });

  it("keeps stronger delivery surfaces above weaker team-stage delivery foundations", () => {
    const team = getDeliverySurfaceTruthCeiling("team_assessment");
    const strategy = getDeliverySurfaceTruthCeiling("strategy_room");

    expect(strategy).toBeGreaterThan(team);
    expect(strategy).toBe(8);
  });

  it("carries real source references for audit traceability", () => {
    for (const contract of DELIVERY_SURFACE_CONTRACTS) {
      expect(contract.sourceRefs.length).toBeGreaterThan(0);
      expect(contract.primaryOutput.length).toBeGreaterThan(20);
    }
  });
});
