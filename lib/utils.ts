// lib/utils.ts

/**
 * Safe environment variable access
 */
export function getEnv(key: string, defaultValue: string = ""): string {
  if (typeof process === "undefined" || !process.env) {
    return defaultValue;
  }
  return (
    (process.env as Record<string, string | undefined>)[key] || defaultValue
  );
}

/**
 * Safe URL builder
 */
export function buildUrl(base: string, path: string): string {
  try {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
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
    if (value && value.trim().length > 0) {
      const trimmed = value.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
    }
  }
  return fallbacks.find((fb) => fb && fb.trim().length > 0) || "#";
}

export const ENV_KEYS = {
  INNOVATEHUB_URL: "NEXT_PUBLIC_INNOVATEHUB_URL",
  INNOVATEHUB_ALT_URL: "NEXT_PUBLIC_INNOVATEHUB_ALT_URL",
  ALOMARADA_URL: "NEXT_PUBLIC_ALOMARADA_URL",
  ENDURELUXE_URL: "NEXT_PUBLIC_ENDURELUXE_URL",
} as const;
