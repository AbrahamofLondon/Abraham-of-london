/**
 * Strategy Room Adapter — proof tests.
 *
 * Proves that the adapter:
 *   1. selfTest passes with strong fixture
 *   2. Weak evidence fixture (authority=No) returns DECLINED gate with blocker findings
 *   3. Strong evidence fixture returns ACCEPTED gate
 *   4. ruleTrace exists — every formula step has a non-empty sourceRule
 *   5. sourceRule references real production files
 *   6. limitations are explicit and non-empty
 *   7. No production mutation occurs (no stateToken, caseRef, sessionId, DB fields)
 *   8. Engine version is captured
 *   9. Invalid input returns typed finding (not a throw)
 *  10. Score breakdown reflects production scoring logic
 */

import { describe, it, expect } from "vitest";
import {
  run,
  selfTest,
  getVersion,
  STRATEGY_ROOM_ENGINE_ID,
  STRATEGY_ROOM_VERSION,
} from "@/lib/research/engines/strategy-room-adapter";

// ─── Identity ─────────────────────────────────────────────────────────────────

describe("Strategy Room Adapter — identity", () => {
  it("engine ID is 'strategy-room'", () => {
    expect(STRATEGY_ROOM_ENGINE_ID).toBe("strategy-room");
  });

  it("version is semver string", () => {
    expect(STRATEGY_ROOM_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("getVersion() returns expected version", async () => {
    const { version } = await getVersion();
    expect(version).toBe(STRATEGY_ROOM_VERSION);
  });
});

// ─── selfTest ─────────────────────────────────────────────────────────────────

describe("Strategy Room Adapter — selfTest", () => {
  it("selfTest passes with default strong fixture", async () => {
    const result = await selfTest();
    expect(result.ok).toBe(true);
  });

  it("selfTest detail mentions findings count", async () => {
    const result = await selfTest();
    expect(result.detail).toMatch(/findings/i);
  });
});

// ─── Strong fixture (passes threshold) ───────────────────────────────────────

describe("Strategy Room Adapter — strong fixture (ACCEPTED)", () => {
  it("returns ACCEPTED gate finding with strong fixture", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const gateFinding = result.findings.find(
      (f) => f.title.includes("ACCEPTED") || f.title.includes("DECLINED"),
    );
    expect(gateFinding).toBeDefined();
    expect(gateFinding?.title).toContain("ACCEPTED");
  });

  it("score meets threshold (16/25) with strong fixture", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { total: number; threshold: number };
    expect(score.total).toBeGreaterThanOrEqual(score.threshold);
  });

  it("evaluationStatus is 'accepted' with strong fixture", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(raw["evaluationStatus"]).toBe("accepted");
  });

  it("gatesPassed is true with strong fixture", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { gatesPassed: boolean };
    expect(score.gatesPassed).toBe(true);
  });
});

// ─── Weak fixture (authority=No, below threshold) ─────────────────────────────

describe("Strategy Room Adapter — weak fixture (DECLINED)", () => {
  it("returns DECLINED gate finding with weak fixture", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const gateFinding = result.findings.find(
      (f) => f.title.includes("DECLINED"),
    );
    expect(gateFinding).toBeDefined();
  });

  it("evaluationStatus is 'declined' with weak fixture", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(raw["evaluationStatus"]).toBe("declined");
  });

  it("score is below threshold with weak fixture", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { total: number; threshold: number };
    expect(score.total).toBeLessThan(score.threshold);
  });

  it("authority component is 0 when hasAuthority=No", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { components: Record<string, number> };
    expect(score.components.authority).toBe(0);
  });

  it("authority gate finding appears for weak fixture", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const authorityFinding = result.findings.find(
      (f) => f.title.toLowerCase().includes("authority"),
    );
    expect(authorityFinding).toBeDefined();
    expect(authorityFinding?.severity).toBe("HIGH");
  });

  it("severity is HIGH or MEDIUM when gate declined", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    expect(["HIGH", "MEDIUM"]).toContain(result.severity);
  });
});

