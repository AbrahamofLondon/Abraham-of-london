// lib/stringUtils.ts

/** Safely converts any value to a trimmed string, or empty string if not a string */
export function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

/** Safely splits a string by a delimiter into trimmed parts, or returns empty array */
export function safeSplit(value: string, delimiter: string): string[] {
  if (!value) return [];
  return value
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Parse a width/height string or number (e.g. "800", "800px") into a number */
export function toNumber(v?: number | string): number | undefined {
  if (v == null) return undefined;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseInt(String(v).replace(/[^\d.-]/g, ""), 10);
  return Number.isFinite(n) ? n : undefined;
}

/** True if a string looks like an absolute URL (http/https) */
export function isAbsoluteUrl(u?: string): boolean {
  if (!u) return false;
  return /^https?:\/\//i.test(u);
}

/** Ensure a leading slash for local paths; leaves absolute URLs untouched */
export function ensureLeadingSlash(p?: string): string {
  if (!p) return "";
  if (isAbsoluteUrl(p)) return p;
  return p.startsWith("/") ? p : `/${p}`;
}

/** Very light email check (client-side validation) */
export function isEmail(s?: string): boolean {
  if (!s) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Compact undefined/null values from an array */
export function compact<T>(arr: (T | null | undefined)[]): T[] {
  return arr.filter((x): x is T => x != null);
}

/** Deduplicate string arrays while preserving order */
export function uniq(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
