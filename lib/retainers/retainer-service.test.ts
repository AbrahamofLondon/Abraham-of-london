import { describe, expect, it } from "vitest";
import {
  getDecisionCapacityForTier,
  getEntitlementSlugForTier,
  normalizeRetainerTier,
} from "./retainer-service";

describe("enterprise retainer authority model", () => {
  it("maps tiers to hard decision capacity", () => {
    expect(getDecisionCapacityForTier("CORE")).toBe(1);
    expect(getDecisionCapacityForTier("OPERATIONAL")).toBe(3);
    expect(getDecisionCapacityForTier("INSTITUTIONAL")).toBe(999);
  });

  it("maps tiers to canonical entitlement slugs", () => {
    expect(getEntitlementSlugForTier("CORE")).toBe("retainer_core");
    expect(getEntitlementSlugForTier("OPERATIONAL")).toBe("retainer_operational");
    expect(getEntitlementSlugForTier("INSTITUTIONAL")).toBe("retainer_institutional");
  });

  it("rejects unknown retainer tiers", () => {
    expect(() => normalizeRetainerTier("starter")).toThrow("Invalid retainer tier");
  });
});