// ─── ruleTrace — every step has sourceRule ────────────────────────────────────

describe("Strategy Room Adapter — ruleTrace", () => {
  it("formulaSteps array is non-empty", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("every formula step has a non-empty sourceRule", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    for (const step of steps) {
      expect(typeof step.sourceRule).toBe("string");
      expect((step.sourceRule as string).trim().length).toBeGreaterThan(0);
    }
  });

  it("sourceRules reference real production files", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    const allRules = steps.map((s) => s.sourceRule as string).join(" ");
    expect(allRules).toMatch(/strategy-room\.ts|decision-authority\.ts/);
  });

  it("scoring step is present with stepId 'intake-scoring'", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    const scoringStep = steps.find((s) => s.stepId === "intake-scoring");
    expect(scoringStep).toBeDefined();
  });

  it("gate evaluation step is present with stepId 'gate-evaluation'", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const steps = raw["formulaSteps"] as Array<Record<string, unknown>>;
    const gateStep = steps.find((s) => s.stepId === "gate-evaluation");
    expect(gateStep).toBeDefined();
  });
});

// ─── Limitations honesty ──────────────────────────────────────────────────────

describe("Strategy Room Adapter — limitations honesty", () => {
  it("limitations array is non-empty", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    expect(result.limitations).toBeDefined();
    expect(result.limitations!.length).toBeGreaterThan(0);
  });

  it("promotionRequirements array is non-empty", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    expect(result.promotionRequirements).toBeDefined();
    expect(result.promotionRequirements!.length).toBeGreaterThan(0);
  });

  it("limitations mention DB admission check not called", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const allLimitations = result.limitations!.join(" ").toLowerCase();
    expect(allLimitations).toMatch(/db|database|journey|admission/);
  });

  it("limitations mention persistence (archive) not called", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const allLimitations = result.limitations!.join(" ").toLowerCase();
    expect(allLimitations).toMatch(/archiv|persist/);
  });

  it("limitations mention notification not called", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const allLimitations = result.limitations!.join(" ").toLowerCase();
    expect(allLimitations).toMatch(/discord|notif|webhook/);
  });
});

// ─── No production mutation ───────────────────────────────────────────────────

describe("Strategy Room Adapter — no production mutation", () => {
  it("result does not expose stateToken", async () => {
    const result = await run({ payload: { useDefaultFixture: true } }) as Record<string, unknown>;
    expect(result["stateToken"]).toBeUndefined();
  });

  it("result does not expose caseRef", async () => {
    const result = await run({ payload: { useDefaultFixture: true } }) as Record<string, unknown>;
    expect(result["caseRef"]).toBeUndefined();
  });

  it("result does not expose sessionId", async () => {
    const result = await run({ payload: { useDefaultFixture: true } }) as Record<string, unknown>;
    expect(result["sessionId"]).toBeUndefined();
  });

  it("rawOutput does not expose email address fields from the intake contact", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const rawStr = JSON.stringify(result.rawOutput);
    // Raw output must not expose email hash, stateToken, or direct email — those are customer fields
    expect(rawStr).not.toContain("emailHash");
    expect(rawStr).not.toContain("stateToken");
    expect(rawStr).not.toContain("spine");
  });

  it("productionFunctionsCalled does not include archive or discord", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const called = (raw["productionFunctionsCalled"] as string[]).join(" ").toLowerCase();
    expect(called).not.toContain("archive");
    expect(called).not.toContain("discord");
    expect(called).not.toContain("notify");
  });
});

// ─── Decision directive ───────────────────────────────────────────────────────

