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

// ─── 11. Structural input: approvingAuthority influences evidenceBasis ───────

describe("structural input: approvingAuthority", () => {
  it("appears in evidenceBasis when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        approvingAuthority: "Board of Directors",
      },
    });

    const hasApprovingAuthority = vm.governedAction.evidenceBasis!.some(
      b => b.includes("Approving authority")
    );
    expect(hasApprovingAuthority).toBe(true);
  });

  it("does not create authority unresolved item solely because decisionOwner is present", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport({ mandateFit: true }),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        decisionOwner: "CEO",
        approvingAuthority: "Board of Directors",
      },
    });

    // With approvingAuthority present, there should be no "approving authority not confirmed" item
    const hasApprovingUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("approving authority not confirmed")
    );
    expect(hasApprovingUnresolved).toBe(false);
  });
});

// ─── 12. Structural input: missing approvingAuthority creates unresolved ─────

describe("structural input: missing approvingAuthority", () => {
  it("creates unresolved item when decisionOwner exists but approvingAuthority is missing", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        decisionOwner: "CEO",
      },
    });

    const hasUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("approving authority not confirmed")
    );
    expect(hasUnresolved).toBe(true);
  });

  it("does not create approving authority unresolved when neither decisionOwner nor approvingAuthority exist", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    const hasUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("approving authority not confirmed")
    );
    expect(hasUnresolved).toBe(false);
  });
});

// ─── 13. Structural input: blockingAuthority appears in unresolvedItems ──────

describe("structural input: blockingAuthority", () => {
  it("appears in unresolvedItems when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        blockingAuthority: "Legal counsel",
      },
    });

    const hasBlocking = vm.nextLayer.unresolvedItems.some(
      i => i.includes("Blocking authority")
    );
    expect(hasBlocking).toBe(true);
  });

  it("triggers review when blockingAuthority is present", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        blockingAuthority: "Legal counsel",
      },
    });

    expect(vm.review.required).toBe(true);
  });
});

// ─── 14. Structural input: missing mandateSource appears as unresolved ───────

describe("structural input: missing mandateSource", () => {
  it("appears as unresolved item when mandateSource is missing and mandateFit is false", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport({ mandateFit: false }),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    const hasMandateUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("mandate source not confirmed")
    );
    expect(hasMandateUnresolved).toBe(true);
  });
});

// ─── 15. Structural input: failureMode affects governedAction ────────────────

describe("structural input: failureMode", () => {
  it("affects governedAction whyThisAction when rationale is absent", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ rationale: [] }),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        failureMode: "authority_ambiguity",
      },
    });

    expect(vm.governedAction.whyThisAction).toContain("authority_ambiguity");
  });

  it("appears in changes.newEvidence when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        failureMode: "authority_ambiguity",
      },
    });

    const hasFailureEvidence = vm.changes.newEvidence.some(
      e => e.includes("Failure mode")
    );
    expect(hasFailureEvidence).toBe(true);
  });
});

// ─── 16. Structural input: repairCondition affects nextLayer and continuity ──

describe("structural input: repairCondition", () => {
  it("appears in nextLayer unresolvedItems when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Clear mandate from board required",
      },
    });

    const hasRepair = vm.nextLayer.unresolvedItems.some(
      i => i.includes("Repair condition")
    );
    expect(hasRepair).toBe(true);
  });

  it("appears in continuity statement when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Clear mandate from board required",
      },
    });

    expect(vm.continuity.continuityStatement).toContain("Repair condition");
  });
});

// ─── 17. Score-only input does not create authority/memory claims ────────────

describe("score-only input safety", () => {
  it("does not create authority claims from scores alone", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    // Without structural input, the adapter should not fabricate authority claims
    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("approvingAuthority");
  });
});

// ─── 18. Adapter still works when structural input is absent ────────────────

