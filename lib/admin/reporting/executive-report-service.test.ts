// @ts-nocheck
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/db", () => ({
  db: {
    getPrismaClient: vi.fn(),
  },
}));

vi.mock("@/lib/decision/constitutional-guidance-assembler", () => ({
  assembleConstitutionalGuidance: vi.fn(async () => ({
    constitution: {
      route: "DIAGNOSTIC",
      priority: "HIGH",
      temperature: "WARM",
      orgState: "MISALIGNED",
    },
    guidance: {
      summary: "Test guidance summary.",
      rationale: ["Test rationale line."],
      recommendations: [],
      nextAction: "Run controlled diagnostic.",
    },
  })),
}));

vi.mock("./canonical-report-contract", () => ({
  buildCanonicalReportContract: vi.fn(() => ({
    schemaVersion: "canonical-report-v2",
    generatedAt: new Date().toISOString(),
  })),
}));

vi.mock("@/lib/team/sentiment-aggregation", () => ({
  aggregateTeamSentiment: vi.fn(() => ({
    mode: "multi_respondent",
    respondentCount: 8,
    confidence: 72,
    domains: [],
  })),
  compareLeaderToTeam: vi.fn(() => []),
}));

vi.mock("@/lib/claims/claim-governor", () => ({
  resolveClaimSet: vi.fn(() => ({
    "team-wide sentiment": { allowed: true },
    predictive: { allowed: false },
  })),
}));

vi.mock("@/lib/predictive/trajectory-engine", () => ({
  resolveTrajectory: vi.fn(() => ({
    trajectory: "stable",
    confidence: 0.65,
  })),
  buildTrajectoryScenarios: vi.fn(() => []),
}));

import { buildExecutiveReportFromCampaign } from "./executive-report-service";
import { db } from "@/lib/db";

function makePrisma(overrides: any = {}) {
  return {
    alignmentCampaign: {
      findUnique: vi.fn(async () => overrides.campaign ?? null),
    },
  };
}

function makeCampaign(participantCount: number) {
  const participants = Array.from({ length: participantCount }, (_, i) => ({
    id: `p-${i}`,
    status: "completed",
    assessments: [{ percentScore: 65 }],
    membership: { teamName: "Engineering" },
  }));
  return {
    id: "cmp_test_1",
    title: "Test Campaign",
    organisation: { name: "Test Org", sector: "technology" },
    participants,
    correctionNodes: [],
  };
}

describe("buildExecutiveReportFromCampaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects empty campaign ID", async () => {
    const result = await buildExecutiveReportFromCampaign("");
    expect(result).toMatchObject({ ok: false, error: "INVALID_CAMPAIGN_ID" });
  });

  it("returns DATABASE_CONNECTION_FAILURE when prisma client is unavailable", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(null);
    const result = await buildExecutiveReportFromCampaign("cmp_1");
    expect(result).toMatchObject({ ok: false, error: "DATABASE_CONNECTION_FAILURE" });
  });

  it("returns CAMPAIGN_NOT_FOUND when campaign does not exist", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(makePrisma({ campaign: null }));
    const result = await buildExecutiveReportFromCampaign("cmp_missing");
    expect(result).toMatchObject({ ok: false, error: "CAMPAIGN_NOT_FOUND" });
  });

  it("returns ANONYMITY_THRESHOLD_NOT_MET with fewer than 5 completed participants", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(
      makePrisma({ campaign: makeCampaign(3) })
    );
    const result = await buildExecutiveReportFromCampaign("cmp_small");
    expect(result).toMatchObject({
      ok: false,
      error: "ANONYMITY_THRESHOLD_NOT_MET",
      threshold: 5,
      participantCount: 3,
    });
  });

  it("builds a successful report with sufficient participants", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(
      makePrisma({ campaign: makeCampaign(8) })
    );
    const result = await buildExecutiveReportFromCampaign("cmp_ok");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload).toBeTruthy();
      expect(result.payload.report).toBeTruthy();
      expect(result.payload.campaign).toBeTruthy();
      expect(result.payload.context).toBeTruthy();
      expect(result.payload.constitution).toBeTruthy();
      expect(result.payload.guidance).toBeTruthy();
      expect(result.payload.jsonPayload).toBeTruthy();
    }
  });

  it("includes the correct campaign metadata in the payload", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(
      makePrisma({ campaign: makeCampaign(10) })
    );
    const result = await buildExecutiveReportFromCampaign("cmp_meta");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.campaign.id).toBe("cmp_test_1");
      expect(result.payload.campaign.organisationName).toBe("Test Org");
      expect(result.payload.context.completedParticipantCount).toBe(10);
    }
  });
});
