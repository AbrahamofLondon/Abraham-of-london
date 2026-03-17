// lib/server/request-fingerprint.ts
import type { NextApiRequest } from "next";
import type { IncomingMessage } from "http";

// Works with NextApiRequest, IncomingMessage, and Fetch API Request
export type RequestLike = NextApiRequest | IncomingMessage | Request;

type HeaderBag = Headers | Record<string, string | string[] | undefined>;

function hasHeaders(value: unknown): value is { headers: HeaderBag } {
  return typeof value === "object" && value !== null && "headers" in value;
}

function hasSocket(
  value: unknown,
): value is { socket?: { remoteAddress?: string | undefined } } {
  return typeof value === "object" && value !== null && "socket" in value;
}

function isHeadersInstance(value: unknown): value is Headers {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    typeof (value as Headers).get === "function"
  );
}

function getHeaders(req: RequestLike): HeaderBag | null {
  return hasHeaders(req) ? req.headers : null;
}

function getHeaderValue(headers: HeaderBag | null, name: string): string | null {
  if (!headers) return null;

  if (isHeadersInstance(headers)) {
    return headers.get(name);
  }

  const value = headers[name];
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return first?.trim() || null;
  }

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeIp(ip: string): string {
  const trimmed = ip.trim();

  if (trimmed === "::1" || trimmed === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  if (trimmed.startsWith("::ffff:")) {
    return trimmed.slice(7);
  }

  return trimmed;
}

function isValidIp(ip: string): boolean {
  const normalized = normalizeIp(ip);

  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern =
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::$|^::1$/;

  if (ipv4Pattern.test(normalized)) {
    return normalized.split(".").every((octet) => {
      const num = Number.parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  return ipv6Pattern.test(normalized);
}

export function getClientIp(req: RequestLike): string | null {
  try {
    const headers = getHeaders(req);

    const cf = getHeaderValue(headers, "cf-connecting-ip");
    if (cf && isValidIp(cf)) return normalizeIp(cf);

    const xff = getHeaderValue(headers, "x-forwarded-for");
    if (xff) {
      const firstIp = xff.split(",")[0]?.trim();
      if (firstIp && isValidIp(firstIp)) return normalizeIp(firstIp);
    }

    const real = getHeaderValue(headers, "x-real-ip");
    if (real && isValidIp(real)) return normalizeIp(real);

    if (hasSocket(req) && req.socket?.remoteAddress) {
      const socketIp = normalizeIp(req.socket.remoteAddress);
      if (isValidIp(socketIp)) return socketIp;
      return socketIp || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function getUserAgent(req: RequestLike): string | null {
  try {
    const headers = getHeaders(req);
    const ua = getHeaderValue(headers, "user-agent");

    if (!ua) return null;

    return (
      ua
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .slice(0, 500)
        .trim() || null
    );
  } catch {
    return null;
  }
}

export function getReferrer(req: RequestLike): string | null {
  try {
    const headers = getHeaders(req);
    const ref =
      getHeaderValue(headers, "referer") || getHeaderValue(headers, "referrer");

    if (!ref) return null;

    return (
      ref
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .slice(0, 1000)
        .trim() || null
    );
  } catch {
    return null;
  }
}

/**
 * Generate a lightweight correlation fingerprint from request data.
 * Not cryptographic. Intended for analytics/audit correlation only.
 */
export function generateRequestFingerprint(req: RequestLike): string {
  const components = [
    getClientIp(req) || "",
    getUserAgent(req) || "",
    getReferrer(req) || "",
  ].join("|");

  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return Math.abs(hash).toString(36).slice(0, 12);
}