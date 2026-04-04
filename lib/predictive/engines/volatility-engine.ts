// lib/predictive/engines/volatility-engine.ts
import { TimeSeriesPoint, RiskMetrics } from '../types';

export class VolatilityEngine {
  private static instance: VolatilityEngine | null = null;
  private readonly WINDOW_SIZE = 14; // Standard lookback for market volatility

  private constructor() {}

  static getInstance(): VolatilityEngine {
    if (!VolatilityEngine.instance) {
      VolatilityEngine.instance = new VolatilityEngine();
    }
    return VolatilityEngine.instance;
  }

  /**
   * Calculates Realized Volatility using log returns.
   * Essential for live market data to normalize scale-independent moves.
   */
  calculateRealizedVolatility(points: TimeSeriesPoint[]): number {
    const values = points.map(p => p.value);
    const returns: number[] = [];

    for (let i = 1; i < values.length; i++) {
      // Use log returns to handle market percentage shifts
      const logReturn = Math.log(values[i] / (values[i - 1] || 1));
      returns.push(logReturn);
    }

    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    
    // Annualized volatility (assuming daily data points)
    return Math.sqrt(variance * 252);
  }

  /**
   * Detects Regime Shifts (High vs Low Volatility states)
   * Returns a sensitivity multiplier for the ScenarioEngine
   */
  getMarketRegimeMultiplier(points: TimeSeriesPoint[]): number {
    const recent = points.slice(-this.WINDOW_SIZE);
    const historical = points.slice(0, -this.WINDOW_SIZE);

    const recentVol = this.calculateRealizedVolatility(recent);
    const histVol = this.calculateRealizedVolatility(historical);

    if (histVol === 0) return 1.0;
    
    // If recent volatility is 2x historical, we are in a "Shock Regime"
    const ratio = recentVol / histVol;
    return Math.max(0.5, Math.min(2.5, ratio));
  }

  /**
   * Generates a Volatility Surface for PDF Reporting
   */
  getVolatilityMetrics(points: TimeSeriesPoint[]): {
    currentVol: number;
    isHighVolatility: boolean;
    parkinsonVol: number; // High-Low range estimator
  } {
    const currentVol = this.calculateRealizedVolatility(points);
    
    return {
      currentVol,
      isHighVolatility: currentVol > 0.45, // Threshold for market instability
      parkinsonVol: currentVol * 0.811 // Simplified Parkinson estimator
    };
  }
}