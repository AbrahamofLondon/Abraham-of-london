// lib/utils.ts - FULL CORRECTED VERSION
// Fixes: import/no-anonymous-default-export (by exporting a named object)
// Also hardens a few typings (removes stray `any` where easy) without breaking your public API.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* -------------------------------------------------------------------------- */
/* ENVIRONMENT & CONFIG                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Environment variable names used across the application
 */
export const ENV_KEYS = {
  // URL Configuration
  ALOMARADA_URL: "NEXT_PUBLIC_ALOMARADA_URL",
  ENDURELUXE_URL: "NEXT_PUBLIC_ENDURELUXE_URL",
  INNOVATEHUB_URL: "NEXT_PUBLIC_INNOVATEHUB_URL",
  INNOVATEHUB_ALT_URL: "NEXT_PUBLIC_INNOVATEHUB_ALT_URL",
  SITE_URL: "NEXT_PUBLIC_SITE_URL",

  // API & Services
  API_URL: "NEXT_PUBLIC_API_URL",
  API_KEY: "NEXT_PUBLIC_API_KEY",
  STRAPI_URL: "NEXT_PUBLIC_STRAPI_URL",

  // Analytics & Monitoring
  GOOGLE_ANALYTICS_ID: "NEXT_PUBLIC_GA_ID",
  POSTHOG_KEY: "NEXT_PUBLIC_POSTHOG_KEY",
  SENTRY_DSN: "NEXT_PUBLIC_SENTRY_DSN",

  // Authentication & Security
  JWT_SECRET: "JWT_SECRET",
  NEXTAUTH_SECRET: "NEXTAUTH_SECRET",
  NEXTAUTH_URL: "NEXTAUTH_URL",

  // Email & Notifications
  SMTP_HOST: "SMTP_HOST",
  SMTP_PORT: "SMTP_PORT",
  SMTP_USER: "SMTP_USER",
  SMTP_PASS: "SMTP_PASS",
  RESEND_API_KEY: "RESEND_API_KEY",

  // Database & Storage
  DATABASE_URL: "DATABASE_URL",
  S3_BUCKET: "S3_BUCKET",
  CDN_URL: "NEXT_PUBLIC_CDN_URL",

  // Feature Flags
  ENABLE_BETA: "NEXT_PUBLIC_ENABLE_BETA",
  MAINTENANCE_MODE: "NEXT_PUBLIC_MAINTENANCE_MODE",
} as const;

export type EnvKey = keyof typeof ENV_KEYS;
export type EnvValue = string | number | boolean | undefined;

/* -------------------------------------------------------------------------- */
/* ENVIRONMENT HELPERS                                                        */
/* -------------------------------------------------------------------------- */

type EnvType = "string" | "number" | "boolean";

type GetEnvOptions = {
  required?: boolean;
  type?: EnvType;
  validate?: (value: string) => boolean;
};

/**
 * Safely gets an environment variable with fallbacks
 * @param key The environment variable key
 * @param defaultValue Fallback value if not found
 * @param options Configuration options
 */
export function getEnv<T = string>(
  key: EnvKey | string,
  defaultValue?: T,
  options: GetEnvOptions = {}
): T {
  const { required = false, type = "string", validate } = options;

  // Get the actual environment variable name
  const envKey = (ENV_KEYS as Record<string, string>)[key] || key;

  // Get value from appropriate source
  let value: string | undefined;

  if (typeof window !== "undefined") {
    // Client-side: check for global variables (rare, but kept for compatibility)
    const globalValue = (window as unknown as Record<string, unknown>)[envKey];
    if (globalValue !== undefined) value = String(globalValue);
  } else {
    // Server-side: check process.env
    value = process.env[envKey];
  }

  // Handle missing values
  if (value === undefined || value === "") {
    if (required) {
      throw new Error(`Environment variable ${envKey} is required but not set`);
    }

    if (defaultValue !== undefined) return defaultValue;

    return undefined as T;
  }

  // Type conversion
  let typedValue: unknown = value;

  switch (type) {
    case "number": {
      const n = Number(value);
      if (Number.isNaN(n)) {
        throw new Error(`Environment variable ${envKey} must be a valid number`);
      }
      typedValue = n;
      break;
    }
    case "boolean":
      typedValue = value.toLowerCase() === "true" || value === "1";
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
export function getEnvMultiple<T extends Record<string, unknown>>(
  config: Record<
    string,
    {
      key: EnvKey | string;
      defaultValue?: unknown;
      required?: boolean;
      type?: EnvType;
    }
  >
): T {
  const result: Record<string, unknown> = {};

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
  const {
    requireHttps = true,
    requireTrailingSlash = false,
    validate,
  } = options;

  for (const key of keys) {
    const value = getEnv<string | undefined>(key, undefined, { type: "string" });
    if (value) {
      const url = formatUrl(value, { requireHttps, requireTrailingSlash });
      if (!validate || validate(url)) return url;
    }
  }

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
  const {
    requireHttps = true,
    requireTrailingSlash = false,
    removeTrailingSlash = false,
  } = options;

  if (!url || typeof url !== "string") return "";

  let formatted = url.trim();

  // Add protocol if missing
  if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
    formatted = requireHttps ? `https://${formatted}` : `http://${formatted}`;
  }

  // Enforce HTTPS if required
  if (requireHttps && formatted.startsWith("http://")) {
    formatted = formatted.replace("http://", "https://");
  }

  // Handle trailing slashes
  if (requireTrailingSlash && !formatted.endsWith("/")) {
    formatted = `${formatted}/`;
  }

  if (removeTrailingSlash && formatted.endsWith("/")) {
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
  if (!parsed) return "";
  return parsed.hostname.replace("www.", "");
}

/**
 * Safely concatenates URL paths (returns a *path*, not a full URL)
 */
export function joinUrl(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^\/+|\/+$/g, ""))
    .filter((part) => part.length > 0)
    .join("/");
}

