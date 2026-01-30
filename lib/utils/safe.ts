// lib/utils/safe.ts - INDEPENDENT, NO CIRCULAR DEPENDENCIES

// ✅ CORE UTILITIES - Completely independent

// String utilities
export function safeString(str: any, maxLength: number = 1000): string {
  if (str == null) return '';
  if (typeof str !== 'string') {
    try {
      str = String(str);
    } catch {
      return '';
    }
  }
  // Safe slice for strings
  if (str.length > maxLength) {
    return str.substring(0, maxLength);
  }
  return str;
}

export function safeTrim(str: any): string {
  return safeString(str).trim();
}

export function safeSubstring(str: any, start: number, end?: number): string {
  const s = safeString(str);
  try {
    return s.substring(start, end);
  } catch {
    return '';
  }
}

export function safeCharAt(str: any, index: number): string {
  const s = safeString(str);
  return s.charAt(index) || '';
}

export function safeFirstChar(str: any): string {
  return safeCharAt(str, 0);
}

export function capitalize(str: any): string {
  const s = safeString(str);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Alias for compatibility
export const safeCapitalize = capitalize;

export function isNonEmptyString(str: any): boolean {
  return safeString(str).length > 0;
}

// Array utilities
export function safeArray<T>(arr: any): T[] {
  return Array.isArray(arr) ? arr : [];
}

// ✅ CRITICAL FIX: This is what audit.ts needs
export function safeSlice<T>(arr: any, start: number, end?: number): T[] {
  if (!Array.isArray(arr)) return [];
  try {
    // For arrays, use Array.prototype.slice
    return Array.prototype.slice.call(arr, start, end);
  } catch {
    return [];
  }
}

// For strings specifically
export function safeSliceString(str: any, start: number, end?: number): string {
  const s = safeString(str);
  try {
    return s.slice(start, end);
  } catch {
    return '';
  }
}

export function safeArraySlice<T>(arr: any, start: number, end?: number): T[] {
  return safeSlice<T>(arr, start, end);
}

export function safeTrimSlice<T>(arr: any, start: number, end?: number): T[] {
  return safeSlice<T>(arr, start, end);
}

export function safeSliceAlt<T>(arr: any, start: number, end?: number): T[] {
  return safeSlice<T>(arr, start, end);
}

// Number utilities
export function safeNumber(input: any, fallback = 0): number {
  if (input == null) return fallback;
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

export function safeInteger(input: any): number {
  return Math.floor(safeNumber(input, 0));
}

export function safeParseInt(value: any, defaultValue = 0): number {
  if (typeof value === "number") return Math.floor(value);
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export function safeParseFloat(value: any, defaultValue = 0): number {
  if (typeof value === "number") return value;
  const parsed = parseFloat(String(value));
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

// Boolean utilities
export function safeBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return !["false", "no", "0", "off", ""].includes(lower);
  }
  return Boolean(value);
}

// URL/Path utilities
export function safeUrl(input: any, fallback = "#"): string {
  const s = safeString(input).trim();
  if (!s) return fallback;
  if (s.startsWith("/")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return fallback;
}

export function safeImageSrc(input: any, fallback = "/assets/images/writing-desk.webp"): string {
  return safeUrl(input, fallback);
}

// Date utilities
export function safeDate(input: any): Date | null {
  if (!input) return null;
  try {
    const d = input instanceof Date ? input : new Date(String(input));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function safeDateSlice(input: any, start = 0, end = 10): string {
  const d = safeDate(input);
  if (!d) return "";
  return d.toISOString().slice(start, end);
}

export function formatSafeDate(input: any, locale: string = "en-GB"): string {
  try {
    const d = safeDate(input);
    if (!d) return "";
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(d);
  } catch {
    return "";
  }
}

// Object utilities
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

// Other utilities
export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Simple versions of other functions (to avoid dependencies)
export function safeEquals(a: any, b: any): boolean {
  return String(a) === String(b);
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function truncate(str: any, maxLength = 100, suffix = '...'): string {
  const s = safeString(str);
  if (s.length <= maxLength) return s;
  return s.substring(0, maxLength) + suffix;
}

export function safeJoin(arr: any, separator = ', '): string {
  const a = safeArray(arr);
  return a.map(item => safeString(item)).join(separator);
}

export function safeReplace(str: any, searchValue: string | RegExp, replaceValue: string): string {
  const s = safeString(str);
  return s.replace(searchValue, replaceValue);
}

export function toSlug(str: any): string {
  const s = safeString(str);
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Default export for easy imports
const safe = {
  // Core
  safeString,
  safeNumber,
  safeArray,
  safeBoolean,
  safeUrl,
  safeImageSrc,
  safeDate,
  safeInteger,
  
  // String
  safeTrim,
  safeSubstring,
  safeFirstChar,
  safeCharAt,
  safeCapitalize,
  capitalize,
  isNonEmptyString,
  safeEquals,
  formatBytes,
  truncate,
  safeJoin,
  safeReplace,
  toSlug,
  
  // Array
  safeSlice,
  safeSliceAlt,
  safeArraySlice,
  safeTrimSlice,
  
  // Date
  safeDateSlice,
  formatSafeDate,
  
  // Type conversion
  safeParseInt,
  safeParseFloat,
  
  // Object
  safeGet,
  
  // CSS
  classNames,
};

export default safe;