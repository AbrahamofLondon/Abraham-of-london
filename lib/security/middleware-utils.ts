// lib/security/middleware-utils.ts
import type { NextRequest } from "next/server";

export interface SecurityMetrics {
  blockedRequests: number;
  rateLimitedRequests: number;
  maliciousPatterns: string[];
  suspiciousIPs: Set<string>;
}

const PRODUCTION = process.env.NODE_ENV === "production";

function getIp(req: NextRequest): string {
  const h = req.headers;

  const candidates = [
    h.get("cf-connecting-ip"),
    h.get("x-real-ip"),
    h.get("x-forwarded-for"),
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  const raw = candidates[0];
  if (!raw) return "unknown";

  const first = raw.split(",")[0];
  return first ? first.trim() : "unknown";
}

export class SecurityMonitor {
  private metrics: SecurityMetrics = {
    blockedRequests: 0,
    rateLimitedRequests: 0,
    maliciousPatterns: [],
    suspiciousIPs: new Set(),
  };

  logRequest(
    req: NextRequest,
    action: "allowed" | "blocked" | "rate-limited",
    reason?: string
  ) {
    const ip = getIp(req);
    const path = req.nextUrl.pathname;
    const timestamp = new Date().toISOString();

    if (!PRODUCTION) {
      const icon = action === "allowed" ? "✅" : action === "blocked" ? "❌" : "⚠️";
      console.log(`${icon} [${timestamp}] ${action.toUpperCase()} ${path} from ${ip}`);
    }

    if (action === "blocked") {
      this.metrics.blockedRequests++;
      if (reason?.toLowerCase().includes("malicious")) {
        this.metrics.maliciousPatterns.push(reason);
        this.metrics.suspiciousIPs.add(ip);
      }
    } else if (action === "rate-limited") {
      this.metrics.rateLimitedRequests++;
    }
  }

  getMetrics(): SecurityMetrics {
    return {
      ...this.metrics,
      suspiciousIPs: new Set(this.metrics.suspiciousIPs),
    };
  }

  getMetricsJsonSafe() {
    const m = this.getMetrics();
    return {
      ...m,
      suspiciousIPs: Array.from(m.suspiciousIPs),
    };
  }
}

export const securityMonitor = new SecurityMonitor();