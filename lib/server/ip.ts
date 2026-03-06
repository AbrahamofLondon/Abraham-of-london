// lib/server/ip.ts — SSOT IP Extraction + Analysis (Proxy-aware, GDPR-safe)
import "server-only";

import type { NextApiRequest } from "next";
import { isIP } from "node:net";

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
 * 2. CONSTANTS
 * ============================================================================ */

const LOOPBACK = new Set(["127.0.0.1", "::1", "localhost"]);

const TRUSTED_HEADERS = [
  "cf-connecting-ip", // Cloudflare
  "x-client-ip", // AWS / GCP
  "true-client-ip", // Akamai / Cloudflare
  "x-real-ip", // Nginx / Vercel
  "x-forwarded-for", // Standard Proxy
  "x-forwarded",
  "x-cluster-client-ip",
  "forwarded-for",
  "forwarded",
  "client-ip",
] as const;

/* ============================================================================
 * 3. VALIDATION + PRIVATE DETECTION
 * ============================================================================ */

export function isValidIp(ip: string | undefined | null): boolean {
  if (!ip || typeof ip !== "string") return false;
  const clean = ip.trim();
  if (!clean || clean === "unknown") return false;
  if (LOOPBACK.has(clean)) return true;
  const v = isIP(clean);
  return v === 4 || v === 6;
}

function isPrivateIpv4(ip: string): boolean {
  // Assumes valid IPv4
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;

  // 172.16.0.0 – 172.31.255.255
  if (ip.startsWith("172.")) {
    const parts = ip.split(".");
    const second = Number(parts[1]);
    if (Number.isFinite(second) && second >= 16 && second <= 31) return true;
  }

  // loopback
  if (ip.startsWith("127.")) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // fc00::/7 (ULA), fe80::/10 (link-local), ::1 (loopback)
  return (
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80:") ||
    lower === "::1"
  );
}

function isPrivateIp(ip: string): boolean {
  if (!isValidIp(ip)) return false;
  const v = isIP(ip);
  if (v === 4) return isPrivateIpv4(ip);
  if (v === 6) return isPrivateIpv6(ip);
  return false;
}

/* ============================================================================
 * 4. EXTRACTION LOGIC
 * ============================================================================ */

function normalizeHeaders(headers: any): Record<string, string | string[] | undefined> {
  const out: Record<string, string | string[] | undefined> = {};
  if (!headers || typeof headers !== "object") return out;

  for (const [k, v] of Object.entries(headers)) {
    out[String(k).toLowerCase()] = v as any;
  }
  return out;
}

/**
 * Parses a header value that might be a comma-separated chain.
 * Returns the first PUBLIC valid IP if possible; otherwise returns first valid IP.
 */
function extractBestIp(headerVal: string | string[] | undefined): string | null {
  if (!headerVal) return null;

  const valString = Array.isArray(headerVal) ? headerVal[0] : headerVal;
  if (!valString) return null;

  const parts = valString.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  // Prefer public IP
  for (const p of parts) {
    if (isValidIp(p) && !isPrivateIp(p) && !LOOPBACK.has(p)) return p;
  }
  // Fallback: any valid IP
  for (const p of parts) {
    if (isValidIp(p)) return p;
  }

  return null;
}

/**
 * Main extractor. Checks headers in order of trust, falls back to socket.
 */
export function getClientIp(
  req: NextApiRequest | { headers: Record<string, string | string[] | undefined>; socket?: any }
): string {
  const headers = normalizeHeaders((req as any).headers);

  for (const header of TRUSTED_HEADERS) {
    const extracted = extractBestIp(headers[header]);
    if (extracted) return extracted;
  }

  const socket = (req as any).socket;
  const ra = socket?.remoteAddress;
  if (typeof ra === "string" && isValidIp(ra)) return ra;

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

  const isLocalhost = LOOPBACK.has(ip);
  const isPriv = isPrivateIp(ip);

  const v = isIP(ip);
  const version: 4 | 6 | "unknown" = v === 4 ? 4 : v === 6 ? 6 : "unknown";

  const trusted = !isPriv && !isLocalhost;

  return {
    ip,
    source,
    isPrivate: isPriv,
    isLocalhost,
    version,
    trusted,
    analysis: { isPrivate: isPriv, isLocalhost, version, trusted },
  };
}

export function getClientIpWithAnalysis(req: NextApiRequest): IpAnalysis {
  const headers = normalizeHeaders(req.headers as any);

  for (const header of TRUSTED_HEADERS) {
    const extracted = extractBestIp(headers[header]);
    if (extracted) return analyzeIp(extracted, `header:${header}`);
  }

  const ra = (req.socket as any)?.remoteAddress;
  if (typeof ra === "string" && isValidIp(ra)) return analyzeIp(ra, "socket");

  return analyzeIp("unknown", "unknown");
}

/* ============================================================================
 * 6. ANONYMIZATION (GDPR/Privacy Safe)
 * ============================================================================ */

export function anonymizeIp(ip: string): string {
  if (!isValidIp(ip)) return "unknown";

  // IPv6: keep /48-ish prefix (first 3 hextets)
  if (ip.includes(":")) {
    const parts = ip.split(":").filter((p) => p.length > 0);
    const a = parts[0] ?? "0000";
    const b = parts[1] ?? "0000";
    const c = parts[2] ?? "0000";
    return `${a}:${b}:${c}::`;
  }

  // IPv4: zero last octet
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;

  return ip;
}

export function getRateLimitKey(req: NextApiRequest, prefix: string): string {
  const ip = getClientIp(req);
  const anon = anonymizeIp(ip);
  return `${prefix}:${anon}`;
}