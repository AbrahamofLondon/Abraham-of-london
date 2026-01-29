// lib/utils/safe.ts - FINAL SIMPLE VERSION
// Barrel file that re-exports ALL safe utilities

// Export everything from the source
export * from "@/lib/shared/safe";

// Explicitly re-export key functions to ensure they're available
export {
  // Core functions
  safeString,
  safeNumber,
  safeArray,
  safeBoolean,
  safeUrl,
  safeImageSrc,
  safeDate,
  safeInteger,
  
  // String utilities
  safeTrim,
  safeSubstring,
  safeFirstChar, // This should be exported
  safeCharAt,
  safeCapitalize, // This should be exported
  capitalize,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,
  
  // Array utilities
  safeSlice, // This should be exported
  safeSliceAlt,
  safeArraySlice,
  safeTrimSlice,
  
  // Date utilities
  safeDateSlice,
  formatSafeDate,
  
  // Type conversion
  safeParseInt,
  safeParseFloat,
  
  // Object utilities
  safeGet,
  
  // CSS utilities
  classNames,
} from "@/lib/shared/safe";