// tests/performance/predictive-benchmark.test.ts
import { TimeSeriesEngine } from '@/lib/predictive/engines/time-series-engine';
import { ScenarioEngine } from '@/lib/predictive/engines/scenario-engine';

describe('Performance Benchmarks', () => {
  it('should decompose 1000 points in under 100ms', () => {
    const points = generateTimeSeries(1000);
    const engine = TimeSeriesEngine.getInstance();
    
    const start = performance.now();
    engine.decompose(points);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
  
  it('should run 10,000 Monte Carlo iterations in under 5s', () => {
    const points = generateTimeSeries(90);
    const engine = TimeSeriesEngine.getInstance();
    const forecast = engine.forecast(points);
    const scenarioEngine = ScenarioEngine.getInstance();
    
    const start = performance.now();
    scenarioEngine.monteCarloSimulation(forecast, 10000);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5000);
  });
});