// lib/metrics.ts (dependency for performance monitoring)
import client from 'prom-client';
import { logger } from './logging';

// Enable default metrics
client.collectDefaultMetrics({
  prefix: 'app_',
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// Custom metric registry
class MetricsRegistry {
  private counters = new Map<string, client.Counter>();
  private gauges = new Map<string, client.Gauge>();
  private histograms = new Map<string, client.Histogram>();
  private summaries = new Map<string, client.Summary>();

  counter(name: string, labels?: string[]): client.Counter;
  counter(name: string, config: { help?: string; labelNames?: string[] }): client.Counter;
  counter(name: string, arg?: any): client.Counter {
    if (!this.counters.has(name)) {
      const config = Array.isArray(arg) 
        ? { name, labelNames: arg, help: `${name} counter` }
        : { name, help: `${name} counter`, ...arg };
      
      this.counters.set(name, new client.Counter(config));
    }
    return this.counters.get(name)!;
  }

  gauge(name: string, labels?: string[]): client.Gauge;
  gauge(name: string, config: { help?: string; labelNames?: string[] }): client.Gauge;
  gauge(name: string, arg?: any): client.Gauge {
    if (!this.gauges.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} gauge` }
        : { name, help: `${name} gauge`, ...arg };
      
      this.gauges.set(name, new client.Gauge(config));
    }
    return this.gauges.get(name)!;
  }

  histogram(name: string, labels?: string[]): client.Histogram;
  histogram(name: string, config: { 
    help?: string; 
    labelNames?: string[]; 
    buckets?: number[] 
  }): client.Histogram;
  histogram(name: string, arg?: any): client.Histogram {
    if (!this.histograms.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} histogram` }
        : { name, help: `${name} histogram`, ...arg };
      
      this.histograms.set(name, new client.Histogram(config));
    }
    return this.histograms.get(name)!;
  }

  summary(name: string, labels?: string[]): client.Summary;
  summary(name: string, config: { 
    help?: string; 
    labelNames?: string[]; 
    percentiles?: number[];
    maxAgeSeconds?: number;
    ageBuckets?: number;
  }): client.Summary;
  summary(name: string, arg?: any): client.Summary {
    if (!this.summaries.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} summary` }
        : { name, help: `${name} summary`, ...arg };
      
      this.summaries.set(name, new client.Summary(config));
    }
    return this.summaries.get(name)!;
  }

  async getMetrics(): Promise<string> {
    return await client.register.metrics();
  }

  async getMetricsAsJSON(): Promise<any> {
    return await client.register.getMetricsAsJSON();
  }

  resetMetrics(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.summaries.clear();
    client.register.clear();
  }
}

// Export singleton instance
export const metrics = new MetricsRegistry();

// Export types
export type Metric = client.Counter | client.Gauge | client.Histogram | client.Summary;

// Export prom-client for advanced usage
export { client as promClient };