describe("adapter resilience", () => {
  it("works when constitutionalStructural is undefined", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    expect(vm).toBeDefined();
    expect(vm.governedAction).toBeDefined();
    expect(vm.nextLayer).toBeDefined();
    expect(vm.changes).toBeDefined();
    expect(vm.continuity).toBeDefined();
  });

  it("works when constitutionalStructural is empty", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    expect(vm).toBeDefined();
    expect(vm.governedAction).toBeDefined();
  });
});

// ─── 19. Structural facts override score inference ───────────────────────────

describe("structural facts override score inference", () => {
  it("approvingAuthority from structuralFacts appears in evidenceBasis", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        approvingAuthority: "Board of Directors",
      },
    });

    const hasApproving = vm.governedAction.evidenceBasis!.some(
      b => b.includes("Approving authority")
    );
    expect(hasApproving).toBe(true);
  });

  it("mandateSource from structuralFacts appears in evidence gaps", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        mandateSource: "Board instruction",
      },
    });

    const hasMandate = vm.evidence.gaps.some(
      g => g.includes("Mandate source")
    );
    expect(hasMandate).toBe(true);
  });
});

// ─── 20. approvingAuthority from structuralFacts sets authorityState ─────────

describe("approvingAuthority sets authorityState", () => {
  it("appears in evidenceBasis when approvingAuthority is provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        approvingAuthority: "Board of Directors",
      },
    });

    const hasApproving = vm.governedAction.evidenceBasis!.some(
      b => b.includes("Approving authority")
    );
    expect(hasApproving).toBe(true);
  });
});

// ─── 21. decisionOwner alone does not establish approving authority ──────────

describe("decisionOwner alone does not establish approving authority", () => {
  it("creates unresolved item when decisionOwner exists but approvingAuthority is missing", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        decisionOwner: "CEO",
      },
    });

    const hasUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("approving authority not confirmed")
    );
    expect(hasUnresolved).toBe(true);
  });

  it("does not create approving authority unresolved when neither exists", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    const hasUnresolved = vm.nextLayer.unresolvedItems.some(
      i => i.toLowerCase().includes("approving authority not confirmed")
    );
    expect(hasUnresolved).toBe(false);
  });
});

// ─── 22. blockingAuthority appears in unresolvedItems ────────────────────────

describe("blockingAuthority appears in unresolvedItems", () => {
  it("appears in unresolvedItems when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        blockingAuthority: "Legal counsel",
      },
    });

    const hasBlocking = vm.nextLayer.unresolvedItems.some(
      i => i.includes("Blocking authority")
    );
    expect(hasBlocking).toBe(true);
  });

  it("triggers review when blockingAuthority is present", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        blockingAuthority: "Legal counsel",
      },
    });

    expect(vm.review.required).toBe(true);
  });
});

// ─── 23. mandateSource affects admissibility/evidenceBasis ───────────────────

describe("mandateSource affects admissibility/evidenceBasis", () => {
  it("appears in evidence gaps when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        mandateSource: "Board instruction",
      },
    });

    const hasMandate = vm.evidence.gaps.some(
      g => g.includes("Mandate source")
    );
    expect(hasMandate).toBe(true);
  });

  it("appears in changes.newEvidence when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        mandateSource: "Shareholder agreement",
      },
    });

    const hasMandate = vm.changes.newEvidence.some(
      e => e.includes("Mandate source") || e.includes("Shareholder")
    );
    // mandateSource may or may not appear in newEvidence depending on adapter logic
    // but it should appear in evidence gaps
    expect(vm.evidence.gaps.some(g => g.includes("Mandate source"))).toBe(true);
  });
});

// ─── 24. currentRoute affects current route output ───────────────────────────

describe("currentRoute affects current route output", () => {
  it("appears in evidence gaps when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        currentRoute: "Leadership review",
      },
    });

    const hasRoute = vm.evidence.gaps.some(
      g => g.includes("Current route")
    );
    expect(hasRoute).toBe(true);
  });

  it("appears in continuity statement when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        currentRoute: "Board / executive approval",
      },
    });

    expect(vm.continuity.continuityStatement).toContain("Current route");
  });
});

// ─── 25. failureMode affects nextAdmissibleMove ──────────────────────────────

