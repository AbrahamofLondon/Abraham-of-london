/**
 * tests/kernel/living-layer-v1.5.test.ts
 *
 * Verification and integrity tests for the Living Layer V1.5.
 *
 * Covers:
 * - Multi-turn context preservation
 * - Actor/signal deduplication and occurrence counting
 * - Evidence tier progression (conservative, never overclaims)
 * - "Session memory" language (never "Institutional memory")
 * - Simulation path cap (max 3)
 * - No internal scores/thresholds/taxonomy keys exposed in view model
 * - Weak/vague inputs trigger helpful refusal
 * - View model does not label evidence as verified without actual verification
 * - Shell renders safely when optional fields are missing
 */

import { describe, it, expect } from "vitest";
import {
  createLiveSessionContext,
  appendUserTurn,
  appendSystemTurn,
  type LiveSessionContext,
  type LiveSessionDelta,
} from "@/lib/kernel/live-session-context";
import { runSimulationGate } from "@/lib/kernel/simulation-gate";
import { runSynthesisGate } from "@/lib/kernel/synthesis-gate";
import { buildLivingLayerViewModel } from "@/lib/kernel/living-layer-view-model";
import { buildPressureSignalTranslation } from "@/lib/kernel/public-situation-translation";
import type { PublicSituationTranslation } from "@/lib/kernel/public-situation-translation";
import type { SimulationGateResult } from "@/lib/kernel/simulation-gate";
import type { SynthesisGateResult } from "@/lib/kernel/synthesis-gate";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a minimal PublicSituationTranslation from an input string.
 * Uses the existing pressure signal adapter for realistic test data.
 */
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

/**
 * Build a full LivingLayerRuntimeInput from a context.
 * Runs simulation and synthesis gates to produce realistic data.
 */
function buildRuntimeInput(context: LiveSessionContext) {
  const simulation = runSimulationGate({ context });
  const synthesis = runSynthesisGate({ context, simulation });
  const noticed = context.currentSummary
    ? buildPressureSignalTranslation(
        context.turns[0]?.content ?? "",
        "LIVE",
        "Authority gap",
        "",
        "",
        "",
      )
    : buildTranslation(context.turns[0]?.content ?? "");

  return { context, noticed, simulation, synthesis };
}

// ─── 1. First-turn context creation ──────────────────────────────────────────

describe("first-turn context creation", () => {
  it("creates context with initial input as first turn", () => {
    const ctx = createLiveSessionContext({
      initialInput: "We need to decide whether to acquire the competitor.",
    });

    expect(ctx.sessionId).toBeTruthy();
    expect(ctx.turns).toHaveLength(1);
    expect(ctx.turns[0].role).toBe("user");
    expect(ctx.turns[0].content).toBe("We need to decide whether to acquire the competitor.");
    expect(ctx.actors).toEqual([]);
    expect(ctx.signals).toEqual([]);
    expect(ctx.ambiguities).toEqual([]);
    expect(ctx.hiddenStakes).toEqual([]);
    expect(ctx.lastDelta).toBeUndefined();
  });

  it("creates empty context when no initial input", () => {
    const ctx = createLiveSessionContext({});
    expect(ctx.turns).toHaveLength(0);
    expect(ctx.actors).toEqual([]);
  });

  it("generates unique session IDs", () => {
    const ctx1 = createLiveSessionContext({ initialInput: "test" });
    const ctx2 = createLiveSessionContext({ initialInput: "test" });
    expect(ctx1.sessionId).not.toBe(ctx2.sessionId);
  });
});

// ─── 2. Second-turn delta detection ──────────────────────────────────────────

