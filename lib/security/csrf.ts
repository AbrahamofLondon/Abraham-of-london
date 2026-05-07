// lib/security/csrf.ts
import type { NextApiRequest, NextApiResponse } from "next";
import type { Session } from "next-auth";
import crypto from "crypto";
import { logger } from "@/lib/logging";

const CSRF_COOKIE_NAME = "aol_csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

type CsrfPayload = {
  sid: string;
  exp: number;
  nonce: string;
};

// Explicit session type that matches what we actually use
type CsrfSession = Session & {
  id?: string | null;
  user?: {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  aol?: {
    sessionId?: string;
    memberId?: string;
    tier?: string;
    [key: string]: unknown;
  };
};

function safeStr(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET;

  if (!safeStr(secret)) {
    throw new Error("[CSRF] Missing CSRF_SECRET");
  }

  return String(secret);
}

function base64UrlEncode(input: Buffer | string): string {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function timingSafeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);

  if (ab.length !== bb.length) return false;

  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function sign(body: string): string {
  return base64UrlEncode(
    crypto.createHmac("sha256", getCsrfSecret()).update(body).digest(),
  );
}

function serializePayload(payload: CsrfPayload): string {
  return base64UrlEncode(JSON.stringify(payload));
}

function deserializePayload(body: string): CsrfPayload | null {
  try {
    const raw = base64UrlDecode(body).toString("utf8");
    const parsed = JSON.parse(raw) as Partial<CsrfPayload>;

    if (
      !parsed ||
      typeof parsed.sid !== "string" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.nonce !== "string"
    ) {
      return null;
    }

    return {
      sid: parsed.sid,
      exp: parsed.exp,
      nonce: parsed.nonce,
    };
  } catch {
    return null;
  }
}

function buildToken(sessionId: string): string {
  const payload: CsrfPayload = {
    sid: sessionId,
    exp: Date.now() + CSRF_TOKEN_EXPIRY_MS,
    nonce: base64UrlEncode(crypto.randomBytes(24)),
  };

  const body = serializePayload(payload);
  const signature = sign(body);
  return `${body}.${signature}`;
}

function parseToken(token: string): { payload: CsrfPayload | null; valid: boolean } {
  const [body, signature] = token.split(".");

  if (!body || !signature) {
    return { payload: null, valid: false };
  }

  const expected = sign(body);
  if (!timingSafeEqualString(signature, expected)) {
    return { payload: null, valid: false };
  }

  const payload = deserializePayload(body);
  return {
    payload,
    valid: Boolean(payload),
  };
}

function parseCookies(req: NextApiRequest): Record<string, string> {
  const raw = req.headers.cookie || "";
  const out: Record<string, string> = {};

  raw.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return;

    try {
      out[key] = decodeURIComponent(rest.join("=") || "");
    } catch {
      out[key] = rest.join("=") || "";
    }
  });

  return out;
}

function getSessionId(req: NextApiRequest): string | null {
  const cookies = parseCookies(req);

  const candidates: Array<unknown> = [
    (req as { session?: { id?: string } }).session?.id,
    cookies.aol_session_id,
    cookies["next-auth.session-token"],
    cookies["__Secure-next-auth.session-token"],
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      const value = safeStr(candidate[0]);
      if (value) return value;
      continue;
    }

    const value = safeStr(candidate);
    if (value) return value;
  }

  return null;
}

function buildCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(
    token,
  )}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600${secure}`;
}

export function generateCsrfToken(): string {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function createCsrfToken(sessionId: string): string {
  const sid = safeStr(sessionId);
  if (!sid) {
    throw new Error("[CSRF] Cannot create token without session id");
  }

  return buildToken(sid);
}

export function validateCsrfToken(
  token: string | undefined,
  sessionId: string | undefined,
): boolean {
  const rawToken = safeStr(token);
  const rawSessionId = safeStr(sessionId);

  if (!rawToken || !rawSessionId) {
    return false;
  }

  const parsed = parseToken(rawToken);
  if (!parsed.valid || !parsed.payload) {
    return false;
  }

  if (parsed.payload.exp < Date.now()) {
    return false;
  }

  return timingSafeEqualString(parsed.payload.sid, rawSessionId);
}

export function withCsrfProtection(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = safeStr(req.method).toUpperCase();
    const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (!mutatingMethods.includes(method)) {
      return handler(req, res);
    }

    const sessionId = getSessionId(req);

    if (!sessionId) {
      logger.warn("[CSRF] No session ID found for mutating request", {
        method,
        path: req.url,
        ip: req.socket.remoteAddress || null,
      });

      return res.status(403).json({
        error: "CSRF token required",
        code: "CSRF_REQUIRED",
      });
    }

    const cookies = parseCookies(req);
    const headerToken = safeStr(req.headers[CSRF_HEADER_NAME]);
    const cookieToken = safeStr(cookies[CSRF_COOKIE_NAME]);

    if (!headerToken || !cookieToken) {
      logger.warn("[CSRF] Missing CSRF header or cookie token", {
        method,
        path: req.url,
        sessionId: `${sessionId.slice(0, 8)}...`,
      });

      return res.status(403).json({
        error: "Invalid CSRF token",
        code: "CSRF_INVALID",
      });
    }

    if (!timingSafeEqualString(headerToken, cookieToken)) {
      logger.warn("[CSRF] CSRF header and cookie token mismatch", {
        method,
        path: req.url,
        sessionId: `${sessionId.slice(0, 8)}...`,
      });

      return res.status(403).json({
        error: "Invalid CSRF token",
        code: "CSRF_INVALID",
      });
    }

    if (!validateCsrfToken(headerToken, sessionId)) {
      logger.warn("[CSRF] Invalid or expired CSRF token", {
        method,
        path: req.url,
        sessionId: `${sessionId.slice(0, 8)}...`,
      });

      return res.status(403).json({
        error: "Invalid CSRF token",
        code: "CSRF_INVALID",
      });
    }

    return handler(req, res);
  };
}

/**
 * Get CSRF token from session with explicit typing
 * No reliance on 'any' - uses explicit CsrfSession type
 */
export function getCsrfToken(session: Session | null): string | null {
  if (!session) return null;

  // Cast to our explicit type that includes the fields we need
  const typedSession = session as CsrfSession;

  // Try both session.id and session.user.id
  const sessionId =
    safeStr(typedSession.id) ||
    safeStr(typedSession.user?.id);

  if (!sessionId) return null;

  return createCsrfToken(sessionId);
}

export async function csrfTokenHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sessionId = getSessionId(req);

  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = createCsrfToken(sessionId);

  res.setHeader("Set-Cookie", buildCookie(token));

  return res.status(200).json({
    csrfToken: token,
    expiresIn: 3600,
    headerName: CSRF_HEADER_NAME,
    cookieName: CSRF_COOKIE_NAME,
  });
}
