/**
 * ULTIMATE SAFETY UTILITIES FOR ZERO-CRASH COMPONENTS
 * Use these instead of direct string/number operations
 */

// ==================== TYPE SAFETY ====================
export type Maybe<T> = T | null | undefined;
export type SafeValue<T> = T extends Maybe<infer U> ? U : T;

// ==================== INTERNAL SAFE PRIMITIVES ====================
// These use direct string access in a controlled way
const internalSafeString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && !isNaN(value)) return String(value);
  if (typeof value === 'boolean') return String(value);
  if (value == null) return '';
  
  try {
    return String(value);
  } catch {
    return '';
  }
};

const internalCharAt = (str: string, index: number): string => {
  if (str.length === 0 || index < 0 || index >= str.length) return '';
  return str[index] || '';
};

const internalSlice = (str: string, start?: number, end?: number): string => {
  if (str.length === 0) return '';
  
  const safeStart = start == null ? 0 : Math.max(0, Math.min(start, str.length));
  const safeEnd = end == null ? str.length : Math.max(0, Math.min(end, str.length));
  
  if (safeStart >= safeEnd) return '';
  
  let result = '';
  for (let i = safeStart; i < safeEnd && i < str.length; i++) {
    result += str[i];
  }
  return result;
};

// ==================== PUBLIC STRING SAFETY ====================
export const safeString = (value: unknown, fallback: string = ''): string => {
  const str = internalSafeString(value);
  const trimmed = str.trim();
  return trimmed || fallback;
};

export const safeFirstChar = (value: unknown, fallback: string = '?'): string => {
  const str = safeString(value);
  const firstChar = internalCharAt(str, 0);
  return firstChar ? firstChar.toUpperCase() : fallback;
};

export const safeCharAt = (
  value: unknown, 
  index: number = 0, 
  fallback: string = ''
): string => {
  if (!Number.isInteger(index) || index < 0) return fallback;
  const str = safeString(value);
  const char = internalCharAt(str, index);
  return char || fallback;
};

export const safeCapitalize = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  const firstChar = internalCharAt(str, 0).toUpperCase();
  const rest = internalSlice(str, 1).toLowerCase();
  return firstChar + rest;
};

export const safeTitleCase = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  const words = str.split(' ').filter(Boolean);
  if (words.length === 0) return fallback;
  
  const resultWords: string[] = [];
  for (const word of words) {
    const firstChar = internalCharAt(word, 0).toUpperCase();
    const rest = internalSlice(word, 1).toLowerCase();
    resultWords.push(firstChar + rest);
  }
  
  return resultWords.join(' ');
};

export const safeSlice = (
  value: unknown,
  start?: number,
  end?: number,
  fallback: string = ''
): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  const result = internalSlice(str, start, end);
  return result || fallback;
};

export const safeTruncate = (
  value: unknown, 
  maxLength: number = 100, 
  ellipsis: string = '...'
): string => {
  if (maxLength <= 0) return ellipsis;
  
  const str = safeString(value);
  if (str.length <= maxLength) return str;
  
  const safeEllipsis = safeString(ellipsis, '...');
  const ellipsisLength = safeEllipsis.length;
  
  if (maxLength <= ellipsisLength) return safeEllipsis;
  
  const contentLength = maxLength - ellipsisLength;
  const content = internalSlice(str, 0, contentLength);
  return content + safeEllipsis;
};

// ==================== ARRAY SAFETY ====================
export const safeArray = <T>(
  value: unknown, 
  fallback: T[] = []
): T[] => {
  if (!Array.isArray(value)) return fallback;
  
  const result: T[] = [];
  for (const item of value) {
    if (item != null) {
      result.push(item as T);
    }
  }
  return result;
};

export const safeArraySlice = <T>(
  value: unknown,
  start?: number,
  end?: number,
  fallback: T[] = []
): T[] => {
  const arr = safeArray<T>(value, fallback);
  
  if (arr.length === 0) return arr;
  
  const safeStart = start == null ? 0 : Math.max(0, Math.floor(start));
  const safeEnd = end == null ? arr.length : Math.max(0, Math.floor(end));
  
  if (safeStart >= safeEnd) return [];
  
  const result: T[] = [];
  for (let i = safeStart; i < safeEnd && i < arr.length; i++) {
    result.push(arr[i]);
  }
  return result;
};

// ==================== OBJECT SAFETY ====================
export const safeObject = <T extends Record<string, unknown>>(
  value: unknown, 
  fallback: T = {} as T
): T => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }
  return fallback;
};

// ==================== NUMBER SAFETY ====================
export const safeNumber = (value: unknown, fallback: number = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return fallback;
    const parsed = parseFloat(trimmed);
    if (!isNaN(parsed)) return parsed;
  }
  return fallback;
};

export const safeInteger = (value: unknown, fallback: number = 0): number => {
  const num = safeNumber(value, fallback);
  return Math.round(num);
};

// ==================== URL/IMAGE SAFETY ====================
export const safeUrl = (value: unknown, fallback: string = '/'): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  // Check for valid URL patterns
  if (
    internalSlice(str, 0, 1) === '/' ||
    internalSlice(str, 0, 7) === 'http://' ||
    internalSlice(str, 0, 8) === 'https://'
  ) {
    return str;
  }
  
  return fallback;
};

