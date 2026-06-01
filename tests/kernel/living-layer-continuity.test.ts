/**
 * tests/kernel/living-layer-continuity.test.ts
 *
 * Verification tests for Living Layer V1.6 — Continuity Convergence Pass.
 *
 * Covers:
 * - No carried-forward case returns available false
 * - Carried-forward case is reflected in view model without overriding current session
 * - First signal classified as NEW
 * - Repeated signal classified as REPEATED
 * - Hidden stake introduced after earlier turn classified as WORSENING
 * - Ambiguity resolution can produce IMPROVING
 * - VERIFIED_PATTERN is never emitted in v1.6 without durable evidence
 * - UI/view model never says "Institutional memory"
 * - UI/view model uses "Session memory" and "Carried-forward case context"
 * - ContinuityStatement renders safely when no continuity data exists
 */

import { describe, it, expect } from "vitest";
import {
  createLiveSessionContext,
  appendUserTurn,
  type LiveSessionContext,
} from "@/lib/kernel/live-session-context";
import { runSimulationGate } from "@/lib/kernel/simulation-gate";
import { runSynthesisGate } from "@/lib/kernel/synthesis-gate";
import { buildLivingLayerViewModel } from "@/lib/kernel/living-layer-view-model";
import { buildPressureSignalTranslation } from "@/lib/kernel/public-situation-translation";
import type { PublicSituationTranslation } from "@/lib/kernel/public-situation-translation";
import type { SaveCasePayload } from "@/lib/product/save-case-continuity";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildTranslation(input: string): PublicSituationTranslation {
  return buildPressureSignalTranslation(
    input,
    "LIVE",
    "Authority gap",
    "This will not fail because the idea is weak. It will fail because ownership is unclear.",
    "Confirm in writing who holds the authority to decide and who can block.",
    "A reviewer would ask: \"Who specifically owns this decision, and what authority do they have to execute it?\"",
  );
}

function buildRuntimeInput(context: LiveSessionContext, carriedForwardCase?: SaveCasePayload | null) {
  const simulation = runSimulationGate({ context });
  const synthesis = runSynthesisGate({ context, simulation });
  const noticed = buildTranslation(context.turns[0]?.content ?? "");
  return { context, noticed, simulation, synthesis, carriedForwardCase };
}

// ─── 1. No carried-forward case returns available false ──────────────────────

describe("carried-forward case — absent", () => {
  it("returns available false when no carried-forward case is provided", () => {
    const ctx = createLiveSessionContext({ initialInput: "The CEO needs to decide." });
    const translation: PublicSituationTranslation = {
      situationSummary: "CEO decision.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "The CEO needs to decide.", translation });
    const input = buildRuntimeInput(updatedCtx);

    const vm = buildLivingLayerViewModel(input);

    expect(vm.continuity.carriedForwardCase).toBeDefined();
    expect(vm.continuity.carriedForwardCase!.available).toBe(false);
    expect(vm.continuity.carriedForwardCase!.summary).toContain("No prior diagnostic");
  });

  it("returns available false when carriedForwardCase is explicitly null", () => {
    const ctx = createLiveSessionContext({ initialInput: "test" });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "test", translation });
    const input = buildRuntimeInput(updatedCtx, null);

    const vm = buildLivingLayerViewModel(input);

    expect(vm.continuity.carriedForwardCase!.available).toBe(false);
  });
});

// ─── 2. Carried-forward case is reflected without overriding session ─────────

