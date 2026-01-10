// lib/health/monitoring.ts - Health monitoring utilities
import { sendAlert } from '@/lib/notifications';

export type HealthCheckResult = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  service: string;
  message?: string;
  latency?: number;
  timestamp: Date;
};

export class HealthMonitor {
  private static instance: HealthMonitor;
  private lastResults: Map<string, HealthCheckResult> = new Map();
  private alertCooldown: Map<string, number> = new Map();
  private readonly ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async recordCheck(result: HealthCheckResult): Promise<void> {
    this.lastResults.set(result.service, result);
    
    // Check if we need to send an alert
    if (result.status === 'unhealthy') {
      await this.checkAndSendAlert(result);
    }
    
    // Log the result
    this.logResult(result);
  }

  getStatus(service?: string): HealthCheckResult | Map<string, HealthCheckResult> {
    if (service) {
      return this.lastResults.get(service) || {
        status: 'unhealthy',
        service,
        message: 'No data available',
        timestamp: new Date(),
      };
    }
    return new Map(this.lastResults);
  }

  private async checkAndSendAlert(result: HealthCheckResult): Promise<void> {
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(result.service) || 0;
    
    if (now - lastAlert > this.ALERT_COOLDOWN_MS) {
      await sendAlert({
        type: 'health',
        severity: 'critical',
        service: result.service,
        message: result.message || `${result.service} is unhealthy`,
        timestamp: result.timestamp,
      });
      
      this.alertCooldown.set(result.service, now);
    }
  }

  private logResult(result: HealthCheckResult): void {
    const logLevel = result.status === 'healthy' ? 'info' : 
                     result.status === 'degraded' ? 'warn' : 'error';
    
    console[logLevel](`[HEALTH] ${result.service}: ${result.status}`, {
      message: result.message,
      latency: result.latency,
      timestamp: result.timestamp.toISOString(),
    });
  }
}
