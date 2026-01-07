export interface HealthCheckMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeRequests: number;
  totalChecks: number;
  failedChecks: number;
  responseTime: number;
}

export interface SubsystemCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  metrics: Record<string, any>;
  performanceScore: number;
  timestamp: string;
}