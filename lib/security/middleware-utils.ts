// lib/security/middleware-utils.ts
export interface SecurityMetrics {
  blockedRequests: number;
  rateLimitedRequests: number;
  maliciousPatterns: string[];
  suspiciousIPs: Set<string>;
}

export class SecurityMonitor {
  private metrics: SecurityMetrics = {
    blockedRequests: 0,
    rateLimitedRequests: 0,
    maliciousPatterns: [],
    suspiciousIPs: new Set(),
  };

  logRequest(req: NextRequest, action: 'allowed' | 'blocked' | 'rate-limited', reason?: string) {
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
    const path = req.nextUrl.pathname;
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      timestamp,
      ip,
      path,
      action,
      reason,
      userAgent: req.headers.get('user-agent'),
      country: req.geo?.country,
    };

    // Console logging in development
    if (!PRODUCTION) {
      const color = action === 'allowed' ? '✅' : action === 'blocked' ? '❌' : '⚠️';
      console.log(`${color} [${timestamp}] ${action.toUpperCase()} ${path} from ${ip}`);
    }

    // Update metrics
    if (action === 'blocked') {
      this.metrics.blockedRequests++;
      if (reason?.includes('malicious')) {
        this.metrics.maliciousPatterns.push(reason);
        this.metrics.suspiciousIPs.add(ip);
      }
    } else if (action === 'rate-limited') {
      this.metrics.rateLimitedRequests++;
    }

    // TODO: Send to monitoring service in production
    if (PRODUCTION) {
      // await sendToMonitoringService(logEntry);
    }
  }

  getMetrics(): SecurityMetrics {
    return {
      ...this.metrics,
      suspiciousIPs: new Set(this.metrics.suspiciousIPs), // Clone for safety
    };
  }
}

// Singleton instance
export const securityMonitor = new SecurityMonitor();