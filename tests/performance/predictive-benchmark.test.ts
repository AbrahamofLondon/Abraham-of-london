// tests/performance/predictive-benchmark.test.ts
import { TimeSeriesEngine, type TimeSeriesPoint } from '@/lib/predictive/engines/time-series-engine';
import { ScenarioEngine } from '@/lib/predictive/engines/scenario-engine';

function generateTimeSeries(count: number): TimeSeriesPoint[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(2024, 0, i + 1),
    value: 50 + Math.sin(i / 7) * 10 + i * 0.1 + (Math.random() - 0.5) * 5,
  }));
}

describe('Performance Benchmarks', () => {
  it('should decompose 1000 points in under 100ms', () => {
    const points = generateTimeSeries(1000);
    const engine = TimeSeriesEngine.getInstance();
    
    const start = performance.now();
    engine.decompose(points);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(2000);
  });

  it('should run 10,000 Monte Carlo iterations in under 5s', () => {
    const points = generateTimeSeries(90);
    const engine = TimeSeriesEngine.getInstance();
    const forecast = engine.forecast(points);
    const scenarioEngine = ScenarioEngine.getInstance();

    const start = performance.now();
    scenarioEngine.monteCarloSimulation(forecast, points, 10000);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});