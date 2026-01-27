// lib/utils/string.ts
export function safeString(input: unknown, fallback = ""): string {
  if (typeof input === "string") return input;
  if (input == null) return fallback;
  try {
    return String(input);
  } catch {
    return fallback;
  }
}

export function safeTrim(input: unknown, fallback = ""): string {
  return safeString(input, fallback).trim();
}

export function safeSubstring(input: unknown, start: number, end?: number): string {
  const s = safeString(input);
  const a = Math.max(0, start | 0);
  const b = end == null ? undefined : Math.max(0, end | 0);
  return s.substring(a, b);
}

export function safeTrimSlice(input: unknown, start: number, end?: number): string {
  return safeSubstring(safeTrim(input), start, end);
}

export function isNonEmptyString(input: unknown): input is string {
  return typeof input === "string" && input.trim().length > 0;
}

export function safeEquals(a: unknown, b: unknown): boolean {
  return safeString(a) === safeString(b);
}

export function truncate(input: unknown, max = 120): string {
  const s = safeString(input);
  if (max <= 0) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

export function safeJoin(parts: unknown[], sep = " "): string {
  return parts.map((p) => safeString(p).trim()).filter(Boolean).join(sep);
}

export function safeReplace(input: unknown, search: string | RegExp, replace: string): string {
  return safeString(input).replace(search as any, replace);
}

export function toSlug(input: unknown): string {
  return safeString(input)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function safeCharAt(input: unknown, index: number): string {
  const s = safeString(input);
  const i = index | 0;
  return i >= 0 && i < s.length ? s.charAt(i) : "";
}

export function safeArraySlice<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(start, end);
}

export function capitalize(input: unknown): string {
  const s = safeString(input).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatBytes(bytes: unknown): string {
  const n = typeof bytes === "number" ? bytes : Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const rounded = i === 0 ? Math.round(v) : Math.round(v * 10) / 10;
  return `${rounded} ${units[i]}`;
}