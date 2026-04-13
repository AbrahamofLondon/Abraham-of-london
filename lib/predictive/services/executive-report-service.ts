// lib/predictive/services/executive-report-service.ts
// C10 DEBT: ExecutiveReport and ReportMetadata not exported from ../types.
// db.marketData model does not exist in schema.
// All DB calls and missing type references are stubbed below.

import { ScenarioEngine } from "../engines/scenario-engine";
import { TimeSeriesEngine } from "../engines/time-series-engine";

// C10: Define minimal local types until ../types exports them
export interface ReportMetadata {
  generatedAt: Date;
  campaignId: string;
  horizon: number;
  confidenceScore: number;
}

export interface ExecutiveReport {
  metadata: ReportMetadata;
  baseline: ReturnType<TimeSeriesEngine["forecast"]>;
  riskAnalysis: unknown;
  projections: {
    optimistic: unknown;
    pessimistic: unknown;
    median: unknown;
  };
  distribution: Array<{ bucket: string; probability: number }>;
  marketContext: {
    volatilityRegime: string;
    isAnomalous: boolean;
  };
}

interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export class ExecutiveReportService {
  private static instance: ExecutiveReportService | null = null;
  private scenarioEngine: ScenarioEngine;
  private timeSeriesEngine: TimeSeriesEngine;

  private constructor() {
    this.scenarioEngine = ScenarioEngine.getInstance();
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
  }

  static getInstance(): ExecutiveReportService {
    if (!ExecutiveReportService.instance) {
      ExecutiveReportService.instance = new ExecutiveReportService();
    }
    return ExecutiveReportService.instance;
  }

  async generateMarketAnalysisReport(
    campaignId: string,
    horizon: number = 30
  ): Promise<ExecutiveReport> {
    // STUB: db.marketData does not exist in schema (C10 debt)
    // Returns empty dataset until marketData model is added.
    const marketData: Array<{ timestamp: Date; value: number }> = [];

    if (!marketData || marketData.length < 14) {
      throw new Error(
        `[EXECUTIVE_REPORT_SERVICE_FAILURE] Insufficient market data for campaign ${campaignId}`
      );
    }

    const historicalPoints: TimeSeriesPoint[] = marketData.map((d) => ({
      timestamp: d.timestamp,
      value: d.value,
    }));

    const baselineForecast = this.timeSeriesEngine.forecast(
      historicalPoints,
      horizon
    );

    const monteCarloResults = this.scenarioEngine.monteCarloSimulation(
      baselineForecast,
      historicalPoints
    );

    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      campaignId,
      horizon,
      confidenceScore: baselineForecast.rSquared,
    };

    return {
      metadata,
      baseline: baselineForecast,
      riskAnalysis: monteCarloResults.riskMetrics,
      projections: {
        optimistic: monteCarloResults.optimistic,
        pessimistic: monteCarloResults.pessimistic,
        median: monteCarloResults.median,
      },
      distribution: Array.from(
        monteCarloResults.distribution.entries()
      ).map(([bucket, probability]) => ({ bucket, probability })),
      marketContext: {
        volatilityRegime:
          monteCarloResults.riskMetrics.standardDeviation > 15
            ? "High"
            : "Stable",
        isAnomalous: Math.abs(monteCarloResults.riskMetrics.skewness) > 1,
      },
    };
  }
}