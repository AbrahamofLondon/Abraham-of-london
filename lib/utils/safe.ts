// lib/utils/safe.ts
// Barrel file that re-exports ALL safe utilities

export * from "@/lib/shared/safe";

// Explicitly export all functions for clarity
export {
  safeSlice,
  safeArraySlice,
  safeFirstChar,
  safeCapitalize,
  safeGet,
  safeDate,
  safeInteger,
  safeTrimSlice,
  safeSubstring,
  safeNumber,
  safeUrl,
  safeImageSrc,
  safeDateSlice,
  classNames,
  formatSafeDate,
  safeParseInt,
  safeParseFloat,
  safeBoolean,
  safeArray,
  safeSliceAlt,
  // String utilities
  safeString,
  safeTrim,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,
  safeCharAt,
  capitalize,
} from "@/lib/shared/safe";