// lib/predictive/types.ts
export type ConfidenceLevel = 0.80 | 0.85 | 0.90 | 0.95 | 0.99;
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type Severity = 'info' | 'warning' | 'critical';
export type Complexity = 'low' | 'medium' | 'high';

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
}

export interface TimeSeriesPointWithConfidence extends TimeSeriesPoint {
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  trendSlope: number;
  seasonalPatterns: Map<string, number[]>;
  stdDev: number;
  seasonalityStrength?: number;
}

export interface ForecastResult {
  points: TimeSeriesPointWithConfidence[];
  trend: TrendDirection;
  volatility: number;
  seasonalityStrength: number;
  mape: number;
  mae?: number;
  rmse?: number;
  rSquared?: number;
}

export interface InterventionSimulation {
  type: 'correction_node' | 'mandate' | 'structural_change' | 'leadership_action';
  timing: Date;
  magnitude: number;
  decayRate: number;
  confidence: number;
}

export interface ScenarioOutcome {
  resonanceTrajectory: ForecastResult;
  humanCapitalTrajectory: ForecastResult;
  financialImpact: {
    costAvoidance: number;
    revenueProtection: number;
    netPresentValue: number;
    internalRateOfReturn: number;
  };
  probability: number;
  riskAdjustedValue: number;
}

export interface RiskMetrics {
  var95: number;
  var99: number;
  cvar95: number;
  expectedValue: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
}

export interface MonteCarloResult {
  optimistic: ForecastResult;
  pessimistic: ForecastResult;
  median: ForecastResult;
  distribution: Map<number, number>;
  riskMetrics: RiskMetrics;
  scenarios: ForecastResult[];
}

export interface PredictiveInsight {
  id: string;
  campaignId: string;
  generatedAt: Date;
  modelVersion: string;
  validationMetrics: {
    mape: number;
    rSquared: number;
    mae: number;
    rmse: number;
  };
  currentBaseline: {
    resonance: number;
    dissonance: number;
    burnoutIndex: number;
    sovereignCertainty: number;
  };
  forecasts: {
    resonance: ForecastResult;
    humanCapital: ForecastResult;
    operationalEfficiency: ForecastResult;
  };
  earlyWarnings: EarlyWarningSignal[];
  scenarios: {
    baseline: ScenarioOutcome;
    optimistic: ScenarioOutcome;
    pessimistic: ScenarioOutcome;
  };
  recommendations: ActionRecommendation[];
}

export interface EarlyWarningSignal {
  id: string;
  metric: string;
  currentValue: number;
  threshold: number;
  projectedDaysToThreshold: number;
  severity: Severity;
  confidence: number;
  leadingIndicators: string[];
  historicalAccuracy: number;
  trend?: TrendDirection;
  acceleration?: number;
}

export interface ThresholdConfig {
  warning: number;
  critical: number;
  direction: 'above' | 'below';
}

export interface LeadingIndicator {
  metric: string;
  weight: number;
  lag: number;
}

export interface ActionRecommendation {
  id: string;
  priority: number;
  action: string;
  domain: string;
  expectedImpact: {
    resonanceGain: number;
    costSavings: number;
    timelineDays: number;
    probability: number;
  };
  implementationComplexity: Complexity;
  requiredResources: string[];
  dependencies: string[];
  riskFactors: string[];
  alternatives: string[];
  roi: number;
}