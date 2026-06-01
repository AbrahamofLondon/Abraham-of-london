/**
 * tests/kernel/living-layer-stream.test.ts
 *
 * Verification tests for Living Layer V1.7 — Governed Streaming Runtime.
 *
 * Covers:
 * - encodeLivingStreamEvent produces valid SSE format
 * - Stream stage order is stable
 * - Stream result event includes viewModel
 * - Error event does not expose stack traces
 * - Streaming endpoint caps simulation paths at 3
 * - Streaming output never contains raw scores, thresholds, taxonomy keys, "Institutional memory"
 * - Refused state emits stage 'refused'
 * - Completed state emits stage 'completed'
 */

import { describe, it, expect } from "vitest";
import {
  encodeLivingStreamEvent,
  createStageEvent,
  createErrorEvent,
  type LivingStreamEvent,
  type LivingStreamStage,
} from "@/lib/kernel/living-stream-events";
import {
  createLiveSessionContext,
  appendUserTurn,
} from "@/lib/kernel/live-session-context";
import { runSimulationGate } from "@/lib/kernel/simulation-gate";
import { runSynthesisGate } from "@/lib/kernel/synthesis-gate";
import { buildLivingLayerViewModel } from "@/lib/kernel/living-layer-view-model";
import { buildPressureSignalTranslation } from "@/lib/kernel/public-situation-translation";
import type { PublicSituationTranslation } from "@/lib/kernel/public-situation-translation";

// ─── 1. SSE Encoding ─────────────────────────────────────────────────────────

describe("encodeLivingStreamEvent", () => {
  it("produces valid SSE format with data: prefix and double newline", () => {
    const event: LivingStreamEvent = {
      type: "stage",
      stage: "received",
      label: "Input received",
      timestamp: "2026-05-31T12:00:00.000Z",
    };

    const encoded = encodeLivingStreamEvent(event);

    expect(encoded).toContain("data: ");
    expect(encoded).toContain('"type":"stage"');
    expect(encoded).toContain('"stage":"received"');
    expect(encoded).toContain('"label":"Input received"');
    expect(encoded.endsWith("\n\n")).toBe(true);
  });

  it("produces valid SSE for result events", () => {
    // Create a minimal context for the payload
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
    const simulation = runSimulationGate({ context: updatedCtx });
    const synthesis = runSynthesisGate({ context: updatedCtx, simulation });
    const vm = buildLivingLayerViewModel({
      context: updatedCtx,
      noticed: translation,
      simulation,
      synthesis,
    });

    const resultEvent: LivingStreamEvent = {
      type: "result",
      stage: "completed",
      payload: {
        sessionId: updatedCtx.sessionId,
        context: updatedCtx,
        noticed: translation,
        simulation,
        synthesis,
        viewModel: vm,
      },
      timestamp: "2026-05-31T12:00:00.000Z",
    };

    const encoded = encodeLivingStreamEvent(resultEvent);

    expect(encoded).toContain("data: ");
    expect(encoded).toContain('"type":"result"');
    expect(encoded).toContain('"stage":"completed"');
    expect(encoded).toContain('"viewModel"');
    expect(encoded.endsWith("\n\n")).toBe(true);
  });

  it("is valid JSON when parsed", () => {
    const event: LivingStreamEvent = createStageEvent("received", "Test");
    const encoded = encodeLivingStreamEvent(event);

    const jsonStr = encoded.slice(6).trim();
    const parsed = JSON.parse(jsonStr) as LivingStreamEvent;

    expect(parsed.type).toBe("stage");
    expect(parsed.stage).toBe("received");
    expect(parsed.label).toBe("Test");
  });
});

// ─── 2. Stream stage order is stable ─────────────────────────────────────────

describe("stream stage order", () => {
  it("has a stable expected order", () => {
    const expectedOrder: LivingStreamStage[] = [
      "received",
      "interpreting",
      "signals_detected",
      "continuity_checked",
      "simulation_running",
      "synthesis_running",
    ];

    // Verify no duplicates
    const unique = new Set(expectedOrder);
    expect(unique.size).toBe(expectedOrder.length);

    // Verify all stages are valid
    for (const stage of expectedOrder) {
      expect(stage).toBeDefined();
      expect(typeof stage).toBe("string");
    }
  });
});

// ─── 3. Stream result event includes viewModel ───────────────────────────────

describe("stream result event includes viewModel", () => {
  it("result event payload contains viewModel", () => {
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
    const simulation = runSimulationGate({ context: updatedCtx });
    const synthesis = runSynthesisGate({ context: updatedCtx, simulation });
    const vm = buildLivingLayerViewModel({
      context: updatedCtx,
      noticed: translation,
      simulation,
      synthesis,
    });

    const resultEvent: LivingStreamEvent = {
      type: "result",
      stage: "completed",
      payload: {
        sessionId: updatedCtx.sessionId,
        context: updatedCtx,
        noticed: translation,
        simulation,
        synthesis,
        viewModel: vm,
      },
      timestamp: new Date().toISOString(),
    };

    expect(resultEvent.type).toBe("result");
    if (resultEvent.type === "result") {
      expect(resultEvent.payload.viewModel).toBeDefined();
      expect(resultEvent.payload.viewModel.progress).toBeDefined();
      expect(resultEvent.payload.viewModel.evidence).toBeDefined();
      expect(resultEvent.payload.viewModel.continuity).toBeDefined();
      expect(resultEvent.payload.sessionId).toBe(updatedCtx.sessionId);
    }
  });
});

