// /lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* -------------------------------------------------------------------------- */
/* ENVIRONMENT & CONFIG                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Environment variable names used across the application
 */
export const ENV_KEYS = {
  // URL Configuration
  ALOMARADA_URL: 'NEXT_PUBLIC_ALOMARADA_URL',
  ENDURELUXE_URL: 'NEXT_PUBLIC_ENDURELUXE_URL',
  INNOVATEHUB_URL: 'NEXT_PUBLIC_INNOVATEHUB_URL',
  INNOVATEHUB_ALT_URL: 'NEXT_PUBLIC_INNOVATEHUB_ALT_URL',
  SITE_URL: 'NEXT_PUBLIC_SITE_URL',
  
  // API & Services
  API_URL: 'NEXT_PUBLIC_API_URL',
  API_KEY: 'NEXT_PUBLIC_API_KEY',
  STRAPI_URL: 'NEXT_PUBLIC_STRAPI_URL',
  
  // Analytics & Monitoring
  GOOGLE_ANALYTICS_ID: 'NEXT_PUBLIC_GA_ID',
  POSTHOG_KEY: 'NEXT_PUBLIC_POSTHOG_KEY',
  SENTRY_DSN: 'NEXT_PUBLIC_SENTRY_DSN',
  
  // Authentication & Security
  JWT_SECRET: 'JWT_SECRET',
  NEXTAUTH_SECRET: 'NEXTAUTH_SECRET',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  
  // Email & Notifications
  SMTP_HOST: 'SMTP_HOST',
  SMTP_PORT: 'SMTP_PORT',
  SMTP_USER: 'SMTP_USER',
  SMTP_PASS: 'SMTP_PASS',
  RESEND_API_KEY: 'RESEND_API_KEY',
  
  // Database & Storage
  DATABASE_URL: 'DATABASE_URL',
  S3_BUCKET: 'S3_BUCKET',
  CDN_URL: 'NEXT_PUBLIC_CDN_URL',
  
  // Feature Flags
  ENABLE_BETA: 'NEXT_PUBLIC_ENABLE_BETA',
  MAINTENANCE_MODE: 'NEXT_PUBLIC_MAINTENANCE_MODE',
} as const;

type EnvKey = keyof typeof ENV_KEYS;
type EnvValue = string | number | boolean | undefined;

/* -------------------------------------------------------------------------- */
/* ENVIRONMENT HELPERS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Safely gets an environment variable with fallbacks
 * @param key The environment variable key
 * @param defaultValue Fallback value if not found
 * @param options Configuration options
 */
export function getEnv<T = string>(
  key: EnvKey | string,
  defaultValue?: T,
  options: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
    validate?: (value: string) => boolean;
  } = {}
): T {
  const { required = false, type = 'string', validate } = options;
  
  // Get the actual environment variable name
  const envKey = ENV_KEYS[key as EnvKey] || key;
  
  // Get value from appropriate source
  let value: string | undefined;
  
  if (typeof window !== 'undefined') {
    // Client-side: check for global variables
    // For NEXT_PUBLIC_ variables, they should be available in the global scope
    const globalValue = (window as any)[envKey];
    if (globalValue !== undefined) {
      value = String(globalValue);
    }
  } else {
    // Server-side: check process.env
    value = process.env[envKey];
  }
  
  // Handle missing values
  if (value === undefined || value === '') {
    if (required) {
      throw new Error(`Environment variable ${envKey} is required but not set`);
    }
    
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    
    return undefined as T;
  }
  
  // Type conversion
  let typedValue: any = value;
  
  switch (type) {
    case 'number':
      typedValue = Number(value);
      if (isNaN(typedValue)) {
        throw new Error(`Environment variable ${envKey} must be a valid number`);
      }
      break;
    case 'boolean':
      typedValue = value.toLowerCase() === 'true' || value === '1';
      break;
    default:
      typedValue = value;
  }
  
  // Custom validation
  if (validate && !validate(String(value))) {
    throw new Error(`Environment variable ${envKey} failed validation`);
  }
  
  return typedValue as T;
}

/**
 * Gets multiple environment variables at once
 */
export function getEnvMultiple<T extends Record<string, any>>(
  config: Record<string, {
    key: EnvKey | string;
    defaultValue?: any;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean';
  }>
): T {
  const result: Record<string, any> = {};
  
  for (const [name, cfg] of Object.entries(config)) {
    result[name] = getEnv(cfg.key, cfg.defaultValue, {
      required: cfg.required,
      type: cfg.type,
    });
  }
  
  return result as T;
}

/**
 * Picks the first available URL from environment variables
 * @param keys Array of environment variable keys to try
 * @param fallback Default URL if none found
 * @param options Configuration options
 */
export function pickEnvUrl(
  keys: (EnvKey | string)[],
  fallback: string,
  options: {
    requireHttps?: boolean;
    requireTrailingSlash?: boolean;
    validate?: (url: string) => boolean;
  } = {}
): string {
  const { requireHttps = true, requireTrailingSlash = false, validate } = options;
  
  // Try each key
  for (const key of keys) {
    const value = getEnv(key);
    if (value) {
      const url = formatUrl(value, { requireHttps, requireTrailingSlash });
      if (!validate || validate(url)) {
        return url;
      }
    }
  }
  
  // Return formatted fallback
  return formatUrl(fallback, { requireHttps, requireTrailingSlash });
}

/* -------------------------------------------------------------------------- */
/* URL & STRING MANIPULATION                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Formats a URL consistently
 */
