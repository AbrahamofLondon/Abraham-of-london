// lib/server/ip.ts
import type { NextApiRequest } from "next";

export interface IpAnalysis {
  ip: string;
  source: string;
  isPrivate: boolean;
  isLocalhost: boolean;
  version: 4 | 6 | "unknown";
  trusted: boolean;
}

// ----------------------------------------------------------------------------
// 1. PRIVATE + SPECIAL ADDRESS RANGES
// ----------------------------------------------------------------------------
const PRIVATE_IPV4 = [
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^127\./,
];
const PRIVATE_IPV6 = [
  /^fc00:/,     // Unique local address
  /^fd00:/,     // Unique local address
  /^fe80:/,     // Link-local
  /^::1$/,      // Loopback
];

const LOOPBACK = ["127.0.0.1", "::1", "localhost"];

// ----------------------------------------------------------------------------
// 2. FULL IPv4 + IPv6 VALIDATION (supports compressed IPv6!)
// ----------------------------------------------------------------------------
const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}$/;

// Full IPv6 (normal + compressed + IPv4 embedded)
const IPV6_REGEX =
  /^(([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}|(([0-9A-Fa-f]{1,4}:){1,7}|:)((:[0-9A-Fa-f]{1,4}){1,7}|:)|(([0-9A-Fa-f]{1,4}:){6}|:)((25[0-5]|(2[0-4]\d|[0-1]?\d?\d))(\.(25[0-5]|(2[0-4]\d|[0-1]?\d?\d))){3}))$/;

// ----------------------------------------------------------------------------
// 3. HELPER: VALID IP?
// ----------------------------------------------------------------------------
export function isValidIp(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  if (ip === "unknown") return false;
  if (LOOPBACK.includes(ip)) return true;

  // IPv4
  if (IPV4_REGEX.test(ip)) return true;

  // IPv6 (normal, compressed, embedded IPv4)
  if (IPV6_REGEX.test(ip)) return true;

  return false;
}

// ----------------------------------------------------------------------------
// 4. PRIVATE ADDRESS CHECK
// ----------------------------------------------------------------------------
function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;

  if (PRIVATE_IPV4.some((r) => r.test(ip))) return true;
  if (PRIVATE_IPV6.some((r) => r.test(ip))) return true;

  return false;
}

// ----------------------------------------------------------------------------
// 5. ANALYSE AN IP ADDRESS
// ----------------------------------------------------------------------------
function analyzeIp(ip: string, source = "unknown"): IpAnalysis {
  if (!isValidIp(ip)) {
    return {
      ip: "unknown",
      source,
      isPrivate: false,
      isLocalhost: false,
      version: "unknown",
      trusted: false,
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
  };
}

// ----------------------------------------------------------------------------
// 6. TRUSTED HEADERS (ordered by reliability)
// ----------------------------------------------------------------------------
const TRUSTED_HEADERS = [
  // Cloudflare
  "cf-connecting-ip",

  // AWS / GCP / Fly / Heroku
  "x-client-ip",
  "true-client-ip",

  // Nginx / Apache / Vercel / Netlify
  "x-real-ip",

  // Standard proxy header (can contain multiple)
  "x-forwarded-for",

  // Other RFC-compliant variants
  "x-forwarded",
  "x-cluster-client-ip",
  "forwarded",
  "forwarded-for",

  // Netlify (custom)
  "client-ip",
];

// ----------------------------------------------------------------------------
// 7. SAFE PARSER FOR X-FORWARDED-FOR CHAINS
// ----------------------------------------------------------------------------
function extractFirstValidIp(headerVal: string): string | null {
  if (!headerVal) return null;

  // Can be a chain "1.1.1.1, 10.0.0.1, ::1"
  const parts = headerVal.split(",").map((x) => x.trim());

  for (const part of parts) {
    if (isValidIp(part)) return part;
  }

  return null;
}

// ----------------------------------------------------------------------------
// 8. MAIN: GET CLIENT IP
// ----------------------------------------------------------------------------
export function getClientIp(
  req: NextApiRequest | { headers: Record<string, any> },
): string {
  const headers = req.headers || {};

  for (const header of TRUSTED_HEADERS) {
    const value = headers[header];

    if (!value) continue;

    if (Array.isArray(value)) {
      const extracted = extractFirstValidIp(value[0]);
      if (extracted) return extracted;
    }

    if (typeof value === "string") {
      const extracted = extractFirstValidIp(value);
      if (extracted) return extracted;
    }
  }

  // Fallback to socket remote address
  const socket = (req as NextApiRequest).socket;
  if (socket?.remoteAddress && isValidIp(socket.remoteAddress)) {
    return socket.remoteAddress;
  }

  return "unknown";
}

// ----------------------------------------------------------------------------
// 9. GET CLIENT IP + ANALYSIS
// ----------------------------------------------------------------------------
export function getClientIpWithAnalysis(
  req: NextApiRequest,
): IpAnalysis {
  const ip = getClientIp(req);
  return analyzeIp(ip, "header/proxy");
}

// ----------------------------------------------------------------------------
// 🔟 ANONYMISATION FOR RATE LIMIT KEYS
// ----------------------------------------------------------------------------
export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip)) return "unknown";

  // IPv6 — keep first 3 blocks
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 3).join(":") + "::";
  }

  // IPv4 — mask last octet
  const parts = ip.split(".");
  return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
}

// ----------------------------------------------------------------------------
// 11. RATE LIMIT KEY DERIVED FROM ANONYMISED IP
// ----------------------------------------------------------------------------
export function getRateLimitKey(req: NextApiRequest, prefix: string): string {
  const ip = getClientIp(req);
  const anon = anonymizeIp(ip);
  return `${prefix}:${anon}`;
}