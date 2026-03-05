/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/security-monitor.ts — Suspicious activity detection & response
 *
 * Principles:
 * - No assumptions about ./rate-limit export signatures (we do NOT import blockers from there).
 * - Immediate enforcement via process-local denylist (sync, middleware-safe).
 * - Durable denylist via DB+Redis (denyIp) in the background (compliance-grade).
 * - Fixes slicing/this.events bugs and actually blocks.
 */

import "server-only";

import { denyIp } from "@/lib/server/denylist";
import { RATE_LIMIT_CONFIGS } from "./rate-limit";

// -------------------------------------
// Process-local denylist (immediate, sync)
// -------------------------------------
const PERMA_BLOCK = new Set<string>();

function normalizeIp(ip: string): string {
  return String(ip || "").trim().toLowerCase();
}

function isBlocked(ip: string): boolean {
  return PERMA_BLOCK.has(normalizeIp(ip));
}

// -------------------------------------
// Patterns
// -------------------------------------
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
  /(--|;|\/\*|\*\/|xp_|sp_)/i,
  /(\bOR\b.*=|1\s*=\s*1|'.*'.*=.*')/i,
  /(WAITFOR|DELAY|BENCHMARK|SLEEP)/i,
];

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /eval\s*\(/gi,
  /expression\s*\(/gi,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e\//gi,
  /%252e%252e\//gi,
  /\.\.\%2f/gi,
];

const BAD_USER_AGENTS = ["sqlmap", "nikto", "nmap", "masscan", "metasploit", "havij"];

// -------------------------------------
// Types
// -------------------------------------
interface SecurityEvent {
  type:
    | "sql_injection"
    | "xss"
    | "path_traversal"
    | "suspicious_headers"
    | "rapid_requests"
    | "brute_force";
  ip: string;
  endpoint: string;
  details: string;
  timestamp: number;
  severity: "low" | "medium" | "high" | "critical";
}

// -------------------------------------
// Safe array tail helper
// -------------------------------------
function tail<T>(arr: T[], count: number): T[] {
  if (!Array.isArray(arr)) return [];
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return [];
  return arr.length <= n ? arr : arr.slice(arr.length - n);
}

// -------------------------------------
// Block threshold policy
// -------------------------------------
function getBlockThreshold(): number {
  // Your client-safe RATE_LIMIT_CONFIGS does NOT define API_READ.
  // Use something real and conservative.
  const base = (RATE_LIMIT_CONFIGS as any)?.standard?.limit ?? 60; // from your file: standard.limit = 60
  const n = Number(base);
  const baseLimit = Number.isFinite(n) ? n : 60;

  // e.g. standard 60 -> threshold 6 (but minimum 5)
  return Math.max(5, Math.floor(baseLimit / 10));
}

function shouldEscalate(event: { severity: SecurityEvent["severity"] }, incidents: number): boolean {
  if (event.severity === "critical") return true;
  if (event.severity === "high" && incidents >= getBlockThreshold()) return true;
  if (event.severity === "medium" && incidents >= getBlockThreshold() + 3) return true;
  return false;
}

/**
 * Durable block (DB+Redis) happens in background.
 * Sync middleware blocks immediately via PERMA_BLOCK.
 */
function enforceBlockNowAndDurably(ip: string, reason: string, severity: SecurityEvent["severity"]) {
  const nip = normalizeIp(ip);
  if (!nip || nip === "unknown") return;

  // 1) Immediate: process-local
  PERMA_BLOCK.add(nip);

  // 2) Durable: DB + Redis (Option C), fire-and-forget
  // denyIp expects severity: "low" | "medium" | "high" | "critical" in your denylist module
  // (If your denylist uses different type names, align there — not here.)
  void denyIp(nip, reason, severity as any).catch(() => {
    // if DB/Redis is down, we still keep the process-local block
  });
}

// -------------------------------------
// Monitor
// -------------------------------------
class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000;
  private suspiciousIps = new Map<string, number>(); // IP -> incident count

  logEvent(event: Omit<SecurityEvent, "timestamp">): void {
    const ip = normalizeIp(event.ip);

    const fullEvent: SecurityEvent = {
      ...event,
      ip,
      timestamp: Date.now(),
    };

    this.events.push(fullEvent);
    if (this.events.length > this.MAX_EVENTS) {
      this.events = tail(this.events, this.MAX_EVENTS);
    }

    const incidents = (this.suspiciousIps.get(ip) || 0) + 1;
    this.suspiciousIps.set(ip, incidents);

    if (shouldEscalate(event, incidents)) {
      enforceBlockNowAndDurably(
        ip,
        `${event.type}: ${event.details} (incidents=${incidents})`,
        event.severity
      );
      console.error(`[Security] BLOCKED IP: ${ip} (${incidents} incidents)`);
    }

    const logMsg = `[Security:${event.severity}] ${event.type} from ${ip} at ${event.endpoint}: ${event.details}`;
    if (event.severity === "critical" || event.severity === "high") console.error(logMsg);
    else if (event.severity === "medium") console.warn(logMsg);
    else console.info(logMsg);
  }

  getRecentEvents(limit = 100): SecurityEvent[] {
    return tail(this.events, Math.max(1, limit));
  }

  getEventsByIp(ip: string): SecurityEvent[] {
    const nip = normalizeIp(ip);
    return this.events.filter((e) => e.ip === nip);
  }

  getSuspiciousIps(): Array<{ ip: string; incidents: number }> {
    return Array.from(this.suspiciousIps.entries())
      .map(([ip, incidents]) => ({ ip, incidents }))
      .sort((a, b) => b.incidents - a.incidents);
  }

  clearHistory(): void {
    this.events = [];
    this.suspiciousIps.clear();
    PERMA_BLOCK.clear();
  }
}

