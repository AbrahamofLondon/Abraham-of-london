export type GmiYieldThreshold = {
  watch: number;
  elevated: number;
  critical: number;
};

export type GmiQualitativeThreshold = {
  watch: string;
  elevated: string;
  critical: string;
};

export type GmiAlertThresholds = {
  us10yYieldSpike: GmiYieldThreshold;
  tariffEscalation: GmiQualitativeThreshold;
  usdStress: GmiQualitativeThreshold;
  creditSpreadWidening: GmiQualitativeThreshold;
  growthForecastRevision: GmiQualitativeThreshold;
};

export const GMI_ALERT_THRESHOLDS: GmiAlertThresholds = {
  us10yYieldSpike: {
    watch: 4.5,
    elevated: 4.75,
    critical: 5.0,
  },
  tariffEscalation: {
    watch: "new material tariff measure announced or 90-day pause expired without extension",
    elevated: "tariff expansion across strategic sectors or retaliation escalation",
    critical: "multi-jurisdiction retaliation or systemic trade restriction framework imposed",
  },
  usdStress: {
    watch: "episodic dollar weakness during equity market stress — isolated event",
    elevated: "repeated dollar weakness in risk-off episodes across multiple weeks",
    critical: "institutional selling of US Treasuries visible in market pricing — reserve-demand question observable",
  },
  creditSpreadWidening: {
    watch: "IG or HY credit spreads widen beyond Q1 2026 levels",
    elevated: "sustained spread widening across multiple weeks indicating financial stress compounding trade shock",
    critical: "systemic liquidity stress or credit event requiring coordinated institutional response",
  },
  growthForecastRevision: {
    watch: "IMF or major institutional 2026 global growth forecast revised down by 0.3pp or more",
    elevated: "global growth consensus revised below 2.8% — approaching AoL downside scenario",
    critical: "global growth consensus revised below 2.5% or recession probability crosses 50% in institutional median",
  },
};

export function getYieldSeverity(
  yieldValue: number,
): "BELOW_WATCH" | "WATCH" | "ELEVATED" | "CRITICAL" {
  const t = GMI_ALERT_THRESHOLDS.us10yYieldSpike;
  if (yieldValue >= t.critical) return "CRITICAL";
  if (yieldValue >= t.elevated) return "ELEVATED";
  if (yieldValue >= t.watch) return "WATCH";
  return "BELOW_WATCH";
}
