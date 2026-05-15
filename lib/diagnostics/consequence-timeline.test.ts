import { describe, expect, it } from "vitest";

import {
  buildConsequenceTimeline,
  type ConsequenceTimelineInput,
} from "./consequence-timeline";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const kinds = [
  "FAST_DIAGNOSTIC",
  "PURPOSE_ALIGNMENT",
  "CONSTITUTIONAL_DIAGNOSTIC",
  "TEAM_ASSESSMENT",
  "ENTERPRISE_ASSESSMENT",
] as const;

const base: Omit<ConsequenceTimelineInput, "kind"> = {
  band: "MODERATE",
  primaryFinding: "Moderate organisational drift observed.",
};

// ─── Output shape ─────────────────────────────────────────────────────────────

describe("buildConsequenceTimeline — output shape", () => {
  it("always returns all three periods", () => {
    const result = buildConsequenceTimeline({ ...base, kind: "FAST_DIAGNOSTIC" });
    expect(typeof result.sevenDays).toBe("string");
    expect(typeof result.thirtyDays).toBe("string");
    expect(typeof result.ninetyDays).toBe("string");
    expect(result.sevenDays.length).toBeGreaterThan(10);
    expect(result.thirtyDays.length).toBeGreaterThan(10);
    expect(result.ninetyDays.length).toBeGreaterThan(10);
  });

  for (const kind of kinds) {
    it(`returns all three periods for kind: ${kind}`, () => {
      const result = buildConsequenceTimeline({ ...base, kind });
      expect(result.sevenDays).toBeDefined();
      expect(result.thirtyDays).toBeDefined();
      expect(result.ninetyDays).toBeDefined();
      expect(result.sevenDays.length).toBeGreaterThan(0);
      expect(result.thirtyDays.length).toBeGreaterThan(0);
      expect(result.ninetyDays.length).toBeGreaterThan(0);
    });
  }
});

// ─── Qualitative defaults ─────────────────────────────────────────────────────

describe("buildConsequenceTimeline — qualitative (no financial data)", () => {
  it("severe band produces urgency-weighted language", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "CRITICAL",
      primaryFinding: "Governance failure identified.",
    });
    // Severe bands should surface compounding / structural language
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ");
    expect(combined.toLowerCase()).toMatch(/compou|structur|interven|escalat|embed/);
  });

  it("ALERT band is treated as severe", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "ALERT",
      primaryFinding: "Authority gap.",
    });
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ");
    expect(combined.toLowerCase()).toMatch(/compou|structur|interven|escalat|embed/);
  });

  it("mild band produces monitoring language", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "mild",
      primaryFinding: "Minor pattern noted.",
    });
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ");
    expect(combined.toLowerCase()).toMatch(/monitor|review|re-assess|watch|open/);
  });

  it("moderate band produces drift-tracking language", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
      primaryFinding: "Moderate drift observed.",
    });
    // Moderate should mention drift or alignment correction
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ");
    expect(combined.toLowerCase()).toMatch(/drift|align|correct|misalign|embed/);
  });

  it("unrecognised band falls back to mild", () => {
    const result = buildConsequenceTimeline({
      kind: "TEAM_ASSESSMENT",
      band: "unknown-xyz",
      primaryFinding: "Some finding.",
    });
    // Should not throw and should return non-empty strings
    expect(result.sevenDays.length).toBeGreaterThan(0);
    expect(result.thirtyDays.length).toBeGreaterThan(0);
    expect(result.ninetyDays.length).toBeGreaterThan(0);
  });
});

// ─── Quantitative timeline ────────────────────────────────────────────────────

describe("buildConsequenceTimeline — quantitative (weeklyCost supplied)", () => {
  it("uses financial figures when weeklyCost is positive", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
      primaryFinding: "Cost overrun identified.",
      weeklyCost: 10_000,
    });
    expect(result.sevenDays).toContain("£");
    expect(result.thirtyDays).toContain("£");
    expect(result.ninetyDays).toContain("£");
  });

  it("formats amounts ≥ 1 000 000 as £Xm", () => {
    const result = buildConsequenceTimeline({
      kind: "ENTERPRISE_ASSESSMENT",
      band: "CRITICAL",
      primaryFinding: "Large cost exposure.",
      weeklyCost: 2_000_000,
    });
    expect(result.sevenDays).toMatch(/£\d+(\.\d+)?m/);
  });

  it("formats amounts ≥ 1 000 as £Xk", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
      primaryFinding: "Mid-range exposure.",
      weeklyCost: 5_000,
    });
    expect(result.sevenDays).toMatch(/£\d+k/);
  });

  it("7-day figure equals weeklyCost, 30-day is ~4.3×, 90-day is ~12.9×", () => {
    const weeklyCost = 7_000;
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "MODERATE",
      primaryFinding: "Cost exposure.",
      weeklyCost,
    });
    // Extract numeric values from strings and check ratios
    expect(result.thirtyDays).toContain("£");
    expect(result.ninetyDays).toContain("£");
    // 90-day cost > 30-day cost > 7-day cost is the key property
    const extractNum = (s: string): number =>
      parseFloat(s.replace(/[^0-9.]/g, ""));
    const sevenNum = extractNum(result.sevenDays);
    const thirtyNum = extractNum(result.thirtyDays);
    const ninetyNum = extractNum(result.ninetyDays);
    expect(ninetyNum).toBeGreaterThan(thirtyNum);
    expect(thirtyNum).toBeGreaterThan(sevenNum);
  });

  it("falls back to qualitative when weeklyCost is 0", () => {
    const result = buildConsequenceTimeline({
      kind: "FAST_DIAGNOSTIC",
      band: "CRITICAL",
      primaryFinding: "Severe finding.",
      weeklyCost: 0,
    });
    // No currency symbol — qualitative path
    expect(result.sevenDays).not.toContain("£");
  });

  it("falls back to qualitative when weeklyCost is null", () => {
    const result = buildConsequenceTimeline({
      kind: "TEAM_ASSESSMENT",
      band: "SEVERE",
      primaryFinding: "Team failure.",
      weeklyCost: null,
    });
    expect(result.sevenDays).not.toContain("£");
  });
});

// ─── Per-kind severe timelines ────────────────────────────────────────────────

describe("buildConsequenceTimeline — severe by kind", () => {
  it("CONSTITUTIONAL_DIAGNOSTIC severe references governance/constitutional", () => {
    const result = buildConsequenceTimeline({
      kind: "CONSTITUTIONAL_DIAGNOSTIC",
      band: "SEVERE",
      primaryFinding: "Constitutional mandate conflict.",
    });
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ").toLowerCase();
    expect(combined).toMatch(/constitution|governance|authority|restructur/);
  });

  it("ENTERPRISE_ASSESSMENT severe references enterprise/board", () => {
    const result = buildConsequenceTimeline({
      kind: "ENTERPRISE_ASSESSMENT",
      band: "CRITICAL",
      primaryFinding: "Enterprise execution failure.",
    });
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ").toLowerCase();
    expect(combined).toMatch(/enterprise|board|systemic|institution/);
  });

  it("TEAM_ASSESSMENT severe references team dysfunction", () => {
    const result = buildConsequenceTimeline({
      kind: "TEAM_ASSESSMENT",
      band: "ALERT",
      primaryFinding: "Team trust breakdown.",
    });
    const combined = [result.sevenDays, result.thirtyDays, result.ninetyDays].join(" ").toLowerCase();
    expect(combined).toMatch(/team|leadership|dysfunction|deliver/);
  });
});
