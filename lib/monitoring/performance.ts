// lib/monitoring/performance.ts
import { logger } from '@/lib/logging';
import { metrics, Metric } from '@/lib/metrics';
import { safeSlice } from "@/lib/utils/safe";

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  error?: string;
}

export class PerformanceMonitor {
  private metrics: Map<string, Metric> = new Map();
  private buffer: PerformanceMetric[] = [];
  private readonly bufferSize = 100;
  private readonly flushInterval = 60000;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly serviceName: string,
    private readonly enableHistograms = true
  ) {
    this.startFlushTimer();
  }

  start(operation: string) {
    const startTime = performance.now();
    const startHrTime = process.hrtime();
    const timestamp = Date.now();

    return {
      end: (metadata?: Record<string, any>, error?: Error) => {
        const [seconds, nanoseconds] = process.hrtime(startHrTime);
        const durationHr = seconds * 1000 + nanoseconds / 1000000;

        const metric: PerformanceMetric = {
          operation: `${this.serviceName}.${operation}`,
          duration: durationHr,
          timestamp,
          metadata,
          error: error?.message
        };

        this.recordMetric(metric);
        return metric;
      }
    };
  }

  private recordMetric(metric: PerformanceMetric): void {
    this.buffer.push(metric);
    this.updatePrometheusMetrics(metric);
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private updatePrometheusMetrics(metric: PerformanceMetric): void {
    const labelValues = {
      operation: metric.operation,
      service: this.serviceName,
      error: metric.error ? 'true' : 'false'
    };

    if (this.enableHistograms) {
      const histogram = this.getOrCreateHistogram(metric.operation);
      histogram.labels(labelValues.operation, labelValues.service).observe(metric.duration);
    }

    metrics.counter('performance_operations_total', {
      help: 'Total operations',
      labelNames: ['operation', 'service', 'error']
    }).labels(labelValues.operation, labelValues.service, labelValues.error).inc();
  }

  private getOrCreateHistogram(operation: string): any {
    const key = `${this.serviceName}.${operation}`;
    if (!this.metrics.has(key)) {
      const histogram = metrics.histogram('performance_duration_seconds', {
        help: 'Duration in seconds',
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        labelNames: ['operation', 'service']
      });
      this.metrics.set(key, histogram);
    }
    return this.metrics.get(key)!;
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const toFlush = this.buffer;
    this.buffer = [];

    try {
      // Mock for external telemetry
      logger.debug(`Flushed ${toFlush.length} performance metrics`);
    } catch (error) {
      logger.error('Failed to flush performance metrics:', { 
        error: error instanceof Error ? error.message : String(error)
      });
      // ✅ Use the new polymorphic safeSlice
      this.buffer.unshift(...safeSlice(toFlush, -50));
    }
  }

  private startFlushTimer(): void {
    if (typeof setInterval !== 'undefined') {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}