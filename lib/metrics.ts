// lib/metrics.ts (dependency for performance monitoring) - HARDENED
import { logger } from './logging';

// ============================================================================
// STRATEGIC OPTIONAL IMPORT PATTERN
// Prevents build failure if prom-client is missing (e.g., in browser builds)
// ============================================================================
let client: any = null;
let prometheusAvailable = false;

try {
  // Dynamic require to avoid build-time failures
  client = require('prom-client');
  prometheusAvailable = true;
  
  // Only initialize if we're in a Node.js environment and metrics are enabled
  if (typeof process !== 'undefined' && process.env.ENABLE_METRICS === 'true') {
    // Enable default metrics
    client.collectDefaultMetrics({
      prefix: 'app_',
      timeout: 5000,
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });
    
    logger.info('[Metrics] Prometheus metrics initialized');
  }
} catch (error) {
  prometheusAvailable = false;
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[Metrics] prom-client not available (metrics disabled)');
  }
}

// ============================================================================
// Environment detection
// ============================================================================
const isNode = typeof process !== 'undefined' && 
               process.versions != null && 
               process.versions.node != null;

const metricsEnabled = () => {
  return prometheusAvailable && 
         isNode && 
         process.env.ENABLE_METRICS === 'true';
};

// ============================================================================
// No-op metric implementations for when prom-client is unavailable
// ============================================================================
class NoopCounter {
  inc() {}
  reset() {}
  labels() { return this; }
}

class NoopGauge {
  set() {}
  inc() {}
  dec() {}
  setToCurrentTime() {}
  startTimer() { return () => {}; }
  labels() { return this; }
}

class NoopHistogram {
  observe() {}
  startTimer() { return () => {}; }
  labels() { return this; }
}

class NoopSummary {
  observe() {}
  startTimer() { return () => {}; }
  labels() { return this; }
}

// ============================================================================
// Custom metric registry (with graceful fallback)
// ============================================================================
class MetricsRegistry {
  private counters = new Map<string, any>();
  private gauges = new Map<string, any>();
  private histograms = new Map<string, any>();
  private summaries = new Map<string, any>();

  counter(name: string, labels?: string[]): any;
  counter(name: string, config: { help?: string; labelNames?: string[] }): any;
  counter(name: string, arg?: any): any {
    if (!metricsEnabled()) {
      return new NoopCounter();
    }
    
    if (!this.counters.has(name)) {
      const config = Array.isArray(arg) 
        ? { name, labelNames: arg, help: `${name} counter` }
        : { name, help: `${name} counter`, ...arg };
      
      this.counters.set(name, new client.Counter(config));
    }
    return this.counters.get(name)!;
  }

  gauge(name: string, labels?: string[]): any;
  gauge(name: string, config: { help?: string; labelNames?: string[] }): any;
  gauge(name: string, arg?: any): any {
    if (!metricsEnabled()) {
      return new NoopGauge();
    }
    
    if (!this.gauges.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} gauge` }
        : { name, help: `${name} gauge`, ...arg };
      
      this.gauges.set(name, new client.Gauge(config));
    }
    return this.gauges.get(name)!;
  }

  histogram(name: string, labels?: string[]): any;
  histogram(name: string, config: { 
    help?: string; 
    labelNames?: string[]; 
    buckets?: number[] 
  }): any;
  histogram(name: string, arg?: any): any {
    if (!metricsEnabled()) {
      return new NoopHistogram();
    }
    
    if (!this.histograms.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} histogram` }
        : { name, help: `${name} histogram`, ...arg };
      
      this.histograms.set(name, new client.Histogram(config));
    }
    return this.histograms.get(name)!;
  }

  summary(name: string, labels?: string[]): any;
  summary(name: string, config: { 
    help?: string; 
    labelNames?: string[]; 
    percentiles?: number[];
    maxAgeSeconds?: number;
    ageBuckets?: number;
  }): any;
  summary(name: string, arg?: any): any {
    if (!metricsEnabled()) {
      return new NoopSummary();
    }
    
    if (!this.summaries.has(name)) {
      const config = Array.isArray(arg)
        ? { name, labelNames: arg, help: `${name} summary` }
        : { name, help: `${name} summary`, ...arg };
      
      this.summaries.set(name, new client.Summary(config));
    }
    return this.summaries.get(name)!;
  }

  async getMetrics(): Promise<string> {
    if (!metricsEnabled()) {
      return '# Metrics disabled';
    }
    return await client.register.metrics();
  }

  async getMetricsAsJSON(): Promise<any> {
    if (!metricsEnabled()) {
      return [];
    }
    return await client.register.getMetricsAsJSON();
  }

  resetMetrics(): void {
    if (metricsEnabled()) {
      this.counters.clear();
      this.gauges.clear();
      this.histograms.clear();
      this.summaries.clear();
      client.register.clear();
    }
  }

  // Helper to check if metrics are actually enabled
  isEnabled(): boolean {
    return metricsEnabled();
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================
export const metrics = new MetricsRegistry();

// Export types for TypeScript support
export type Metric = any; // Simplified type for compatibility

// Export prom-client only if available
export const promClient = prometheusAvailable ? client : null;

// ============================================================================
// Middleware helper for Next.js API routes
// ============================================================================
export function withMetrics(handler: any) {
  return async (req: any, res: any) => {
    const start = Date.now();
    
    try {
      await handler(req, res);
    } finally {
      if (metrics.isEnabled()) {
        const duration = Date.now() - start;
        const route = req.url || 'unknown';
        
        try {
          metrics.histogram('http_request_duration_ms', {
            help: 'HTTP request duration in milliseconds',
            labelNames: ['route', 'method']
          }).observe({ route, method: req.method }, duration);
        } catch (error) {
          // Silently fail - metrics shouldn't break the request
        }
      }
    }
  };
}

// ============================================================================
// Utility function to track async operations
// ============================================================================
export async function trackMetric<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  if (!metrics.isEnabled()) {
    return fn();
  }
  
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    metrics.histogram(`${name}_duration_ms`).observe(labels, duration);
    metrics.counter(`${name}_total`).inc(labels);
    
    return result;
  } catch (error) {
    metrics.counter(`${name}_errors_total`).inc(labels);
    throw error;
  }
}

// ============================================================================
// Default export for convenience
// ============================================================================
export default metrics;