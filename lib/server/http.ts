// lib/server/http.ts
import type { NextApiRequest, NextApiResponse } from "next";

export type ApiOk<T> = { ok: true; data: T; meta?: Record<string, unknown> };
export type ApiErr = {
  ok: false;
  error: { code: string; message: string; details?: unknown };
  meta?: Record<string, unknown>;
};

export function setSecurityHeaders(res: NextApiResponse) {
  // Sensible defaults for APIs (tune as needed)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
}

export function jsonOk<T>(res: NextApiResponse, data: T, meta?: ApiOk<T>["meta"]) {
  setSecurityHeaders(res);
  return res.status(200).json({ ok: true, data, meta });
}

export function jsonErr(res: NextApiResponse, status: number, code: string, message: string, details?: unknown) {
  setSecurityHeaders(res);
  const payload: ApiErr = { ok: false, error: { code, message, details } };
  return res.status(status).json(payload);
}

export function getRequestId(req: NextApiRequest): string {
  const fromHeader = req.headers["x-request-id"];
  if (typeof fromHeader === "string" && fromHeader.trim()) return fromHeader.trim();
  // fallback - stable enough for logs
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function methodNotAllowed(res: NextApiResponse, allowed: string[]) {
  res.setHeader("Allow", allowed.join(", "));
  return jsonErr(res, 405, "METHOD_NOT_ALLOWED", `Allowed methods: ${allowed.join(", ")}`);
}

