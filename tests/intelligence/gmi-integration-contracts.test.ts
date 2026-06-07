/**
 * P10 — Integration Contract Tests
 * Manual providers must work. Bloomberg/Reuters must be stubs and disabled.
 * LIVE_FEED_ENABLED must be false.
 */

import { describe, expect, it } from "vitest";

import {
  ACTIVE_EVIDENCE_PROVIDERS,
  ACTIVE_MARKET_SIGNAL_PROVIDERS,
  BloombergEvidenceProvider,
  DashboardOnlyAlertProvider,
  IntegrationDisabledError,
  LIVE_FEED_ENABLED,
  ManualConsensusBenchmarkProvider,
  ManualEvidenceProvider,
  ManualMarketSnapshotProvider,
  ReutersMarketSignalProvider,
} from "@/lib/intelligence/gmi-integrations/index";

describe("LIVE_FEED_ENABLED", () => {
  it("is false", () => {
    expect(LIVE_FEED_ENABLED).toBe(false);
  });
});

describe("ManualEvidenceProvider", () => {
  it("has correct metadata", () => {
    expect(ManualEvidenceProvider.providerId).toBe("manual-evidence-v1");
    expect(ManualEvidenceProvider.licensingStatus).toBe("free");
    expect(ManualEvidenceProvider.confidenceBasis).toBe("manual");
    expect(ManualEvidenceProvider.sourceVisibility).toBe("public");
  });

  it("fetchEvidence returns an array", async () => {
    const result = await ManualEvidenceProvider.fetchEvidence("test query");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("rawId");
    expect(result[0]).toHaveProperty("rawText");
    expect(result[0]).toHaveProperty("retrievedAt");
  });

  it("normalizeEvidence returns expected shape", () => {
    const raw = {
      rawId: "test-id",
      rawText: "Evidence text",
      retrievedAt: new Date().toISOString(),
    };
    const normalized = ManualEvidenceProvider.normalizeEvidence(raw);
    expect(normalized).toHaveProperty("evidenceId", "test-id");
    expect(normalized).toHaveProperty("statement", "Evidence text");
    expect(normalized).toHaveProperty("providerName", "Manual Evidence");
    expect(normalized).toHaveProperty("licensingStatus", "free");
    expect(normalized).toHaveProperty("confidence");
  });
});

describe("ManualMarketSnapshotProvider", () => {
  it("has manual signalType and public visibility", () => {
    expect(ManualMarketSnapshotProvider.signalType).toBe("manual");
    expect(ManualMarketSnapshotProvider.sourceVisibility).toBe("public");
  });

  it("fetchSnapshot returns a valid snapshot", async () => {
    const snapshot = await ManualMarketSnapshotProvider.fetchSnapshot();
    expect(snapshot).toHaveProperty("snapshotId");
    expect(snapshot).toHaveProperty("capturedAt");
    expect(snapshot).toHaveProperty("signals");
  });
});

describe("ManualConsensusBenchmarkProvider", () => {
  it("fetchConsensus returns a valid consensus object", async () => {
    const raw = await ManualConsensusBenchmarkProvider.fetchConsensus();
    expect(raw).toHaveProperty("rawId");
    expect(raw).toHaveProperty("forecastType");
    expect(raw).toHaveProperty("capturedAt");
  });

  it("normalizeBenchmark returns expected shape", async () => {
    const raw = await ManualConsensusBenchmarkProvider.fetchConsensus();
    const normalized = ManualConsensusBenchmarkProvider.normalizeBenchmark(raw);
    expect(normalized).toHaveProperty("benchmarkId");
    expect(normalized).toHaveProperty("forecastType");
    expect(normalized).toHaveProperty("providerName", "Manual Consensus");
  });
});

describe("DashboardOnlyAlertProvider", () => {
  it("has dashboard deliveryType", () => {
    expect(DashboardOnlyAlertProvider.deliveryType).toBe("dashboard");
  });

  it("sendAlert returns delivered:true", async () => {
    const result = await DashboardOnlyAlertProvider.sendAlert({
      alertId: "test-alert",
      editionId: "GMI-Q2-2026",
      alertType: "threshold_breach",
      severity: "medium",
      message: "Test alert message",
      triggeredAt: new Date().toISOString(),
      deliveryMode: "dashboard",
    });
    expect(result.delivered).toBe(true);
    expect(result.deliveryMode).toBe("dashboard");
    expect(result.error).toBeNull();
  });
});

describe("BloombergEvidenceProvider (STUB — DISABLED)", () => {
  it("fetchEvidence throws IntegrationDisabledError", async () => {
    await expect(
      BloombergEvidenceProvider.fetchEvidence("any query")
    ).rejects.toThrow(IntegrationDisabledError);
  });

  it("error message mentions 'disabled'", async () => {
    await expect(
      BloombergEvidenceProvider.fetchEvidence("any query")
    ).rejects.toThrow(/disabled/i);
  });

  it("licensingStatus is stub_only", () => {
    expect(BloombergEvidenceProvider.licensingStatus).toBe("stub_only");
  });
});

describe("ReutersMarketSignalProvider (STUB — DISABLED)", () => {
  it("fetchSnapshot throws IntegrationDisabledError", async () => {
    await expect(
      ReutersMarketSignalProvider.fetchSnapshot()
    ).rejects.toThrow(IntegrationDisabledError);
  });

  it("error message mentions 'disabled'", async () => {
    await expect(
      ReutersMarketSignalProvider.fetchSnapshot()
    ).rejects.toThrow(/disabled/i);
  });
});

describe("Active provider registries", () => {
  it("ACTIVE_EVIDENCE_PROVIDERS does NOT include Bloomberg", () => {
    const ids = ACTIVE_EVIDENCE_PROVIDERS.map((p) => p.providerId);
    expect(ids).not.toContain("bloomberg-evidence-stub");
  });

  it("ACTIVE_EVIDENCE_PROVIDERS does NOT include Reuters", () => {
    const ids = ACTIVE_EVIDENCE_PROVIDERS.map((p) => p.providerId);
    expect(ids).not.toContain("reuters-market-signal-stub");
  });

  it("ACTIVE_MARKET_SIGNAL_PROVIDERS does NOT include Reuters", () => {
    const ids = ACTIVE_MARKET_SIGNAL_PROVIDERS.map((p) => p.providerId);
    expect(ids).not.toContain("reuters-market-signal-stub");
  });

  it("ACTIVE_EVIDENCE_PROVIDERS includes the manual provider", () => {
    const ids = ACTIVE_EVIDENCE_PROVIDERS.map((p) => p.providerId);
    expect(ids).toContain("manual-evidence-v1");
  });
});
