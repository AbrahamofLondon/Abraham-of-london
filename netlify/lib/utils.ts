// netlify/functions/_utils.ts
import type { HandlerResponse } from "@netlify/functions";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org";
  return String(raw).replace(/\/$/, "");
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { return (await req.json()) as T; } catch { /* fall through */ }
  }
  return {} as T;
}

export function json(body: unknown, status = 200): HandlerResponse {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

export function bad(message = "Bad Request", status = 400): HandlerResponse {
  return json({ ok: false, message }, status);
}

export function ok(message = "OK", extra: Record<string, unknown> = {}): HandlerResponse {
  return json({ ok: true, message, ...extra }, 200);
}

export function methodNotAllowed(): HandlerResponse {
  return json({ ok: false, message: "Method Not Allowed" }, 405);
}

export function handleOptions(): HandlerResponse {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: "",
  };
}

export function escapeHtml(str: string) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const)[m] || m
  );
}
