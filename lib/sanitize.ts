// lib/sanitize.ts

/**
 * Safely converts null/undefined to undefined while preserving other falsy values
 */
export const undef = <T>(v: T | null | undefined): T | undefined =>
  v == null ? undefined : v;

/**
 * Convert null/undefined to a default value
 */
export const withDefault = <T, D>(v: T | null | undefined, defaultValue: D): T | D =>
  v == null ? defaultValue : v;

/**
 * Convert empty string to undefined (useful for form inputs)
 */
export const undefEmpty = <T extends string>(v: T | null | undefined): T | undefined =>
  v?.trim() === "" ? undefined : undef(v);

/**
 * Convert falsy values to undefined (0, false, '', etc.)
 */
export const undefFalsy = <T>(v: T | null | undefined): T | undefined =>
  v ? v : undefined;

/**
 * Safe number conversion with fallback
 */
export const safeNumber = (v: unknown, fallback: number = 0): number => {
  if (v == null) return fallback;
  const num = Number(v);
  return isNaN(num) ? fallback : num;
};

/**
 * Safe string conversion
 */
export const safeString = (v: unknown, fallback: string = ""): string => {
  if (v == null) return fallback;
  if (typeof v === "string") return v;
  return String(v);
};

/**
 * Safe boolean conversion
 */
export const safeBoolean = (v: unknown, fallback: boolean = false): boolean => {
  if (v == null) return fallback;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const lower = v.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  if (typeof v === "number") return v !== 0;
  return Boolean(v);
};

