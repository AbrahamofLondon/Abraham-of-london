// lib/predictive/services/executive-report-service.ts
import { ScenarioEngine } from '../engines/scenario-engine';
import { TimeSeriesEngine } from '../engines/time-series-engine';
import { db } from '@/lib/db';
import { 
  ExecutiveReport, 
  ReportMetadata, 
  TimeSeriesPoint 
} from '../types';

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

  /**
   * Generates a comprehensive executive report using live market data.
   */
  async generateMarketAnalysisReport(
    campaignId: string,
    horizon: number = 30
  ): Promise<ExecutiveReport> {
    // 1. Fetch live market data for the campaign
    const marketData = await db.marketData.findMany({
      where: { campaignId },
      orderBy: { timestamp: 'asc' },
    });

    if (!marketData || marketData.length < 14) {
      throw new Error(`[EXECUTIVE_REPORT_SERVICE_FAILURE] Insufficient market data for campaign ${campaignId}`);
    }

    const historicalPoints: TimeSeriesPoint[] = marketData.map(d => ({
      timestamp: d.timestamp,
      value: d.value
    }));

    // 2. Generate Baseline Forecast
    const baselineForecast = this.timeSeriesEngine.forecast(historicalPoints, horizon);

    // 3. Execute Volatility-Aware Monte Carlo Simulation
    // Now passing historicalPoints to allow ScenarioEngine to calculate market regime
    const monteCarloResults = this.scenarioEngine.monteCarloSimulation(
      baselineForecast,
      historicalPoints
    );

    // 4. Construct Final Report Object
    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      campaignId,
      horizon,
      confidenceScore: baselineForecast.rSquared, // Using R-Squared as a proxy for model reliability
    };

    return {
      metadata,
      baseline: baselineForecast,
      riskAnalysis: monteCarloResults.riskMetrics,
      projections: {
        optimistic: monteCarloResults.optimistic,
        pessimistic: monteCarloResults.pessimistic,
        median: monteCarloResults.median
      },
      distribution: Array.from(monteCarloResults.distribution.entries()).map(([bucket, probability]) => ({
        bucket,
        probability
      })),
      marketContext: {
        volatilityRegime: monteCarloResults.riskMetrics.standardDeviation > 15 ? 'High' : 'Stable',
        isAnomalous: Math.abs(monteCarloResults.riskMetrics.skewness) > 1
      }
    };
  }
}