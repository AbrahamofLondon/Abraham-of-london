/**
 * P9 — GMI Adoption Maturity Tests
 * Validates benchmark, alert, scenario and Q3 state post-migration.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Benchmark claim guard ────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: {
    gmiBenchmarkEntry: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    gmiAlertRule: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    gmiReleaseSnapshot: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    gmiEditionGovernanceState: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { canShowBenchmarkClaims, getBenchmarksByEdition } from "@/lib/intelligence/gmi-benchmark-service";
import { EMAIL_DELIVERY_ENABLED, WEBHOOK_DELIVERY_ENABLED, createAlertRule, getAlertRulesByEdition } from "@/lib/intelligence/gmi-alert-rule-service";
import { GMI_SCENARIO_EXPLORER_ENABLED } from "@/lib/intelligence/gmi-feature-flags";
import { validateGmiCopy, DISALLOWED_COPY_TERMS } from "@/lib/intelligence/gmi-copy-guardrails";
import { resolveGmiEditionById } from "@/lib/intelligence/gmi-edition-resolver";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Benchmark claim guard (P6)", () => {
  it("canShowBenchmarkClaims returns true when rows seeded", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(3);
    expect(await canShowBenchmarkClaims("GMI-Q2-2026")).toBe(true);
  });

  it("canShowBenchmarkClaims returns false for Q3 (no rows yet)", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(0);
    expect(await canShowBenchmarkClaims("GMI-Q3-2026")).toBe(false);
  });

  it("benchmark rows have non-null sourceReference", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.findMany).mockResolvedValueOnce([
      {
        id: "bench_001",
        editionId: "GMI-Q2-2026",
        callId: null,
        benchmarkType: "consensus_narrative",
        providerName: "IMF WEO April 2026",
        benchmarkStatement: "2.8% growth under moderate fragmentation",
        benchmarkValue: "2.8% growth",
        actualValue: null,
        gmiValue: "Survivability pricing, not normalisation",
        evaluationWindow: "Q2-2026",
        resultSummary: null,
        sourceReference: "IMF WEO April 2026, imf.org/en/Publications/WEO",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    ]);
    const rows = await getBenchmarksByEdition("GMI-Q2-2026");
    expect(rows[0].sourceReference).toBeTruthy();
    expect(rows[0].sourceReference.length).toBeGreaterThan(10);
  });
});

describe("Dashboard alert rule (P6)", () => {
  it("creates a dashboard_only alert rule with status active", async () => {
    vi.mocked(prisma.gmiAlertRule.create).mockResolvedValueOnce({
      id: "alert_001",
      editionId: "GMI-Q2-2026",
      linkedCallId: null,
      linkedFalsificationRuleId: null,
      alertType: "edition_published",
      triggerCondition: "GMI edition GMI-Q2-2026 has been published",
      severity: "medium",
      status: "active",
      deliveryMode: "dashboard_only",
      lastEvaluatedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const rule = await createAlertRule({
      editionId: "GMI-Q2-2026",
      alertType: "edition_published",
      triggerCondition: "GMI edition GMI-Q2-2026 has been published",
      deliveryMode: "dashboard_only",
      status: "active",
    });

    expect(rule.deliveryMode).toBe("dashboard_only");
    expect(rule.status).toBe("active");
    expect(rule.alertType).toBe("edition_published");
  });

  it("email delivery remains disabled", () => {
    expect(EMAIL_DELIVERY_ENABLED).toBe(false);
  });

  it("webhook delivery remains disabled", () => {
    expect(WEBHOOK_DELIVERY_ENABLED).toBe(false);
  });
});

describe("Scenario explorer flag (P8)", () => {
  it("GMI_SCENARIO_EXPLORER_ENABLED is false", () => {
    expect(GMI_SCENARIO_EXPLORER_ENABLED).toBe(false);
  });
});

describe("Copy guardrails (P9)", () => {
  it("real-time is disallowed", () => {
    const result = validateGmiCopy("Our platform provides real-time market data");
    expect(result.valid).toBe(false);
    expect(result.violations).toContain("real-time");
  });

  it("live market feed is disallowed", () => {
    const result = validateGmiCopy("Powered by live market feed from Reuters");
    expect(result.valid).toBe(false);
  });

  it("clean copy passes validation", () => {
    const result = validateGmiCopy(
      "Current published state of the dashboard — manual evidence snapshot updated quarterly."
    );
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("DISALLOWED_COPY_TERMS is non-empty", () => {
    expect(DISALLOWED_COPY_TERMS.length).toBeGreaterThan(5);
  });
});

describe("Q3 dry-run proof (P7)", () => {
  it("Q3 resolves through edition resolver — same code path as Q2", async () => {
    vi.mocked(prisma.gmiReleaseSnapshot.findFirst).mockResolvedValueOnce({
      id: "snap_q3",
      editionId: "GMI-Q3-2026",
      editionSlug: "gmi-q3-2026",
      releaseStatus: "DRAFT",
      publishedAt: null,
      createdAt: new Date(),
    } as any);
    vi.mocked(prisma.gmiEditionGovernanceState.findFirst).mockResolvedValueOnce(
      { publicationStatus: "draft" } as any
    );

    const record = await resolveGmiEditionById("GMI-Q3-2026");
    expect(record).not.toBeNull();
    expect(record!.releaseStatus).not.toBe("PUBLISHED");
    expect(record!.publishedAt).toBeNull();
  });

  it("Q3 canShowBenchmarkClaims returns false (no rows)", async () => {
    vi.mocked(prisma.gmiBenchmarkEntry.count).mockResolvedValueOnce(0);
    expect(await canShowBenchmarkClaims("GMI-Q3-2026")).toBe(false);
  });
});

describe("Deferred features have explicit status (P8)", () => {
  it("Bloomberg is not in active evidence providers", async () => {
    const { ACTIVE_EVIDENCE_PROVIDERS, LIVE_FEED_ENABLED } = await import(
      "@/lib/intelligence/gmi-integrations/index"
    );
    expect(LIVE_FEED_ENABLED).toBe(false);
    const ids = ACTIVE_EVIDENCE_PROVIDERS.map((p) => p.providerId);
    expect(ids).not.toContain("bloomberg-evidence-stub");
  });

  it("Reuters is not in active market signal providers", async () => {
    const { ACTIVE_MARKET_SIGNAL_PROVIDERS } = await import(
      "@/lib/intelligence/gmi-integrations/index"
    );
    const ids = ACTIVE_MARKET_SIGNAL_PROVIDERS.map((p) => p.providerId);
    expect(ids).not.toContain("reuters-market-signal-stub");
  });
});
