/**
 * GMI Integration Contracts — interface-only definitions.
 * No paid API keys. No live data. No licensing risk.
 * Bloomberg/Reuters adapters are stubs only.
 * Connect real providers in future when licensed and demand-proven.
 */

// ─── Shared primitives ────────────────────────────────────────────────────────

export type RawEvidence = {
  rawId: string;
  rawText: string;
  sourceUrl?: string;
  retrievedAt: string; // ISO
  providerMeta?: Record<string, unknown>;
};

export type NormalizedEvidence = {
  evidenceId: string;
  statement: string;
  sourceUrl: string | null;
  retrievedAt: string;
  confidence: "high" | "medium" | "low" | "unverified";
  providerName: string;
  licensingStatus: "free" | "licensed" | "stub_only";
};

export type RawMarketSnapshot = {
  snapshotId: string;
  capturedAt: string; // ISO
  signals: Record<string, unknown>;
  providerMeta?: Record<string, unknown>;
};

export type NormalizedMarketSnapshot = {
  snapshotId: string;
  capturedAt: string;
  signalType: string;
  values: Record<string, number | string | null>;
  freshnessAgeSeconds: number;
  providerName: string;
  sourceVisibility: "public" | "private" | "restricted";
};

export type RawConsensus = {
  rawId: string;
  forecastType: string;
  forecastValue: string | number | null;
  forecastRange?: { low: number; high: number };
  capturedAt: string;
  sourceReference: string;
  providerMeta?: Record<string, unknown>;
};

export type NormalizedBenchmark = {
  benchmarkId: string;
  forecastType: string;
  forecastValue: string | null;
  forecastRange: { low: number; high: number } | null;
  capturedAt: string;
  sourceReference: string;
  providerName: string;
};

export type AlertPayload = {
  alertId: string;
  editionId: string;
  alertType: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  linkedCallId?: string;
  triggeredAt: string; // ISO
  deliveryMode: "email" | "webhook" | "dashboard";
};

export type AlertResult = {
  delivered: boolean;
  deliveryMode: "email" | "webhook" | "dashboard";
  deliveredAt: string | null;
  error: string | null;
};

// ─── Provider contracts ───────────────────────────────────────────────────────

/**
 * Evidence ingestion provider contract.
 * Implement for any evidence source: manual, Bloomberg, Reuters, etc.
 */
export interface EvidenceIngestionProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly confidenceBasis: "manual" | "algorithmic" | "hybrid";
  readonly licensingStatus: "free" | "licensed" | "stub_only";
  readonly sourceVisibility: "public" | "private" | "restricted";
  fetchEvidence(query: string): Promise<RawEvidence[]>;
  normalizeEvidence(raw: RawEvidence): NormalizedEvidence;
}

/**
 * Market signal provider contract.
 * Implement for equity tickers, macro signals, sector reads, or manual snapshots.
 */
export interface MarketSignalProvider {
  readonly providerId: string;
  readonly signalType: "equity" | "macro" | "sector" | "manual";
  readonly freshnessWindow: number; // seconds
  readonly sourceVisibility: "public" | "private" | "restricted";
  fetchSnapshot(): Promise<RawMarketSnapshot>;
  normalizeSnapshot(raw: RawMarketSnapshot): NormalizedMarketSnapshot;
}

/**
 * Consensus benchmark provider contract.
 * Implement to compare GMI calls against published consensus or analyst forecasts.
 */
export interface ConsensusBenchmarkProvider {
  readonly providerId: string;
  readonly forecastType: string;
  fetchConsensus(): Promise<RawConsensus>;
  normalizeBenchmark(raw: RawConsensus): NormalizedBenchmark;
}

/**
 * Alert delivery provider contract.
 * dashboard_only is the only active delivery mode for now.
 * email and webhook are future-mode; not wired to external systems yet.
 */
export interface AlertDeliveryProvider {
  readonly providerId: string;
  readonly deliveryType: "email" | "webhook" | "dashboard";
  sendAlert(payload: AlertPayload): Promise<AlertResult>;
}