const monitor = new SecurityMonitor();

// -------------------------------------
// Detection
// -------------------------------------
export function detectSqlInjection(input: string): boolean {
  if (!input) return false;
  return SQL_INJECTION_PATTERNS.some((p) => p.test(input));
}

export function detectXss(input: string): boolean {
  if (!input) return false;
  return XSS_PATTERNS.some((p) => p.test(input));
}

export function detectPathTraversal(input: string): boolean {
  if (!input) return false;
  return PATH_TRAVERSAL_PATTERNS.some((p) => p.test(input));
}

export function detectSuspiciousHeaders(
  headers: Record<string, string | string[] | undefined>
): string[] {
  const suspicious: string[] = [];

  const ua = String(headers["user-agent"] || "").toLowerCase();
  if (BAD_USER_AGENTS.some((bad) => ua.includes(bad))) suspicious.push("Suspicious user agent");

  const xForwardedFor = headers["x-forwarded-for"];
  if (xForwardedFor) {
    const chain = Array.isArray(xForwardedFor) ? xForwardedFor : xForwardedFor.split(",");
    if (chain.length > 5) suspicious.push("Excessive proxy chain");
  }

  const accept = String(headers["accept"] || "");
  if (accept && !accept.includes("text") && !accept.includes("application") && !accept.includes("*/*")) {
    suspicious.push("Unusual accept header");
  }

  return suspicious;
}

// -------------------------------------
// Public API
// -------------------------------------
export function logSecurityEvent(
  type: SecurityEvent["type"],
  ip: string,
  endpoint: string,
  details: string,
  severity: SecurityEvent["severity"] = "medium"
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

// -------------------------------------
// Middleware (sync) — actually blocks
// -------------------------------------
export function securityMiddleware(
  req: any,
  endpoint: string
): { safe: boolean; issues: string[]; blocked?: boolean } {
  const issues: string[] = [];
  const ip = getIpFromRequest(req);

  // Hard block (immediate)
  if (isBlocked(ip)) {
    return { safe: false, blocked: true, issues: ["IP is permanently blocked"] };
  }

  // Headers
  const headerIssues = detectSuspiciousHeaders(req?.headers || {});
  if (headerIssues.length > 0) {
    issues.push(...headerIssues);
    logSecurityEvent("suspicious_headers", ip, endpoint, headerIssues.join(", "), "medium");
  }

  // Query
  const query = req?.query || {};
  for (const [key, value] of Object.entries(query)) {
    const str = String(value);

    if (detectSqlInjection(str)) {
      issues.push(`SQL injection in query param: ${key}`);
      logSecurityEvent("sql_injection", ip, endpoint, `Query param: ${key}`, "critical");
    }
    if (detectXss(str)) {
      issues.push(`XSS attempt in query param: ${key}`);
      logSecurityEvent("xss", ip, endpoint, `Query param: ${key}`, "high");
    }
    if (detectPathTraversal(str)) {
      issues.push(`Path traversal in query param: ${key}`);
      logSecurityEvent("path_traversal", ip, endpoint, `Query param: ${key}`, "high");
    }
  }

  // Body
  if (req?.body && typeof req.body === "object") {
    try {
      const bodyStr = JSON.stringify(req.body);

      if (detectSqlInjection(bodyStr)) {
        issues.push("SQL injection in request body");
        logSecurityEvent("sql_injection", ip, endpoint, "Request body", "critical");
      }
      if (detectXss(bodyStr)) {
        issues.push("XSS attempt in request body");
        logSecurityEvent("xss", ip, endpoint, "Request body", "high");
      }
    } catch (e) {
      console.warn("[Security] Could not stringify request body for scan", e);
    }
  }

  // Re-check: critical events may have blocked
  if (isBlocked(ip)) {
    return { safe: false, blocked: true, issues: [...issues, "IP blocked by security policy"] };
  }

  return { safe: issues.length === 0, issues };
}

function getIpFromRequest(req: any): string {
  const headers = ["cf-connecting-ip", "x-client-ip", "x-forwarded-for", "x-real-ip"];

  for (const header of headers) {
    const value = req?.headers?.[header];
    if (!value) continue;

    const raw = Array.isArray(value) ? value.find(Boolean) : value;
    if (!raw) continue;

    const first = String(raw).split(",")[0]?.trim();
    if (first) return first;
  }

  const sock = req?.socket?.remoteAddress;
  return sock ? String(sock) : "unknown";
}

// Legacy default export
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