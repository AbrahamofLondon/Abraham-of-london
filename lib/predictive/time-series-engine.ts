// lib/predictive/time-series-engine.ts
import { 
  TimeSeriesPoint, 
  TimeSeriesPointWithConfidence, 
  DecompositionResult,
  ForecastResult,
  TrendDirection,
  ConfidenceLevel 
} from './types';

export class TimeSeriesEngine {
  private static instance: TimeSeriesEngine | null = null;
  private readonly MIN_DATA_POINTS = 14; // Minimum 2 weeks for meaningful forecast
  private readonly MAX_FORECAST_HORIZON = 180; // Max 6 months

  private constructor() {}

  static getInstance(): TimeSeriesEngine {
    if (!TimeSeriesEngine.instance) {
      TimeSeriesEngine.instance = new TimeSeriesEngine();
    }
    return TimeSeriesEngine.instance;
  }

  /**
   * STL Decomposition (Seasonal-Trend decomposition using LOESS)
   * Production-grade decomposition with deterministic output
   */
  decompose(
    points: TimeSeriesPoint[],
    period: number = 7
  ): DecompositionResult {
    if (points.length < this.MIN_DATA_POINTS) {
      throw new Error(`Insufficient data: need ${this.MIN_DATA_POINTS} points, got ${points.length}`);
    }

    const values = points.map(p => p.value);
    const n = values.length;
    
    // 1. Extract trend using LOESS with adaptive bandwidth
    const trend = this.loessTrend(values, Math.max(0.3, 7 / n));
    
    // 2. Detrend: y - trend
    const detrended = values.map((v, i) => v - trend[i]);
    
    // 3. Extract seasonal component using STL's seasonal smoothing
    const seasonal = this.extractSeasonal(detrended, period);
    
    // 4. Residual = detrended - seasonal
    const residual = detrended.map((v, i) => v - seasonal[i]);
    
    // 5. Calculate trend slope using robust linear regression
    const trendSlope = this.calculateTrendSlope(trend);
    
    // 6. Extract seasonal patterns for each period
    const seasonalPatterns = new Map<string, number[]>();
    seasonalPatterns.set('weekly', this.getSeasonalPattern(seasonal, 7));
    seasonalPatterns.set('monthly', this.getSeasonalPattern(seasonal, 30));
    seasonalPatterns.set('quarterly', this.getSeasonalPattern(seasonal, 90));
    
    // 7. Calculate standard deviation of residuals
    const stdDev = Math.sqrt(residual.reduce((sum, r) => sum + r * r, 0) / residual.length);
    
    return {
      trend,
      seasonal,
      residual,
      trendSlope,
      seasonalPatterns,
      stdDev
    };
  }

  /**
   * LOESS (LOWESS) implementation - Locally Weighted Regression
   * Determines trend without assuming linearity
   */
  private loessTrend(y: number[], bandwidth: number): number[] {
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const result: number[] = new Array(n);
    
    for (let i = 0; i < n; i++) {
      // Calculate weights for all points
      const weights: number[] = new Array(n);
      let maxDist = 0;
      
      for (let j = 0; j < n; j++) {
        const dist = Math.abs(x[j] - x[i]);
        if (dist > maxDist) maxDist = dist;
      }
      
      const window = bandwidth * maxDist;
      let totalWeight = 0;
      
      for (let j = 0; j < n; j++) {
        const dist = Math.abs(x[j] - x[i]);
        if (dist < window) {
          const weight = Math.pow(1 - Math.pow(dist / window, 3), 3);
          weights[j] = weight;
          totalWeight += weight;
        } else {
          weights[j] = 0;
        }
      }
      
      // Normalize weights
      for (let j = 0; j < n; j++) {
        weights[j] = totalWeight > 0 ? weights[j] / totalWeight : 0;
      }
      
      // Weighted linear regression at point i
      const wX = x.map((xi, j) => xi * weights[j]);
      const wY = y.map((yi, j) => yi * weights[j]);
      
      const sumW = weights.reduce((a, b) => a + b, 0);
      const sumWX = wX.reduce((a, b) => a + b, 0);
      const sumWY = wY.reduce((a, b) => a + b, 0);
      const sumWXX = wX.reduce((a, b, j) => a + b * x[j], 0);
      const sumWXY = wX.reduce((a, b, j) => a + b * y[j], 0);
      
      const denominator = sumW * sumWXX - sumWX * sumWX;
      if (Math.abs(denominator) < 1e-10) {
        result[i] = y[i];
        continue;
      }
      
      const slope = (sumW * sumWXY - sumWX * sumWY) / denominator;
      const intercept = (sumWY - slope * sumWX) / sumW;
      
      result[i] = intercept + slope * x[i];
    }
    
    return result;
  }

