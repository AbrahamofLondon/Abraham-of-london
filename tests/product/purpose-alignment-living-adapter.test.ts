/**
 * tests/product/purpose-alignment-living-adapter.test.ts
 *
 * Tests for the Purpose Alignment Living Adapter.
 *
 * Covers:
 * - Produces a valid LivingLayerViewModel from result data
 * - Evidence level is conservative (never verified without VERIFIED label)
 * - Never claims institutional memory
 * - Maps result data into memory entries
 * - Handles missing optional fields gracefully
 * - No internal mechanics exposed
 */

import { describe, it, expect } from "vitest";
import { buildPurposeAlignmentViewModel } from "@/lib/product/purpose-alignment-living-adapter";
import type { PurposeProfileResult } from "@/lib/alignment/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMinimalResult(overrides: Partial<PurposeProfileResult> = {}): PurposeProfileResult {
  return {
    totalScore: 45,
    maxScore: 100,
    percent: 45,
    coherenceBand: "DRIFTING",
    domainProfiles: [],
    weakestDomains: ["decision"],
    strengths: [],
    corrections: ["Name the avoided decision explicitly"],
    narrative: "Test narrative",
    nextActions: [],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── 1. Produces a valid LivingLayerViewModel ────────────────────────────────

describe("adapter produces valid view model", () => {
  it("returns a complete LivingLayerViewModel from minimal result data", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Whether to restructure the team",
        competingObligation: "Maintaining current project deadlines",
        consequence: "Team burnout and missed targets",
      },
    });

    expect(vm).toBeDefined();
    expect(vm.progress).toBeDefined();
    expect(vm.evidence).toBeDefined();
    expect(vm.governedAction).toBeDefined();
    expect(vm.advantage).toBeDefined();
    expect(vm.nextLayer).toBeDefined();
    expect(vm.memory).toBeDefined();
    expect(vm.changes).toBeDefined();
    expect(vm.review).toBeDefined();
    expect(vm.continuity).toBeDefined();
  });

  it("sets evidence level conservatively", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "",
        competingObligation: "",
        consequence: "",
      },
    });

    // Should be single_source for a single diagnostic
    expect(vm.evidence.level).toBe("single_source");
    // Should never be verified without VERIFIED evidence
    expect(vm.evidence.level).not.toBe("verified");
  });
});

// ─── 2. Never claims institutional memory ────────────────────────────────────

describe("language safety", () => {
  it("never contains 'Institutional memory'", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Test",
        competingObligation: "Test",
        consequence: "Test",
      },
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("Institutional memory");
    expect(serialized).not.toContain("institutional memory");
  });

  it("continuity statement does not claim verified outcome", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "",
        competingObligation: "",
        consequence: "",
      },
    });

    expect(vm.continuity.continuityStatement).not.toContain("Verified outcome");
    expect(vm.continuity.continuityStatement).not.toContain("Retained memory");
    expect(vm.continuity.continuityStatement).not.toContain("Cross-session intelligence");
  });
});

// ─── 3. Maps result data into memory entries ─────────────────────────────────

describe("memory mapping", () => {
  it("includes Purpose Alignment completion in memory entries", () => {
    const result = makeMinimalResult({
      coherenceBand: "DRIFTING",
      primaryPattern: {
        id: "mandate_fracture",
        label: "Mandate fracture",
        score: 72,
        reasons: ["Authority is unclear"],
        consequence: "Decision paralysis",
        firstAction: "Name the decision owner",
      },
    });
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Whether to restructure",
        competingObligation: "Project deadlines",
        consequence: "Burnout",
      },
    });

    expect(vm.memory.entries.length).toBeGreaterThanOrEqual(1);
    const paEntry = vm.memory.entries.find(e => e.label.includes("Purpose Alignment"));
    expect(paEntry).toBeDefined();
    expect(paEntry!.summary).toContain("DRIFTING");
  });

  it("includes avoided decision in memory when provided", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Whether to fire the COO",
        competingObligation: "",
        consequence: "",
      },
    });

    const avoidedEntry = vm.memory.entries.find(e => e.label.includes("Avoided decision"));
    expect(avoidedEntry).toBeDefined();
    expect(avoidedEntry!.summary).toContain("Whether to fire the COO");
  });
});

// ─── 4. Handles missing optional fields gracefully ───────────────────────────