export const safeImageSrc = (value: unknown): string | null => {
  const str = safeString(value);
  if (!str) return null;
  
  if (
    internalSlice(str, 0, 1) === '/' ||
    internalSlice(str, 0, 7) === 'http://' ||
    internalSlice(str, 0, 8) === 'https://' ||
    internalSlice(str, 0, 11) === 'data:image/'
  ) {
    return str;
  }
  
  return null;
};

// ==================== DATE SAFETY ====================
export const safeDate = (value: unknown, fallback: Date = new Date()): Date => {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date;
  }
  
  return fallback;
};

export const formatSafeDate = (
  value: unknown, 
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  },
  locale: string = 'en-GB'
): string => {
  try {
    const date = safeDate(value);
    return date.toLocaleDateString(locale, options);
  } catch {
    return '';
  }
};

// ==================== DEEP SAFETY ====================
export const safeGet = <T>(
  obj: unknown,
  path: string,
  fallback: T
): T => {
  if (typeof obj !== 'object' || obj === null) return fallback;
  
  const keys = safeString(path).split('.').filter(Boolean);
  if (keys.length === 0) return fallback;
  
  let current: any = obj;
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') {
      return fallback;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined ? current as T : fallback;
};

// ==================== COMPONENT UTILS ====================
export const withDefaults = <T extends Record<string, unknown>>(
  props: T,
  defaults: Partial<T>
): T => {
  const result: T = { ...defaults } as T;
  
  for (const key in props) {
    if (props[key] !== undefined) {
      result[key] = props[key];
    } else if (defaults[key] !== undefined) {
      result[key] = defaults[key];
    }
  }
  
  return result;
};

export const classNames = (...classes: (string | false | null | undefined)[]): string => {
  const result: string[] = [];
  
  for (const className of classes) {
    if (className && typeof className === 'string') {
      result.push(className);
    }
  }
  
  return result.join(' ');
};

// ==================== STRING TRANSFORMATION HELPERS ====================
export const safeToUpperCase = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += internalCharAt(str, i).toUpperCase();
  }
  return result;
};

export const safeToLowerCase = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  if (!str) return fallback;
  
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += internalCharAt(str, i).toLowerCase();
  }
  return result;
};

// ==================== COMMON PATTERNS ====================
export const safeInitials = (name: unknown, maxLength: number = 2): string => {
  const str = safeString(name);
  if (!str) return '?';
  
  const parts = str.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  
  let initials = '';
  for (let i = 0; i < Math.min(parts.length, maxLength); i++) {
    initials += safeFirstChar(parts[i]);
  }
  
  return initials;
};

export const safeJoin = (
  array: unknown,
  separator: string = ', ',
  fallback: string = ''
): string => {
  const arr = safeArray<unknown>(array);
  if (arr.length === 0) return fallback;
  
  const safeSeparator = safeString(separator, ', ');
  let result = '';
  
  for (let i = 0; i < arr.length; i++) {
    if (i > 0) {
      result += safeSeparator;
    }
    result += safeString(arr[i]);
  }
  
  return result;
};

export const safeStartsWith = (str: unknown, searchString: string, position?: number): boolean => {
  const safeStr = safeString(str);
  const safeSearch = safeString(searchString);
  
  if (!safeStr || !safeSearch) return false;
  
  const start = position == null ? 0 : Math.max(0, Math.floor(position));
  if (start + safeSearch.length > safeStr.length) return false;
  
  for (let i = 0; i < safeSearch.length; i++) {
    if (internalCharAt(safeStr, start + i) !== internalCharAt(safeSearch, i)) {
      return false;
    }
  }
  
  return true;
};

export const safeEndsWith = (str: unknown, searchString: string, length?: number): boolean => {
  const safeStr = safeString(str);
  const safeSearch = safeString(searchString);
  
  if (!safeStr || !safeSearch) return false;
  
  const strLength = safeStr.length;
  const searchLength = safeSearch.length;
  const end = length == null ? strLength : Math.min(Math.max(0, Math.floor(length)), strLength);
  const start = end - searchLength;
  
  if (start < 0) return false;
  
  for (let i = 0; i < searchLength; i++) {
    if (internalCharAt(safeStr, start + i) !== internalCharAt(safeSearch, i)) {
      return false;
    }
  }
  
export const safeDateSlice = (
  date: Date | string,
  start: number = 0,
  end?: number
): string => {
  const dateStr = date instanceof Date ? date.toISOString() : String(date);
  return safeSlice(dateStr, start, end);
};

export const safeTrim = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  return str.trim();
};

export const safeTrimSlice = (
  value: unknown,
  start: number,
  end: number,
  fallback: string = ''
): string => {
  const str = safeString(value);
  const trimmed = str.trim();
  return safeSlice(trimmed, start, end, fallback);
};

export const safeNewUtility = (value: unknown, fallback: string = ''): string => {
  const str = safeString(value);
  // Safe implementation here...
  return result || fallback;
};

  return true;
};