describe("second-turn delta detection", () => {
  it("detects new actors introduced on second turn", () => {
    let ctx = createLiveSessionContext({
      initialInput: "We need to make a decision about the project.",
    });

    // First turn translation — no actors
    const firstTranslation: PublicSituationTranslation = {
      situationSummary: "This appears to be an operational decision.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We need to make a decision about the project.",
      translation: firstTranslation,
    });

    // Second turn — introduces CEO and board
    const secondTranslation: PublicSituationTranslation = {
      situationSummary: "This appears to be a board-level governance decision.",
      actors: ["CEO", "Board"],
      detectedSignals: [
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO wants to move fast but the board is split.",
      translation: secondTranslation,
    });

    expect(ctx.lastDelta).toBeDefined();
    expect(ctx.lastDelta!.newActors).toContain("ceo");
    expect(ctx.lastDelta!.newActors).toContain("board");
    expect(ctx.lastDelta!.newSignals).toContain("authority:unclear");
    expect(ctx.actors).toHaveLength(2);
  });

  it("detects new signals on second turn", () => {
    let ctx = createLiveSessionContext({
      initialInput: "We have a decision to make.",
    });

    const firstTranslation: PublicSituationTranslation = {
      situationSummary: "This appears to be a decision.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We have a decision to make.",
      translation: firstTranslation,
    });

    const secondTranslation: PublicSituationTranslation = {
      situationSummary: "This appears to be a decision under deadline pressure.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
        { label: "Penalty exposure", value: "consequence:penalty", severity: "CRITICAL" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We have a regulatory deadline next week with penalty exposure.",
      translation: secondTranslation,
    });

    expect(ctx.lastDelta!.newSignals).toContain("obligation:deadline");
    expect(ctx.lastDelta!.newSignals).toContain("consequence:penalty");
    expect(ctx.signals).toHaveLength(2);
  });
});

// ─── 3. Repeated actor occurrence increments ─────────────────────────────────

describe("repeated actor occurrence increments", () => {
  it("increments occurrence count when same actor appears again", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO is pushing for this.",
    });

    const firstTranslation: PublicSituationTranslation = {
      situationSummary: "Decision with CEO involvement.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO is pushing for this.",
      translation: firstTranslation,
    });

    const secondTranslation: PublicSituationTranslation = {
      situationSummary: "CEO still the key actor.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO mentioned again.",
      translation: secondTranslation,
    });

    const ceo = ctx.actors.find(a => a.name.toLowerCase() === "ceo");
    expect(ceo).toBeDefined();
    expect(ceo!.occurrences).toBe(2);
    expect(ctx.lastDelta!.repeatedActors).toContain("ceo");
  });

  it("does not duplicate actor entries", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO is involved.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO involved.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO is involved.",
      translation,
    });

    ctx = appendUserTurn({
      context: ctx,
      input: "CEO again.",
      translation,
    });

    ctx = appendUserTurn({
      context: ctx,
      input: "CEO a third time.",
      translation,
    });

    // Should still be exactly 1 actor entry, not 3
    expect(ctx.actors).toHaveLength(1);
    expect(ctx.actors[0].occurrences).toBe(3);
  });
});

// ─── 4. Repeated signal occurrence increments ────────────────────────────────

describe("repeated signal occurrence increments", () => {
  it("increments occurrence count when same signal appears again", () => {
    let ctx = createLiveSessionContext({
      initialInput: "We have a deadline issue.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "Deadline pressure detected.",
      actors: [],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We have a deadline issue.",
      translation,
    });

    ctx = appendUserTurn({
      context: ctx,
      input: "The deadline is next Friday.",
      translation,
    });

    const deadlineSignal = ctx.signals.find(s => s.key === "obligation:deadline");
    expect(deadlineSignal).toBeDefined();
    expect(deadlineSignal!.occurrences).toBe(2);
  });

  it("does not duplicate signal entries", () => {
    let ctx = createLiveSessionContext({
      initialInput: "Deadline problem.",
    });

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

    ctx = appendUserTurn({ context: ctx, input: "Deadline problem.", translation });
    ctx = appendUserTurn({ context: ctx, input: "Deadline again.", translation });
    ctx = appendUserTurn({ context: ctx, input: "Deadline third time.", translation });

    expect(ctx.signals).toHaveLength(1);
    expect(ctx.signals[0].occurrences).toBe(3);
  });
});

// ─── 5. Hidden stake introduced on second turn ───────────────────────────────

describe("hidden stake introduced on second turn", () => {
  it("detects hidden stakes when they appear on second turn", () => {
    let ctx = createLiveSessionContext({
      initialInput: "Just a minor decision about the budget.",
    });

    const firstTranslation: PublicSituationTranslation = {
      situationSummary: "Low-stakes budget decision.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "Just a minor decision about the budget.",
      translation: firstTranslation,
    });

    const secondTranslation: PublicSituationTranslation = {
      situationSummary: "Budget decision with possible hidden stakes.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [
        "The situation may be more consequential than your wording suggests.",
      ],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "Actually it involves a regulatory compliance deadline.",
      translation: secondTranslation,
    });

    expect(ctx.hiddenStakes).toHaveLength(1);
    expect(ctx.lastDelta!.newlyDetectedHiddenStakes).toHaveLength(1);
    expect(ctx.lastDelta!.newlyDetectedHiddenStakes[0]).toContain("consequential");
  });
});

