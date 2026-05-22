/**
 * tests/lib/alignment/enterprise-pipeline.test.ts
 *
 * Proves: cohort safety gate, anonymisation, report generation.
 * All DB + external module calls are mocked at the module boundary.
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
} = vi.hoisted(() => ({
  mockGetCampaignById: vi.fn(),
  mockGetLeadershipGapSnapshot: vi.fn(),
  mockGetTeamSnapshots: vi.fn(),
  mockAlignmentSnapshotFindFirst: vi.fn(),
  mockEvaluateDecision: vi.fn(),
  mockRunEnforcementAssessment: vi.fn(),
  mockAdaptEnterpriseAssessmentToConstitution: vi.fn(),
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

// ── helpers ────────────────────────────────────────────────────────────────────

function makeCampaign(completedCount: number, totalCount?: number) {
  const count = totalCount ?? completedCount + 2;
  const participants = Array.from({ length: count }, (_, i) => ({
    id: `part-${i}`,
    status: i < completedCount ? "completed" : "pending",
  }));
  return {
    id: "campaign-abc",
    title: "Test Campaign",
    status: "active",
    organisationId: "org-xyz",
    organisation: { id: "org-xyz", name: "Test Organisation" },
    participants,
  };
}

const VALID_AGGREGATED = JSON.stringify({
  percentScore: 72,
  totalScore: 720,
  possibleScore: 1000,
  band: "DRIFTING",
  fragilitySignal: "MEDIUM",
  dissonanceArea: 850,
  confidenceScore: 78,
  completionRate: 65,
  domainScores: [
    { domain: "mandate_clarity", earned: 80, possible: 100, percent: 80 },
    { domain: "decision_integrity", earned: 60, possible: 100, percent: 60 },
    { domain: "operational_discipline", earned: 65, possible: 100, percent: 65 },
  ],
  varianceScores: [
    { domain: "mandate_clarity", variance: 12 },
    { domain: "decision_integrity", variance: 22 },
  ],
  weakestDomains: ["decision_integrity"],
  strongestDomains: ["mandate_clarity"],
});

const MOCK_CONSTITUTION = {
  constitutionalInput: {
    clarityScore: 68,
    authorityType: "PROXY",
    readinessTier: "STABILIZING",
    posture: "DRIFTING",
    failureModeCount: 1,
    failureModeSeverity: 4,
    narrativeCoherence: 70,
    interventionReadiness: 60,
    mandateFit: true,
    seriousnessScore: 71,
    operatorOverrideRequested: false,
    trustCondition: 65,
    governanceDiscipline: 68,
  },
  constitutionalDecision: {
    route: "DIAGNOSTIC",
    confidence: 0.72,
    disqualifiersTriggered: [],
    recommendedInterventions: ["Tighten operating cadence"],
    rationale: [],
    thresholds: { strategyThreshold: 75, diagnosticThreshold: 45 },
    proximity: { toStrategy: 3, toDiagnostic: 0 },
    postureWeight: 0.3,
    readinessWeight: 0.4,
    escalationAllowed: true,
  },
  derived: {
    marketReadiness: "DEVELOPING",
    prioritySignal: "MATERIAL",
    trustCondition: 65,
    governanceDiscipline: 68,
    coherenceScore: 70,
    strongestDomains: ["mandate_clarity"],
    weakestDomains: ["decision_integrity"],
    failureModes: ["Decision-rights ambiguity"],
    requiredInterventions: ["Tighten operating cadence"],
    executiveSummary: "Enterprise posture is drifting at 72%.",
  },
};

const MOCK_KERNEL = {
  id: "campaign-abc",
  condition: "Enterprise alignment band: DRIFTING at 72%",
  decision: { required: "Run corrective diagnostic", blocked: false },
  simulation: { horizon30: "Stable", horizon60: "Stable", horizon90: "Stable", trajectory: "stable", simulationConfidence: 0.7, decayAdjustedSeverity: 3 },
  signal: { strength: "MODERATE", basis: "multi_source", confidence: 0.7, strengthenWith: [] },
  constraint: { allowed: true, violations: [], riskLevel: "low" },
  verification: { expectedOutcome: "Improvement after intervention", measurementRequired: false, prediction: null },
  crossAssessmentInterference: [],
  graphMetrics: { totalNodes: 3, activeContradictions: 0, resolvedContradictions: 0, blockedDecisions: 0, graphDensity: 0.2, staleness: 0, stagesCovered: 1, accumulatedDepth: "shallow" },
  contradictionGraph: { id: "g", nodes: [], edges: [], createdAt: "", updatedAt: "" },
};

const MOCK_ENFORCEMENT = {
  signals: [],
  directive: { action: "ALLOW", reason: "No blocking signals", signals: [], escalation: "CLEAR", recommendedToolkit: null },
  dominantPattern: null,
  canonReference: null,
};

// ── tests ──────────────────────────────────────────────────────────────────────

describe("runEnterprisePipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeadershipGapSnapshot.mockResolvedValue(null);
    mockGetTeamSnapshots.mockResolvedValue([]);
    mockEvaluateDecision.mockReturnValue(MOCK_KERNEL);
    mockRunEnforcementAssessment.mockReturnValue(MOCK_ENFORCEMENT);
    mockAdaptEnterpriseAssessmentToConstitution.mockReturnValue(MOCK_CONSTITUTION);
    mockAlignmentSnapshotFindFirst.mockResolvedValue({
      aggregatedData: VALID_AGGREGATED,
    });
  });

  describe("cohort safety", () => {
    it("returns COHORT_TOO_SMALL when fewer than 5 completed participants", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(3));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("COHORT_TOO_SMALL");
        expect(result.participantCount).toBe(3);
      }
    });

    it("returns COHORT_TOO_SMALL for exactly 4 participants", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(4));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("COHORT_TOO_SMALL");
    });

    it("passes cohort gate with exactly 5 completed participants", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      expect(result.ok).toBe(true);
    });
  });

  describe("campaign not found", () => {
    it("returns CAMPAIGN_NOT_FOUND when getCampaignById returns null", async () => {
      mockGetCampaignById.mockResolvedValue(null);
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("nonexistent");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("CAMPAIGN_NOT_FOUND");
    });
  });

  describe("no snapshot", () => {
    it("returns NO_SNAPSHOT when alignment snapshot is missing", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      mockAlignmentSnapshotFindFirst.mockResolvedValue(null);
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toBe("NO_SNAPSHOT");
    });
  });

  describe("anonymisation", () => {
    it("does not expose raw participant IDs in the report", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok result, got: ${result.reason}`);

      // Report must not contain raw participant IDs
      const reportStr = JSON.stringify(result.report);
      expect(reportStr).not.toContain("part-0");
      expect(reportStr).not.toContain("part-1");
      expect(reportStr).not.toContain("part-2");
    });

    it("records participantCount (not individual IDs) in metadata", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok: got ${result.reason}`);
      expect(result.report.metadata.participantCount).toBe(5);
      expect(result.report.metadata).not.toHaveProperty("anonymisedIds");
    });
  });

  describe("report generation", () => {
    it("returns a well-formed EnrichedEnterpriseReport on success", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(6));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok: got ${result.reason}`);

      const { report } = result;
      expect(report.metadata.auditID).toMatch(/^OGR-/);
      expect(report.metadata.organisationName).toBe("Test Organisation");
      expect(report.scores.band).toBe("DRIFTING");
      expect(report.scores.overall).toBe(72);
      expect(report.constitution).toBeDefined();
      expect(report.kernel).toBeDefined();
      expect(report.costOfDelay).toBeDefined();
      expect(report.enforcement).toBeDefined();
    });

    it("includes domainPerformance and varianceScores from the snapshot", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(6));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok: got ${result.reason}`);

      expect(result.report.domainPerformance).toHaveLength(3);
      expect(result.report.varianceScores).toHaveLength(2);
    });

    it("calls the decision kernel with enterprise source", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      await runEnterprisePipeline("campaign-abc");
      expect(mockEvaluateDecision).toHaveBeenCalledWith(
        expect.objectContaining({ source: "enterprise" }),
      );
    });

    it("calls the constitution adapter", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      await runEnterprisePipeline("campaign-abc");
      expect(mockAdaptEnterpriseAssessmentToConstitution).toHaveBeenCalledOnce();
    });

    it("includes leadership gap when available", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      mockGetLeadershipGapSnapshot.mockResolvedValue({
        overallGapPercent: 18,
        domainGaps: [],
        interpretationFlags: [],
      });
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok: got ${result.reason}`);
      expect(result.report.leadershipGap).not.toBeNull();
      expect(result.report.leadershipGap?.overallGapPercent).toBe(18);
    });

    it("emits PERCEPTUAL_DISSONANCE finding when leadership gap > 15%", async () => {
      mockGetCampaignById.mockResolvedValue(makeCampaign(5));
      mockGetLeadershipGapSnapshot.mockResolvedValue({
        overallGapPercent: 20,
        domainGaps: [],
        interpretationFlags: [],
      });
      const { runEnterprisePipeline } = await import("@/lib/alignment/enterprise-pipeline");
      const result = await runEnterprisePipeline("campaign-abc");
      if (!result.ok) throw new Error(`Expected ok: got ${result.reason}`);
      expect(result.report.findings.some((f) => f.includes("PERCEPTUAL_DISSONANCE"))).toBe(true);
    });
  });
});
