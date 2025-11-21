// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-friendly className merge helper
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(...inputs));
}

/**
 * Safe environment variable access
 */
export function getEnv(key: string, defaultValue: string = ""): string {
  if (typeof process === "undefined" || !process.env) {
    return defaultValue;
  }

  const value = (process.env as Record<string, string | undefined>)[key];
  return value ?? defaultValue;
}

/**
 * Safe URL builder
 */
export function buildUrl(base: string, path: string): string {
  try {
    const normalizedBase = base.endsWith("/") ? base : `${base}/`;
    return new URL(path, normalizedBase).toString();
  } catch {
    return "#";
  }
}

/**
 * Pick first valid URL from environment variables
 */
export function pickEnvUrl(envKeys: string[], ...fallbacks: string[]): string {
  for (const key of envKeys) {
    const value = getEnv(key);
    if (value) {
      const trimmed = value.trim();
      if (
        trimmed.length > 0 &&
        (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
      ) {
        return trimmed;
      }
    }
  }

  const fallback = fallbacks.find(
    (fb) => fb && fb.trim().length > 0,
  );

  return fallback ?? "#";
}

export const ENV_KEYS = {
  INNOVATEHUB_URL: "NEXT_PUBLIC_INNOVATEHUB_URL",
  INNOVATEHUB_ALT_URL: "NEXT_PUBLIC_INNOVATEHUB_ALT_URL",
  ALOMARADA_URL: "NEXT_PUBLIC_ALOMARADA_URL",
  ENDURELUXE_URL: "NEXT_PUBLIC_ENDURELUXE_URL",
} as const;

/**
 * Format currency with proper localization
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage with sign
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Debounce function for performance
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}