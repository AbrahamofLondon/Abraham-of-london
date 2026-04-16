import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures a value is a string, providing a fallback
 */
export function safeString(val: any, fallback: string = ""): string {
  if (typeof val === 'string') return val;
  if (val === null || val === undefined) return fallback;
  return String(val);
}

/**
 * Type guard for strings
 */
export function isString(val: any): val is string {
  return typeof val === 'string';
}

/**
 * Surface detection helper - extracts surface from pathname
 */
export function detectSurfaceFromPath(pathname: string): string | null {
  const surfaces = ['canon', 'vault', 'shorts', 'essays', 'books', 'library', 
                    'inner-circle', 'downloads', 'resources', 'events', 
                    'editorial', 'vault-briefs'];
  
  for (const surface of surfaces) {
    if (pathname.startsWith(`/${surface}`)) {
      return surface;
    }
  }
  return null;
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncate(text: string, length: number = 160, ellipsis: string = '...'): string {
  if (!text || text.length <= length) return text;
  return text.substring(0, length).trim() + ellipsis;
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(date: string | Date, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculates estimated read time in minutes
 */
export function getReadTime(content: string, wordsPerMinute: number = 200): number {
  const wordCount = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

/**
 * Safely extracts nested object properties
 */
export function getNestedValue(obj: any, path: string, fallback: any = undefined): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return fallback;
    }
    result = result[key];
  }
  
  return result === undefined ? fallback : result;
}