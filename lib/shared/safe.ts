// lib/shared/safe.ts
export {
  safeString,
  safeTrim,
  safeSubstring,
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
  capitalize as safeCapitalize,
  capitalize,
} from "@/lib/utils/string";

export function safeSlice<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(start, end);
}

// aliases your UI expects
export function safeArray<T>(arr: T[] | null | undefined): T[] {
  return Array.isArray(arr) ? arr : [];
}

export function safeNumber(input: unknown, fallback = 0): number {
  const n = typeof input === "number" ? input : Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function safeDate(input: unknown): Date | null {
  const d = input instanceof Date ? input : new Date(String(input));
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatSafeDate(input: unknown, fallback = ""): string {
  const d = safeDate(input);
  if (!d) return fallback;
  return d.toISOString().slice(0, 10);
}

export function safeDateSlice(input: unknown, start = 0, end = 10, fallback = ""): string {
  const s = typeof input === "string" ? input : formatSafeDate(input, "");
  if (!s) return fallback;
  return s.slice(start, end);
}

export function safeUrl(input: unknown, fallback = "#"): string {
  const s = safeString(input).trim();
  if (!s) return fallback;
  // allow relative or absolute http(s)
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

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}