import { describe, expect, it } from "vitest";

import {
  FREE_TIER_MAX_ACTIVE_CASES,
  TIER_FEATURES,
  PROFESSIONAL_FEATURE_LIST,
  describeTierFeature,
  UPGRADE_MODAL_TITLE,
  UPGRADE_MODAL_BODY,
  type TierFeature,
} from "./free-tier-limits";

describe("FREE_TIER_MAX_ACTIVE_CASES", () => {
  it("is set to 3", () => {
    expect(FREE_TIER_MAX_ACTIVE_CASES).toBe(3);
  });
});

describe("TIER_FEATURES", () => {
  it("free tier has active_case_limit", () => {
    expect(TIER_FEATURES.free).toContain("active_case_limit");
  });

  it("professional tier has all expected features", () => {
    const expected: TierFeature[] = [
      "active_case_limit",
      "return_brief_generation",
      "client_safe_evidence_export",
      "strategy_room_eligibility",
      "executive_reporting_eligibility",
      "organisation_workspace",
    ];
    for (const feature of expected) {
      expect(TIER_FEATURES.professional).toContain(feature);
    }
  });
});

describe("PROFESSIONAL_FEATURE_LIST", () => {
  it("includes active_case_limit", () => {
    expect(PROFESSIONAL_FEATURE_LIST).toContain("active_case_limit");
  });

  it("includes return_brief_generation", () => {
    expect(PROFESSIONAL_FEATURE_LIST).toContain("return_brief_generation");
  });

  it("includes client_safe_evidence_export", () => {
    expect(PROFESSIONAL_FEATURE_LIST).toContain("client_safe_evidence_export");
  });

  it("includes organisation_workspace", () => {
    expect(PROFESSIONAL_FEATURE_LIST).toContain("organisation_workspace");
  });

  it("does not include strategy_room_eligibility (separate purchase)", () => {
    expect(PROFESSIONAL_FEATURE_LIST).not.toContain("strategy_room_eligibility");
  });

  it("does not include executive_reporting_eligibility (separate purchase)", () => {
    expect(PROFESSIONAL_FEATURE_LIST).not.toContain("executive_reporting_eligibility");
  });
});

describe("describeTierFeature", () => {
  it("returns a non-empty string for every feature", () => {
    const features: TierFeature[] = [
      "active_case_limit",
      "return_brief_generation",
      "client_safe_evidence_export",
      "strategy_room_eligibility",
      "executive_reporting_eligibility",
      "organisation_workspace",
    ];
    for (const feature of features) {
      expect(describeTierFeature(feature).length).toBeGreaterThan(0);
    }
  });
});

describe("UPGRADE_MODAL_TITLE", () => {
  it("is non-empty", () => {
    expect(UPGRADE_MODAL_TITLE.length).toBeGreaterThan(0);
  });
});

describe("UPGRADE_MODAL_BODY", () => {
  it("mentions existing records remain readable", () => {
    expect(UPGRADE_MODAL_BODY.toLowerCase()).toContain("readable");
  });

  it("mentions Professional", () => {
    expect(UPGRADE_MODAL_BODY).toContain("Professional");
  });
});
