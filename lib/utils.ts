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