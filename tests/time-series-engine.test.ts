// tests/predictive/time-series-engine.test.ts
import { TimeSeriesEngine } from '@/lib/predictive/time-series-engine';
import { TimeSeriesPoint } from '@/lib/predictive/types';

describe('TimeSeriesEngine', () => {
  let engine: TimeSeriesEngine;
  
  beforeEach(() => {
    engine = TimeSeriesEngine.getInstance();
  });
  
  describe('decompose', () => {
    it('should decompose a simple linear trend', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50 + i * 0.5 // Increasing trend
      }));
      
      const result = engine.decompose(points);
      
      expect(result.trend).toBeDefined();
      expect(result.trend.length).toBe(30);
      expect(result.seasonal).toBeDefined();
      expect(result.residual).toBeDefined();
      expect(result.trendSlope).toBeGreaterThan(0);
    });
    
    it('should throw error with insufficient data', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50
      }));
      
      expect(() => engine.decompose(points)).toThrow('Insufficient data');
    });
    
    it('should detect seasonality', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 60 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50 + Math.sin(i * 2 * Math.PI / 7) * 10 // Weekly pattern
      }));
      
      const result = engine.decompose(points);
      const weeklyPattern = result.seasonalPatterns.get('weekly');
      
      expect(weeklyPattern).toBeDefined();
      expect(weeklyPattern?.length).toBe(7);
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
    });
    
    it('should respect forecast horizon limits', () => {
      const points: TimeSeriesPoint[] = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2024, 0, i + 1),
        value: 50
      }));
      
      expect(() => engine.forecast(points, 200)).toThrow('exceeds maximum');
    });
  });
});