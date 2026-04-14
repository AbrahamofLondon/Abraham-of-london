import { TimeSeriesEngine } from '../engines/time-series-engine';
import { ScenarioEngine } from '../engines/scenario-engine';
import { EarlyWarningEngine } from '../engines/early-warning-engine';
import { TimeSeriesPoint, PredictiveInsight, ForecastResult, ScenarioOutcome } from '../types';

export interface GenerateInsightOptions {
  horizon?: number;
  confidence?: number;
  includeScenarios?: boolean;
  includeRecommendations?: boolean;
}

export class PredictiveIntelligenceService {
  private static instance: PredictiveIntelligenceService | null = null;
  private timeSeriesEngine: TimeSeriesEngine;
  private scenarioEngine: ScenarioEngine;
  private earlyWarningEngine: EarlyWarningEngine;

  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
    this.scenarioEngine = ScenarioEngine.getInstance();
    this.earlyWarningEngine = EarlyWarningEngine.getInstance();
  }

  static getInstance(): PredictiveIntelligenceService {
    if (!PredictiveIntelligenceService.instance) {
      PredictiveIntelligenceService.instance = new PredictiveIntelligenceService();
    }
    return PredictiveIntelligenceService.instance;
  }

  async generateInsight(
    campaignId: string,
    historicalData: {
      resonance: TimeSeriesPoint[];
      dissonance: TimeSeriesPoint[];
      burnout: TimeSeriesPoint[];
      certainty: TimeSeriesPoint[];
    },
    currentMetrics: {
      resonance: number;
      dissonance: number;
      burnoutIndex: number;
      sovereignCertainty: number;
    },
    options: GenerateInsightOptions = {}
  ): Promise<PredictiveInsight> {
    const horizon = options.horizon || 90;
    const confidence = (options.confidence || 0.95) as any;

    const resonanceForecast = this.timeSeriesEngine.forecast(
      historicalData.resonance,
      horizon,
      confidence
    );

    const humanCapitalForecast = this.timeSeriesEngine.forecast(
      historicalData.burnout,
      horizon,
      confidence
    );

    const operationalForecast = this.timeSeriesEngine.forecast(
      historicalData.dissonance,
      horizon,
      confidence
    );

    const earlyWarnings = [];
    
    const resonanceWarning = this.earlyWarningEngine.detectSignals(
      historicalData.resonance,
      'resonance',
      currentMetrics.resonance
    );
    if (resonanceWarning) earlyWarnings.push(resonanceWarning);
    
    const burnoutWarning = this.earlyWarningEngine.detectSignals(
      historicalData.burnout,
      'burnout',
      currentMetrics.burnoutIndex
    );
    if (burnoutWarning) earlyWarnings.push(burnoutWarning);
    
    const dissonanceWarning = this.earlyWarningEngine.detectSignals(
      historicalData.dissonance,
      'dissonance',
      currentMetrics.dissonance
    );
    if (dissonanceWarning) earlyWarnings.push(dissonanceWarning);

    const recommendations = this.generateRecommendations(
      currentMetrics,
      resonanceForecast,
      earlyWarnings
    );

    let scenarios = null;
    if (options.includeScenarios) {
      const baselineForecast = resonanceForecast;
      const monteCarlo = this.scenarioEngine.monteCarloSimulation(
        baselineForecast,
        historicalData.resonance,
        1000
      );
      scenarios = {
        baseline: this.toScenarioOutcome(
          baselineForecast,
          humanCapitalForecast,
          currentMetrics,
          0.5
        ),
        optimistic: this.toScenarioOutcome(
          monteCarlo.optimistic,
          humanCapitalForecast,
          currentMetrics,
          0.25
        ),
        pessimistic: this.toScenarioOutcome(
          monteCarlo.pessimistic,
          humanCapitalForecast,
          currentMetrics,
          0.25
        )
      };
    }

    return {
      id: `pred_${campaignId}_${Date.now()}`,
      campaignId,
      generatedAt: new Date(),
      modelVersion: '1.0.0',
      validationMetrics: {
        mape: resonanceForecast.mape,
        rSquared: resonanceForecast.rSquared || 0.85,
        mae: resonanceForecast.mae || 0,
        rmse: resonanceForecast.rmse || 0
      },
      currentBaseline: currentMetrics,
      forecasts: {
        resonance: resonanceForecast,
        humanCapital: humanCapitalForecast,
        operationalEfficiency: operationalForecast
      },
      earlyWarnings,
      scenarios: scenarios || this.buildDefaultScenarios(
        resonanceForecast,
        humanCapitalForecast,
        currentMetrics
      ),
      recommendations
    };
  }

  private buildDefaultScenarios(
    resonanceForecast: ForecastResult,
    humanCapitalForecast: ForecastResult,
    currentMetrics: {
      resonance: number;
      dissonance: number;
      burnoutIndex: number;
      sovereignCertainty: number;
    }
  ): PredictiveInsight["scenarios"] {
    return {
      baseline: this.toScenarioOutcome(resonanceForecast, humanCapitalForecast, currentMetrics, 0.5),
      optimistic: this.toScenarioOutcome(resonanceForecast, humanCapitalForecast, currentMetrics, 0.25),
      pessimistic: this.toScenarioOutcome(resonanceForecast, humanCapitalForecast, currentMetrics, 0.25),
    };
  }

  private toScenarioOutcome(
    resonanceTrajectory: ForecastResult,
    humanCapitalTrajectory: ForecastResult,
    currentMetrics: {
      resonance: number;
      dissonance: number;
      burnoutIndex: number;
      sovereignCertainty: number;
    },
    probability: number
  ): ScenarioOutcome {
    const costAvoidance = Math.max(0, Math.round((100 - currentMetrics.burnoutIndex) * 500));
    const revenueProtection = Math.max(0, Math.round(currentMetrics.sovereignCertainty * 1000));
    const netPresentValue = revenueProtection - costAvoidance;
    const internalRateOfReturn = revenueProtection === 0 ? 0 : netPresentValue / revenueProtection;

    return {
      resonanceTrajectory,
      humanCapitalTrajectory,
      financialImpact: {
        costAvoidance,
        revenueProtection,
        netPresentValue,
        internalRateOfReturn,
      },
      probability,
      riskAdjustedValue: netPresentValue * probability,
    };
  }

  private generateRecommendations(
    currentMetrics: any,
    forecast: ForecastResult,
    warnings: any[]
  ): any[] {
    const recommendations = [];

    if (currentMetrics.resonance < 60) {
      recommendations.push({
        id: `rec_critical_${Date.now()}`,
        priority: 10,
        action: 'Immediate Sovereign Intervention Required',
        domain: 'Strategic Alignment',
        expectedImpact: {
          resonanceGain: 25,
          costSavings: 50000,
          timelineDays: 14,
          probability: 0.7
        },
        implementationComplexity: 'high',
        requiredResources: ['executive_team', 'governance_board'],
        dependencies: ['mandate_approval'],
        riskFactors: ['resistance_to_change', 'resource_constraints'],
        alternatives: ['phased_intervention', 'targeted_correction'],
        roi: 2.5
      });
    } else if (currentMetrics.resonance < 75) {
      recommendations.push({
        id: `rec_warning_${Date.now()}`,
        priority: 7,
        action: 'Strategic Realignment Protocol',
        domain: 'Strategic Alignment',
        expectedImpact: {
          resonanceGain: 15,
          costSavings: 25000,
          timelineDays: 21,
          probability: 0.75
        },
        implementationComplexity: 'medium',
        requiredResources: ['strategy_team'],
        dependencies: [],
        riskFactors: ['execution_delay'],
        alternatives: ['monitor_and_adjust'],
        roi: 1.8
      });
    }

    if (currentMetrics.burnoutIndex > 70) {
      recommendations.push({
        id: `rec_burnout_${Date.now()}`,
        priority: 9,
        action: 'Human Capital Stabilization Protocol',
        domain: 'Human Capital',
        expectedImpact: {
          resonanceGain: 15,
          costSavings: 75000,
          timelineDays: 21,
          probability: 0.8
        },
        implementationComplexity: 'medium',
        requiredResources: ['hr_team', 'leadership'],
        dependencies: ['budget_approval'],
        riskFactors: ['talent_attrition', 'morale_impact'],
        alternatives: ['wellness_program', 'workload_redistribution'],
        roi: 3.2
      });
    }

    if (forecast.trend === 'decreasing') {
      recommendations.push({
        id: `rec_trend_${Date.now()}`,
        priority: 6,
        action: 'Trend Reversal Initiative',
        domain: 'Operational Excellence',
        expectedImpact: {
          resonanceGain: 10,
          costSavings: 25000,
          timelineDays: 30,
          probability: 0.65
        },
        implementationComplexity: 'low',
        requiredResources: ['operations_team'],
        dependencies: [],
        riskFactors: ['execution_delay'],
        alternatives: ['monitor_and_wait'],
        roi: 1.8
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }
}