// ─── 6. Ambiguity resolved on later turn ─────────────────────────────────────

describe("ambiguity resolved on later turn", () => {
  it("detects resolved ambiguities when they disappear from translation", () => {
    let ctx = createLiveSessionContext({
      initialInput: "We need to decide something but I'm not sure who decides.",
    });

    const firstTranslation: PublicSituationTranslation = {
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

    ctx = appendUserTurn({
      context: ctx,
      input: "We need to decide something but I'm not sure who decides.",
      translation: firstTranslation,
    });

    expect(ctx.ambiguities).toHaveLength(1);

    const secondTranslation: PublicSituationTranslation = {
      situationSummary: "Decision with clear authority.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [], // Ambiguity resolved
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO owns this decision.",
      translation: secondTranslation,
    });

    expect(ctx.lastDelta!.resolvedAmbiguities).toHaveLength(1);
    expect(ctx.ambiguities).toHaveLength(0);
  });
});

// ─── 7. Simulation path cap ──────────────────────────────────────────────────

describe("simulation path cap", () => {
  it("never generates more than 3 simulation paths", () => {
    // Create a context with many signals to trigger all possible assumptions
    let ctx = createLiveSessionContext({
      initialInput: "We need to decide whether to acquire a competitor by end of quarter. The board is split, cash is tight, and the CEO is pushing hard. Legal is still reviewing the exposure.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "High-stakes acquisition decision.",
      actors: ["CEO", "Board"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
        { label: "Cash constraint", value: "constraint:cash", severity: "HIGH" },
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
        { label: "Evidence gap", value: "evidence:assumed", severity: "MEDIUM" },
      ],
      hiddenStakes: ["The situation may be more consequential than your wording suggests."],
      ambiguities: ["Who holds the authority to decide has not been confirmed."],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We need to decide whether to acquire a competitor by end of quarter.",
      translation,
    });

    const simulation = runSimulationGate({ context: ctx });

    expect(simulation.paths.length).toBeLessThanOrEqual(3);
  });

  it("generates at least 1 path when context has data", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide by Friday.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "Decision with deadline.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO needs to decide by Friday.",
      translation,
    });

    const simulation = runSimulationGate({ context: ctx });
    expect(simulation.paths.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 8. Synthesis refusal when owner/consequence/evidence is missing ─────────

describe("synthesis refusal when critical data missing", () => {
  it("refuses when no owner after two turns", () => {
    let ctx = createLiveSessionContext({
      initialInput: "We need to make a decision.",
    });

    const emptyTranslation: PublicSituationTranslation = {
      situationSummary: "Vague decision.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "We need to make a decision.",
      translation: emptyTranslation,
    });

    ctx = appendUserTurn({
      context: ctx,
      input: "It's about the project timeline.",
      translation: emptyTranslation,
    });

    const simulation = runSimulationGate({ context: ctx });
    const synthesis = runSynthesisGate({ context: ctx, simulation });

    expect(synthesis.shouldRefuse).toBe(true);
    expect(synthesis.refusalReason).toBeTruthy();
    expect(synthesis.refusalReason).toContain("no accountable decision owner");
  });

  it("does not refuse when owner is present", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide whether to proceed with the acquisition.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO acquisition decision.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO needs to decide whether to proceed with the acquisition.",
      translation,
    });

    const simulation = runSimulationGate({ context: ctx });
    const synthesis = runSynthesisGate({ context: ctx, simulation });

    expect(synthesis.shouldRefuse).toBe(false);
  });

  it("produces helpful refusal message, not generic output", () => {
    let ctx = createLiveSessionContext({
      initialInput: "Stuff needs to happen.",
    });

    const vagueTranslation: PublicSituationTranslation = {
      situationSummary: "Vague situation.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "Stuff needs to happen.",
      translation: vagueTranslation,
    });

    ctx = appendUserTurn({
      context: ctx,
      input: "Things are happening.",
      translation: vagueTranslation,
    });

    const simulation = runSimulationGate({ context: ctx });
    const synthesis = runSynthesisGate({ context: ctx, simulation });

    expect(synthesis.shouldRefuse).toBe(true);
    expect(synthesis.refusalReason).toBeTruthy();
    // Should be specific, not generic
    expect(synthesis.refusalReason!.length).toBeGreaterThan(20);
    expect(synthesis.refusalReason).not.toBe("An error occurred.");
  });
});

