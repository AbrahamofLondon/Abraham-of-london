import { 
  TimeSeriesPoint, 
  TimeSeriesPointWithConfidence,
  DecompositionResult, 
  ForecastResult, 
  TrendDirection,
  ConfidenceLevel 
} from '../types';

export class TimeSeriesEngine {
  private static instance: TimeSeriesEngine | null = null;
  private readonly MIN_DATA_POINTS = 14;
  private readonly MAX_FORECAST_HORIZON = 180;
  private readonly LOESS_BANDWIDTH = 0.3;

  private constructor() {}

  static getInstance(): TimeSeriesEngine {
    if (!TimeSeriesEngine.instance) {
      TimeSeriesEngine.instance = new TimeSeriesEngine();
    }
    return TimeSeriesEngine.instance;
  }

  decompose(points: TimeSeriesPoint[], period: number = 7): DecompositionResult {
    this.validateInput(points);
    const values = points.map(p => p.value);
    
    // Extract trend using adaptive LOESS
    const trend = this.loessTrend(values, Math.max(0.2, this.LOESS_BANDWIDTH));
    
    // Detrend and extract seasonal component
    const detrended = values.map((v, i) => v - trend[i]);
    const seasonal = this.extractSeasonal(detrended, period);
    
    // Calculate residuals
    const residual = detrended.map((v, i) => v - seasonal[i]);
    const trendSlope = this.calculateTrendSlope(trend);
    
    // Extract multi-period seasonal patterns for market cycles
    const seasonalPatterns = new Map<string, number[]>();
    seasonalPatterns.set('weekly', this.getSeasonalPattern(seasonal, 7));
    seasonalPatterns.set('monthly', this.getSeasonalPattern(seasonal, 30));
    seasonalPatterns.set('quarterly', this.getSeasonalPattern(seasonal, 90));
    
    const stdDev = Math.sqrt(residual.reduce((sum, r) => sum + r * r, 0) / residual.length);

    return {
      trend,
      seasonal,
      residual,
      trendSlope,
      seasonalPatterns,
      stdDev,
      seasonalityStrength: this.calculateSeasonalityStrength(seasonal)
    };
  }

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
    const lastPoint = points[n - 1];
    const lastTrend = decomposition.trend[n - 1];
    const weeklyPattern = decomposition.seasonalPatterns.get('weekly') || [];
    
    const projectedPoints: TimeSeriesPointWithConfidence[] = [];
    const zScore = this.getZScore(confidence);
    
    for (let i = 1; i <= horizon; i++) {
      // Linear trend projection + seasonal overlay
      const trendValue = Math.max(0, lastTrend + decomposition.trendSlope * i);
      const seasonalValue = weeklyPattern[(n + i - 1) % 7] || 0;
      const pointValue = Math.max(0, Math.min(100, trendValue + seasonalValue));
      
      // Fan chart error expansion logic
      const predictionInterval = zScore * decomposition.stdDev * Math.sqrt(1 + i / n);
      
      projectedPoints.push({
        timestamp: new Date(lastPoint.timestamp.getTime() + i * 24 * 60 * 60 * 1000),
        value: pointValue,
        lowerBound: Math.max(0, pointValue - predictionInterval),
        upperBound: Math.min(100, pointValue + predictionInterval),
        confidence
      });
    }
    
