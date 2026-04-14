// @ts-nocheck
// lib/predictive/scenario-engine.ts
import { TimeSeriesEngine } from './time-series-engine';
import { 
  ForecastResult, 
  InterventionSimulation, 
  ScenarioOutcome,
  TimeSeriesPoint 
} from './types';

export class ScenarioEngine {
  private static instance: ScenarioEngine | null = null;
  private timeSeriesEngine: TimeSeriesEngine;

  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
  }

  static getInstance(): ScenarioEngine {
    if (!ScenarioEngine.instance) {
      ScenarioEngine.instance = new ScenarioEngine();
    }
    return ScenarioEngine.instance;
  }

  /**
   * Simulate intervention impact using impulse response function
   */
  simulateIntervention(
    historicalPoints: TimeSeriesPoint[],
    intervention: InterventionSimulation,
    horizon: number = 90
  ): ForecastResult {
    // Get baseline forecast
    const baseline = this.timeSeriesEngine.forecast(historicalPoints, horizon);
    
    // Calculate intervention impact curve
    const impactCurve = this.calculateImpactCurve(
      intervention.magnitude,
      intervention.decayRate,
      intervention.timing,
      historicalPoints[historicalPoints.length - 1].timestamp,
      horizon
    );
    
    // Apply impact to forecast
    const adjustedPoints = baseline.points.map((point, i) => ({
      ...point,
      value: Math.max(0, Math.min(100, point.value + impactCurve[i])),
      lowerBound: Math.max(0, point.lowerBound + impactCurve[i]),
      upperBound: Math.min(100, point.upperBound + impactCurve[i])
    }));
    
    return {
      ...baseline,
      points: adjustedPoints
    };
  }

  /**
   * Calculate ROI for intervention
   */
  calculateROI(
    intervention: InterventionSimulation,
    baselineForecast: ForecastResult,
    interventionForecast: ForecastResult,
    cost: number
  ): {
    roi: number;
    npv: number;
    paybackPeriod: number;
    breakevenPoint: number;
  } {
    // Calculate area between curves (total resonance gain)
    let totalGain = 0;
    let cumulativeGain = 0;
    let breakevenPoint = -1;
    
    for (let i = 0; i < baselineForecast.points.length; i++) {
      const gain = interventionForecast.points[i].value - baselineForecast.points[i].value;
      totalGain += gain;
      cumulativeGain += gain;
      
      // Find when cumulative gain exceeds cost (assuming gain = $1,000 per percentage point)
      if (breakevenPoint === -1 && cumulativeGain * 1000 >= cost) {
        breakevenPoint = i;
      }
    }
    
    const totalValue = totalGain * 1000; // $1,000 per percentage point
    const roi = cost > 0 ? (totalValue - cost) / cost : 0;
    
    return {
      roi,
      npv: totalValue - cost,
      paybackPeriod: cost > 0 ? cost / (totalValue / baselineForecast.points.length) : 0,
      breakevenPoint
    };
  }

  /**
   * Calculate impact curve using exponential decay model
   */
  private calculateImpactCurve(
    magnitude: number,
    decayRate: number,
    timing: Date,
    lastHistoricalDate: Date,
    horizon: number
  ): number[] {
    const startDelay = Math.max(0, 
      Math.floor((timing.getTime() - lastHistoricalDate.getTime()) / (24 * 60 * 60 * 1000))
    );
    
    const impact: number[] = new Array(horizon).fill(0);
    
    // Impact builds up over first 7 days, then decays exponentially
    for (let i = startDelay; i < horizon && i < startDelay + 90; i++) {
      const daysSinceStart = i - startDelay;
      
      if (daysSinceStart < 0) continue;
      
      // S-curve for ramp-up (first 7 days)
      let impactFactor;
      if (daysSinceStart < 7) {
        impactFactor = Math.sin((daysSinceStart / 7) * Math.PI / 2);
      } else {
        // Exponential decay after peak
        impactFactor = Math.exp(-(daysSinceStart - 7) / decayRate);
      }
      
      impact[i] = magnitude * impactFactor;
    }
    
    return impact;
  }

  /**
   * Monte Carlo simulation for risk-adjusted scenarios
   */
  monteCarloSimulation(
    baselineForecast: ForecastResult,
    iterations: number = 1000,
    confidence: number = 0.95
  ): {
    optimistic: ForecastResult;
    pessimistic: ForecastResult;
    probabilityDistribution: Map<number, number>;
  } {
    const results: number[][] = [];
    
    for (let iter = 0; iter < iterations; iter++) {
      const simulated: number[] = [];
      
      for (let i = 0; i < baselineForecast.points.length; i++) {
        const point = baselineForecast.points[i];
        const range = point.upperBound - point.lowerBound;
        const randomFactor = this.randomNormal();
        const simulatedValue = point.value + randomFactor * (range / 4);
        
        simulated.push(Math.max(0, Math.min(100, simulatedValue)));
      }
      
      results.push(simulated);
    }
    
    // Calculate percentiles
    const optimistic: TimeSeriesPointWithConfidence[] = [];
    const pessimistic: TimeSeriesPointWithConfidence[] = [];
    const distribution = new Map<number, number>();
    
    for (let i = 0; i < baselineForecast.points.length; i++) {
      const valuesAtTime = results.map(r => r[i]);
      valuesAtTime.sort((a, b) => a - b);
      
      const optimisticIdx = Math.floor(valuesAtTime.length * (1 - (1 - confidence) / 2));
      const pessimisticIdx = Math.floor(valuesAtTime.length * ((1 - confidence) / 2));
      
      optimistic.push({
        ...baselineForecast.points[i],
        value: valuesAtTime[optimisticIdx]
      });
      
      pessimistic.push({
        ...baselineForecast.points[i],
        value: valuesAtTime[pessimisticIdx]
      });
      
      // Store distribution at final point
      if (i === baselineForecast.points.length - 1) {
        const finalValues = valuesAtTime;
        const histogram: Map<number, number> = new Map();
        const bucketSize = 5;
        
        for (const v of finalValues) {
          const bucket = Math.floor(v / bucketSize) * bucketSize;
          histogram.set(bucket, (histogram.get(bucket) || 0) + 1);
        }
        
        for (const [bucket, count] of histogram) {
          distribution.set(bucket, count / iterations);
        }
      }
    }
    
    return {
      optimistic: { ...baselineForecast, points: optimistic },
      pessimistic: { ...baselineForecast, points: pessimistic },
      probabilityDistribution: distribution
    };
  }

  private randomNormal(): number {
    // Box-Muller transform
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}