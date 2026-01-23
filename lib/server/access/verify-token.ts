// lib/server/access/verify-token.ts
export type AccessTier = "public" | "inner-circle" | "private";

function parseAllowList(envValue?: string): Set<string> {
  // Comma-separated tokens, no spaces ideally
  const raw = (envValue || "").split(",").map(s => s.trim()).filter(Boolean);
  return new Set(raw);
}

const INNER = parseAllowList(process.env.INNER_CIRCLE_TOKENS);
const PRIVATE = parseAllowList(process.env.PRIVATE_TOKENS);

export function verifyAccessToken(token: string | null | undefined): AccessTier | null {
  const t = (token || "").trim();
  if (!t) return null;

  if (PRIVATE.has(t)) return "private";
  if (INNER.has(t)) return "inner-circle";

  return null;
}