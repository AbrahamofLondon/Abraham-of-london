// lib/stringUtils.ts

// --- Type Coercion and String Cleaning ---

/**
 * Safely converts any value to a trimmed string.
 * Handles strings (trims them), numbers (converts to string), and returns an empty string for others.
 * @param value The value to convert.
 * @returns The trimmed string or "".
 */
export function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

/**
 * Safely splits a string by a delimiter into an array of trimmed, non-empty parts.
 * @param value The string to split.
 * @param delimiter The character(s) to split by (defaults to comma).
 * @returns An array of non-empty, trimmed strings.
 */
export function safeSplit(value: string | undefined | null, delimiter: string = ","): string[] {
  const safeValue = safeString(value);
  if (!safeValue) return [];
  
  return safeValue
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean); // Filters out any empty strings after trimming
}

/**
 * Parses a width/height string or number (e.g., "800", "800px") into a finite integer.
 * It's safer to use parseInt directly to respect numerical precision.
 * @param v The value to parse.
 * @returns A finite integer or undefined.
 */
export function toNumber(v: number | string | null | undefined): number | undefined {
  if (v == null) return undefined;

  let strValue: string;
  if (typeof v === "number") {
    if (Number.isFinite(v)) return v;
    return undefined;
  } else {
    // Safely convert to string and remove non-digit characters except the negative sign
    strValue = String(v).replace(/[^-\d.]/g, ""); 
  }
  
  // Use parseFloat for robustness, but then floor/ceil if an integer is desired
  const n = Number.parseFloat(strValue);
  
  // Ensure it's a finite number before returning
  return Number.isFinite(n) ? n : undefined;
}


// --- Path and URL Utilities ---

/**
 * True if a string looks like an absolute external URL (http/https, or protocol-relative).
 * This is a robust check used across the codebase (e.g., in lib/siteConfig.ts).
 * @param u The string to check.
 * @returns True if it appears to be an external URL.
 */
export function isExternalUrl(u: string | undefined | null): boolean {
  if (!u) return false;
  // Check for protocol-relative, absolute external, mailto, or tel schemes
  return /^(?:[a-z]+:|\/\/)/i.test(u);
}

/**
 * Ensure a leading slash for local paths; leaves absolute external URLs untouched.
 * @param p The path string.
 * @returns The path starting with '/', or the absolute URL, or an empty string.
 */
export function ensureLeadingSlash(p: string | undefined | null): string {
  if (!p) return "";
  const trimmedPath = p.trim();

  if (isExternalUrl(trimmedPath)) return trimmedPath;
  
  // Ensure it starts with exactly one slash
  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
}

/**
 * Very light email format check. Suitable for client-side form validation.
 * @param s The string to check.
 * @returns True if the string matches a basic email pattern.
 */
export function isEmail(s: string | undefined | null): boolean {
  if (!s) return false;
  // Pattern: [non-space/@]+ @ [non-space/@]+ . [non-space/@]+
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

// --- Array Utilities ---

/**
 * Compacts an array by removing null and undefined values.
 * @param arr The array potentially containing null/undefined values.
 * @returns A new array with only defined values.
 */
export function compact<T>(arr: ReadonlyArray<T | null | undefined>): T[] {
  return arr.filter((x): x is T => x != null);
}

/**
 * Deduplicates string arrays while preserving order.
 * @param arr The array of strings to deduplicate.
 * @returns A new array with unique, ordered elements.
 */
export function uniq(arr: ReadonlyArray<string>): string[] {
  // Leverage Set for efficient deduplication while maintaining order
  return Array.from(new Set(arr));
}