/**
 * tests/product/constitutional-living-adapter.test.ts
 *
 * Tests for the Constitutional Diagnostic Living Adapter.
 *
 * Covers:
 * - Builds valid LivingLayerViewModel from minimal constitutional result
 * - Authority unresolved appears as unresolved item
 * - Route restriction appears in next layer / review logic
 * - Evidence tier remains conservative
 * - Governed action derives from constitutional next move
 * - Evidence basis is present and derived
 * - No verified claim without verified evidence
 * - No internal engine keys/scores leak
 * - No "institutional memory" unless backed by durable data
 */

import { describe, it, expect } from "vitest";
import { buildConstitutionalLivingViewModel } from "@/lib/product/constitutional-living-adapter";
import type { ConstitutionalReport, ConstitutionalDecision, ConstitutionalRouteSummary } from "@/lib/product/constitutional-living-adapter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMinimalReport(overrides: Partial<ConstitutionalReport> = {}): ConstitutionalReport {
  return {
    authorityScore: 45,
    coherenceScore: 50,
    pressureScore: 60,
    frictionScore: 40,
    trustScore: 55,
    seriousnessScore: 50,
    governanceDiscipline: 45,
    interventionReadiness: 35,
    narrativeCoherence: 50,
    failureModeCount: 2,
    failureModeSeverity: 3,
    authorityType: "DEFERRED",
    posture: "REACTIVE",
    readinessTier: "LOW",
    mandateFit: false,
    summary: "Authority is deferred and mandate fit is unconfirmed.",
    keyFindings: ["Authority holder not clearly identified", "Posture is reactive rather than intentional"],
    answeredCount: 10,
    totalQuestions: 10,
    completionPercent: 100,
    ...overrides,
  };
}

function makeDecision(overrides: Partial<ConstitutionalDecision> = {}): ConstitutionalDecision {
  return {
    route: "DIAGNOSTIC",
    confidence: 0.65,
    disqualifiersTriggered: ["Insufficient evidence for escalation"],
    recommendedInterventions: ["Complete a Team Assessment to validate structural perception"],
    rationale: ["The constitutional posture suggests authority is deferred, which may mask execution readiness."],
    escalationAllowed: false,
    ...overrides,
  };
}

function makeRouteSummary(overrides: Partial<ConstitutionalRouteSummary> = {}): ConstitutionalRouteSummary {
  return {
    route: "DIAGNOSTIC",
    title: "Diagnostic route",
    description: "Complete additional diagnostics before escalation.",
    href: "/diagnostics/team-assessment",
    cta: "Continue to Team Assessment",
    tone: "neutral",
    ...overrides,
  };
}

// ─── 1. Builds valid LivingLayerViewModel ────────────────────────────────────

describe("adapter produces valid view model", () => {
  it("returns a complete LivingLayerViewModel from minimal constitutional result", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
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
});

// ─── 2. Authority unresolved appears as unresolved item ──────────────────────

describe("authority unresolved", () => {
  it("appears as unresolved item when mandateFit is false", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport({ mandateFit: false }),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const hasAuthorityItem = vm.nextLayer.unresolvedItems.some(
      item => item.toLowerCase().includes("authority") || item.toLowerCase().includes("mandate")
    );
    expect(hasAuthorityItem).toBe(true);
  });

  it("does not include authority item when mandateFit is true", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport({ mandateFit: true }),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const hasAuthorityItem = vm.nextLayer.unresolvedItems.some(
      item => item.toLowerCase().includes("authority") || item.toLowerCase().includes("mandate")
    );
    expect(hasAuthorityItem).toBe(false);
  });
});

// ─── 3. Route restriction appears in next layer / review logic ───────────────

describe("route restriction", () => {
  it("appears in unresolved items when route is REJECT", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ route: "REJECT" }),
      routeSummary: makeRouteSummary({ route: "REJECT" }),
    });

    const hasRestriction = vm.nextLayer.unresolvedItems.some(
      item => item.toLowerCase().includes("restricted") || item.toLowerCase().includes("reject") || item.toLowerCase().includes("insufficient")
    );
    expect(hasRestriction).toBe(true);
  });

  it("triggers review when route is REJECT", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ route: "REJECT" }),
      routeSummary: makeRouteSummary({ route: "REJECT" }),
    });

    expect(vm.review.required).toBe(true);
  });
});

// ─── 4. Evidence tier remains conservative ───────────────────────────────────

describe("evidence tier conservatism", () => {
  it("does not return 'verified' without verified evidence", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    expect(vm.evidence.level).not.toBe("verified");
  });

  it("returns a valid evidence level", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    expect(["none", "single_source", "multi_source", "corroborated"]).toContain(vm.evidence.level);
  });
});

// ─── 5. Governed action derives from constitutional next move ────────────────

describe("governed action derivation", () => {
  it("derives required action from recommended interventions", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({
        recommendedInterventions: ["Complete a Team Assessment"],
      }),
      routeSummary: makeRouteSummary(),
    });

    expect(vm.governedAction.requiredAction).toContain("Team Assessment");
  });
});

// ─── 6. Evidence basis is present and derived ────────────────────────────────

describe("evidence basis", () => {
  it("includes evidence basis in governed action", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ route: "STRATEGY", confidence: 0.85 }),
      routeSummary: makeRouteSummary({ route: "STRATEGY" }),
    });

    expect(vm.governedAction.evidenceBasis).toBeDefined();
    expect(vm.governedAction.evidenceBasis!.length).toBeGreaterThanOrEqual(1);
    expect(vm.governedAction.evidenceBasis![0]).toContain("STRATEGY");
  });
});

// ─── 7. No verified claim without verified evidence ──────────────────────────

describe("no false verification", () => {
  it("does not claim verified evidence", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain('"verified"');
  });
});

// ─── 8. No internal engine keys/scores leak ──────────────────────────────────

describe("no internal mechanics exposed", () => {
  it("serialized view model contains no raw taxonomy keys", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");
    expect(serialized).not.toContain("compositeScore");
    expect(serialized).not.toContain("vocabularyState");
  });
});

// ─── 9. No "institutional memory" ────────────────────────────────────────────

describe("no institutional memory", () => {
  it("never contains 'Institutional memory'", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("Institutional memory");
    expect(serialized).not.toContain("institutional memory");
  });
});

// ─── 10. Failure modes appear in evidence gaps ───────────────────────────────

describe("failure modes", () => {
  it("appear in evidence gaps when present", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport({ failureModeCount: 3 }),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    const hasFailureGap = vm.evidence.gaps.some(g => g.includes("failure mode"));
    expect(hasFailureGap).toBe(true);
  });
});
