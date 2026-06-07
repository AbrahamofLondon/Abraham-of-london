/**
 * GMI Integrations — public surface.
 * Exports contracts, manual providers, disabled stubs, and active registries.
 *
 * LIVE_FEED_ENABLED is false. Bloomberg and Reuters are NOT in active registries.
 */

export * from "./types";

export {
  BloombergEvidenceProvider,
  DashboardOnlyAlertProvider,
  IntegrationDisabledError,
  ManualConsensusBenchmarkProvider,
  ManualEvidenceProvider,
  ManualMarketSnapshotProvider,
  ReutersMarketSignalProvider,
} from "./manual-providers";

import {
  DashboardOnlyAlertProvider,
  ManualConsensusBenchmarkProvider,
  ManualEvidenceProvider,
  ManualMarketSnapshotProvider,
} from "./manual-providers";

import type {
  AlertDeliveryProvider,
  ConsensusBenchmarkProvider,
  EvidenceIngestionProvider,
  MarketSignalProvider,
} from "./types";

/**
 * Live feed is permanently disabled until a licensed data provider is connected
 * and the product team explicitly enables it. Do not set this to true.
 */
export const LIVE_FEED_ENABLED = false as const;

/**
 * Active evidence providers. Bloomberg/Reuters are stubs and NOT included.
 */
export const ACTIVE_EVIDENCE_PROVIDERS: readonly EvidenceIngestionProvider[] = [
  ManualEvidenceProvider,
] as const;

/**
 * Active market signal providers. Reuters is NOT included.
 */
export const ACTIVE_MARKET_SIGNAL_PROVIDERS: readonly MarketSignalProvider[] = [
  ManualMarketSnapshotProvider,
] as const;

/**
 * Active consensus benchmark providers.
 */
export const ACTIVE_BENCHMARK_PROVIDERS: readonly ConsensusBenchmarkProvider[] = [
  ManualConsensusBenchmarkProvider,
] as const;

/**
 * Active alert delivery providers.
 * Only dashboard_only is active. Email/webhook are disabled.
 */
export const ACTIVE_ALERT_PROVIDERS: readonly AlertDeliveryProvider[] = [
  DashboardOnlyAlertProvider,
] as const;
