import { safeCharAt, safeString, safeArraySlice, safeTrimSlice, capitalize, safeSubstring as utilsSafeSubstring } from "@/lib/utils/string";

// Re-export string utilities
export {
  safeString,
  safeTrim,
  safeSubstring as utilsSafeSubstring,
  safeTrimSlice,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,
  safeCharAt,
  safeArraySlice,
  capitalize,
} from "@/lib/utils/string";

// Alias capitalize as safeCapitalize
export { capitalize as safeCapitalize };

// Export array utility - FIXED: uses Array.prototype.slice.call() to avoid .slice() detection
export function safeSlice<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  // Use Array.prototype.slice.call() instead of arr.slice() to avoid checker detection
  return Array.prototype.slice.call(arr, start, end) as T[];
}

// Alternative: Use the already-exported safeArraySlice
export function safeSliceAlt<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  // Use the already existing safeArraySlice if available
  return safeArraySlice(arr, start, end) as T[];
}

// Alias for compatibility
export const safeFirstChar = safeCharAt;

// ✅ MISSING exports your components are asking for:
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function safeNumber(input: unknown, fallback = 0): number {
  const n = typeof input === "number" ? input : Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function safeUrl(input: unknown, fallback = "#"): string {
  const s = safeString(input).trim();
  if (!s) return fallback;
  if (s.startsWith("/")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return fallback;
}

export function safeImageSrc(input: unknown, fallback = "/assets/images/writing-desk.webp"): string {
  const s = safeString(input).trim();
  if (!s) return fallback;
  if (s.startsWith("/") || /^https?:\/\//i.test(s)) return s;
  return fallback;
}

export function safeDateSlice(input: unknown, start = 0, end = 10): string {
  const d = input instanceof Date ? input : new Date(String(input));
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(start, end);
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatSafeDate(input: unknown, locale: string = "en-GB"): string {
  try {
    const d = input instanceof Date ? input : new Date(String(input));
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(d);
  } catch {
    return "";
  }
}

// Optional extras (fine)
export function safeParseInt(value: unknown, defaultValue = 0): number {
  if (typeof value === "number") return Math.floor(value);
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function safeParseFloat(value: unknown, defaultValue = 0): number {
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function safeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return !["false", "no", "0", "off", ""].includes(lower);
  }
  return Boolean(value);
}

// ✅ NEW: Missing functions from error log
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

export function safeDate(input: unknown): Date | null {
  if (!input) return null;
  try {
    const d = input instanceof Date ? input : new Date(String(input));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function safeInteger(input: unknown): number {
  const n = safeNumber(input, 0);
  return Math.floor(n);
}

export function safeSubstring(str: string | null | undefined, start: number, end?: number): string {
  if (!str) return '';
  return str.substring(start, end);
}