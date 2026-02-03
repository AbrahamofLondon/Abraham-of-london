import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

// Must match the client constant
const COOKIE_NAME = "aol_access";

/**
 * Minimal, robust cookie setter without extra deps.
 */
function setCookie(res: NextApiResponse, name: string, value: string, opts: {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "Lax" | "Strict" | "None";
  path?: string;
  maxAge?: number; // seconds
}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (opts.maxAge != null) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);

  // Append (don’t overwrite) existing Set-Cookie headers
  const prev = res.getHeader("Set-Cookie");
  const next = Array.isArray(prev) ? [...prev, parts.join("; ")] : prev ? [String(prev), parts.join("; ")] : [parts.join("; ")];
  res.setHeader("Set-Cookie", next);
}

/**
 * Very simple rate limit: in-memory per server instance.
 * (MVP only; in production use Redis/Upstash/etc.)
 */
const bucket = new Map<string, { count: number; ts: number }>();
function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const cur = bucket.get(key);
  if (!cur || now - cur.ts > windowMs) {
    bucket.set(key, { count: 1, ts: now });
    return { ok: true };
  }
  if (cur.count >= limit) return { ok: false };
  cur.count += 1;
  return { ok: true };
}

/**
 * Canonical timing-safe compare for secrets.
 */
function timingSafeEq(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

    // Basic rate limit by IP
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const rl = rateLimit(`unlock:${ip}`);
    if (!rl.ok) return res.status(429).json({ ok: false, error: "Too many attempts. Try again shortly." });

    const key = String(req.body?.key || "").trim();
    if (!key || key.length < 6) return res.status(400).json({ ok: false, error: "Invalid security key" });

    /**
     * MVP validation options:
     * A) Single shared key via ENV (fastest)
     * B) Multiple keys via ENV comma list (still simple)
     * Later: validate against Postgres table of issued keys.
     */
    const master = String(process.env.INNER_CIRCLE_MASTER_KEY || "").trim();
    const list = String(process.env.INNER_CIRCLE_KEYS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const allowedKeys = master ? [master, ...list] : list;

    if (allowedKeys.length === 0) {
      return res.status(500).json({
        ok: false,
        error: "Server is not configured (missing INNER_CIRCLE_MASTER_KEY or INNER_CIRCLE_KEYS).",
      });
    }

    const match = allowedKeys.some((k) => timingSafeEq(k, key));
    if (!match) return res.status(401).json({ ok: false, error: "Invalid security key" });

    /**
     * Cookie value should not store the key itself.
     * Use a signed session token. MVP: random token with short TTL.
     */
    const session = crypto.randomBytes(24).toString("base64url");

    // 14 days (MVP). Adjust later.
    const maxAge = 60 * 60 * 24 * 14;

    setCookie(res, COOKIE_NAME, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      path: "/",
      maxAge,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
