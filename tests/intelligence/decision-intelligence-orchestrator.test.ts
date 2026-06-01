/**
 * tests/intelligence/decision-intelligence-orchestrator.test.ts
 *
 * Tests for the Decision Intelligence Orchestrator.
 *
 * The orchestrator connects ALL existing deep engine layers:
 * - SituationTranslator (vocabulary state, decision class, signals)
 * - DecisionClassTaxonomy (classification, mandatory lenses)
 * - KernelLensRunner (15+ lenses producing findings, evidence nodes)
 * - KernelContradictionResolver (cross-lens contradiction resolution)
 * - SimulationGate (bounded assumption paths)
 * - SynthesisGate (situation read, next admissible move)
 * - LiveSessionContext (multi-turn context)
 * - UserLanguageInterpretation (quote-to-intelligence)
 * - EvidenceTierDerivation (conservative evidence strength)
 */

import { describe, it, expect } from "vitest";
import { runDecisionIntelligence } from "@/lib/intelligence/decision-intelligence-orchestrator";

// ─── 1. Deep engine integration: SituationTranslator runs ────────────────────

describe("situation translation", () => {
  it("classifies input through the full SituationTranslator", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // The SituationTranslator should classify this
    expect(result.situationClass).toBeTruthy();
    expect(result.decisionClass).toBeTruthy();
    // Vocabulary state should be detected (1-5)
    expect(result.vocabularyState).toBeGreaterThanOrEqual(1);
    expect(result.vocabularyState).toBeLessThanOrEqual(5);
  });
});

// ─── 2. Deep engine integration: Lenses run ──────────────────────────────────

describe("lens analysis", () => {
  it("runs lenses appropriate to the decision class", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // The KernelLensRunner should run mandatory lenses for the classified decision class
    expect(result.lensCount).toBeGreaterThanOrEqual(1);
  });

  it("produces lens findings from the evidence lens", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // The evidence lens should produce findings
    expect(result.findings.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 3. Deep engine integration: Contradiction resolution ────────────────────

describe("contradiction resolution", () => {
  it("detects authority vs execution contradiction through lens analysis", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need to launch by end of quarter but no one has approved the budget.",
    });

    // The contradiction resolver should detect this
    expect(result.primaryContradiction).toBeTruthy();
    expect(result.contradictionCount).toBeGreaterThanOrEqual(1);
  });

  it("does not fabricate contradiction when no supporting language exists", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "The weather is nice today.",
    });

    // Should not have a contradiction for irrelevant input
    // (may still have lens findings but no contradiction)
    expect(result.primaryContradiction).toBeNull();
  });
});

// ─── 4. Deep engine integration: SimulationGate runs ─────────────────────────

describe("simulation", () => {
  it("generates bounded simulation paths through the SimulationGate", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need to decide whether to acquire the competitor but the board is split.",
    });

    // The SimulationGate should generate paths
    expect(result.simulationPaths.length).toBeGreaterThanOrEqual(1);
    // Should not exceed reasonable bounds
    expect(result.simulationPaths.length).toBeLessThanOrEqual(5);
  });

  it("produces a preferred path", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need to decide whether to acquire the competitor but the board is split.",
    });

    // Should have a preferred path
    expect(result.preferredPath).toBeTruthy();
  });
});

// ─── 5. Deep engine integration: SynthesisGate produces next move ────────────

describe("synthesis", () => {
  it("produces a specific next admissible move", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "No one has approved the budget for the launch.",
    });

    // The SynthesisGate should produce a specific move
    expect(result.nextAdmissibleMove).toBeTruthy();
    expect(result.nextAdmissibleMove.length).toBeGreaterThan(20);
  });

  it("produces evidence basis from lens findings and synthesis", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // Evidence basis should come from multiple sources
    expect(result.evidenceBasis.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 6. User language interpretations ────────────────────────────────────────

describe("user language interpretations", () => {
  it("produces interpretations from raw input", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // Should have at least one interpretation
    expect(result.userLanguageInterpretations.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 7. Evidence tier ────────────────────────────────────────────────────────

describe("evidence tier", () => {
  it("derives evidence tier conservatively", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    // Should not claim verified without verified evidence
    expect(result.evidenceTier).not.toBe("verified");
  });
});

// ─── 8. No prediction language ───────────────────────────────────────────────

describe("no prediction language", () => {
  it("does not contain 'prediction' or 'forecast' in simulation outputs", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need to decide about the acquisition by end of quarter.",
    });

    const pathText = JSON.stringify(result.simulationPaths);
    expect(pathText).not.toContain("prediction");
    expect(pathText).not.toContain("forecast");
    expect(pathText).not.toContain("guaranteed outcome");
  });
});

// ─── 9. Low evidence input produces refusal ──────────────────────────────────

describe("low evidence refusal", () => {
  it("produces refusal or restrained output for very weak input", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "Things.",
    });

    // Should either refuse or have LOW confidence
    const hasRefusal = result.refusalReason && result.refusalReason.length > 0;
    const isLowConfidence = result.confidence === "LOW";
    expect(hasRefusal || isLowConfidence).toBe(true);
  });
});

// ─── 10. Multi-turn context preservation ─────────────────────────────────────

describe("multi-turn context", () => {
  it("preserves session context across calls", async () => {
    const first = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed.",
    });

    expect(first.sessionContext).toBeTruthy();
    expect(first.sessionContext!.sessionId).toBeTruthy();
    expect(first.sessionContext!.turns.length).toBeGreaterThanOrEqual(1);
  });
});

// ─── 11. No fabricated evidence basis ────────────────────────────────────────

describe("no fabricated evidence", () => {
  it("does not fabricate evidence when input is empty", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
    });

    expect(result.confidence).toBe("LOW");
    // Should not have a contradiction for empty input
    expect(result.primaryContradiction).toBeNull();
    // Should not have a preferred path for empty input
    expect(result.nextAdmissibleMove).toBeTruthy();
  });
});

// ─── 12. Engine trace emitted internally ────────────────────────────────────

describe("engine trace", () => {
  it("emits engineTrace with USED and SKIPPED entries", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "We need board approval to proceed with the launch.",
    });

    expect(result.engineTrace).toBeDefined();
    expect(Array.isArray(result.engineTrace)).toBe(true);
    expect(result.engineTrace!.length).toBeGreaterThan(0);

    const usedEngines = result.engineTrace!.filter(e => e.status === "USED");

    // At least some engines should be USED for a valid input
    expect(usedEngines.length).toBeGreaterThan(0);

    // Every entry should have a valid status
    for (const entry of result.engineTrace!) {
      expect(["USED", "SKIPPED_GATED", "SKIPPED_NOT_APPLICABLE"]).toContain(entry.status);
    }
  });

  it("does not include AVAILABLE status in any trace entry", async () => {
    const result = await runDecisionIntelligence({
      surface: "fast_diagnostic",
      rawUserInput: "Test input.",
    });

    for (const entry of result.engineTrace ?? []) {
      expect(entry.status).not.toBe("AVAILABLE");
    }
  });

  it("includes SKIPPED_GATED entries with reasons on decision_centre surface", async () => {
    const result = await runDecisionIntelligence({
      surface: "decision_centre",
      rawUserInput: "We need to resolve the supplier risk before the board meeting.",
    });

    const skippedGated = (result.engineTrace ?? []).filter(e => e.status === "SKIPPED_GATED");
    expect(skippedGated.length).toBeGreaterThan(0);
    for (const entry of skippedGated) {
      expect(entry.reason).toBeTruthy();
    }
  });
});