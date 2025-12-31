// lib/security-monitor.ts
// Detect and respond to suspicious activity

import { blockPermanently, RATE_LIMIT_CONFIGS } from './rate-limit';

interface SecurityEvent {
  type: 'sql_injection' | 'xss' | 'path_traversal' | 'suspicious_headers' | 'rapid_requests' | 'brute_force';
  ip: string;
  endpoint: string;
  details: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private suspiciousIps = new Map<string, number>(); // IP -> incident count

  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);

    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Track suspicious IPs
    const count = (this.suspiciousIps.get(event.ip) || 0) + 1;
    this.suspiciousIps.set(event.ip, count);

    // Auto-block for critical events or repeated offenders
    if (event.severity === 'critical' || count >= 5) {
      blockPermanently(event.ip);
      console.error(`[Security] BLOCKED IP: ${event.ip} (${count} incidents)`);
    }

    // Log based on severity
    const logMsg = `[Security:${event.severity}] ${event.type} from ${event.ip} at ${event.endpoint}: ${event.details}`;
    
    switch (event.severity) {
      case 'critical':
      case 'high':
        console.error(logMsg);
        break;
      case 'medium':
        console.warn(logMsg);
        break;
      case 'low':
        console.info(logMsg);
        break;
    }
  }

  getRecentEvents(limit = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  getEventsByIp(ip: string): SecurityEvent[] {
    return this.events.filter(e => e.ip === ip);
  }

  getSuspiciousIps(): Array<{ ip: string; incidents: number }> {
    return Array.from(this.suspiciousIps.entries())
      .map(([ip, incidents]) => ({ ip, incidents }))
      .sort((a, b) => b.incidents - a.incidents);
  }

  clearHistory(): void {
    this.events = [];
    this.suspiciousIps.clear();
  }
}

const monitor = new SecurityMonitor();

// Detection functions

export function detectSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|;|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=|1\s*=\s*1|'.*'.*=.*')/i,
    /(WAITFOR|DELAY|BENCHMARK|SLEEP)/i,
  ];
  
  return patterns.some(p => p.test(input));
}

export function detectXss(input: string): boolean {
  const patterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
  ];
  
  return patterns.some(p => p.test(input));
}

export function detectPathTraversal(input: string): boolean {
  const patterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e\//gi,
    /%252e%252e\//gi,
    /\.\.\%2f/gi,
  ];
  
  return patterns.some(p => p.test(input));
}

export function detectSuspiciousHeaders(headers: Record<string, any>): string[] {
  const suspicious: string[] = [];
  
  // Check for suspicious user agents
  const ua = String(headers['user-agent'] || '').toLowerCase();
  const badUserAgents = ['sqlmap', 'nikto', 'nmap', 'masscan', 'metasploit', 'havij'];
  
  if (badUserAgents.some(bad => ua.includes(bad))) {
    suspicious.push('Suspicious user agent');
  }

  // Check for proxy headers manipulation
  const xForwardedFor = headers['x-forwarded-for'];
  if (xForwardedFor && String(xForwardedFor).split(',').length > 5) {
    suspicious.push('Excessive proxy chain');
  }

  // Check for unusual accept headers
  const accept = String(headers['accept'] || '');
  if (accept && !accept.includes('text') && !accept.includes('application') && !accept.includes('*/*')) {
    suspicious.push('Unusual accept header');
  }

  return suspicious;
}

export function logSecurityEvent(
  type: SecurityEvent['type'],
  ip: string,
  endpoint: string,
  details: string,
  severity: SecurityEvent['severity'] = 'medium'
): void {
  monitor.logEvent({ type, ip, endpoint, details, severity });
}

export function getSecurityEvents(limit?: number): SecurityEvent[] {
  return monitor.getRecentEvents(limit);
}

export function getSecurityEventsByIp(ip: string): SecurityEvent[] {
  return monitor.getEventsByIp(ip);
}

export function getSuspiciousIps() {
  return monitor.getSuspiciousIps();
}

export function clearSecurityHistory(): void {
  monitor.clearHistory();
}

// Middleware for API routes
export function securityMiddleware(req: any, endpoint: string): {
  safe: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const ip = getIpFromRequest(req);

  // Check headers
  const headerIssues = detectSuspiciousHeaders(req.headers);
  if (headerIssues.length > 0) {
    issues.push(...headerIssues);
    logSecurityEvent('suspicious_headers', ip, endpoint, headerIssues.join(', '), 'medium');
  }

  // Check query parameters
  const query = req.query || {};
  for (const [key, value] of Object.entries(query)) {
    const str = String(value);
    
    if (detectSqlInjection(str)) {
      issues.push(`SQL injection in query param: ${key}`);
      logSecurityEvent('sql_injection', ip, endpoint, `Query param: ${key}`, 'critical');
    }
    
    if (detectXss(str)) {
      issues.push(`XSS attempt in query param: ${key}`);
      logSecurityEvent('xss', ip, endpoint, `Query param: ${key}`, 'high');
    }
    
    if (detectPathTraversal(str)) {
      issues.push(`Path traversal in query param: ${key}`);
      logSecurityEvent('path_traversal', ip, endpoint, `Query param: ${key}`, 'high');
    }
  }

  // Check body
  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    
    if (detectSqlInjection(bodyStr)) {
      issues.push('SQL injection in request body');
      logSecurityEvent('sql_injection', ip, endpoint, 'Request body', 'critical');
    }
    
    if (detectXss(bodyStr)) {
      issues.push('XSS attempt in request body');
      logSecurityEvent('xss', ip, endpoint, 'Request body', 'high');
    }
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

function getIpFromRequest(req: any): string {
  const headers = [
    'cf-connecting-ip',
    'x-client-ip',
    'x-forwarded-for',
    'x-real-ip',
  ];
  
  for (const header of headers) {
    const value = req.headers?.[header];
    if (value) {
      const ip = Array.isArray(value) ? value[0] : value;
      return ip.split(',')[0].trim();
    }
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

export default {
  detectSqlInjection,
  detectXss,
  detectPathTraversal,
  detectSuspiciousHeaders,
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventsByIp,
  getSuspiciousIps,
  clearSecurityHistory,
  securityMiddleware,
};
