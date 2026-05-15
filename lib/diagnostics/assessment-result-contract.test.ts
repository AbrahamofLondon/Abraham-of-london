import { describe, expect, it } from "vitest";

import {
  describeEvidencePosture,
  earnedRouteHref,
  earnedRouteLabel,
  recordStatusLabel,
  type AssessmentResult,
  type EarnedRoute,
  type EvidencePosture,
} from "./assessment-result-contract";

// ─── Type fixture ─────────────────────────────────────────────────────────────

const FULL_RESULT: AssessmentResult = {
  kind: "FAST_DIAGNOSTIC",
  title: "Whether to restructure",
  score: 72,
  band: "ALERT",
  primaryFinding: "Authority is unclear. No binding owner identified.",
  failurePattern: "Shared accountability structure without formal mandate.",
  evidencePosture: "USER_REPORTED",
  governanceImplication:
    "Without assigning a single accountable owner, this decision will continue to drift.",
  recommendedNextMove: "Assign one accountable owner with board-level mandate before next cycle.",
  consequenceTimeline: {
    sevenDays: "Ambiguity hardens into working assumption.",
    thirtyDays: "Execution drag becomes normalised.",
    ninetyDays: "Reversal cost compounds significantly.",
  },
  earnedRoute: {
    route: "STRATEGY_ROOM",
    label: "Enter Strategy Room",
    href: "/strategy-room",
    reason: "Severe authority gap detected — coordinated governance intervention required.",
  },
  recordStatus: {
    level: "SESSION_PREVIEW",
    label: "Session preview — sign in to retain this record.",
  },
};

// ─── AssessmentResult shape ───────────────────────────────────────────────────

describe("AssessmentResult contract shape", () => {
  it("requires governanceImplication", () => {
    expect(FULL_RESULT.governanceImplication).toBeTruthy();
    expect(typeof FULL_RESULT.governanceImplication).toBe("string");
    expect(FULL_RESULT.governanceImplication.length).toBeGreaterThan(0);
  });

  it("requires consequenceTimeline with all three periods", () => {
    const { consequenceTimeline } = FULL_RESULT;
    expect(consequenceTimeline).toBeDefined();
    expect(typeof consequenceTimeline.sevenDays).toBe("string");
    expect(typeof consequenceTimeline.thirtyDays).toBe("string");
    expect(typeof consequenceTimeline.ninetyDays).toBe("string");
    expect(consequenceTimeline.sevenDays.length).toBeGreaterThan(0);
    expect(consequenceTimeline.thirtyDays.length).toBeGreaterThan(0);
    expect(consequenceTimeline.ninetyDays.length).toBeGreaterThan(0);
  });

  it("requires recordStatus and never omits it", () => {
    const { recordStatus } = FULL_RESULT;
    expect(recordStatus).toBeDefined();
    expect(["SESSION_PREVIEW", "ACCOUNT_RECORD", "GOVERNED_CASE"]).toContain(recordStatus.level);
    expect(typeof recordStatus.label).toBe("string");
  });

  it("earnedRoute returns exactly one primary action", () => {
    const { earnedRoute } = FULL_RESULT;
    expect(earnedRoute).toBeDefined();
    expect(typeof earnedRoute.route).toBe("string");
    expect(typeof earnedRoute.label).toBe("string");
    expect(typeof earnedRoute.href).toBe("string");
    expect(typeof earnedRoute.reason).toBe("string");
    expect(earnedRoute.href.startsWith("/")).toBe(true);
  });

  it("accepts null score when not quantifiable", () => {
    const withNullScore: AssessmentResult = { ...FULL_RESULT, score: null };
    expect(withNullScore.score).toBeNull();
  });

  it("accepts undefined score when not quantifiable", () => {
    const withUndefinedScore: AssessmentResult = { ...FULL_RESULT, score: undefined };
    expect(withUndefinedScore.score).toBeUndefined();
  });

  it("accepts optional caseId in recordStatus", () => {
    const withCase: AssessmentResult = {
      ...FULL_RESULT,
      recordStatus: { level: "GOVERNED_CASE", label: "Governed case — CASE-2605-A3F2", caseId: "CASE-2605-A3F2" },
    };
    expect(withCase.recordStatus.caseId).toBe("CASE-2605-A3F2");
  });
});

// ─── describeEvidencePosture ──────────────────────────────────────────────────

describe("describeEvidencePosture", () => {
  const postures: EvidencePosture[] = [
    "USER_REPORTED",
    "SYSTEM_INFERRED",
    "OPERATOR_VERIFIED",
    "THIRD_PARTY",
  ];

  for (const posture of postures) {
    it(`returns a non-empty description for ${posture}`, () => {
      const desc = describeEvidencePosture(posture);
      expect(typeof desc).toBe("string");
      expect(desc.length).toBeGreaterThan(10);
    });
  }
});

// ─── earnedRouteHref ──────────────────────────────────────────────────────────

describe("earnedRouteHref", () => {
  const routes: EarnedRoute[] = [
    "WATCH",
    "NEXT_ASSESSMENT",
    "DECISION_CENTRE",
    "EXECUTIVE_REPORTING",
    "STRATEGY_ROOM",
    "RETAINER_OVERSIGHT",
    "COUNSEL_REVIEW",
    "BOARDROOM",
  ];

  for (const route of routes) {
    it(`returns a path starting with / for ${route}`, () => {
      const href = earnedRouteHref(route);
      expect(href.startsWith("/")).toBe(true);
    });
  }
});

// ─── earnedRouteLabel ─────────────────────────────────────────────────────────

describe("earnedRouteLabel", () => {
  it("returns a non-empty label for every EarnedRoute", () => {
    const routes: EarnedRoute[] = [
      "WATCH", "NEXT_ASSESSMENT", "DECISION_CENTRE", "EXECUTIVE_REPORTING",
      "STRATEGY_ROOM", "RETAINER_OVERSIGHT", "COUNSEL_REVIEW", "BOARDROOM",
    ];
    for (const route of routes) {
      expect(earnedRouteLabel(route).length).toBeGreaterThan(0);
    }
  });
});

// ─── recordStatusLabel ────────────────────────────────────────────────────────

describe("recordStatusLabel", () => {
  it("SESSION_PREVIEW label mentions sign-in", () => {
    expect(recordStatusLabel("SESSION_PREVIEW")).toContain("sign in");
  });

  it("ACCOUNT_RECORD label mentions Decision Centre when no caseId", () => {
    expect(recordStatusLabel("ACCOUNT_RECORD")).toContain("Decision Centre");
  });

  it("GOVERNED_CASE label includes caseId when provided", () => {
    expect(recordStatusLabel("GOVERNED_CASE", "CASE-2605-A3F2")).toContain("CASE-2605-A3F2");
  });
});
