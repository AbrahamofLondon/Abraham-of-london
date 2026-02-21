// lib/utils/safe-string.ts
export function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

export function safeSplit(v: unknown, sep: string | RegExp, fallback: string[] = []): string[] {
  const s = safeString(v, "");
  if (!s) return fallback;
  return s.split(sep);
}