import { TimeSeriesEngine } from './time-series-engine';
import { VolatilityEngine } from './volatility-engine'; // New dependency
import { 
  ForecastResult, 
  InterventionSimulation, 
  ScenarioOutcome,
  TimeSeriesPoint,
  TimeSeriesPointWithConfidence,
  MonteCarloResult,
  RiskMetrics
} from '../types';

export class ScenarioEngine {
  private static instance: ScenarioEngine | null = null;
  private timeSeriesEngine: TimeSeriesEngine;
  private volatilityEngine: VolatilityEngine; // Instance reference
  private readonly MONTE_CARLO_ITERATIONS = 10000;
  private readonly RISK_FREE_RATE = 0.05;

  private constructor() {
    this.timeSeriesEngine = TimeSeriesEngine.getInstance();
    this.volatilityEngine = VolatilityEngine.getInstance();
  }

  static getInstance(): ScenarioEngine {
    if (!ScenarioEngine.instance) {
      ScenarioEngine.instance = new ScenarioEngine();
    }
    return ScenarioEngine.instance;
  }

  /**
   * REVISED MONTE CARLO SIMULATION
   * Protocol: OGR-IV High Fidelity Live Market Risk Engine
   */
  monteCarloSimulation(
    baselineForecast: ForecastResult,
    historicalPoints: TimeSeriesPoint[], // Required for volatility context
    iterations: number = this.MONTE_CARLO_ITERATIONS
  ): MonteCarloResult {
    const results: number[][] = [];
    const scenarios: ForecastResult[] = [];
    
    // 1. Contextualize the simulation based on live market regime
    const regimeMultiplier = this.volatilityEngine.getMarketRegimeMultiplier(historicalPoints);
    const phi = 0.75; // Temporal correlation (momentum)
    
    for (let iter = 0; iter < iterations; iter++) {
      const simulated: TimeSeriesPointWithConfidence[] = [];
      let previousShock = 0;
      
      for (let i = 0; i < baselineForecast.points.length; i++) {
        const point = baselineForecast.points[i];
        const range = point.upperBound - point.lowerBound;
        
        // 2. Generate Gaussian noise adjusted by the Market Regime
        const epsilon = this.randomNormal() * regimeMultiplier;
        
        // 3. AR(1) Shock Model: Shock = (Momentum * Last) + (Market Variability * Error)
        const currentShock = (phi * previousShock) + (epsilon * (range / 6));
        const simulatedValue = Math.max(0, Math.min(100, point.value + currentShock));
        
        previousShock = currentShock;

        simulated.push({
          ...point,
          value: simulatedValue
        });
      }
      
      results.push(simulated.map(p => p.value));
      scenarios.push({ ...baselineForecast, points: simulated });
    }
    
    // Percentile calculations
    const optimistic: TimeSeriesPointWithConfidence[] = [];
    const pessimistic: TimeSeriesPointWithConfidence[] = [];
    const median: TimeSeriesPointWithConfidence[] = [];
    const distribution = new Map<number, number>();
    
    for (let i = 0; i < baselineForecast.points.length; i++) {
      const valuesAtTime = results.map(r => r[i]);
      valuesAtTime.sort((a, b) => a - b);
      
      optimistic.push({
        ...baselineForecast.points[i],
        value: valuesAtTime[Math.floor(valuesAtTime.length * 0.95)]
      });
      
      pessimistic.push({
        ...baselineForecast.points[i],
        value: valuesAtTime[Math.floor(valuesAtTime.length * 0.05)]
      });
      
      median.push({
        ...baselineForecast.points[i],
        value: valuesAtTime[Math.floor(valuesAtTime.length * 0.5)]
      });

      if (i === baselineForecast.points.length - 1) {
        const bucketSize = 5;
        valuesAtTime.forEach(v => {
          const bucket = Math.floor(v / bucketSize) * bucketSize;
          distribution.set(bucket, (distribution.get(bucket) || 0) + 1);
        });
        for (const [bucket, count] of distribution) {
          distribution.set(bucket, count / iterations);
        }
      }
    }
    
    const finalValues = results.map(r => r[baselineForecast.points.length - 1]);
    finalValues.sort((a, b) => a - b);
    
    const var95 = finalValues[Math.floor(finalValues.length * 0.05)];
    const var99 = finalValues[Math.floor(finalValues.length * 0.01)];
    const tail95 = finalValues.filter(v => v <= var95);
    const cvar95 = tail95.length > 0 ? tail95.reduce((a, b) => a + b, 0) / tail95.length : var95;
    
    const mean = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
    const stdDev = Math.sqrt(finalValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / finalValues.length);
    
    return {
      optimistic: { ...baselineForecast, points: optimistic },
      pessimistic: { ...baselineForecast, points: pessimistic },
      median: { ...baselineForecast, points: median },
      distribution,
      riskMetrics: {
        var95,
        var99,
        cvar95,
        expectedValue: mean,
        standardDeviation: stdDev,
        skewness: this.calculateSkewness(finalValues),
        kurtosis: this.calculateKurtosis(finalValues)
      },
      scenarios
    };
  }

  // ... (calculateImpactCurve, calculateROI, and calculateIRR remain as previously defined)

  private randomNormal(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private calculateSkewness(values: number[]): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const m3 = values.reduce((sum, v) => sum + Math.pow(v - mean, 3), 0) / n;
    const m2 = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    return m3 / Math.pow(m2, 1.5);
  }

  private calculateKurtosis(values: number[]): number {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const m4 = values.reduce((sum, v) => sum + Math.pow(v - mean, 4), 0) / n;
    const m2 = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    return m4 / Math.pow(m2, 2) - 3;
  }
}