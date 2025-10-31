// lib/safe-coercion.ts
// Central utility module for safely coercing unknown values to specific types.

/**
 * Safely converts null or undefined values to strictly undefined.
 * This is useful for passing optional props where null is invalid.
 * @param v The value to check.
 * @returns T if value is present, otherwise undefined.
 */
export function undef<T>(v: T | null | undefined): T | undefined {
  // Use loose comparison (==) to catch both null and undefined
  return v == null ? undefined : v;
}

/**
 * Coerces a value into a non-negative integer, or undefined.
 * @param v The value to coerce.
 * @returns A non-negative integer or undefined.
 */
export function toInteger(v: unknown): number | undefined {
  const value = Number(v);
  if (Number.isInteger(value) && value >= 0 && Number.isFinite(value)) {
    return value;
  }
  
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number.parseInt(v.trim(), 10);
    return Number.isInteger(n) && n >= 0 && Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Coerces a value into a boolean.
 * Treats 'true', '1', and non-zero numbers as true; everything else as false.
 * @param v The value to coerce.
 * @returns The boolean equivalent.
 */
export function toBoolean(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true' || v.toLowerCase() === '1';
  if (typeof v === 'number') return v === 1;
  return false;
}

/**
 * Coerces a value into an ISO 8601 date string, or undefined if not a valid date.
 * @param v The value to coerce.
 * @returns An ISO date string (YYYY-MM-DDTHH:mm:ss.sssZ) or undefined.
 */
export function toDateString(v: unknown): string | undefined {
  let date: Date;

  if (v instanceof Date) {
    date = v;
  } else if (typeof v === "number") {
    date = new Date(v);
  } else if (typeof v === "string") {
    const t = Date.parse(v);
    if (Number.isNaN(t)) return undefined;
    date = new Date(t);
  } else {
    return undefined;
  }

  return isNaN(date.getTime()) ? undefined : date.toISOString();
}

/**
 * Coerces a value into an array of trimmed, non-empty strings.
 * Handles single strings (comma-separated) or existing arrays.
 * @param v The value to coerce.
 * @returns An array of strings.
 */
export function toStringArray(v: unknown): string[] {
  let values: unknown[] = [];

  if (Array.isArray(v)) {
    values = v;
  } else if (typeof v === "string") {
    values = v.split(',');
  }
  
  return values
    .map(String)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Coerces a value into a finite floating-point number within a min/max range, or undefined.
 * Useful for fields like 'rating'.
 * @param v The value to coerce.
 * @param min The minimum allowed value (inclusive).
 * @param max The maximum allowed value (inclusive).
 * @returns The finite number or undefined.
 */
export function toRangedNumber(v: unknown, min = 0, max = 5): number | undefined {
  const n = Number(v);
  
  if (Number.isFinite(n) && n >= min && n <= max) {
    return n;
  }
  
  return undefined;
}