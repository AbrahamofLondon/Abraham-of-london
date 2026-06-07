/**
 * GMI Manual Providers — active implementations using manual/static data.
 * Bloomberg and Reuters are stubs only; they are disabled and throw on use.
 */

import type {
  AlertDeliveryProvider,
  AlertPayload,
  AlertResult,
  ConsensusBenchmarkProvider,
  EvidenceIngestionProvider,
  MarketSignalProvider,
  NormalizedBenchmark,
  NormalizedEvidence,
  NormalizedMarketSnapshot,
  RawConsensus,
  RawEvidence,
  RawMarketSnapshot,
} from "./types";

// ─── Error for disabled integrations ─────────────────────────────────────────

export class IntegrationDisabledError extends Error {
  constructor(providerName: string, reason: string) {
    super(`${providerName} integration disabled: ${reason}`);
    this.name = "IntegrationDisabledError";
  }
}

// ─── Manual Evidence Provider ─────────────────────────────────────────────────

export const ManualEvidenceProvider: EvidenceIngestionProvider = {
  providerId: "manual-evidence-v1",
  providerName: "Manual Evidence",
  confidenceBasis: "manual",
  licensingStatus: "free",
  sourceVisibility: "public",

  async fetchEvidence(query: string): Promise<RawEvidence[]> {
    // Manual provider returns empty array — evidence is loaded via admin workbench
    return [
      {
        rawId: `manual-${Date.now()}`,
        rawText: `Manual evidence snapshot for query: "${query}"`,
        sourceUrl: undefined,
        retrievedAt: new Date().toISOString(),
        providerMeta: { source: "manual_admin_entry" },
      },
    ];
  },

  normalizeEvidence(raw: RawEvidence): NormalizedEvidence {
    return {
      evidenceId: raw.rawId,
      statement: raw.rawText,
      sourceUrl: raw.sourceUrl ?? null,
      retrievedAt: raw.retrievedAt,
      confidence: "medium",
      providerName: "Manual Evidence",
      licensingStatus: "free",
    };
  },
};

// ─── Manual Market Snapshot Provider ─────────────────────────────────────────

export const ManualMarketSnapshotProvider: MarketSignalProvider = {
  providerId: "manual-market-snapshot-v1",
  signalType: "manual",
  freshnessWindow: 86400, // 24h — manual snapshots are updated daily at most
  sourceVisibility: "public",

  async fetchSnapshot(): Promise<RawMarketSnapshot> {
    return {
      snapshotId: `manual-snapshot-${Date.now()}`,
      capturedAt: new Date().toISOString(),
      signals: {
        note: "Manual snapshot — no live market feed connected",
        source: "admin_manual_entry",
      },
    };
  },

  normalizeSnapshot(raw: RawMarketSnapshot): NormalizedMarketSnapshot {
    return {
      snapshotId: raw.snapshotId,
      capturedAt: raw.capturedAt,
      signalType: "manual",
      values: raw.signals as Record<string, string | number | null>,
      freshnessAgeSeconds: 0,
      providerName: "Manual Market Snapshot",
      sourceVisibility: "public",
    };
  },
};

// ─── Manual Consensus Benchmark Provider ──────────────────────────────────────

export const ManualConsensusBenchmarkProvider: ConsensusBenchmarkProvider = {
  providerId: "manual-consensus-v1",
  forecastType: "manual_placeholder",

  async fetchConsensus(): Promise<RawConsensus> {
    return {
      rawId: `manual-consensus-${Date.now()}`,
      forecastType: "manual_placeholder",
      forecastValue: null,
      capturedAt: new Date().toISOString(),
      sourceReference: "Manual entry — no automated consensus feed",
    };
  },

  normalizeBenchmark(raw: RawConsensus): NormalizedBenchmark {
    return {
      benchmarkId: raw.rawId,
      forecastType: raw.forecastType,
      forecastValue: raw.forecastValue != null ? String(raw.forecastValue) : null,
      forecastRange: raw.forecastRange ?? null,
      capturedAt: raw.capturedAt,
      sourceReference: raw.sourceReference,
      providerName: "Manual Consensus",
    };
  },
};

// ─── Dashboard-Only Alert Provider ────────────────────────────────────────────

export const DashboardOnlyAlertProvider: AlertDeliveryProvider = {
  providerId: "dashboard-only-alert-v1",
  deliveryType: "dashboard",

  async sendAlert(payload: AlertPayload): Promise<AlertResult> {
    // Dashboard-only: logs to console, no external delivery
    console.log(
      `[GMI ALERT] [${payload.severity.toUpperCase()}] ${payload.alertType} — ${payload.message}`,
      { editionId: payload.editionId, linkedCallId: payload.linkedCallId }
    );
    return {
      delivered: true,
      deliveryMode: "dashboard",
      deliveredAt: new Date().toISOString(),
      error: null,
    };
  },
};

// ─── Bloomberg Stub (DISABLED) ────────────────────────────────────────────────

export const BloombergEvidenceProvider: EvidenceIngestionProvider = {
  providerId: "bloomberg-evidence-stub",
  providerName: "Bloomberg (Stub)",
  confidenceBasis: "algorithmic",
  licensingStatus: "stub_only",
  sourceVisibility: "restricted",

  async fetchEvidence(_query: string): Promise<RawEvidence[]> {
    throw new IntegrationDisabledError(
      "Bloomberg",
      "no license — Bloomberg integration is a stub only"
    );
  },

  normalizeEvidence(_raw: RawEvidence): NormalizedEvidence {
    throw new IntegrationDisabledError(
      "Bloomberg",
      "no license — Bloomberg integration is a stub only"
    );
  },
};

// ─── Reuters Stub (DISABLED) ──────────────────────────────────────────────────

export const ReutersMarketSignalProvider: MarketSignalProvider = {
  providerId: "reuters-market-signal-stub",
  signalType: "macro",
  freshnessWindow: 0,
  sourceVisibility: "restricted",

  async fetchSnapshot(): Promise<RawMarketSnapshot> {
    throw new IntegrationDisabledError(
      "Reuters",
      "no license — Reuters integration is a stub only"
    );
  },

  normalizeSnapshot(_raw: RawMarketSnapshot): NormalizedMarketSnapshot {
    throw new IntegrationDisabledError(
      "Reuters",
      "no license — Reuters integration is a stub only"
    );
  },
};