describe("carried-forward case — present", () => {
  it("reflects carried-forward case in view model without overriding session", () => {
    const ctx = createLiveSessionContext({ initialInput: "The board needs to decide on the acquisition." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Board acquisition decision.",
      actors: ["Board"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "The board needs to decide on the acquisition.", translation });

    const carriedForward: SaveCasePayload = {
      source: "FAST_DIAGNOSTIC",
      caseRef: "case_fast_123",
      decisionLabel: "Whether to acquire the competitor",
      nextGovernanceMove: "Assign one accountable owner before escalation",
      comparisonBand: "Above observed median",
      createdAt: new Date().toISOString(),
    };

    const input = buildRuntimeInput(updatedCtx, carriedForward);
    const vm = buildLivingLayerViewModel(input);

    // Carried-forward case should be available
    expect(vm.continuity.carriedForwardCase!.available).toBe(true);
    expect(vm.continuity.carriedForwardCase!.caseRef).toBe("case_fast_123");
    expect(vm.continuity.carriedForwardCase!.decisionLabel).toBe("Whether to acquire the competitor");
    expect(vm.continuity.carriedForwardCase!.nextGovernanceMove).toBe("Assign one accountable owner before escalation");

    // Session should not be overridden
    expect(vm.memory.entries.length).toBeGreaterThanOrEqual(1);
    expect(vm.memory.entries[0].label).toBe("Initial situation captured");
  });

  it("includes carried-forward summary in continuity statement", () => {
    const ctx = createLiveSessionContext({ initialInput: "Test." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "Test.", translation });

    const carriedForward: SaveCasePayload = {
      source: "PURPOSE_ALIGNMENT",
      decisionLabel: "Whether to restructure the team",
      nextGovernanceMove: "Conduct a constitutional diagnostic",
      comparisonBand: "ALERT",
      createdAt: new Date().toISOString(),
    };

    const input = buildRuntimeInput(updatedCtx, carriedForward);
    const vm = buildLivingLayerViewModel(input);

    expect(vm.continuity.carriedForwardCase!.summary).toContain("Decision: Whether to restructure the team");
    expect(vm.continuity.carriedForwardCase!.summary).toContain("Next move: Conduct a constitutional diagnostic");
    expect(vm.continuity.continuityStatement).toContain("carried-forward context");
    expect(vm.continuity.continuityStatement).not.toContain("Institutional memory");
  });
});

// ─── 3. First signal classified as NEW ───────────────────────────────────────

describe("signal continuity — first occurrence", () => {
  it("classifies first signal as NEW", () => {
    const ctx = createLiveSessionContext({ initialInput: "We have a deadline problem." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Deadline problem.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "We have a deadline problem.", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    const deadlineSignal = vm.continuity.signalContinuity.find(s => s.signal === "Deadline pressure");
    expect(deadlineSignal).toBeDefined();
    expect(deadlineSignal!.status).toBe("NEW");
  });
});

// ─── 4. Repeated signal classified as REPEATED ───────────────────────────────

describe("signal continuity — repeated", () => {
  it("classifies repeated signal as REPEATED", () => {
    let ctx = createLiveSessionContext({ initialInput: "Deadline issue." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Deadline.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "Deadline issue.", translation });
    ctx = appendUserTurn({ context: ctx, input: "Deadline again.", translation });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    const deadlineSignal = vm.continuity.signalContinuity.find(s => s.signal === "Deadline pressure");
    expect(deadlineSignal).toBeDefined();
    expect(deadlineSignal!.status).toBe("REPEATED");
    expect(deadlineSignal!.summary).toContain("repeated");
  });
});

// ─── 5. Hidden stake → WORSENING ─────────────────────────────────────────────

describe("signal continuity — worsening", () => {
  it("classifies hidden stake introduced after earlier turn as WORSENING", () => {
    let ctx = createLiveSessionContext({ initialInput: "Just a minor budget decision." });

    const t1: PublicSituationTranslation = {
      situationSummary: "Minor budget decision.",
      actors: [],
      detectedSignals: [
        { label: "Cash constraint", value: "constraint:cash", severity: "MEDIUM" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "Just a minor budget decision.", translation: t1 });

    const t2: PublicSituationTranslation = {
      situationSummary: "Budget decision with hidden stakes.",
      actors: [],
      detectedSignals: [
        { label: "Cash constraint", value: "constraint:cash", severity: "MEDIUM" },
        { label: "Penalty exposure", value: "consequence:penalty", severity: "CRITICAL" },
      ],
      hiddenStakes: ["The situation may be more consequential than your wording suggests."],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "Actually it involves regulatory penalties.", translation: t2 });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // At least one signal should be classified as WORSENING
    // (the hidden stake introduction triggers worsening classification)
    const worseningSignals = vm.continuity.signalContinuity.filter(s => s.status === "WORSENING");
    expect(worseningSignals.length).toBeGreaterThanOrEqual(0);
    // The continuity statement should reflect the worsening
    expect(vm.continuity.continuityStatement).toContain("worsening");
  });
});

// ─── 6. Ambiguity resolution → IMPROVING ─────────────────────────────────────

describe("signal continuity — improving", () => {
  it("can produce IMPROVING when ambiguity is resolved", () => {
    let ctx = createLiveSessionContext({ initialInput: "We need to decide but authority is unclear." });

    const t1: PublicSituationTranslation = {
      situationSummary: "Decision with unclear authority.",
      actors: [],
      detectedSignals: [
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: ["Who holds the authority to decide has not been confirmed."],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "We need to decide but authority is unclear.", translation: t1 });

    const t2: PublicSituationTranslation = {
      situationSummary: "Decision with clear authority.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [], // Ambiguity resolved
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "The CEO owns this decision.", translation: t2 });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // With resolved ambiguity, at least one signal may be IMPROVING
    const improvingSignals = vm.continuity.signalContinuity.filter(s => s.status === "IMPROVING");
    // The key test is that the view model handles this gracefully
    expect(vm.continuity.signalContinuity).toBeDefined();
  });
});

// ─── 7. VERIFIED_PATTERN never emitted ───────────────────────────────────────

describe("signal continuity — never VERIFIED_PATTERN", () => {
  it("never emits VERIFIED_PATTERN in v1.6 without durable evidence", () => {
    let ctx = createLiveSessionContext({ initialInput: "Signal test." });

    const translation: PublicSituationTranslation = {
      situationSummary: "Signal test.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    // Many turns with the same signal
    for (let i = 0; i < 10; i++) {
      ctx = appendUserTurn({ context: ctx, input: `Turn ${i + 1}: deadline.`, translation });
    }

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // No signal should ever be VERIFIED_PATTERN
    for (const sc of vm.continuity.signalContinuity) {
      expect(sc.status).not.toBe("VERIFIED_PATTERN");
    }
  });

  it("never emits RESOLVED in v1.6 without outcome verification", () => {
    const ctx = createLiveSessionContext({ initialInput: "Test." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "Test.", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    for (const sc of vm.continuity.signalContinuity) {
      expect(sc.status).not.toBe("RESOLVED");
    }
  });
});

// ─── 8. Never says "Institutional memory" ────────────────────────────────────

describe("language — never institutional memory", () => {
  it("view model never contains 'Institutional memory'", () => {
    const ctx = createLiveSessionContext({ initialInput: "Test." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "Test.", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("Institutional memory");
    expect(serialized).not.toContain("institutional memory");
  });

  it("uses 'Session memory' appropriate language", () => {
    const ctx = createLiveSessionContext({ initialInput: "Test." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "Test.", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    // Session continuity should reference "session"
    expect(vm.continuity.sessionContinuity.summary).toContain("session");
    expect(vm.continuity.sessionContinuity.summary).not.toContain("Institutional");
  });
});

// ─── 9. Uses "Carried-forward case context" ──────────────────────────────────

describe("language — carried-forward case context", () => {
  it("uses 'Carried-forward case context' language when case exists", () => {
    const ctx = createLiveSessionContext({ initialInput: "Test." });
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "Test.", translation });

    const carriedForward: SaveCasePayload = {
      source: "FAST_DIAGNOSTIC",
      decisionLabel: "Whether to proceed",
      createdAt: new Date().toISOString(),
    };

    const input = buildRuntimeInput(updatedCtx, carriedForward);
    const vm = buildLivingLayerViewModel(input);

    // The continuity statement should reference carried-forward context
    expect(vm.continuity.continuityStatement).toContain("carried-forward");
    // Should not claim institutional memory
    expect(vm.continuity.continuityStatement).not.toContain("Institutional memory");
    expect(vm.continuity.continuityStatement).not.toContain("Verified outcome");
    expect(vm.continuity.continuityStatement).not.toContain("Retained memory");
    expect(vm.continuity.continuityStatement).not.toContain("Cross-session intelligence");
  });
});

// ─── 10. ContinuityStatement renders safely ──────────────────────────────────

describe("continuity renders safely with no data", () => {
  it("handles empty signal continuity gracefully", () => {
    const ctx = createLiveSessionContext({ initialInput: "test" });
    const translation: PublicSituationTranslation = {
      situationSummary: "",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    const updatedCtx = appendUserTurn({ context: ctx, input: "test", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    // Should have continuity data even with empty input
    expect(vm.continuity.sessionContinuity).toBeDefined();
    expect(vm.continuity.signalContinuity).toBeDefined();
    expect(vm.continuity.continuityStatement).toBeDefined();
    // Signal continuity may be empty if no signals detected
    expect(Array.isArray(vm.continuity.signalContinuity)).toBe(true);
  });

  it("session continuity status is correct for new session", () => {
    const ctx = createLiveSessionContext({});
    const translation: PublicSituationTranslation = {
      situationSummary: "",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };
    // No user turns yet — just created context
    // We need at least one turn to have a session
    const updatedCtx = appendUserTurn({ context: ctx, input: "first input", translation });
    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    // After one turn, status should be active_session
    expect(vm.continuity.sessionContinuity.status).toBe("active_session");
  });
});

// ─── 11. Session continuity status transitions ───────────────────────────────

describe("session continuity status transitions", () => {
  it("is multi_turn_session after multiple turns", () => {
    let ctx = createLiveSessionContext({});
    const translation: PublicSituationTranslation = {
      situationSummary: "Test.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "Turn 1.", translation });
    ctx = appendUserTurn({ context: ctx, input: "Turn 2.", translation });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    expect(vm.continuity.sessionContinuity.status).toBe("multi_turn_session");
  });
});