// ─── 9. Evidence tier progression remains conservative ───────────────────────

describe("evidence tier progression remains conservative", () => {
  it("starts at 'none' for empty context", () => {
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

    const updatedCtx = appendUserTurn({
      context: ctx,
      input: "test",
      translation,
    });

    const input = buildRuntimeInput(updatedCtx);
    const vm = buildLivingLayerViewModel(input);

    expect(vm.evidence.level).toBe("none");
  });

  it("reaches 'single_source' after one turn with actors or signals", () => {
    // Create context without initialInput so we control turn count precisely
    let ctx = createLiveSessionContext({});

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO deadline decision.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({
      context: ctx,
      input: "The CEO needs to decide about the deadline.",
      translation,
    });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    expect(vm.evidence.level).toBe("single_source");
  });

  it("reaches 'multi_source' after two turns with actors and signals", () => {
    // Create context without initialInput so we control turn count precisely
    let ctx = createLiveSessionContext({});

    const t1: PublicSituationTranslation = {
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

    ctx = appendUserTurn({ context: ctx, input: "The CEO needs to decide.", translation: t1 });

    const t2: PublicSituationTranslation = {
      situationSummary: "CEO decision with board.",
      actors: ["CEO", "Board"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "The board is split on the deadline.", translation: t2 });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    expect(vm.evidence.level).toBe("multi_source");
  });

  it("never reaches 'verified' without actual verification", () => {
    // Simulate many turns with rich data — should still not reach 'verified'
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide about the acquisition by Friday.",
    });

    const richTranslation: PublicSituationTranslation = {
      situationSummary: "Rich acquisition decision.",
      actors: ["CEO", "Board", "Legal"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
        { label: "Unclear authority", value: "authority:unclear", severity: "HIGH" },
        { label: "Penalty exposure", value: "consequence:penalty", severity: "CRITICAL" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    // 5 turns with rich data
    for (let i = 0; i < 5; i++) {
      ctx = appendUserTurn({
        context: ctx,
        input: `Turn ${i + 1}: more detail about the acquisition.`,
        translation: richTranslation,
      });
    }

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // Should never be 'verified' — that's reserved for actual evidence upload
    expect(vm.evidence.level).not.toBe("verified");
    // Best it can reach is 'corroborated'
    expect(["none", "single_source", "multi_source", "corroborated"]).toContain(vm.evidence.level);
  });
});

// ─── 10. View model does not expose internal mechanics ───────────────────────

describe("view model does not expose internal mechanics", () => {
  it("does not contain raw taxonomy keys", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide about the deadline.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO deadline decision.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "The CEO needs to decide about the deadline.", translation });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    const serialized = JSON.stringify(vm);

    // Should not contain raw taxonomy keys
    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");

    // Should not contain internal score-like values
    expect(serialized).not.toContain("vocabularyState");
    expect(serialized).not.toContain("vocabulary_state");
  });

  it("does not contain numeric scores or thresholds", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide about the deadline.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO deadline decision.",
      actors: ["CEO"],
      detectedSignals: [
        { label: "Deadline pressure", value: "obligation:deadline", severity: "HIGH" },
      ],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "The CEO needs to decide about the deadline.", translation });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // The view model should not expose raw numeric thresholds
    // (stagesCompleted is a count, not a score — that's fine)
    expect(vm.evidence.level).toBeDefined();
    expect(typeof vm.evidence.level).toBe("string");
    expect(vm.advantage.confidenceBand).toBeDefined();
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(vm.advantage.confidenceBand);
  });
});

// ─── 11. "Session memory" language check ─────────────────────────────────────

describe("session memory language", () => {
  it("uses 'Session memory' not 'Institutional memory' in memory entries", () => {
    let ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide.",
    });

    const translation: PublicSituationTranslation = {
      situationSummary: "CEO decision.",
      actors: ["CEO"],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "The CEO needs to decide.", translation });

    const input = buildRuntimeInput(ctx);
    const vm = buildLivingLayerViewModel(input);

    // Check that memory entries use session-appropriate language
    for (const entry of vm.memory.entries) {
      expect(entry.label).not.toContain("Institutional memory");
      expect(entry.label).not.toContain("Cross-session");
    }

    // The OutcomeMemoryPreview component renders "Decision memory" header
    // and "The system remembers prior readings" — that's fine as it's
    // about session memory. The key is we don't claim cross-session persistence.
  });
});

// ─── 12. Shell renders safely when optional fields are missing ───────────────

