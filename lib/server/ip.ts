// lib/server/ip.ts
import type { NextApiRequest } from "next";

export function getClientIp(req: NextApiRequest | { headers: Record<string, any> }): string {
  const headers = req.headers || {};
  const fwd = headers["x-forwarded-for"];
  if (Array.isArray(fwd)) return fwd[0];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();

  const real = headers["x-real-ip"];
  if (typeof real === "string") return real;

  // Netlify-style header
  const clientIp = headers["client-ip"];
  if (typeof clientIp === "string") return clientIp;

  // fallback
  return "unknown";
}