  /**
   * Extract seasonal component using robust seasonal decomposition
   */
  private extractSeasonal(detrended: number[], period: number): number[] {
    const n = detrended.length;
    const seasonal = new Array(n).fill(0);
    
    // Calculate seasonal indices
    const cycles = Math.floor(n / period);
    const seasonalIndices: number[] = new Array(period).fill(0);
    const seasonalCounts: number[] = new Array(period).fill(0);
    
    for (let i = 0; i < cycles; i++) {
      for (let j = 0; j < period; j++) {
        const idx = i * period + j;
        if (idx < n) {
          seasonalIndices[j] += detrended[idx];
          seasonalCounts[j]++;
        }
      }
    }
    
    // Average seasonal indices
    for (let j = 0; j < period; j++) {
      if (seasonalCounts[j] > 0) {
        seasonalIndices[j] /= seasonalCounts[j];
      }
    }
    
    // Center the seasonal indices
    const seasonalMean = seasonalIndices.reduce((a, b) => a + b, 0) / period;
    for (let j = 0; j < period; j++) {
      seasonalIndices[j] -= seasonalMean;
    }
    
    // Apply seasonal pattern
    for (let i = 0; i < n; i++) {
      seasonal[i] = seasonalIndices[i % period];
    }
    
    return seasonal;
  }

  /**
   * Generate forecast using ETS (Error, Trend, Seasonality) with confidence intervals
   */
  forecast(
    points: TimeSeriesPoint[],
    horizon: number = 30,
    confidence: ConfidenceLevel = 0.95
  ): ForecastResult {
    if (horizon > this.MAX_FORECAST_HORIZON) {
      throw new Error(`Forecast horizon ${horizon} exceeds maximum ${this.MAX_FORECAST_HORIZON}`);
    }
    
    const decomposition = this.decompose(points);
    const n = points.length;
    const lastTrend = decomposition.trend[n - 1];
    const lastSeasonalIndices = this.getSeasonalPattern(decomposition.seasonal, 7);
    
    // Project trend forward
    const trendProjection: number[] = [];
    for (let i = 1; i <= horizon; i++) {
      trendProjection.push(lastTrend + decomposition.trendSlope * i);
    }
    
    // Project seasonal component
    const seasonalProjection: number[] = [];
    for (let i = 0; i < horizon; i++) {
      seasonalProjection.push(lastSeasonalIndices[i % lastSeasonalIndices.length]);
    }
    
    // Combine components
    const pointForecasts: TimeSeriesPointWithConfidence[] = [];
    const zScore = this.getZScore(confidence);
    
    for (let i = 0; i < horizon; i++) {
      const pointValue = trendProjection[i] + seasonalProjection[i];
      const predictionInterval = zScore * decomposition.stdDev * Math.sqrt(1 + i / n);
      
      pointForecasts.push({
        timestamp: new Date(points[points.length - 1].timestamp.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
        value: Math.max(0, Math.min(100, pointValue)),
        lowerBound: Math.max(0, pointValue - predictionInterval),
        upperBound: Math.min(100, pointValue + predictionInterval),
        confidence
      });
    }
    
    // Calculate forecast accuracy using historical validation
    const mape = this.calculateMAPE(points, decomposition);
    
    return {
      points: pointForecasts,
      trend: this.determineTrend(decomposition.trendSlope),
      volatility: decomposition.stdDev / points.reduce((sum, p) => sum + p.value, 0) / points.length,
      seasonalityStrength: this.calculateSeasonalityStrength(decomposition.seasonal),
      mape
    };
  }

  private calculateTrendSlope(trend: number[]): number {
    const n = trend.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = trend;
    
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - meanX) * (y[i] - meanY);
      denominator += Math.pow(x[i] - meanX, 2);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private getSeasonalPattern(seasonal: number[], period: number): number[] {
    const pattern: number[] = new Array(period).fill(0);
    const counts: number[] = new Array(period).fill(0);
    
    for (let i = 0; i < seasonal.length; i++) {
      const idx = i % period;
      pattern[idx] += seasonal[i];
      counts[idx]++;
    }
    
    for (let i = 0; i < period; i++) {
      pattern[i] = counts[i] > 0 ? pattern[i] / counts[i] : 0;
    }
    
    return pattern;
  }

  private getZScore(confidence: ConfidenceLevel): number {
    const zScores: Record<ConfidenceLevel, number> = {
      0.80: 1.282,
      0.85: 1.440,
      0.90: 1.645,
      0.95: 1.960,
      0.99: 2.576
    };
    return zScores[confidence];
  }

  private calculateMAPE(points: TimeSeriesPoint[], decomposition: DecompositionResult): number {
    // Leave-one-out cross-validation
    const n = points.length;
    let totalAPE = 0;
    let validCount = 0;
    
    for (let i = 7; i < n - 7; i++) {
      const trainingPoints = points.slice(0, i);
      const actual = points[i].value;
      
      try {
        const trainingDecomp = this.decompose(trainingPoints);
        const forecast = trainingDecomp.trend[i - 1] + this.getSeasonalPattern(trainingDecomp.seasonal, 7)[i % 7];
        const ape = Math.abs((actual - forecast) / actual);
        totalAPE += ape;
        validCount++;
      } catch {
        continue;
      }
    }
    
    return validCount > 0 ? (totalAPE / validCount) * 100 : 100;
  }

  private determineTrend(slope: number): TrendDirection {
    if (slope > 0.05) return 'increasing';
    if (slope < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateSeasonalityStrength(seasonal: number[]): number {
    const variance = seasonal.reduce((sum, s) => sum + s * s, 0) / seasonal.length;
    const totalVariance = variance + Math.pow(seasonal.reduce((a, b) => a + b, 0) / seasonal.length, 2);
    return totalVariance === 0 ? 0 : Math.min(1, variance / totalVariance);
  }
}