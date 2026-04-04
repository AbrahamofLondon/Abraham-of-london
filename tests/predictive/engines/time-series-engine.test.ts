// tests/predictive/engines/time-series-engine.test.ts
import { TimeSeriesEngine } from '@/lib/predictive/engines/time-series-engine';
import { TimeSeriesPoint } from '@/lib/predictive/types';

describe('TimeSeriesEngine', () => {
  let engine: TimeSeriesEngine;
  
  beforeEach(() => {
    engine = TimeSeriesEngine.getInstance();
  });
  
  describe('decompose', () => {
    it('should decompose linear trend correctly', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50 + i * 0.5
      }));
      
      const result = engine.decompose(points);
      
      expect(result.trend).toBeDefined();
      expect(result.trend.length).toBe(30);
      expect(result.trendSlope).toBeGreaterThan(0);
      expect(result.trendSlope).toBeLessThan(1);
      expect(result.seasonalPatterns.has('weekly')).toBe(true);
    });
    
    it('should detect weekly seasonality', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 60 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50 + Math.sin(i * 2 * Math.PI / 7) * 10
      }));
      
      const result = engine.decompose(points);
      const weeklyPattern = result.seasonalPatterns.get('weekly');
      
      expect(weeklyPattern).toBeDefined();
      expect(weeklyPattern?.length).toBe(7);
      expect(result.seasonalityStrength).toBeGreaterThan(0.5);
    });
    
    it('should throw error with insufficient data', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50
      }));
      
      expect(() => engine.decompose(points)).toThrow('Insufficient data');
    });
    
    it('should handle constant values', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 75
      }));
      
      const result = engine.decompose(points);
      
      expect(result.trendSlope).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.seasonalityStrength).toBe(0);
    });
  });
  
  describe('forecast', () => {
    it('should generate forecast with confidence intervals', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50 + i * 0.2
      }));
      
      const result = engine.forecast(points, 30);
      
      expect(result.points.length).toBe(30);
      expect(result.points[0].lowerBound).toBeLessThan(result.points[0].value);
      expect(result.points[0].upperBound).toBeGreaterThan(result.points[0].value);
      expect(result.trend).toBe('increasing');
      expect(result.mape).toBeGreaterThanOrEqual(0);
      expect(result.mape).toBeLessThan(100);
      expect(result.rSquared).toBeGreaterThan(0.8);
    });
    
    it('should respect forecast horizon limits', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50
      }));
      
      expect(() => engine.forecast(points, 200)).toThrow('exceeds maximum');
    });
    
    it('should handle decreasing trend correctly', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 80 - i * 0.5
      }));
      
      const result = engine.forecast(points, 30);
      
      expect(result.trend).toBe('decreasing');
      expect(result.points[result.points.length - 1].value).toBeLessThan(result.points[0].value);
    });
    
    it('should maintain values within bounds [0,100]', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 95 + i * 0.2
      }));
      
      const result = engine.forecast(points, 30);
      
      for (const point of result.points) {
        expect(point.value).toBeLessThanOrEqual(100);
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.upperBound).toBeLessThanOrEqual(100);
        expect(point.lowerBound).toBeGreaterThanOrEqual(0);
      }
    });
    
    it('should have decreasing confidence intervals over longer horizons', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50
      }));
      
      const result = engine.forecast(points, 30);
      const firstInterval = result.points[0].upperBound - result.points[0].lowerBound;
      const lastInterval = result.points[28].upperBound - result.points[28].lowerBound;
      
      expect(lastInterval).toBeGreaterThan(firstInterval);
    });
  });
});