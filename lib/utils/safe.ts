export {
  safeString,
  safeTrim,
  safeSubstring,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,

  // naming compat
  safeCharAt,
  safeArraySlice,
  capitalize as safeCapitalize,
} from "@/lib/utils/string";

export const safeFirstChar = safeCharAt;

export function safeSlice<T>(arr: T[] | null | undefined, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  return arr.slice(start, end);
}