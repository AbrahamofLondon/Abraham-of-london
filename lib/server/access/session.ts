import "server-only";

import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTokenStore } from "./tokenStore";

import type { AccessTier, AccessSession } from "./types";

export const COOKIE_NAME = "aol_access";
const SESSION_TTL_DAYS = Number(process.env.AOL_SESSION_TTL_DAYS || 30);

/**
 * Local safeSlice
 * - Never throws
 * - Handles negative / overflow indices
 */
function safeSlice(input: string, start: number, end?: number): string {
  const s = typeof input === "string" ? input : String(input ?? "");
  const len = s.length;

  const a = Math.max(0, Math.min(len, Math.floor(start || 0)));
  const b = end === undefined ? len : Math.max(0, Math.min(len, Math.floor(end)));

  if (b <= a) return "";
  return s.slice(a, b);
}

function safeDecodeURIComponent(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/**
 * Robust cookie parsing for NextApiRequest (Node runtime)
 */
function parseCookies(req: NextApiRequest): Record<string, string> {
  const header = String(req.headers.cookie || "");
  const out: Record<string, string> = {};
  if (!header) return out;

  header
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i < 0) return;

      const key = safeSlice(part, 0, i).trim();
      if (!key) return;

      const rawValue = safeSlice(part, i + 1);
      out[key] = safeDecodeURIComponent(rawValue);
    });

  return out;
}

export async function getSessionFromReq(req: NextApiRequest): Promise<AccessSession | null> {
  const cookies = parseCookies(req);
  const sessionId = cookies[COOKIE_NAME];
  if (!sessionId) return null;

  const store = await getTokenStore();
  return store.getSession(sessionId);
}

export async function setSessionCookie(res: NextApiResponse, session: AccessSession): Promise<void> {
  const secure = process.env.NODE_ENV === "production";
  const maxAgeSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));

  const cookie =
    `${COOKIE_NAME}=${encodeURIComponent(session.sessionId)}; ` +
    `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}` +
    (secure ? "; Secure" : "");

  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === "production";

  const cookie =
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; ` +
    `Expires=Thu, 01 Jan 1970 00:00:00 GMT` +
    (secure ? "; Secure" : "");

  res.setHeader("Set-Cookie", cookie);
}

export function newSessionId(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function buildSession(args: { tier: AccessTier; subject: string }): AccessSession {
  const now = Date.now();
  const ttlMs = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

  return {
    sessionId: newSessionId(),
    tier: args.tier,
    subject: String(args.subject || "anon"),
    issuedAt: now,
    expiresAt: now + ttlMs,
  };
}

/**
 * Local tier comparison helper
 * IMPORTANT: Use kebab-case tiers (your type union uses "inner-circle")
 */
function hasAccess(current: AccessTier, required: AccessTier): boolean {
  const order: AccessTier[] = [
    "public",
    "member",
    "inner-circle",
    "client",
    "legacy",
    "architect",
    "owner",
  ];

  return order.indexOf(current) >= order.indexOf(required);
}

export function tierAtLeast(current: AccessTier, required: AccessTier): boolean {
  return hasAccess(current, required);
}