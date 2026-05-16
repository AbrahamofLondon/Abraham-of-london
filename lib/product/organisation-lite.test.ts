import { describe, expect, it } from "vitest";

import {
  PROFESSIONAL_SEAT_ALLOWANCE,
  ADDITIONAL_SEAT_PRICE_PENCE,
  ADDITIONAL_SEAT_PRICE_LABEL,
  LITE_ROLE_MAP,
  type OrgLiteRole,
} from "./organisation-lite";

describe("PROFESSIONAL_SEAT_ALLOWANCE", () => {
  it("is set to 5", () => {
    expect(PROFESSIONAL_SEAT_ALLOWANCE).toBe(5);
  });
});

describe("ADDITIONAL_SEAT_PRICE", () => {
  it("is 1500 pence (£15)", () => {
    expect(ADDITIONAL_SEAT_PRICE_PENCE).toBe(1500);
  });

  it("label is £15/month", () => {
    expect(ADDITIONAL_SEAT_PRICE_LABEL).toBe("£15/month");
  });
});

describe("LITE_ROLE_MAP", () => {
  it("maps all 5 roles", () => {
    const roles: OrgLiteRole[] = ["OWNER", "ADMIN", "CONTRIBUTOR", "VIEWER", "AUDITOR"];
    for (const role of roles) {
      expect(LITE_ROLE_MAP[role]).toBeDefined();
    }
  });

  it("maps OWNER to OWNER", () => {
    expect(LITE_ROLE_MAP.OWNER).toBe("OWNER");
  });

  it("maps ADMIN to SPONSOR", () => {
    expect(LITE_ROLE_MAP.ADMIN).toBe("SPONSOR");
  });

  it("maps CONTRIBUTOR to DECISION_OWNER", () => {
    expect(LITE_ROLE_MAP.CONTRIBUTOR).toBe("DECISION_OWNER");
  });

  it("maps VIEWER to OBSERVER", () => {
    expect(LITE_ROLE_MAP.VIEWER).toBe("OBSERVER");
  });

  it("maps AUDITOR to REVIEWER", () => {
    expect(LITE_ROLE_MAP.AUDITOR).toBe("REVIEWER");
  });
});