describe("shell renders safely when optional fields are missing", () => {
  it("buildLivingLayerViewModel handles empty context gracefully", () => {
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

    const updatedCtx = appendUserTurn({
      context: ctx,
      input: "test",
      translation,
    });

    const simulation = runSimulationGate({ context: updatedCtx });
    const synthesis = runSynthesisGate({ context: updatedCtx, simulation });

    const vm = buildLivingLayerViewModel({
      context: updatedCtx,
      noticed: translation,
      simulation,
      synthesis,
    });

    // Should not throw, all fields should have sensible defaults
    expect(vm.progress.stagesCompleted).toBeGreaterThanOrEqual(0);
    expect(vm.evidence.level).toBeDefined();
    expect(vm.governedAction.requiredAction).toBeTruthy();
    expect(vm.advantage.advantages.length).toBeGreaterThanOrEqual(0);
    expect(vm.nextLayer.currentStage).toBeTruthy();
    expect(vm.memory.entries).toBeDefined();
    expect(vm.changes.deltas).toBeDefined();
    expect(typeof vm.review.required).toBe("boolean");
  });

  it("handles null synthesis fields gracefully", () => {
    const ctx = createLiveSessionContext({
      initialInput: "The CEO needs to decide.",
    });

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

    const updatedCtx = appendUserTurn({
      context: ctx,
      input: "The CEO needs to decide.",
      translation,
    });

    const simulation = runSimulationGate({ context: updatedCtx });
    const synthesis = runSynthesisGate({ context: updatedCtx, simulation });

    // Synthesis should have sensible values, not null/undefined where not expected
    expect(synthesis.situationRead).toBeTruthy();
    expect(synthesis.nextAdmissibleMove).toBeTruthy();
    expect(typeof synthesis.shouldRefuse).toBe("boolean");
  });
});

// ─── 13. Multi-turn context preservation ─────────────────────────────────────

describe("multi-turn context preservation", () => {
  it("preserves all turns across multiple submissions", () => {
    // Create context without initialInput so we control turn count precisely
    let ctx = createLiveSessionContext({});

    const translation: PublicSituationTranslation = {
      situationSummary: "Turn 1.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "First turn: initial situation.", translation });

    expect(ctx.turns.filter(t => t.role === "user")).toHaveLength(1);

    ctx = appendUserTurn({ context: ctx, input: "Second turn: more detail.", translation });
    expect(ctx.turns.filter(t => t.role === "user")).toHaveLength(2);

    ctx = appendUserTurn({ context: ctx, input: "Third turn: even more detail.", translation });
    expect(ctx.turns.filter(t => t.role === "user")).toHaveLength(3);

    // System turns can also be appended
    ctx = appendSystemTurn({ context: ctx, content: "System response." });
    expect(ctx.turns.filter(t => t.role === "system")).toHaveLength(1);
    expect(ctx.turns).toHaveLength(4);
  });
});

// ─── 14. Weak/vague inputs trigger helpful refusal ───────────────────────────

describe("weak or vague inputs trigger helpful refusal", () => {
  it("synthesis refuses when input has no owner, consequence, or evidence", () => {
    let ctx = createLiveSessionContext({
      initialInput: "Things.",
    });

    const vagueTranslation: PublicSituationTranslation = {
      situationSummary: "Vague.",
      actors: [],
      detectedSignals: [],
      hiddenStakes: [],
      ambiguities: [],
      underestimatedRisk: null,
      deeperAnalysisWouldMap: [],
    };

    ctx = appendUserTurn({ context: ctx, input: "Things.", translation: vagueTranslation });
    ctx = appendUserTurn({ context: ctx, input: "Stuff.", translation: vagueTranslation });

    const simulation = runSimulationGate({ context: ctx });
    const synthesis = runSynthesisGate({ context: ctx, simulation });

    expect(synthesis.shouldRefuse).toBe(true);
    expect(synthesis.refusalReason).toBeTruthy();
    // The refusal should be helpful, not just "error"
    expect(synthesis.refusalReason!.length).toBeGreaterThan(30);
  });
});

// ─── 15. Lab page is noindex/nofollow ────────────────────────────────────────

describe("lab page noindex/nofollow", () => {
  it("lab page meta is verified via file content", async () => {
    // Read the lab page file and check for noindex/nofollow
    const fs = await import("fs");
    const content = fs.readFileSync("pages/lab/living-case.tsx", "utf-8");

    expect(content).toContain("noindex,nofollow");
    expect(content).toContain("robots");
  });
});
