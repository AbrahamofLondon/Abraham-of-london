import { describe, expect, it } from "vitest";

import {
  PROFESSIONAL_TRIAL_DAYS,
  type TrialInfo,
  type TrialStatus,
} from "./professional-trial";

describe("PROFESSIONAL_TRIAL_DAYS", () => {
  it("is set to 7", () => {
    expect(PROFESSIONAL_TRIAL_DAYS).toBe(7);
  });
});

describe("TrialInfo type shape", () => {
  it("accepts ACTIVE trial info", () => {
    const info: TrialInfo = {
      status: "ACTIVE",
      startedAt: "2026-05-15T00:00:00.000Z",
      endsAt: "2026-05-22T00:00:00.000Z",
      daysRemaining: 7,
    };
    expect(info.status).toBe("ACTIVE");
    expect(info.daysRemaining).toBe(7);
  });

  it("accepts EXPIRED trial info", () => {
    const info: TrialInfo = {
      status: "EXPIRED",
      startedAt: "2026-05-01T00:00:00.000Z",
      endsAt: "2026-05-08T00:00:00.000Z",
      daysRemaining: 0,
    };
    expect(info.status).toBe("EXPIRED");
    expect(info.daysRemaining).toBe(0);
  });

  it("accepts CONVERTED trial info", () => {
    const info: TrialInfo = {
      status: "CONVERTED",
      startedAt: "2026-05-15T00:00:00.000Z",
      endsAt: null,
      daysRemaining: null,
    };
    expect(info.status).toBe("CONVERTED");
  });

  it("accepts NONE trial info", () => {
    const info: TrialInfo = {
      status: "NONE",
      startedAt: null,
      endsAt: null,
      daysRemaining: null,
    };
    expect(info.status).toBe("NONE");
  });

  it("accepts CANCELLED trial info", () => {
    const info: TrialInfo = {
      status: "CANCELLED",
      startedAt: "2026-05-15T00:00:00.000Z",
      endsAt: "2026-05-16T00:00:00.000Z",
      daysRemaining: 0,
    };
    expect(info.status).toBe("CANCELLED");
  });
});

describe("TrialStatus type", () => {
  it("includes all expected statuses", () => {
    const statuses: TrialStatus[] = ["ACTIVE", "EXPIRED", "CONVERTED", "CANCELLED", "NONE"];
    expect(statuses).toHaveLength(5);
  });
});
