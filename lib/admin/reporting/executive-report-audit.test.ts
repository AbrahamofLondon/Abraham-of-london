import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    getPrismaClient: vi.fn(),
  },
}));

import { db } from "@/lib/db";
import { logExecutiveReportAudit } from "./executive-report-audit";

type MockPrisma = {
  governanceLog: {
    create: ReturnType<typeof vi.fn>;
  };
};

const mockReport = {
  state: "MISALIGNED",
  narrative: {
    headline: "Structural Misalignment Identified",
    summary: "Total exposure is rising across execution and talent layers.",
    mandate: "Suspend acceleration, correct the weakest domain, and restore order.",
  },
  ogr: {
    integrationTax: 36.88,
    velocityMultiplier: 1.41,
    resonanceAlpha: 17.5,
    sovereignCertainty: 80.55,
    isAuthorizedToExecute: false,
  },
  resonance: {
    telemetry: {
      averageDissonance: 26.5,
      isDisordered: false,
      domains: [
        {
          label: "STRATEGIC_INTENT",
          intent: 95,
          reality: 72,
          dissonance: 23,
          coverage: "HIGH",
          responseCount: 6,
        },
        {
          label: "OPERATIONAL_CLARITY",
          intent: 88,
          reality: 45,
          dissonance: 43,
          coverage: "HIGH",
          responseCount: 6,
        },
      ],
      strongestDomain: "STRATEGIC_INTENT",
      weakestDomain: "OPERATIONAL_CLARITY",
      domainCount: 2,
      totalResponses: 12,
    },
    metrics: [
      {
        label: "OPERATIONAL_CLARITY",
        intent: 88,
        reality: 45,
        dissonance: 43,
        coverage: "HIGH",
        responseCount: 6,
      },
      {
        label: "STRATEGIC_INTENT",
        intent: 95,
        reality: 72,
        dissonance: 23,
        coverage: "HIGH",
        responseCount: 6,
      },
    ],
  },
  hcd: [],
  hcdAggregate: {
    overallBurnoutIndex: 63,
    riskScore: "HIGH",
    totalReplacementCost: 245000,
    averageUtilization: 87,
    criticalDomains: ["LEADERSHIP_EXHAUSTION"],
    elevatedDomains: ["ENGINEERING_VELOCITY"],
    stableDomains: ["ROLE_VACANCY"],
  },
  financialExposure: {
    replacementCost: 245000,
    executionLoss: 26500,
    totalExposure: 271500,
  },
  priorityStack: [
    "Suspend execution — alignment not verified",
    "Correct OPERATIONAL_CLARITY (dissonance: 43%)",
    "Reduce leadership load concentration",
  ],
  failureModes: [
    "Execution Stall",
    "Capacity Saturation",
    "Leadership Signal Erosion",
  ],
};