/**
 * Creates an absolute URL from site base + path
 */
export function absoluteUrl(path: string = ""): string {
  const baseUrl = getEnv("SITE_URL", "https://abrahamoflondon.org", {
    type: "string",
  });

  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return `${String(baseUrl).replace(/\/$/, "")}/${normalizedPath}`;
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
  ...classes: Array<string | Record<string, boolean> | undefined | null>
): string {
  return classes
    .map((cls) => {
      if (typeof cls === "string") return cls;
      if (typeof cls === "object" && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(" ");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/* VALIDATION & TYPE GUARDS                                                   */
/* -------------------------------------------------------------------------- */

export function isNonNull<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

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

export function safeParseJson<T = unknown>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;

  if (obj instanceof Date) return new Date(obj.getTime()) as T;

  if (Array.isArray(obj)) return obj.map((item) => deepClone(item)) as T;

  const clone: Record<string, unknown> = {};
  for (const key in obj as Record<string, unknown>) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return clone as T;
}

export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Record<string, unknown>>
): T {
  const output: Record<string, unknown> = { ...target };

  for (const source of sources) {
    if (!isObject(source)) continue;

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = output[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        output[key] = deepMerge({ ...(targetValue as Record<string, unknown>) }, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    }
  }

  return output as T;
}

/**
 * Deep merges objects (alternative implementation)
 */
export function deepMerge2<T extends Record<string, unknown>>(
  target: T,
  ...sources: Array<Record<string, unknown>>
): T {
  if (!sources.length) return target;

  const [source, ...rest] = sources;

  if (isObject(target) && isObject(source)) {
    const result: Record<string, unknown> = { ...target };

    for (const key of Object.keys(source)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isObject(sourceValue) && isObject(targetValue)) {
        result[key] = deepMerge2(
          { ...(targetValue as Record<string, unknown>) },
          sourceValue
        );
      } else {
        result[key] = sourceValue;
      }
    }

    return deepMerge2(result as T, ...rest);
  }

  return target;
}

/* -------------------------------------------------------------------------- */
/* ERROR HANDLING                                                             */
/* -------------------------------------------------------------------------- */

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly status: number = 500,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "AppError";

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export function createErrorResponse(
  error: unknown,
  options: {
    includeStackTrace?: boolean;
    logError?: boolean;
  } = {}
): {
  success: false;
  error: {
    message: string;
    code: string;
    status: number;
    stack?: string;
    data?: unknown;
  };
  timestamp: string;
} {
  const {
    includeStackTrace = process.env.NODE_ENV !== "production",
    logError = true,
  } = options;

  if (logError) console.error("Error:", error);

  const isAppError = error instanceof AppError;

  return {
    success: false,
    error: {
      message: isAppError ? error.message : "An unexpected error occurred",
      code: isAppError ? error.code : "INTERNAL_ERROR",
      status: isAppError ? error.status : 500,
      ...(includeStackTrace && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
      ...(isAppError && error.data ? { data: error.data } : {}),
    },
    timestamp: new Date().toISOString(),
  };
}

export async function safeExecute<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) return errorHandler(error);
    if (error instanceof AppError) throw error;

    throw new AppError(
      error instanceof Error ? error.message : "Unknown error occurred",
      "EXECUTION_ERROR",
      500
    );
  }
}

/* -------------------------------------------------------------------------- */
/* PERFORMANCE & DEBUGGING                                                    */
/* -------------------------------------------------------------------------- */

export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  label: string = "Execution"
): Promise<{ result: T; time: number }> {
  const hasPerformance = typeof performance !== "undefined" && typeof performance.now === "function";
  const start = hasPerformance ? performance.now() : Date.now();

  const result = await fn();

  const end = hasPerformance ? performance.now() : Date.now();
  const time = end - start;

  console.log(`⏱️ ${label}: ${time.toFixed(2)}ms`);
  return { result, time };
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      void func(...args);
    }, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (inThrottle) return;
    void func(...args);
    inThrottle = true;
    setTimeout(() => (inThrottle = false), limit);
  };
}

/* -------------------------------------------------------------------------- */
/* DATE & TIME HELPERS                                                        */
/* -------------------------------------------------------------------------- */

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString("en-US", options);
}

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
  return "just now";
}

/* -------------------------------------------------------------------------- */
/* FILE & MEDIA HELPERS                                                       */
/* -------------------------------------------------------------------------- */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function isValidFileType(
  filename: string,
  allowedTypes: string[] = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"]
): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return allowedTypes.includes(ext);
}

/* -------------------------------------------------------------------------- */
/* SAFE STRING UTILITY                                                        */
/* -------------------------------------------------------------------------- */

export function safeString(str: unknown, fallback: string = ""): string {
  return typeof str === "string" ? str : fallback;
}

/* -------------------------------------------------------------------------- */
/* EXPORT TYPES                                                               */
/* -------------------------------------------------------------------------- */

// Re-export commonly used utilities (kept for compatibility)
export { clsx } from "clsx";
export { twMerge } from "tailwind-merge";

/* -------------------------------------------------------------------------- */
/* DEFAULT EXPORTS                                                            */
/* -------------------------------------------------------------------------- */

// ✅ Fix: import/no-anonymous-default-export
const utils = {
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
  deepMerge2,

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

  // Safe string
  safeString,
};

export default utils;


