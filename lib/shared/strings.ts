// lib/utils/string.ts
/**
 * Safe string utilities with no self-imports or infinite recursion.
 * ✅ Compliant with scripts/check-unsafe-strings.js (no .charAt(), no .slice()).
 * Safe for Edge/Node runtimes.
 */

// Core safe string conversion
export function safeString(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

// Capitalize first letter (no charAt/slice)
export function capitalize(v: unknown): string {
  const s = safeString(v).trim();
  if (!s) return "";

  // Use bracket indexing + substring (scanner allows substring)
  const first = s.length > 0 ? s[0] : "";
  const rest = s.substring(1);
  return first ? first.toUpperCase() + rest : s;
}

// Safe character at index (no charAt)
export function safeCharAt(str: unknown, index: number): string {
  const s = safeString(str);
  if (!Number.isFinite(index)) return "";
  const i = Math.floor(index);
  if (i >= 0 && i < s.length) return s[i] ?? "";
  return "";
}

// Safe slicing (for arrays) — no slice()
export function safeArraySlice<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr) || arr.length === 0) return [];

  const len = arr.length;
  const s = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;

  const e =
    end === undefined || end === null
      ? len
      : Number.isFinite(end)
        ? Math.max(0, Math.floor(end))
        : len;

  const out: T[] = [];
  for (let i = s; i < e && i < len; i++) out.push(arr[i]);
  return out;
}

// Tier formatting
export function formatTier(tier: unknown): "Private" | "Inner Circle" | "Public" {
  const s = safeString(tier).toLowerCase().trim();
  if (s.includes("private")) return "Private";
  if (s.includes("inner") || s.includes("member")) return "Inner Circle";
  return "Public";
}

// Safe trim
export function safeTrim(v: unknown): string {
  return safeString(v).trim();
}

// Safe substring
export function safeSubstring(str: unknown, start: number, end?: number): string {
  const s = safeString(str);
  const a = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;

  if (end === undefined) return s.substring(a);

  const b = Number.isFinite(end) ? Math.max(0, Math.floor(end)) : a;
  return s.substring(a, b);
}

// Check if string is non-empty
export function isNonEmptyString(v: unknown): boolean {
  return safeString(v).trim().length > 0;
}

// Case-insensitive equality check
export function safeEquals(a: unknown, b: unknown, ignoreCase = false): boolean {
  const strA = safeString(a);
  const strB = safeString(b);
  return ignoreCase ? strA.toLowerCase() === strB.toLowerCase() : strA === strB;
}

// Format bytes to human readable size
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const val = bytes / Math.pow(k, i);
  return `${parseFloat(val.toFixed(2))} ${sizes[i]}`;
}

// Truncate string with ellipsis
export function truncate(str: unknown, maxLength: number, ellipsis = "…"): string {
  const s = safeString(str);
  const n = Number.isFinite(maxLength) ? Math.max(0, Math.floor(maxLength)) : 0;
  if (s.length <= n) return s;
  return s.substring(0, n) + ellipsis;
}

// Safe join
export function safeJoin(array: unknown[], separator = ", "): string {
  if (!Array.isArray(array)) return "";
  return array
    .map((item) => safeString(item))
    .filter(Boolean)
    .join(separator);
}

// Safe replace
export function safeReplace(str: unknown, searchValue: string | RegExp, replaceValue: string): string {
  const s = safeString(str);
  return s.replace(searchValue, replaceValue);
}

// URL safe slug (no slice/charAt used)
export function toSlug(str: unknown): string {
  const s = safeString(str);
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Default export
const stringUtils = {
  safeString,
  capitalize,
  safeCharAt,
  safeArraySlice,
  formatTier,
  safeTrim,
  safeSubstring,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,
};

export default stringUtils;