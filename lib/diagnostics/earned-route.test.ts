import { describe, expect, it } from "vitest";

import { deriveEarnedRoute, type EarnedRouteInput } from "./earned-route";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const base: Omit<EarnedRouteInput, "band" | "kind"> = {
  primaryFinding: "Moderate organisational drift observed.",
  evidencePosture: "USER_REPORTED",
};

// ─── Each call returns exactly one primary action ─────────────────────────────

describe("deriveEarnedRoute — output shape", () => {
  it("always returns a single route, label, href, and reason", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
    });
    expect(typeof result.route).toBe("string");
    expect(typeof result.label).toBe("string");
    expect(typeof result.href).toBe("string");
    expect(typeof result.reason).toBe("string");
    expect(result.href.startsWith("/")).toBe(true);
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it("never returns null or undefined", () => {
    const inputs: EarnedRouteInput[] = [
      { ...base, kind: "FAST_DIAGNOSTIC", band: "ALERT" },
      { ...base, kind: "FAST_DIAGNOSTIC", band: "MODERATE" },
      { ...base, kind: "FAST_DIAGNOSTIC", band: "mild" },
      { ...base, kind: "ENTERPRISE_ASSESSMENT", band: "CRITICAL" },
      { ...base, kind: "TEAM_ASSESSMENT", band: "SEVERE" },
    ];
    for (const input of inputs) {
      const result = deriveEarnedRoute(input);
      expect(result).toBeDefined();
      expect(result.route).toBeDefined();
    }
  });
});

// ─── Insufficient evidence ────────────────────────────────────────────────────

describe("deriveEarnedRoute — insufficient evidence", () => {
  it("routes FAST_DIAGNOSTIC + insufficient evidence to NEXT_ASSESSMENT", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "FAST_DIAGNOSTIC",
      band: "INSUFFICIENT",
    });
    expect(result.route).toBe("NEXT_ASSESSMENT");
  });

  it("routes ENTERPRISE_ASSESSMENT + insufficient evidence to NEXT_ASSESSMENT", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "ENTERPRISE_ASSESSMENT",
      band: "INSUFFICIENT_EVIDENCE",
    });
    expect(result.route).toBe("NEXT_ASSESSMENT");
  });

  it("routes TEAM_ASSESSMENT + incomplete band to NEXT_ASSESSMENT", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "TEAM_ASSESSMENT",
      band: "incomplete",
    });
    expect(result.route).toBe("NEXT_ASSESSMENT");
  });
});

// ─── Authority / accountability gap → Strategy Room ──────────────────────────

describe("deriveEarnedRoute — severe authority gap", () => {
  it("routes FAST_DIAGNOSTIC severe authority gap to STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      kind: "FAST_DIAGNOSTIC",
      band: "ALERT",
      primaryFinding: "Authority is unclear. No binding owner identified.",
      evidencePosture: "USER_REPORTED",
    });
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes severe accountability gap to STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      kind: "FAST_DIAGNOSTIC",
      band: "CRITICAL",
      primaryFinding: "No clear accountability for the outcome.",
      evidencePosture: "SYSTEM_INFERRED",
    });
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes severe mandate gap to STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      kind: "CONSTITUTIONAL_DIAGNOSTIC",
      band: "SEVERE",
      primaryFinding: "Mandate conflict between governance bodies.",
      evidencePosture: "USER_REPORTED",
    });
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes severe non-authority finding to EXECUTIVE_REPORTING not STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      kind: "FAST_DIAGNOSTIC",
      band: "CRITICAL",
      primaryFinding: "Strategic contradiction in execution timeline.",
      evidencePosture: "USER_REPORTED",
    });
    expect(result.route).toBe("EXECUTIVE_REPORTING");
  });
});

// ─── Enterprise Assessment ────────────────────────────────────────────────────

describe("deriveEarnedRoute — Enterprise Assessment", () => {
  it("routes enterprise severe to EXECUTIVE_REPORTING", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "ENTERPRISE_ASSESSMENT",
      band: "CRITICAL",
    });
    expect(result.route).toBe("EXECUTIVE_REPORTING");
  });

  it("routes enterprise moderate to STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "ENTERPRISE_ASSESSMENT",
      band: "MODERATE",
    });
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes enterprise mild to DECISION_CENTRE", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "ENTERPRISE_ASSESSMENT",
      band: "mild",
    });
    expect(result.route).toBe("DECISION_CENTRE");
  });
});

// ─── Team Assessment ──────────────────────────────────────────────────────────

describe("deriveEarnedRoute — Team Assessment", () => {
  it("routes team severe with verified evidence to STRATEGY_ROOM", () => {
    const result = deriveEarnedRoute({
      kind: "TEAM_ASSESSMENT",
      band: "SEVERE",
      primaryFinding: "Team execution failure with trust breakdown.",
      evidencePosture: "OPERATOR_VERIFIED",
    });
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes team severe with user-reported only to NEXT_ASSESSMENT (enterprise gate)", () => {
    const result = deriveEarnedRoute({
      kind: "TEAM_ASSESSMENT",
      band: "SEVERE",
      primaryFinding: "Team execution failure.",
      evidencePosture: "USER_REPORTED",
    });
    expect(result.route).toBe("NEXT_ASSESSMENT");
  });

  it("routes team moderate to DECISION_CENTRE", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "TEAM_ASSESSMENT",
      band: "MODERATE",
    });
    expect(result.route).toBe("DECISION_CENTRE");
  });

  it("routes team mild to WATCH", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "TEAM_ASSESSMENT",
      band: "mild",
    });
    expect(result.route).toBe("WATCH");
  });
});

// ─── Score-based routing ──────────────────────────────────────────────────────

describe("deriveEarnedRoute — score-based severity", () => {
  it("routes score ≥ 70 as severe even with a non-severe band", () => {
    const result = deriveEarnedRoute({
      kind: "FAST_DIAGNOSTIC",
      band: "watch",
      primaryFinding: "Execution failure — no owner.",
      evidencePosture: "USER_REPORTED",
      score: 80,
    });
    // Severe authority finding → STRATEGY_ROOM
    expect(result.route).toBe("STRATEGY_ROOM");
  });

  it("routes score < 40 as mild when band is also unrecognised", () => {
    const result = deriveEarnedRoute({
      kind: "FAST_DIAGNOSTIC",
      band: "unknown-band",
      primaryFinding: "Minor pattern observed.",
      evidencePosture: "USER_REPORTED",
      score: 20,
    });
    expect(result.route).toBe("WATCH");
  });
});

// ─── Moderate routing ─────────────────────────────────────────────────────────

describe("deriveEarnedRoute — moderate routing", () => {
  it("routes FAST_DIAGNOSTIC moderate to DECISION_CENTRE", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
    });
    expect(result.route).toBe("DECISION_CENTRE");
  });

  it("routes PURPOSE_ALIGNMENT moderate to DECISION_CENTRE", () => {
    const result = deriveEarnedRoute({
      ...base,
      kind: "PURPOSE_ALIGNMENT",
      band: "AMBER",
    });
    expect(result.route).toBe("DECISION_CENTRE");
  });
});