describe("handles missing optional fields", () => {
  it("does not throw when primaryPattern is undefined", () => {
    const result = makeMinimalResult({ primaryPattern: undefined });
    expect(() =>
      buildPurposeAlignmentViewModel({
        result,
        contextAnswers: {
          avoidedDecision: "",
          competingObligation: "",
          consequence: "",
        },
      })
    ).not.toThrow();
  });

  it("does not throw when contradictions is undefined", () => {
    const result = makeMinimalResult({ contradictions: undefined });
    expect(() =>
      buildPurposeAlignmentViewModel({
        result,
        contextAnswers: {
          avoidedDecision: "",
          competingObligation: "",
          consequence: "",
        },
      })
    ).not.toThrow();
  });

  it("does not throw when corrections is empty", () => {
    const result = makeMinimalResult({ corrections: [] });
    expect(() =>
      buildPurposeAlignmentViewModel({
        result,
        contextAnswers: {
          avoidedDecision: "",
          competingObligation: "",
          consequence: "",
        },
      })
    ).not.toThrow();
  });
});

// ─── 5. No internal mechanics exposed ────────────────────────────────────────

describe("no internal mechanics exposed", () => {
  it("serialized view model contains no raw taxonomy keys", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Test",
        competingObligation: "Test",
        consequence: "Test",
      },
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");
  });

  it("serialized view model contains no numeric scores", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "",
        competingObligation: "",
        consequence: "",
      },
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("compositeScore");
    expect(serialized).not.toContain("vocabularyState");
  });
});

// ─── 6. Uses DecisionIntelligenceResult when provided ────────────────────────

describe("uses DecisionIntelligenceResult", () => {
  it("uses orchestrator nextAdmissibleMove when decisionIntelligence is provided", () => {
    const result = makeMinimalResult();
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Whether to restructure",
        competingObligation: "Project deadlines",
        consequence: "Burnout",
      },
      decisionIntelligence: {
        surface: "purpose_alignment",
        sessionContext: null,
        situationClass: "PEOPLE_AND_AUTHORITY",
        situationRead: "Authority gap detected.",
        vocabularyState: 3,
        decisionClass: "PEOPLE_AND_AUTHORITY",
        classificationConfidence: "MEDIUM",
        alternativeClasses: null,
        detectedSignals: [],
        preservedAmbiguities: [],
        hiddenStakesDetected: false,
        findings: [{ label: "Authority gap", summary: "No accountable owner identified", severity: "HIGH", evidenceBasis: ["User language references approval"] }],
        lensCount: 0,
        primaryContradiction: "The user is treating this as an execution issue but the blocker is authority.",
        contradictionCount: 1,
        contradictionGraph: null,
        constitutionalRoute: "DIAGNOSTIC",
        constitutionalReadiness: "EMERGING",
        constitutionalPosture: "DRIFTING",
        constitutionalAuthority: "DEFERRED",
        failureModes: ["authority_ambiguity"],
        disqualifiers: ["Authority holder not identified"],
        escalationPermitted: false,
        simulationPaths: [{ label: "Escalate to authority", assumption: "Escalate to authority", likelyOutcome: "Authority gap surfaced", riskShift: "LOWER", why: "Escalation confirms authority", admissible: true }],
        preferredPath: { label: "Escalate to authority", assumption: "Escalate to authority", likelyOutcome: "Authority gap surfaced", riskShift: "LOWER", why: "Escalation confirms authority", admissible: true },
        costOfDelay: null,
        degradationProjection: null,
        interpretedIssue: "The core issue is an authority gap.",
        authorityState: "Authority not confirmed.",
        evidenceState: "Self-reported.",
        consequenceState: null,
        nextAdmissibleMove: "Identify who can authorise the decision.",
        confidence: "MEDIUM",
        evidenceBasis: ["Authority gap detected"],
        unresolvedItems: ["Authority holder not confirmed"],
        userLanguageInterpretations: [],
        evidenceTier: "single_source",
        signalContinuity: [],
      } as any,
    });

    // Should use orchestrator's next move
    expect(vm.governedAction.requiredAction).toBe("Identify who can authorise the decision.");
    // Should include orchestrator findings in advantages
    const hasOrchestratorAdvantage = vm.advantage.advantages.some(a => a.includes("Authority gap"));
    expect(hasOrchestratorAdvantage).toBe(true);
    // Should include orchestrator unresolved items
    const hasOrchestratorUnresolved = vm.nextLayer.unresolvedItems.some(i => i.includes("Authority holder"));
    expect(hasOrchestratorUnresolved).toBe(true);
  });

  it("falls back to conservative derivation when decisionIntelligence is not provided", () => {
    const result = makeMinimalResult({
      firstAction: "Name the decision owner",
      primaryPattern: {
        id: "mandate_fracture",
        label: "Mandate fracture",
        score: 72,
        reasons: ["Authority is unclear"],
        consequence: "Decision paralysis",
        firstAction: "Name the decision owner",
      },
    });
    const vm = buildPurposeAlignmentViewModel({
      result,
      contextAnswers: {
        avoidedDecision: "Whether to restructure",
        competingObligation: "",
        consequence: "",
      },
    });

    // Should use result data when no orchestrator
    expect(vm.governedAction.requiredAction).toBe("Name the decision owner");
    expect(vm.governedAction.evidenceBasis).toBeDefined();
  });
});
