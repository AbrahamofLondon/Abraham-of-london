// lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- 1. UI & Styling Utilities ---

/**
 * Combines Tailwind CSS class strings intelligently.
 * Uses `clsx` for conditional classes and `tailwind-merge` for resolving conflicts.
 * @param inputs The class values to merge.
 * @returns A single, clean class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ensures a value is a non-negative integer.
 * @param value The value to check.
 * @param fallback The value to return if not a valid integer.
 * @returns A non-negative integer.
 */
export function safePositiveInteger(value: unknown, fallback: number = 0): number {
  const n = Number(value);
  if (Number.isInteger(n) && n >= 0) {
    return n;
  }
  return fallback;
}


// --- 2. Data & Formatting Utilities ---

/**
 * Converts bytes to a human-readable size string (e.g., "4.5 MB").
 * @param bytes The size in bytes.
 * @returns A formatted string.
 */
export function humanFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // Use toFixed(1) for KB, MB, GB, and integer for B
  const sizeValue = parseFloat((bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1));
  
  return sizeValue + ' ' + sizes[i];
}


// --- 3. Security & URL Utilities ---

/**
 * Safely escapes HTML characters in a string to prevent XSS attacks in HTML contexts.
 * This is the original function, slightly improved with explicit typing.
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return String(str);
  
  // Map for HTML entities
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  
  // Replace all special characters
  return str.replace(/[&<>"']/g, (m) => map[m] || m);
}

/**
 * Determines if a given URL is a full external URL.
 * @param url The URL string.
 * @returns True if the URL is external (starts with http(s)://, mailto, tel, etc.), false otherwise.
 */
export function isExternalUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) return false;
  // Check for protocol-relative, absolute external, mailto, or tel schemes
  return /^(?:[a-z]+:|\/\/)/i.test(url);
}