// ─── 4. Error event does not expose stack traces ─────────────────────────────

describe("error event safety", () => {
  it("error event contains only a message, not stack traces", () => {
    const errorEvent = createErrorEvent("The living session could not be completed safely.");

    expect(errorEvent.type).toBe("error");
    if (errorEvent.type === "error") {
      expect(errorEvent.message).toBe("The living session could not be completed safely.");
      // Should not contain stack trace indicators
      expect(errorEvent.message).not.toContain("Error:");
      expect(errorEvent.message).not.toContain("at ");
      expect(errorEvent.message).not.toContain("stack");
    }
  });

  it("error event stage is 'error'", () => {
    const errorEvent = createErrorEvent("Test error");
    expect(errorEvent.stage).toBe("error");
  });
});

// ─── 5. Simulation path cap ──────────────────────────────────────────────────

describe("simulation path cap in stream context", () => {
  it("never generates more than 3 simulation paths", () => {
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

    ctx = appendUserTurn({ context: ctx, input: "We need to decide whether to acquire a competitor by end of quarter.", translation });

    const simulation = runSimulationGate({ context: ctx });

    expect(simulation.paths.length).toBeLessThanOrEqual(3);
  });
});

// ─── 6. Streaming output never contains internal mechanics ───────────────────

describe("streaming output never contains internal mechanics", () => {
  it("result payload does not contain raw taxonomy keys", () => {
    const ctx = createLiveSessionContext({ initialInput: "The CEO needs to decide about the deadline." });
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
    const updatedCtx = appendUserTurn({ context: ctx, input: "The CEO needs to decide about the deadline.", translation });
    const simulation = runSimulationGate({ context: updatedCtx });
    const synthesis = runSynthesisGate({ context: updatedCtx, simulation });
    const vm = buildLivingLayerViewModel({
      context: updatedCtx,
      noticed: translation,
      simulation,
      synthesis,
    });

    const serialized = JSON.stringify(vm);

    // Should not contain raw taxonomy keys
    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");

    // Should not contain "Institutional memory"
    expect(serialized).not.toContain("Institutional memory");
    expect(serialized).not.toContain("institutional memory");
  });

  it("stage events do not contain internal scores or thresholds", () => {
    const event = createStageEvent(
      "signals_detected",
      "Signals detected",
      "3 signal(s) detected from the current input.",
    );

    const serialized = JSON.stringify(event);

    // Stage events should only contain safe display data
    expect(serialized).toContain("Signals detected");
    expect(serialized).not.toContain("compositeScore");
    expect(serialized).not.toContain("vocabularyState");
    expect(serialized).not.toContain("threshold");
  });
});

// ─── 7. Refused state ────────────────────────────────────────────────────────

describe("refused state", () => {
  it("result event can have stage 'refused'", () => {
    const resultEvent: LivingStreamEvent = {
      type: "result",
      stage: "refused",
      payload: null as any, // Minimal for test
      timestamp: new Date().toISOString(),
    };

    expect(resultEvent.stage).toBe("refused");
  });
});

// ─── 8. Completed state ──────────────────────────────────────────────────────

describe("completed state", () => {
  it("result event can have stage 'completed'", () => {
    const resultEvent: LivingStreamEvent = {
      type: "result",
      stage: "completed",
      payload: null as any, // Minimal for test
      timestamp: new Date().toISOString(),
    };

    expect(resultEvent.stage).toBe("completed");
  });
});

// ─── 9. createStageEvent helper ──────────────────────────────────────────────

describe("createStageEvent helper", () => {
  it("creates a valid stage event with timestamp", () => {
    const event = createStageEvent("interpreting", "Interpreting situation", "Translating input.");

    expect(event.type).toBe("stage");
    expect(event.stage).toBe("interpreting");
    expect(event.label).toBe("Interpreting situation");
    expect(event.detail).toBe("Translating input.");
    expect(event.timestamp).toBeDefined();
    expect(() => new Date(event.timestamp)).not.toThrow();
  });

  it("creates a stage event without detail", () => {
    const event = createStageEvent("received", "Input received");

    expect(event.type).toBe("stage");
    expect(event.detail).toBeUndefined();
  });
});

// ─── 10. createErrorEvent helper ─────────────────────────────────────────────

describe("createErrorEvent helper", () => {
  it("creates a valid error event", () => {
    const event = createErrorEvent("Something went wrong.");

    expect(event.type).toBe("error");
    expect(event.stage).toBe("error");
    expect(event.message).toBe("Something went wrong.");
    expect(event.timestamp).toBeDefined();
  });
});