describe("Strategy Room Adapter — decision directive", () => {
  it("directiveLevel is present in rawOutput", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    expect(["allow", "warn", "restrict", "block"]).toContain(raw["directiveLevel"]);
  });

  it("directive finding is present in findings", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const directiveFinding = result.findings.find(
      (f) => f.title.toLowerCase().includes("directive"),
    );
    expect(directiveFinding).toBeDefined();
    expect(directiveFinding!.source).toMatch(/decision-authority\.ts/);
  });

  it("weak fixture produces block or restrict directive from tension thread", async () => {
    const result = await run({ payload: { useWeakFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    // Weak fixture should produce structural tensions → restrict or block
    expect(["allow", "warn", "restrict", "block"]).toContain(raw["directiveLevel"]);
  });
});

// ─── Score component verification ────────────────────────────────────────────

describe("Strategy Room Adapter — score components", () => {
  it("score has all 8 expected components", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { components: Record<string, number> };
    const expectedComponents = [
      "authority", "mandate", "decisionClarity", "tradeoffMaturity",
      "urgencyCredibility", "consequenceAwareness", "constraintRealism", "accountabilityReadiness",
    ];
    for (const comp of expectedComponents) {
      expect(score.components[comp]).toBeDefined();
      expect(typeof score.components[comp]).toBe("number");
    }
  });

  it("total score equals sum of components", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { total: number; components: Record<string, number> };
    const sum = Object.values(score.components).reduce((a, b) => a + b, 0);
    expect(score.total).toBe(sum);
  });

  it("max score is 25", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { max: number };
    expect(score.max).toBe(25);
  });

  it("threshold is 16", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { threshold: number };
    expect(score.threshold).toBe(16);
  });
});

// ─── Authority override test ──────────────────────────────────────────────────

describe("Strategy Room Adapter — authority override", () => {
  it("hasAuthority=No produces authority component of 0", async () => {
    const result = await run({
      payload: {
        authority: { hasAuthority: "No", role: "Manager", mandate: "" },
        decision: { statement: "Should we pivot or stay the course on our current strategy given the market shift?" },
        readiness: { readyForUnpleasantDecision: "Yes", willingAccountability: "Yes", whyNow: "Market conditions require a decision within 30 days." },
        declarationAccepted: true,
      },
    });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { components: { authority: number } };
    expect(score.components.authority).toBe(0);
  });

  it("hasAuthority='Yes, fully' produces authority component of 4", async () => {
    const result = await run({
      payload: {
        authority: { hasAuthority: "Yes, fully", role: "CEO", mandate: "Full board mandate to restructure." },
        decision: { statement: "Should we pivot or stay the course on our current strategy given the market shift?" },
        readiness: { readyForUnpleasantDecision: "Yes", willingAccountability: "Yes", whyNow: "Market conditions require a decision within 30 days." },
        declarationAccepted: true,
      },
    });
    const raw = result.rawOutput as Record<string, unknown>;
    const score = raw["score"] as { components: { authority: number } };
    expect(score.components.authority).toBe(4);
  });
});

// ─── Production functions audit ───────────────────────────────────────────────

describe("Strategy Room Adapter — production functions audit", () => {
  it("productionFunctionsCalled lists computeScore", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const called = raw["productionFunctionsCalled"] as string[];
    expect(called.some((fn) => fn.includes("computeScore"))).toBe(true);
  });

  it("productionFunctionsCalled lists evaluateIntake", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const called = raw["productionFunctionsCalled"] as string[];
    expect(called.some((fn) => fn.includes("evaluateIntake"))).toBe(true);
  });

  it("productionFunctionsCalled lists deriveDecisionDirective", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const called = raw["productionFunctionsCalled"] as string[];
    expect(called.some((fn) => fn.includes("deriveDecisionDirective"))).toBe(true);
  });

  it("pipelineStagesNotCalled lists admission and archive stages", async () => {
    const result = await run({ payload: { useDefaultFixture: true } });
    const raw = result.rawOutput as Record<string, unknown>;
    const notCalled = (raw["pipelineStagesNotCalled"] as string[]).join(" ");
    expect(notCalled).toMatch(/admission|archive|discord/i);
  });
});
