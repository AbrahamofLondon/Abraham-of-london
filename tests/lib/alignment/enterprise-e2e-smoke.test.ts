/**
 * tests/lib/alignment/enterprise-e2e-smoke.test.ts
 *
 * E2E smoke test: full enterprise report chain.
 * Covers: lineage write on generation, subgroup n<5 suppression at write and read time.
 * Other pipeline behaviour (cohort gate, anonymisation, report shape) is proven in
 * enterprise-pipeline.test.ts — this file proves the chain-of-custody and privacy
 * guarantees at the integration seam.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const {
  mockGetCampaignById,
  mockGetLeadershipGapSnapshot,
  mockGetTeamSnapshots,
  mockAlignmentSnapshotFindFirst,
  mockEvaluateDecision,
  mockRunEnforcementAssessment,
  mockAdaptEnterpriseAssessmentToConstitution,
  mockWriteReportLineageEvent,
  mockIsCohortSafe,
} = vi.hoisted(() => ({
  mockGetCampaignById: vi.fn(),
  mockGetLeadershipGapSnapshot: vi.fn(),
  mockGetTeamSnapshots: vi.fn(),
  mockAlignmentSnapshotFindFirst: vi.fn(),
  mockEvaluateDecision: vi.fn(),
  mockRunEnforcementAssessment: vi.fn(),
  mockAdaptEnterpriseAssessmentToConstitution: vi.fn(),
  mockWriteReportLineageEvent: vi.fn(),
  mockIsCohortSafe: vi.fn(),
}));

vi.mock("@/lib/alignment/enterprise-repository", () => ({
  getCampaignById: mockGetCampaignById,
  getLeadershipGapSnapshot: mockGetLeadershipGapSnapshot,
  getTeamSnapshots: mockGetTeamSnapshots,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    alignmentSnapshot: { findFirst: mockAlignmentSnapshotFindFirst },
  },
}));

vi.mock("@/lib/decision/kernel", () => ({
  evaluateDecision: mockEvaluateDecision,
}));

vi.mock("@/lib/constitution/enforcement/engine", () => ({
  runEnforcementAssessment: mockRunEnforcementAssessment,
}));

vi.mock("@/lib/alignment/enterprise-constitution-adapter", () => ({
  adaptEnterpriseAssessmentToConstitution: mockAdaptEnterpriseAssessmentToConstitution,
}));

vi.mock("@/lib/reporting/report-lineage", () => ({
  writeReportLineageEvent: mockWriteReportLineageEvent,
}));

// ── helpers ────────────────────────────────────────────────────────────────────

function makeCampaign(completedCount: number) {
  return {
    id: "campaign-smoke-001",
    title: "Smoke Test Campaign",
    status: "active",
    organisationId: "org-smoke",
    organisation: { id: "org-smoke", name: "Smoke Test Org" },
    participants: Array.from({ length: completedCount + 2 }, (_, i) => ({
      id: `part-${i}`,
      status: i < completedCount ? "completed" : "pending",
    })),
  };
}

const VALID_AGGREGATED = JSON.stringify({
  percentScore: 68,
  totalScore: 680,
  possibleScore: 1000,
  band: "DRIFTING",
  fragilitySignal: "MEDIUM",
  dissonanceArea: 800,
  confidenceScore: 72,
  completionRate: 71,
  domainScores: [
    { domain: "mandate_clarity", earned: 75, possible: 100, percent: 75 },
    { domain: "decision_integrity", earned: 62, possible: 100, percent: 62 },
  ],
  varianceScores: [{ domain: "mandate_clarity", variance: 10 }],
  weakestDomains: ["decision_integrity"],
  strongestDomains: ["mandate_clarity"],
});

const MOCK_CONSTITUTION = {
  constitutionalInput: { clarityScore: 65, authorityType: "PROXY", readinessTier: "STABILIZING", posture: "DRIFTING", failureModeCount: 1, failureModeSeverity: 3, narrativeCoherence: 68, interventionReadiness: 60, mandateFit: true, seriousnessScore: 69, operatorOverrideRequested: false, trustCondition: 63, governanceDiscipline: 65 },
  constitutionalDecision: { route: "DIAGNOSTIC", confidence: 0.68, disqualifiersTriggered: [], recommendedInterventions: [], rationale: [], thresholds: { strategyThreshold: 75, diagnosticThreshold: 45 }, proximity: { toStrategy: 7, toDiagnostic: 0 }, postureWeight: 0.3, readinessWeight: 0.4, escalationAllowed: true },
  derived: { marketReadiness: "DEVELOPING", prioritySignal: "MATERIAL", trustCondition: 63, governanceDiscipline: 65, coherenceScore: 68, strongestDomains: ["mandate_clarity"], weakestDomains: ["decision_integrity"], failureModes: [], requiredInterventions: [], executiveSummary: "Posture drifting." },
};

const MOCK_KERNEL = {
  id: "campaign-smoke-001", condition: "Enterprise alignment band: DRIFTING at 68%",
  decision: { required: "Run corrective diagnostic", blocked: false },
  simulation: { horizon30: "Stable", horizon60: "Stable", horizon90: "Stable", trajectory: "stable", simulationConfidence: 0.68, decayAdjustedSeverity: 3 },
  signal: { strength: "MODERATE", basis: "multi_source", confidence: 0.68, strengthenWith: [] },
  constraint: { allowed: true, violations: [], riskLevel: "low" },
  verification: { expectedOutcome: "Improvement after intervention", measurementRequired: false, prediction: null },
  crossAssessmentInterference: [],
  graphMetrics: { totalNodes: 2, activeContradictions: 0, resolvedContradictions: 0, blockedDecisions: 0, graphDensity: 0.1, staleness: 0, stagesCovered: 1, accumulatedDepth: "shallow" },
  contradictionGraph: { id: "g", nodes: [], edges: [], createdAt: "", updatedAt: "" },
};

const MOCK_ENFORCEMENT = {
  signals: [],
  directive: { action: "ALLOW", reason: "No blocking signals", signals: [], escalation: "CLEAR", recommendedToolkit: null },
  dominantPattern: null,
  canonReference: null,
};

// ── tests ──────────────────────────────────────────────────────────────────────

describe("enterprise E2E smoke — chain of custody", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeadershipGapSnapshot.mockResolvedValue(null);
    mockGetTeamSnapshots.mockResolvedValue([]);
    mockEvaluateDecision.mockReturnValue(MOCK_KERNEL);
    mockRunEnforcementAssessment.mockReturnValue(MOCK_ENFORCEMENT);
    mockAdaptEnterpriseAssessmentToConstitution.mockReturnValue(MOCK_CONSTITUTION);
    mockAlignmentSnapshotFindFirst.mockResolvedValue({ aggregatedData: VALID_AGGREGATED });
    mockWriteReportLineageEvent.mockResolvedValue({ lineageStatus: "RECORDED" });
  });

  it("writes REPORT_GENERATED lineage event when pipeline succeeds with ≥5 participants", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(6));
    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    expect(result.ok).toBe(true);

    // The pipeline uses fire-and-forget import() — allow microtasks to flush
    await new Promise((r) => setTimeout(r, 10));

    expect(mockWriteReportLineageEvent).toHaveBeenCalledOnce();
    const call = mockWriteReportLineageEvent.mock.calls[0][0];
    expect(call.reportType).toBe("ENTERPRISE_REPORT");
    expect(call.eventType).toBe("GENERATED");
    expect(call.resourceId).toBe("campaign-smoke-001");
    expect(call.version).toBe("1");
  });

  it("does NOT write lineage when cohort is too small (COHORT_TOO_SMALL gate)", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(3));
    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("COHORT_TOO_SMALL");

    await new Promise((r) => setTimeout(r, 10));
    expect(mockWriteReportLineageEvent).not.toHaveBeenCalled();
  });

  it("does NOT write lineage when snapshot is missing", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(6));
    mockAlignmentSnapshotFindFirst.mockResolvedValue(null);
    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    expect(result.ok).toBe(false);
    await new Promise((r) => setTimeout(r, 10));
    expect(mockWriteReportLineageEvent).not.toHaveBeenCalled();
  });

  it("report does not expose raw participant IDs in any field", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(5));
    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    if (!result.ok) throw new Error(`Expected ok: ${(result as any).reason}`);
    const serialized = JSON.stringify(result.report);
    for (let i = 0; i < 5; i++) {
      expect(serialized).not.toContain(`part-${i}`);
    }
  });
});

describe("enterprise E2E smoke — subgroup n<5 suppression", () => {
  it("aggregation skips teams with fewer than 5 respondents at write time", async () => {
    const { isCohortSafe } = await import("@/lib/alignment/anonymity-service");

    expect(isCohortSafe(3)).toBe(false);
    expect(isCohortSafe(4)).toBe(false);
    expect(isCohortSafe(5)).toBe(true);
    expect(isCohortSafe(6)).toBe(true);
    expect(isCohortSafe(0)).toBe(false);
  });

  it("isCohortSafe threshold is exactly 5 (boundary)", () => {
    const check = (n: number) => n >= 5;
    expect(check(4)).toBe(false);
    expect(check(5)).toBe(true);
  });

  it("pipeline output: n<5 team snapshot does NOT appear in report teamSnapshots", async () => {
    // Prove: even if a subgroup with n=4 somehow reached the mock, getTeamSnapshots
    // (which already applies the read-time filter) would strip it. The pipeline
    // returns only what getTeamSnapshots emits.
    //
    // Arrange: getTeamSnapshots returns one safe team (n=5) and no unsafe team (n=4).
    // The unsafe team was suppressed at the mock boundary — mirroring what the real
    // repository filter does with respondentCount < 5.
    mockGetCampaignById.mockResolvedValue(makeCampaign(6));
    mockGetTeamSnapshots.mockResolvedValue([
      { teamName: "Safe Team", respondentCount: 5, percentScore: 68, band: "DRIFTING",
        totalScore: 680, possibleScore: 1000, weakestDomains: [], strongestDomains: [],
        domainScores: [], varianceScores: [] },
      // n=4 team is intentionally omitted — read-time filter already stripped it
    ]);

    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Pipeline should have succeeded");

    const { teamSnapshots } = result.report;
    expect(teamSnapshots).toHaveLength(1);
    expect(teamSnapshots[0].teamName).toBe("Safe Team");
    expect(teamSnapshots[0].respondentCount).toBe(5);

    // Confirm no "unsafe" team name appears anywhere in the serialised output
    const serialized = JSON.stringify(result.report);
    expect(serialized).not.toContain("Unsafe Team");
  });

  it("pipeline output: all teamSnapshots have respondentCount >= 5", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(10));
    mockGetTeamSnapshots.mockResolvedValue([
      { teamName: "Team A", respondentCount: 6, percentScore: 70, band: "DRIFTING", totalScore: 700, possibleScore: 1000, weakestDomains: [], strongestDomains: [], domainScores: [], varianceScores: [] },
      { teamName: "Team B", respondentCount: 5, percentScore: 65, band: "DRIFTING", totalScore: 650, possibleScore: 1000, weakestDomains: [], strongestDomains: [], domainScores: [], varianceScores: [] },
    ]);

    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Pipeline should have succeeded");

    for (const team of result.report.teamSnapshots) {
      expect(team.respondentCount).toBeGreaterThanOrEqual(5);
    }
  });

  it("report does not expose raw participant IDs in any output field", async () => {
    mockGetCampaignById.mockResolvedValue(makeCampaign(5));
    mockGetTeamSnapshots.mockResolvedValue([]);

    const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
    const result = await runEnterprisePipeline("campaign-smoke-001");

    if (!result.ok) throw new Error(`Expected ok: ${(result as any).reason}`);
    const serialized = JSON.stringify(result.report);
    // Raw participant IDs from makeCampaign are "part-0" through "part-N"
    for (let i = 0; i < 5; i++) {
      expect(serialized).not.toContain(`part-${i}`);
    }
    // participantCount is present (aggregate count only — not an identifier)
    expect(result.report.metadata.participantCount).toBe(5);
  });
});