    return {
      points: projectedPoints,
      trend: this.determineTrend(decomposition.trendSlope),
      volatility: decomposition.stdDev / (points.reduce((sum, p) => sum + p.value, 0) / n),
      seasonalityStrength: decomposition.seasonalityStrength || 0,
      mape: this.calculateMAPE(points, decomposition),
      mae: this.calculateMAE(projectedPoints, decomposition),
      rmse: this.calculateRMSE(projectedPoints, decomposition),
      rSquared: this.calculateRSquared(projectedPoints, decomposition)
    };
  }

  /* -------------------------------------------------------------------------- */
  /* STATISTICAL CORE                                                           */
  /* -------------------------------------------------------------------------- */

  private calculateSeasonalityStrength(seasonal: number[]): number {
    const variance = seasonal.reduce((sum, s) => sum + s * s, 0) / seasonal.length;
    const mean = seasonal.reduce((a, b) => a + b, 0) / seasonal.length;
    const totalVariance = variance + Math.pow(mean, 2);
    return totalVariance === 0 ? 0 : Math.min(1, variance / totalVariance);
  }

  private calculateMAE(projected: TimeSeriesPointWithConfidence[], decomp: DecompositionResult): number {
    // Measures mean absolute error against the last known trend average
    return projected.reduce((sum, p, i) => {
      const fitted = decomp.trend[Math.min(i, decomp.trend.length - 1)];
      return sum + Math.abs(p.value - fitted);
    }, 0) / projected.length;
  }

  private calculateRMSE(projected: TimeSeriesPointWithConfidence[], decomp: DecompositionResult): number {
    const mse = projected.reduce((sum, p, i) => {
      const fitted = decomp.trend[Math.min(i, decomp.trend.length - 1)];
      return sum + Math.pow(p.value - fitted, 2);
    }, 0) / projected.length;
    return Math.sqrt(mse);
  }

  private calculateRSquared(projected: TimeSeriesPointWithConfidence[], decomp: DecompositionResult): number {
    const values = projected.map(p => p.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    let ssRes = 0, ssTot = 0;
    
    for (let i = 0; i < projected.length; i++) {
      const fitted = decomp.trend[Math.min(i, decomp.trend.length - 1)];
      ssRes += Math.pow(projected[i].value - fitted, 2);
      ssTot += Math.pow(projected[i].value - mean, 2);
    }
    return ssTot === 0 ? 0 : 1 - (ssRes / ssTot);
  }

  private calculateMAPE(points: TimeSeriesPoint[], decomp: DecompositionResult): number {
    let totalAPE = 0, count = 0;
    for (let i = 0; i < points.length; i++) {
      const actual = points[i].value;
      const fitted = decomp.trend[i] + decomp.seasonal[i];
      if (actual !== 0) {
        totalAPE += Math.abs((actual - fitted) / actual);
        count++;
      }
    }
    return count > 0 ? (totalAPE / count) * 100 : 0;
  }

  private loessTrend(y: number[], bandwidth: number): number[] {
    const n = y.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const result: number[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const weights = this.calculateTricubeWeights(x, i, bandwidth);
      const reg = this.weightedLinearRegression(x, y, weights);
      result[i] = reg.intercept + reg.slope * x[i];
    }
    return result;
  }

  private calculateTricubeWeights(x: number[], center: number, bandwidth: number): number[] {
    const n = x.length;
    const maxDist = Math.max(...x.map(xi => Math.abs(xi - x[center])));
    const window = bandwidth * maxDist;
    return x.map(xi => {
      const dist = Math.abs(xi - x[center]);
      if (dist < window) {
        return Math.pow(1 - Math.pow(dist / window, 3), 3);
      }
      return 0;
    });
  }

  private weightedLinearRegression(x: number[], y: number[], w: number[]) {
    let sW = 0, sWX = 0, sWY = 0, sWXX = 0, sWXY = 0;
    for (let i = 0; i < x.length; i++) {
      sW += w[i]; sWX += w[i] * x[i]; sWY += w[i] * y[i];
      sWXX += w[i] * x[i] * x[i]; sWXY += w[i] * x[i] * y[i];
    }
    const denom = sW * sWXX - sWX * sWX;
    if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sWY / sW };
    const slope = (sW * sWXY - sWX * sWY) / denom;
    return { slope, intercept: (sWY - slope * sWX) / sW };
  }

  private extractSeasonal(detrended: number[], period: number): number[] {
    const n = detrended.length;
    const seasonalIndices = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    for (let i = 0; i < n; i++) {
      seasonalIndices[i % period] += detrended[i];
      counts[i % period]++;
    }
    const averaged = seasonalIndices.map((val, i) => val / (counts[i] || 1));
    const mean = averaged.reduce((a, b) => a + b, 0) / period;
    return Array.from({ length: n }, (_, i) => averaged[i % period] - mean);
  }

  private getSeasonalPattern(seasonal: number[], period: number): number[] {
    const pattern = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    for (let i = 0; i < seasonal.length; i++) {
      pattern[i % period] += seasonal[i];
      counts[i % period]++;
    }
    return pattern.map((p, i) => p / (counts[i] || 1));
  }

  private calculateTrendSlope(trend: number[]): number {
    const n = trend.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = (n - 1) / 2;
    const meanY = trend.reduce((a, b) => a + b, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (x[i] - meanX) * (trend[i] - meanY);
      den += Math.pow(x[i] - meanX, 2);
    }
    return den === 0 ? 0 : num / den;
  }

  private determineTrend(slope: number): TrendDirection {
    if (slope > 0.03) return 'increasing';
    if (slope < -0.03) return 'decreasing';
    return 'stable';
  }

  private getZScore(confidence: ConfidenceLevel): number {
    const zScores: Record<number, number> = { 0.8: 1.282, 0.85: 1.44, 0.9: 1.645, 0.95: 1.96, 0.99: 2.576 };
    return zScores[confidence] || 1.96;
  }

  private validateInput(points: TimeSeriesPoint[]): void {
    if (!points || points.length < this.MIN_DATA_POINTS) throw new Error("Insufficient market data.");
  }
}