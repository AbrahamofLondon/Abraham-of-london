// lib/stringUtils.ts

/** Safely converts any value to a trimmed string, or empty string if not a string */
export function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return value.toString();
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













