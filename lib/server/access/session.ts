import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { getTokenStore } from "./tokenStore";
import type { AccessSession, AccessTier } from "./types";
import { safeSlice } from "@/lib/utils/safe";


const COOKIE_NAME = "aol_access";
const SESSION_TTL_DAYS = Number(process.env.AOL_SESSION_TTL_DAYS || 30);

function parseCookies(req: NextApiRequest): Record<string, string> {
  const header = req.headers.cookie || "";
  const out: Record<string, string> = {};
  header.split(";").map(s => s.trim()).filter(Boolean).forEach(part => {
    const i = part.indexOf("=");
    if (i > -1) out[safeSlice(part, 0, i)] = decodeURIComponent(safeSlice(part, i + 1));
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

export async function setSessionCookie(res: NextApiResponse, session: AccessSession) {
  const secure = process.env.NODE_ENV === "production";
  const cookie =
    `${COOKIE_NAME}=${encodeURIComponent(session.sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor((session.expiresAt - Date.now()) / 1000)}`
    + (secure ? "; Secure" : "");
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
    subject: args.subject,
    issuedAt: now,
    expiresAt: now + ttlMs,
  };
}

export function tierAtLeast(current: AccessTier, required: AccessTier): boolean {
  const order: AccessTier[] = ["public", "inner-circle", "private"];
  return order.indexOf(current) >= order.indexOf(required);
}