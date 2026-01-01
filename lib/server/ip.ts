import type { NextApiRequest } from "next";

/* ============================================================================
 * 1. TYPES
 * ============================================================================ */

export interface IpAnalysis {
  ip: string;
  source: string;
  isPrivate: boolean;
  isLocalhost: boolean;
  version: 4 | 6 | "unknown";
  trusted: boolean;
  // Nested analysis kept for backward compatibility if needed
  analysis?: {
    isPrivate: boolean;
    isLocalhost: boolean;
    version: 4 | 6 | "unknown";
    trusted: boolean;
  };
}

/* ============================================================================
 * 2. CONSTANTS & REGEX
 * ============================================================================ */

const PRIVATE_IPV4 = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^127\./,
];

const PRIVATE_IPV6 = [
  /^fc00:/, // Unique local address
  /^fd00:/, // Unique local address
  /^fe80:/, // Link-local
  /^::1$/,  // Loopback
];

const LOOPBACK = ["127.0.0.1", "::1", "localhost"];

// Strict IPv4 Regex
const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/;

// Comprehensive IPv6 Regex (Standard + Compressed + Mixed)
const IPV6_REGEX = /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){1,7}|:)((:[0-9A-Fa-f]{1,4}){1,7}|:)|(([0-9A-Fa-f]{1,4}:){6}|:)((25[0-5]|(2[0-4]\d|[0-1]?\d?\d))(\.(25[0-5]|(2[0-4]\d|[0-1]?\d?\d))){3}))$/;

const TRUSTED_HEADERS = [
  "cf-connecting-ip",      // Cloudflare
  "x-client-ip",           // AWS / GCP
  "true-client-ip",        // Akamai / Cloudflare
  "x-real-ip",             // Nginx / Vercel
  "x-forwarded-for",       // Standard Proxy
  "x-forwarded",
  "x-cluster-client-ip",
  "forwarded-for",
  "forwarded",
  "client-ip",
];

/* ============================================================================
 * 3. VALIDATION LOGIC
 * ============================================================================ */

export function isValidIp(ip: string | undefined | null): boolean {
  if (!ip || typeof ip !== "string") return false;
  const clean = ip.trim();
  if (clean === "unknown" || clean === "") return false;
  if (LOOPBACK.includes(clean)) return true;

  return IPV4_REGEX.test(clean) || IPV6_REGEX.test(clean);
}

function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;
  if (PRIVATE_IPV4.some((r) => r.test(ip))) return true;
  if (PRIVATE_IPV6.some((r) => r.test(ip))) return true;
  return false;
}

/* ============================================================================
 * 4. EXTRACTION LOGIC
 * ============================================================================ */

/**
 * Safely parses a header value (which might be a comma-separated chain)
 * and returns the first valid public IP found.
 */
function extractFirstValidIp(headerVal: string | string[] | undefined): string | null {
  if (!headerVal) return null;

  // Handle array (rare in Next.js headers object but possible in raw node)
  const valString = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  if (!valString) return null;

  // Split "1.2.3.4, 10.0.0.1" -> ["1.2.3.4", "10.0.0.1"]
  const parts = valString.split(",");

  for (const part of parts) {
    const clean = part.trim();
    if (isValidIp(clean)) return clean;
  }

  return null;
}



/**
 * Main extractor. Checks headers in order of trust, falls back to socket.
 */
export function getClientIp(
  req: NextApiRequest | { headers: Record<string, string | string[] | undefined>; socket?: any }
): string {
  const headers = req.headers || {};

  // 1. Check Headers
  for (const header of TRUSTED_HEADERS) {
    const value = headers[header];
    const extracted = extractFirstValidIp(value);
    if (extracted) return extracted;
  }

  // 2. Check Socket (Local dev / Direct connection)
  const socket = (req as any).socket;
  if (socket?.remoteAddress && isValidIp(socket.remoteAddress)) {
    return socket.remoteAddress;
  }

  return "unknown";
}

/* ============================================================================
 * 5. ANALYSIS LOGIC
 * ============================================================================ */

export function analyzeIp(ip: string, source = "unknown"): IpAnalysis {
  if (!isValidIp(ip)) {
    return {
      ip: "unknown",
      source,
      isPrivate: false,
      isLocalhost: false,
      version: "unknown",
      trusted: false,
      analysis: { isPrivate: false, isLocalhost: false, version: "unknown", trusted: false },
    };
  }

  const isLocalhost = LOOPBACK.includes(ip);
  const isPrivate = isPrivateIp(ip);
  
  let version: 4 | 6 | "unknown" = "unknown";
  if (IPV4_REGEX.test(ip)) version = 4;
  else if (IPV6_REGEX.test(ip)) version = 6;

  const trusted = !isPrivate && !isLocalhost;

  return {
    ip,
    source,
    isPrivate,
    isLocalhost,
    version,
    trusted,
    analysis: { isPrivate, isLocalhost, version, trusted },
  };
}

export function getClientIpWithAnalysis(req: NextApiRequest): IpAnalysis {
  const ip = getClientIp(req);
  return analyzeIp(ip, "header/proxy");
}

/* ============================================================================
 * 6. ANONYMIZATION (GDPR/Privacy Safe)
 * ============================================================================ */

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip)) return "unknown";

  // IPv6: Keep first 3 segments (usually /48 or /64 prefix)
  // e.g. 2001:0db8:85a3:0000:0000:8a2e:0370:7334 -> 2001:0db8:85a3::
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length < 3) return ip; // Fallback for weirdly compressed IPs
    return `${parts[0]}:${parts[1]}:${parts[2]}::`;
  }

  // IPv4: Zero out the last octet
  // e.g. 192.168.1.50 -> 192.168.1.0
  const parts = ip.split(".");
  // SAFEGUARD: Ensure we actually have 4 parts before accessing indices
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  return ip;
}

export function getRateLimitKey(req: NextApiRequest, prefix: string): string {
  const ip = getClientIp(req);
  const anon = anonymizeIp(ip);
  return `${prefix}:${anon}`;
}