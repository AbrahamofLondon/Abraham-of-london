import { describe, expect, it } from "vitest";

import {
  checkCaseEntitlement,
  countActiveCases,
} from "./case-entitlement-check";
import { FREE_TIER_MAX_ACTIVE_CASES } from "./free-tier-limits";

describe("checkCaseEntitlement", () => {
  it("allows free user with 0 active cases", () => {
    const result = checkCaseEntitlement(0, false);
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 2 active cases (under limit)", () => {
    const result = checkCaseEntitlement(2, false);
    expect(result.allowed).toBe(true);
  });

  it("blocks free user at exactly the limit", () => {
    const result = checkCaseEntitlement(FREE_TIER_MAX_ACTIVE_CASES, false);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("FREE_TIER_LIMIT_REACHED");
      expect(result.activeCaseCount).toBe(FREE_TIER_MAX_ACTIVE_CASES);
      expect(result.maxActiveCases).toBe(FREE_TIER_MAX_ACTIVE_CASES);
    }
  });

  it("blocks free user above the limit", () => {
    const result = checkCaseEntitlement(5, false);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("FREE_TIER_LIMIT_REACHED");
    }
  });

  it("allows professional user with 0 active cases", () => {
    const result = checkCaseEntitlement(0, true);
    expect(result.allowed).toBe(true);
  });

  it("allows professional user with 100 active cases (unlimited)", () => {
    const result = checkCaseEntitlement(100, true);
    expect(result.allowed).toBe(true);
  });

  it("allows professional user even above the free limit", () => {
    const result = checkCaseEntitlement(FREE_TIER_MAX_ACTIVE_CASES + 10, true);
    expect(result.allowed).toBe(true);
  });
});

describe("countActiveCases", () => {
  it("returns 0 for empty array", () => {
    expect(countActiveCases([])).toBe(0);
  });

  it("counts non-resolved cases as active", () => {
    const cases = [
      { cognitiveState: "ACTIVE" as const, outcomeStatus: null },
      { cognitiveState: "SIGNAL_DISCOVERY" as const, outcomeStatus: null },
    ];
    expect(countActiveCases(cases)).toBe(2);
  });

  it("excludes resolved cases", () => {
    const cases = [
      { cognitiveState: "ACTIVE" as const, outcomeStatus: null },
      { cognitiveState: "ACTIVE" as const, outcomeStatus: "RESOLVED" },
    ];
    expect(countActiveCases(cases)).toBe(1);
  });

  it("excludes institutional intelligence cases", () => {
    const cases = [
      { cognitiveState: "ACTIVE" as const, outcomeStatus: null },
      { cognitiveState: "INSTITUTIONAL_INTELLIGENCE" as const, outcomeStatus: null },
    ];
    expect(countActiveCases(cases)).toBe(1);
  });
});
