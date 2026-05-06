import { safeSlice } from "@/lib/utils/safe";

// lib/server/security.ts - Simplified security module
export interface SecurityThreat {
  id: string;
  type: 'authentication' | 'authorization' | 'injection' | 'dos' | 'malware' | 'data_leak' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source?: string;
  detectedAt: Date;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface SecurityMetrics {
  totalRequests: number;
  suspiciousLogins: number;
  failedLogins: number;
  ipThreats: number;
}

export interface SecurityStatus {
  level: 'low' | 'medium' | 'high';
  threats: SecurityThreat[];
  lastScan: Date;
  metrics: SecurityMetrics;
  recommendations: string[];
}

class SecurityMonitor {
  private threats: SecurityThreat[] = [];
  private metrics: SecurityMetrics = {
    totalRequests: 0,
    suspiciousLogins: 0,
    failedLogins: 0,
    ipThreats: 0,
  };
  private readonly maxThreats = 100;
  private lastMetricsReset = Date.now();

  async getSecurityStatus(): Promise<SecurityStatus> {
    const recentThreats = this.threats.filter(t => 
      Date.now() - t.detectedAt.getTime() < 24 * 60 * 60 * 1000
    );

    const threatLevels = recentThreats.map(t => this.threatLevelToNumber(t.severity));
    const avgThreatLevel = threatLevels.length > 0 ? 
      threatLevels.reduce((a, b) => a + b, 0) / threatLevels.length : 0;

    let overallLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgThreatLevel >= 3) overallLevel = 'high';
    else if (avgThreatLevel >= 1.5) overallLevel = 'medium';

    const recommendations = this.generateRecommendations(recentThreats);

    return {
      level: overallLevel,
      threats: safeSlice(recentThreats, 0, 20),
      lastScan: new Date(),
      metrics: { ...this.metrics },
      recommendations
    };
  }

  private threatLevelToNumber(level: string): number {
    const levels = { 'none': 0, 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return levels[level as keyof typeof levels] || 0;
  }

  private generateRecommendations(threats: SecurityThreat[]): string[] {
    const recommendations: string[] = [];

    if (threats.some(t => t.severity === 'critical')) {
      recommendations.push('Immediate security review recommended');
    }

    if (threats.length === 0) {
      recommendations.push('No immediate security concerns detected');
    }

    return safeSlice(recommendations, 0, 3);
  }

  async analyzeRequest(request: {
    ip: string;
    method: string;
    url: string;
    userAgent?: string;
  }): Promise<{
    allowed: boolean;
    reason?: string;
    threatLevel: 'none' | 'low' | 'medium' | 'high';
  }> {
    this.metrics.totalRequests++;

    return {
      allowed: true,
      threatLevel: 'none'
    };
  }
}

// Singleton instance
const securityMonitor = new SecurityMonitor();

export async function getSecurityStatus(): Promise<SecurityStatus> {
  return securityMonitor.getSecurityStatus();
}

export { securityMonitor, SecurityMonitor };

// Create named object for default export
const securityApi = {
  getSecurityStatus,
  securityMonitor,
  SecurityMonitor,
};

export default securityApi;
