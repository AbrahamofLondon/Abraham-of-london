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
 *
 * - Leaves absolute URLs as-is
 * - If base is empty, returns path (so local /public paths still work)
 * - Joins base + path sensibly when both are present
 */
export function buildUrl(base: string, path: string): string {
  const trimmedPath = String(path || "").trim();
  const trimmedBase = String(base || "").trim();

  // No path at all – nothing we can do
  if (!trimmedPath) return "#";

  // If path is already absolute, trust it
  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  // If base is empty, just return the path (handles `/images/foo.jpg` etc.)
  if (!trimmedBase) {
    return trimmedPath;
  }

  // If base looks like a URL, try to join using WHATWG URL
  if (/^https?:\/\//i.test(trimmedBase)) {
    try {
      const normalizedBase = trimmedBase.endsWith("/")
        ? trimmedBase
        : `${trimmedBase}/`;
      return new URL(trimmedPath, normalizedBase).toString();
    } catch {
      // If URL join somehow fails, fall back to naive join
      const baseClean = normalizedBase.replace(/\/+$/, "");
      const pathClean = trimmedPath.replace(/^\/+/, "");
      return `${baseClean}/${pathClean}`;
    }
  }

  // Fallback: naive join for non-URL bases (edge cases)
  const baseClean = trimmedBase.replace(/\/+$/, "");
  const pathClean = trimmedPath.replace(/^\/+/, "");
  return `${baseClean}/${pathClean}`;
}

/**
 * Pick first valid URL from environment variables
 *
 * Returns:
 * - first env value that looks like a full http(s) URL, or
 * - first non-empty fallback, or
 * - "#" as absolute last resort
 */
export function pickEnvUrl(
  envKeys: string[],
  ...fallbacks: string[]
): string {
  for (const key of envKeys) {
    const value = getEnv(key);
    if (!value) continue;

    const trimmed = value.trim();
    if (
      trimmed.length > 0 &&
      /^https?:\/\//i.test(trimmed)
    ) {
      return trimmed;
    }
  }

  const fallback = fallbacks
    .map((fb) => (fb || "").trim())
    .find((fb) => fb.length > 0);

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