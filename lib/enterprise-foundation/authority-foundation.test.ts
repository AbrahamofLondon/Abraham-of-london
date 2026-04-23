import { describe, expect, it } from "vitest";
import { classifyDecisionStakeholders } from "./authority-foundation";

describe("enterprise authority foundation", () => {
  it("detects a single-point blocker", () => {
    expect(classifyDecisionStakeholders([
      { role: "CFO", function: "Finance", influenceLevel: "CRITICAL", alignmentState: "BLOCKING" },
      { role: "COO", function: "Operations", influenceLevel: "HIGH", alignmentState: "ALIGNED" },
    ])).toBe("single-point blocker");
  });

  it("detects authority divergence", () => {
    expect(classifyDecisionStakeholders([
      { role: "CFO", function: "Finance", influenceLevel: "HIGH", alignmentState: "DIVERGENT" },
      { role: "COO", function: "Operations", influenceLevel: "HIGH", alignmentState: "DIVERGENT" },
    ])).toBe("authority divergence");
  });

  it("detects decision orphaning when no owner is present", () => {
    expect(classifyDecisionStakeholders([
      { role: "Analyst", function: "Ops", influenceLevel: "LOW", alignmentState: "ALIGNED" },
    ])).toBe("decision orphaning");
  });

  it("detects hidden ownership gap when no stakeholders are mapped", () => {
    expect(classifyDecisionStakeholders([])).toBe("hidden ownership gap");
  });
});