export function formatUrl(
  url: string,
  options: {
    requireHttps?: boolean;
    requireTrailingSlash?: boolean;
    removeTrailingSlash?: boolean;
  } = {}
): string {
  const { requireHttps = true, requireTrailingSlash = false, removeTrailingSlash = false } = options;
  
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  let formatted = url.trim();
  
  // Add protocol if missing
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = requireHttps ? `https://${formatted}` : `http://${formatted}`;
  }
  
  // Enforce HTTPS if required
  if (requireHttps && formatted.startsWith('http://')) {
    formatted = formatted.replace('http://', 'https://');
  }
  
  // Handle trailing slashes
  if (requireTrailingSlash && !formatted.endsWith('/')) {
    formatted = `${formatted}/`;
  }
  
  if (removeTrailingSlash && formatted.endsWith('/')) {
    formatted = formatted.slice(0, -1);
  }
  
  return formatted;
}

/**
 * Safely parses a URL string
 */
export function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

/**
 * Extracts domain from URL
 */
export function extractDomain(url: string): string {
  const parsed = parseUrl(url);
  if (!parsed) return '';
  
  return parsed.hostname.replace('www.', '');
}

/**
 * Safely concatenates URL paths
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .map(part => part.replace(/^\/+|\/+$/g, ''))
    .filter(part => part.length > 0)
    .join('/');
}

/**
 * Creates an absolute URL
 */
export function absoluteUrl(path: string = ''): string {
  const baseUrl = getEnv('SITE_URL', 'https://abrahamoflondon.org', { type: 'string' });
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl.replace(/\/$/, '')}/${normalizedPath}`;
}

/* -------------------------------------------------------------------------- */
/* CLASSNAME UTILITIES                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Merges class names with Tailwind CSS support
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class names
 */
export function classNames(
  ...classes: (string | Record<string, boolean> | undefined | null)[]
): string {
  return classes
    .map(cls => {
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/* -------------------------------------------------------------------------- */
/* VALIDATION & TYPE GUARDS                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Type guard for non-null values
 */
export function isNonNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

/**
 * Type guard for objects
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard for arrays
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Type guard for strings
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard for numbers
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------------------------- */
/* DATA TRANSFORMATIONS                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Safely parses JSON with error handling
 */
export function safeParseJson<T = unknown>(
  jsonString: string,
  fallback: T
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clones an object (handles circular references)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (obj instanceof Object) {
    const clone: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return clone as T;
  }
  
  return obj;
}

/**
 * Deep merges objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (!sources.length) return target;
  
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/* -------------------------------------------------------------------------- */
/* ERROR HANDLING                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Error with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly status: number = 500,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown,
  options: {
    includeStackTrace?: boolean;
    logError?: boolean;
  } = {}
) {
  const { includeStackTrace = process.env.NODE_ENV !== 'production', logError = true } = options;
  
  if (logError) {
    console.error('Error:', error);
  }
  
  const isAppError = error instanceof AppError;
  
  return {
    success: false,
    error: {
      message: isAppError ? error.message : 'An unexpected error occurred',
      code: isAppError ? error.code : 'INTERNAL_ERROR',
      status: isAppError ? error.status : 500,
      ...(includeStackTrace && { stack: error instanceof Error ? error.stack : undefined }),
      ...(isAppError && error.data ? { data: error.data } : {}),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Safely executes a function with error handling
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      return errorHandler(error);
    }
    
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      'EXECUTION_ERROR',
      500
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PERFORMANCE & DEBUGGING                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Measures execution time of a function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  label: string = 'Execution'
): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  
  const time = end - start;
  console.log(`⏱️ ${label}: ${time.toFixed(2)}ms`);
  
  return { result, time };
}

/**
 * Creates a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/* -------------------------------------------------------------------------- */
/* DATE & TIME HELPERS                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Formats a date consistently
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Calculates time difference in human-readable format
 */
export function timeAgo(date: Date | string | number): string {
  const now = new Date();
  const then = date instanceof Date ? date : new Date(date);
  const diffMs = now.getTime() - then.getTime();
  
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (weeks > 0) return `${weeks}w ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  if (seconds > 10) return `${seconds}s ago`;
  
  return 'just now';
}

/* -------------------------------------------------------------------------- */
/* FILE & MEDIA HELPERS                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Extracts file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

/**
 * Validates file type
 */
export function isValidFileType(
  filename: string,
  allowedTypes: string[] = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']
): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(ext);
}

/* -------------------------------------------------------------------------- */
/* EXPORT TYPES                                                               */
/* -------------------------------------------------------------------------- */

export type { EnvKey, EnvValue };

// Re-export commonly used utilities
export { clsx } from 'clsx';
export { twMerge } from 'tailwind-merge';

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORTS                                                            */
/* -------------------------------------------------------------------------- */

// Default exports for easy importing
export default {
  // Environment
  ENV_KEYS,
  getEnv,
  getEnvMultiple,
  pickEnvUrl,
  
  // URLs
  formatUrl,
  parseUrl,
  extractDomain,
  joinUrl,
  absoluteUrl,
  
  // Classes
  cn,
  classNames,
  
  // Validation
  isNonNull,
  isObject,
  isArray,
  isString,
  isNumber,
  isValidEmail,
  isValidUrl,
  
  // Data
  safeParseJson,
  deepClone,
  deepMerge,
  
  // Error handling
  AppError,
  createErrorResponse,
  safeExecute,
  
  // Performance
  measureExecutionTime,
  debounce,
  throttle,
  
  // Dates
  formatDate,
  timeAgo,
  
  // Files
  formatFileSize,
  getFileExtension,
  isValidFileType,
};

// Safe string utility
export function safeString(str: unknown, fallback: string = ""): string {
  return typeof str === "string" ? str : fallback;
}




