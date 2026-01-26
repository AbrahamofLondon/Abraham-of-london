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
  private readonly flushInterval = 60000; // 1 minute
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
        const duration = performance.now() - startTime;
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

        if (duration > 1000) { // Log slow operations (>1s)
          logger.warn(`Slow operation detected: ${metric.operation} took ${duration.toFixed(2)}ms`, {
            duration,
            metadata,
            error: error?.message
          });
        }

        return metric;
      }
    };
  }

  private recordMetric(metric: PerformanceMetric): void {
    // Add to buffer
    this.buffer.push(metric);
    
    // Update Prometheus metrics if enabled
    this.updatePrometheusMetrics(metric);
    
    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.flush();
    }
  }

  private updatePrometheusMetrics(metric: PerformanceMetric): void {
    const labels = {
      operation: metric.operation,
      service: this.serviceName,
      error: metric.error ? 'true' : 'false'
    };

    // Histogram for duration distribution
    if (this.enableHistograms) {
      const histogram = this.getOrCreateHistogram(metric.operation);
      histogram.observe(metric.duration);
    }

    // Counter for total operations
    metrics.counter('performance_operations_total', labels).inc();

    // Counter for errors
    if (metric.error) {
      metrics.counter('performance_errors_total', {
        ...labels,
        error_type: metric.error
      }).inc();
    }
  }

  private getOrCreateHistogram(operation: string): any {
    const key = `${this.serviceName}.${operation}`;
    
    if (!this.metrics.has(key)) {
      const histogram = metrics.histogram('performance_duration_seconds', {
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
        labels: { operation, service: this.serviceName }
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
      // Here you would send metrics to your monitoring system
      // For example: DataDog, New Relic, or your own TSDB
      await this.sendToMonitoringService(toFlush);
      
      logger.debug(`Flushed ${toFlush.length} performance metrics`);
    } catch (error) {
      logger.error('Failed to flush performance metrics:', error);
      // Re-buffer failed metrics (with deduplication logic in production)
      this.buffer.unshift(...safeSlice(toFlush, -50)); // Keep last 50 on error
    }
  }

  private async sendToMonitoringService(metrics: PerformanceMetric[]): Promise<void> {
    // Implement integration with your monitoring service
    // Example for DataDog:
    // await fetch('https://api.datadoghq.com/api/v1/series', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'DD-API-KEY': process.env.DATADOG_API_KEY!
    //   },
    //   body: JSON.stringify({
    //     series: metrics.map(m => ({
    //       metric: 'performance.duration',
    //       points: [[m.timestamp / 1000, m.duration]],
    //       tags: [`operation:${m.operation}`, `service:${this.serviceName}`]
    //     }))
    //   })
    // });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  async getStats(): Promise<{
    bufferSize: number;
    metricsCount: number;
    lastFlush: number;
    serviceName: string;
  }> {
    return {
      bufferSize: this.buffer.length,
      metricsCount: this.metrics.size,
      lastFlush: Date.now(),
      serviceName: this.serviceName
    };
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    await this.flush();
    
    logger.info(`PerformanceMonitor for ${this.serviceName} shutdown complete`);
  }
}
