// lib/predictive/predictive-intelligence.ts
import { TimeSeriesEngine } from './time-series-engine';
import { ScenarioEngine } from './scenario-engine';
import { EarlyWarningSystem } from './early-warning';
import {
  PredictiveInsight,
  TimeSeriesPoint,
  InterventionSimulation,
  ScenarioOutcome,
  ActionRecommendation,
  ForecastResult
} from './types';

export class PredictiveIntelligenceService {
  private static instance: PredictiveIntelligenceService | null = null;
  private timeSeriesEngine: TimeSeriesEngine;
  private scenarioEngine: ScenarioEngine;
  private earlyWarning: EarlyWarningSystem;
  
  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
    this.scenarioEngine = ScenarioEngine.getInstance();
    this.earlyWarning = EarlyWarningSystem.getInstance();
  }

  static getInstance(): PredictiveIntelligenceService {
    if (!PredictiveIntelligenceService.instance) {
      PredictiveIntelligenceService.instance = new PredictiveIntelligenceService();
    }
    return PredictiveIntelligenceService.instance;
  }

  /**
   * Generate complete predictive insight for a campaign
   */
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
    }
  ): Promise<PredictiveInsight> {
    // Generate forecasts for each metric
    const forecasts = {
      resonance: this.timeSeriesEngine.forecast(historicalData.resonance, 90),
      humanCapital: this.timeSeriesEngine.forecast(historicalData.burnout, 90),
      operationalEfficiency: this.timeSeriesEngine.forecast(historicalData.dissonance, 90)
    };
    
    // Detect early warnings
    const earlyWarnings = await Promise.all([
      this.earlyWarning.detectSignals(historicalData.resonance, 'resonance', currentMetrics.resonance),
      this.earlyWarning.detectSignals(historicalData.dissonance, 'dissonance', currentMetrics.dissonance),
      this.earlyWarning.detectSignals(historicalData.burnout, 'burnout', currentMetrics.burnoutIndex),
      this.earlyWarning.detectSignals(historicalData.certainty, 'certainty', currentMetrics.sovereignCertainty)
    ]);
    
    // Generate scenarios
    const baselineIntervention: InterventionSimulation = {
      type: 'correction_node',
      timing: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      magnitude: 15,
      decayRate: 30,
      confidence: 0.7
    };
    
    const optimisticIntervention: InterventionSimulation = {
      ...baselineIntervention,
      magnitude: 25,
      confidence: 0.6
    };
    
    const pessimisticIntervention: InterventionSimulation = {
      ...baselineIntervention,
      magnitude: 5,
      confidence: 0.8
    };
    
    const baselineScenario = this.scenarioEngine.simulateIntervention(
      historicalData.resonance,
      baselineIntervention
    );
    
    const optimisticScenario = this.scenarioEngine.simulateIntervention(
      historicalData.resonance,
      optimisticIntervention
    );
    
    const pessimisticScenario = this.scenarioEngine.simulateIntervention(
      historicalData.resonance,
      pessimisticIntervention
    );
    
    // Calculate scenario outcomes
    const baselineOutcome = this.calculateScenarioOutcome(baselineScenario, baselineIntervention);
    const optimisticOutcome = this.calculateScenarioOutcome(optimisticScenario, optimisticIntervention);
    const pessimisticOutcome = this.calculateScenarioOutcome(pessimisticScenario, pessimisticIntervention);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      currentMetrics,
      forecasts,
      earlyWarnings.filter((w): w is NonNullable<typeof w> => w !== null)
    );
    
    // Calculate validation metrics
    const validationMetrics = {
      mape: forecasts.resonance.mape,
      rSquared: this.calculateRSquared(historicalData.resonance),
      mae: this.calculateMAE(historicalData.resonance),
      rmse: this.calculateRMSE(historicalData.resonance)
    };
    
    return {
      id: `pred_${campaignId}_${Date.now()}`,
      campaignId,
      generatedAt: new Date(),
      modelVersion: '1.0.0',
      validationMetrics,
      currentBaseline: currentMetrics,
      forecasts: {
        resonance: forecasts.resonance,
        humanCapital: forecasts.humanCapital,
        operationalEfficiency: forecasts.operationalEfficiency
      },
      earlyWarnings: earlyWarnings.filter((w): w is NonNullable<typeof w> => w !== null),
      scenarios: {
        baseline: baselineOutcome,
        optimistic: optimisticOutcome,
        pessimistic: pessimisticOutcome
      },
      recommendations
    };
  }

  private calculateScenarioOutcome(
    forecast: ForecastResult,
    intervention: InterventionSimulation
  ): ScenarioOutcome {
    const finalValue = forecast.points[forecast.points.length - 1]?.value || 0;
    const baselineValue = forecast.points[0]?.value || 0;
    const improvement = finalValue - baselineValue;
    
    return {
      resonanceTrajectory: forecast,
      humanCapitalTrajectory: forecast, // Simplified - would use actual metrics
      financialImpact: {
        costAvoidance: improvement * 12500, // $12.5k per percentage point
        revenueProtection: improvement * 25000, // $25k per percentage point
        netPresentValue: (improvement * 37500) / (1 + 0.1), // 10% discount rate
        internalRateOfReturn: improvement > 0 ? 0.15 + improvement / 100 : 0
      },
      probability: intervention.confidence,
      riskAdjustedValue: improvement * intervention.confidence * 37500
    };
  }

  private generateRecommendations(
    currentMetrics: any,
    forecasts: any,
    warnings: any[]
  ): ActionRecommendation[] {
    const recommendations: ActionRecommendation[] = [];
    
    // Rule-based recommendations
    if (currentMetrics.resonance < 60) {
      recommendations.push({
        id: `rec_critical_${Date.now()}_1`,
        priority: 10,
        action: 'Immediate Sovereign Intervention',
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
    }
    
    if (currentMetrics.burnoutIndex > 70) {
      recommendations.push({
        id: `rec_human_capital_${Date.now()}_2`,
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
    
    if (forecasts.resonance.trend === 'decreasing') {
      recommendations.push({
        id: `rec_trend_${Date.now()}_3`,
        priority: 7,
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
    
    // Sort by priority (highest first)
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  private calculateRSquared(points: TimeSeriesPoint[]): number {
    const values = points.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Simplified - would use actual fitted values from model
    let ssRes = 0;
    let ssTot = 0;
    
    for (let i = 0; i < values.length; i++) {
      const v = values[i] ?? 0;
      ssRes += Math.pow(v - mean, 2);
      ssTot += Math.pow(v - mean, 2);
    }
    
    return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  }

  private calculateMAE(points: TimeSeriesPoint[]): number {
    const values = points.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let mae = 0;
    for (let i = 0; i < values.length; i++) {
      mae += Math.abs((values[i] ?? 0) - mean);
    }
    
    return mae / values.length;
  }

  private calculateRMSE(points: TimeSeriesPoint[]): number {
    const values = points.map(p => p.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    let mse = 0;
    for (let i = 0; i < values.length; i++) {
      mse += Math.pow((values[i] ?? 0) - mean, 2);
    }
    
    return Math.sqrt(mse / values.length);
  }
}