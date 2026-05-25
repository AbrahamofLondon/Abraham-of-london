/**
 * DEPRECATED — OGR client config. Reference only.
 * Superseded by Intelligence Foundry engine adapters and module registry.
 * Kept to satisfy imports from deprecated OGR sovereign flow.
 */
export const OGR_CLIENT_CONFIG = {
  protocolVersion: "2026.1.ALPHA",
  defaults: { resonanceScore: 92.5, marketFriction: 65.0, targetRevenue: 100 },
  display: { metricPrecision: 2, certaintyPrecision: 4, storagePrecision: 8 },
  thresholds: { sovereignExecution: 90.0 },
  telemetry: { heartbeatMs: 4000, maxDriftPerCyclePct: 0.08 },
  registry: { maxSelectedBriefsForReport: 200 },
} as const;
