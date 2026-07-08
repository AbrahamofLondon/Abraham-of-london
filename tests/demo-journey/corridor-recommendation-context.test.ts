import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { _setRecommendationContextDbForTest, saveRecommendationContext, getRecommendationContext, listRecommendationContextsForSession, isRecommendationContextStale } from "@/lib/intelligence/corridor/recommendation-context-store";

const base = {
  recommendationId: "rec_abc12345",
  sessionId: "session-1",
  sessionVersion: 1,
  pressureBand: "HIGH",
  targetProductCode: "escalation-readiness-scorecard",
  targetLabel: "Escalation Readiness Scorecard",
  targetRoute: "/decision-instruments/escalation-readiness-scorecard",
  accessMode: "self_serve" as const,
  whyAdmissible: "High pressure with structural consequence makes escalation readiness the binding question.",
  evidenceBasis: ["Pressure verdict: HIGH", "Recommended next move"],
  established: ["High pressure", "Delay cost is compounding"],
  unresolved: { contradiction: "Confidence conflicts with stakes", evidenceGap: "Falsification condition missing", ownershipGap: "Owner unconfirmed", timingPressure: "Deadline pressure", unresolvedCommitment: "Name the constraint" },
  notYetAppropriate: "Operator Pilot: not justified until materiality is confirmed",
  carryForward: ["the contradiction", "the evidence gap"],
};

beforeEach(() => { _setRecommendationContextDbForTest(new Database(":memory:")); });

describe("durable Corridor recommendation context", () => {
  it("persists and retrieves a Signal recommendation context by stable recommendation id", () => {
    const saved = saveRecommendationContext(base, "2026-07-07T10:00:00.000Z");
    expect(saved.stateHash).toHaveLength(64);
    expect(getRecommendationContext(base.recommendationId)?.targetLabel).toBe("Escalation Readiness Scorecard");
    expect(listRecommendationContextsForSession("session-1")).toHaveLength(1);
  });

  it("updates the same recommendation instead of creating split identities", () => {
    const a = saveRecommendationContext(base, "2026-07-07T10:00:00.000Z");
    const b = saveRecommendationContext({ ...base, pressureBand: "CRITICAL" }, "2026-07-07T10:05:00.000Z");
    expect(b.contextId).toBe(a.contextId);
    expect(listRecommendationContextsForSession("session-1")).toHaveLength(1);
    expect(getRecommendationContext(base.recommendationId)?.pressureBand).toBe("CRITICAL");
  });

  it("detects stale recommendation context", () => {
    const saved = saveRecommendationContext(base, "2026-07-06T00:00:00.000Z");
    expect(isRecommendationContextStale(saved, new Date("2026-07-07T00:01:00.000Z"))).toBe(true);
  });

  it("rejects malformed recommendation identity", () => {
    expect(() => saveRecommendationContext({ ...base, recommendationId: "guess" })).toThrow(/Invalid recommendation/);
  });
});