describe("logExecutiveReportAudit", () => {
  let prisma: MockPrisma;

  beforeEach(() => {
    vi.clearAllMocks();

    prisma = {
      governanceLog: {
        create: vi.fn(),
      },
    };

    vi.mocked(db.getPrismaClient).mockResolvedValue(prisma as unknown as never);
    prisma.governanceLog.create.mockResolvedValue({
      id: "log_123",
      action: "EXECUTIVE_REPORT_GENERATED",
    });
  });

  it("writes governance log successfully with canonical audit structure", async () => {
    const result = await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    expect(result).toEqual({
      ok: true,
      auditId: "log_123",
    });

    expect(prisma.governanceLog.create).toHaveBeenCalledTimes(1);

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload).toBeTruthy();

    expect(payload.data.action).toBe("EXECUTIVE_REPORT_GENERATED");
    expect(payload.data.entityId).toBe("cmp_123");

    expect(payload.data.metadata).toBeTruthy();
    expect(payload.data.metadata.actorId).toBe("usr_456");
    expect(payload.data.metadata.organisationName).toBe("AOL Strategic Systems");
    expect(payload.data.metadata.state).toBe("MISALIGNED");
    expect(payload.data.metadata.authorized).toBe(false);
    expect(payload.data.metadata.sovereignCertainty).toBe(80.55);
    expect(payload.data.metadata.averageDissonance).toBe(26.5);
    expect(payload.data.metadata.burnoutIndex).toBe(63);
    expect(payload.data.metadata.totalExposure).toBe(271500);
  });

  it("falls back to null actorId when not provided", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.actorId).toBeNull();
  });

  it("falls back to Sovereign Client when organisation name is empty", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      organisationName: "",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.organisationName).toBe("Sovereign Client");
  });

  it("includes priority stack and failure modes in metadata", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.priorityStack).toEqual(mockReport.priorityStack);
    expect(payload.data.metadata.failureModes).toEqual(mockReport.failureModes);
  });

  it("includes critical and elevated HCD domains", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.criticalDomains).toEqual(["LEADERSHIP_EXHAUSTION"]);
    expect(payload.data.metadata.elevatedDomains).toEqual(["ENGINEERING_VELOCITY"]);
    expect(payload.data.metadata.riskScore).toBe("HIGH");
  });

  it("includes top-level narrative in metadata", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.headline).toBe(
      "Structural Misalignment Identified"
    );
    expect(payload.data.metadata.summary).toBe(
      "Total exposure is rising across execution and talent layers."
    );
    expect(payload.data.metadata.mandate).toBe(
      "Suspend acceleration, correct the weakest domain, and restore order."
    );
  });

  it("stores generated timestamp metadata in ISO format", async () => {
    const before = Date.now();

    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const after = Date.now();

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    const loggedAt = Date.parse(payload.data.metadata.generatedAt);

    expect(Number.isFinite(loggedAt)).toBe(true);
    expect(loggedAt).toBeGreaterThanOrEqual(before - 1000);
    expect(loggedAt).toBeLessThanOrEqual(after + 1000);
  });

  it("handles authorized reports correctly", async () => {
    const authorizedReport = {
      ...mockReport,
      state: "ORDERED",
      ogr: {
        ...mockReport.ogr,
        sovereignCertainty: 94.2,
        isAuthorizedToExecute: true,
      },
    };

    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: authorizedReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.state).toBe("ORDERED");
    expect(payload.data.metadata.authorized).toBe(true);
    expect(payload.data.metadata.sovereignCertainty).toBe(94.2);
  });

  it("survives empty priority stack and failure modes", async () => {
    const report = {
      ...mockReport,
      priorityStack: [],
      failureModes: [],
      hcdAggregate: {
        ...mockReport.hcdAggregate,
        criticalDomains: [],
        elevatedDomains: [],
      },
    };

    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: report as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    expect(payload.data.metadata.priorityStack).toEqual([]);
    expect(payload.data.metadata.failureModes).toEqual([]);
    expect(payload.data.metadata.criticalDomains).toEqual([]);
    expect(payload.data.metadata.elevatedDomains).toEqual([]);
  });

  it("returns DATABASE_CONNECTION_FAILURE when prisma is unavailable", async () => {
    vi.mocked(db.getPrismaClient).mockResolvedValue(null as never);

    const result = await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    expect(result).toEqual({
      ok: false,
      error: "DATABASE_CONNECTION_FAILURE",
    });

    expect(prisma.governanceLog.create).not.toHaveBeenCalled();
  });

  it("returns AUDIT_WRITE_FAILURE when governance log write fails", async () => {
    prisma.governanceLog.create.mockRejectedValue(new Error("write failure"));

    const result = await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    expect(result).toEqual({
      ok: false,
      error: "AUDIT_WRITE_FAILURE",
    });
  });

  it("returns AUDIT_WRITE_FAILURE when report is malformed and logging throws", async () => {
    prisma.governanceLog.create.mockImplementation(() => {
      throw new Error("bad payload");
    });

    const malformedReport = {
      ...mockReport,
      ogr: undefined,
    };

    const result = await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: malformedReport as any,
    });

    expect(result).toEqual({
      ok: false,
      error: "AUDIT_WRITE_FAILURE",
    });
  });

  it("writes compact but decision-grade metadata rather than dumping the full report", async () => {
    await logExecutiveReportAudit({
      campaignId: "cmp_123",
      actorId: "usr_456",
      organisationName: "AOL Strategic Systems",
      report: mockReport as any,
    });

    const payload = prisma.governanceLog.create.mock.calls[0]?.[0];
    const metadata = payload.data.metadata;

    expect(metadata).not.toHaveProperty("resonance");
    expect(metadata).not.toHaveProperty("hcd");
    expect(metadata).not.toHaveProperty("fullReport");
    expect(metadata).toHaveProperty("state");
    expect(metadata).toHaveProperty("headline");
    expect(metadata).toHaveProperty("sovereignCertainty");
    expect(metadata).toHaveProperty("totalExposure");
  });
});