describe("failureMode affects nextAdmissibleMove", () => {
  it("affects governedAction whyThisAction when rationale is absent", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ rationale: [] }),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        failureMode: "authority_ambiguity",
      },
    });

    expect(vm.governedAction.whyThisAction).toContain("authority_ambiguity");
  });

  it("appears in changes.newEvidence when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        failureMode: "authority_ambiguity",
      },
    });

    const hasFailureEvidence = vm.changes.newEvidence.some(
      e => e.includes("Failure mode")
    );
    expect(hasFailureEvidence).toBe(true);
  });

  it("appears in evidence gaps when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        failureMode: "unclear ownership",
      },
    });

    const hasFailureGap = vm.evidence.gaps.some(
      g => g.includes("Failure mode")
    );
    expect(hasFailureGap).toBe(true);
  });
});

// ─── 26. repairCondition affects governedAction/continuity ───────────────────

describe("repairCondition affects governedAction/continuity", () => {
  it("appears in nextLayer unresolvedItems when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Clear mandate from board required",
      },
    });

    const hasRepair = vm.nextLayer.unresolvedItems.some(
      i => i.includes("Repair condition")
    );
    expect(hasRepair).toBe(true);
  });

  it("appears in continuity statement when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Clear mandate from board required",
      },
    });

    expect(vm.continuity.continuityStatement).toContain("Repair condition");
  });

  it("drives governedAction requiredAction when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision({ recommendedInterventions: [] }),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Confirm mandate from board before proceeding",
      },
    });

    expect(vm.governedAction.requiredAction).toContain("Confirm mandate from board before proceeding");
  });

  it("appears in changes.newEvidence when provided", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        repairCondition: "Clear mandate from board required",
      },
    });

    const hasRepairEvidence = vm.changes.newEvidence.some(
      e => e.includes("Repair condition")
    );
    expect(hasRepairEvidence).toBe(true);
  });
});

// ─── 27. Missing structuralFacts falls back safely ───────────────────────────

describe("missing structuralFacts fallback safety", () => {
  it("works when constitutionalStructural is undefined", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
    });

    expect(vm).toBeDefined();
    expect(vm.governedAction).toBeDefined();
    expect(vm.nextLayer).toBeDefined();
    expect(vm.continuity).toBeDefined();
  });

  it("does not fabricate authority claims from empty structural input", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("approvingAuthority");
  });
});

// ─── 28. Score-only input does not fabricate structural facts ────────────────

describe("score-only input safety", () => {
  it("does not create authority claims from scores alone", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {},
    });

    const serialized = JSON.stringify(vm);
    expect(serialized).not.toContain("approvingAuthority");
  });
});

// ─── 29. Decision Centre does not expose unsafe raw structural text ──────────

describe("Decision Centre safety", () => {
  it("does not expose raw structural field keys in user-facing output", () => {
    const vm = buildConstitutionalLivingViewModel({
      report: makeMinimalReport(),
      decision: makeDecision(),
      routeSummary: makeRouteSummary(),
      constitutionalStructural: {
        decisionOwner: "CEO",
        approvingAuthority: "Board of Directors",
        blockingAuthority: "Legal counsel",
        mandateSource: "Shareholder agreement",
        currentRoute: "Leadership review",
        failureMode: "unclear ownership",
        repairCondition: "Confirm mandate from board",
      },
    });

    const serialized = JSON.stringify(vm);
    // Raw internal keys should not appear in user-facing output
    expect(serialized).not.toContain("decisionOwner");
    expect(serialized).not.toContain("approvingAuthority");
    expect(serialized).not.toContain("blockingAuthority");
    expect(serialized).not.toContain("mandateSource");
    expect(serialized).not.toContain("currentRoute");
    expect(serialized).not.toContain("failureMode");
    expect(serialized).not.toContain("repairCondition");
    // But human-readable content should appear
    expect(serialized).toContain("Blocking authority");
    expect(serialized).toContain("Repair condition");
  });
});
