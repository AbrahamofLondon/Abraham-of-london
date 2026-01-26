// lib/build-safe.ts
/**
 * BUILD-SAFE UTILITIES (Special Forces Edition)
 * - Zero React hook misuse
 * - Predictable environment detection
 * - Safe wrappers for browser APIs + external services
 */

type Logger = Pick<Console, "log" | "warn" | "error">;

const defaultLogger: Logger = console;

export const env = {
  /** True when running in a Node/server context (SSR, SSG, API, build). */
  isServer(): boolean {
    return typeof window === "undefined";
  },

  /** True when running in a browser context. */
  isClient(): boolean {
    return typeof window !== "undefined";
  },

  /** True when Next build is executing (CI / `next build`). */
  isBuildTime(): boolean {
    // Most reliable: NEXT_RUNTIME is set at runtime, not build.
    // During build, we're on server side, and NEXT_PUBLIC_SITE_URL etc can exist.
    // We treat "build time" as "server + production build command context".
    // Practical: allow override for local debugging.
    if (process.env.NEXT_PUBLIC_DISABLE_BUILD_CHECKS === "true") return false;

    const isServer = typeof window === "undefined";
    const isProd = process.env.NODE_ENV === "production";

    // If you're doing `next export` or static generation, this still counts as build-time.
    // We don’t rely on NEXT_PHASE (inconsistent in userland).
    return isServer && isProd;
  },

  /** True in tests. */
  isTest(): boolean {
    return process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
  },
};

/** Safe JSON parse. */
export function safeJsonParse<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T;
  } catch {
    return fallback;
  }
}

/** Safe base64 decode for JWT payload in browser only. */
export function safeAtob(input: string): string | null {
  if (!env.isClient()) return null;
  try {
    return window.atob(input);
  } catch {
    return null;
  }
}

/**
 * Safely execute code that requires browser APIs.
 * - Never touches window during SSR/build
 * - Returns fallback on failure
 */
export function safeBrowserExecute<T>(
  fn: () => T,
  fallback: T,
  opts?: { warn?: boolean; label?: string; logger?: Logger }
): T {
  const logger = opts?.logger ?? defaultLogger;

  if (!env.isClient()) return fallback;

  try {
    return fn();
  } catch (err) {
    if (opts?.warn !== false) {
      logger.warn(`[BuildSafe] Browser execution failed${opts?.label ? ` (${opts.label})` : ""}`, err);
    }
    return fallback;
  }
}

/**
 * Safely execute async code that might depend on external services (Redis/DB/APIs).
 * - Skips during build (default)
 * - Times out
 * - Returns fallback on any failure
 */
export async function safeAsyncExecute<T>(
  fn: () => Promise<T>,
  fallback: T,
  opts?: {
    skipDuringBuild?: boolean; // default true
    timeoutMs?: number; // default 10s
    label?: string;
    logger?: Logger;
  }
): Promise<T> {
  const logger = opts?.logger ?? defaultLogger;
  const skipDuringBuild = opts?.skipDuringBuild ?? true;
  const timeoutMs = opts?.timeoutMs ?? 10_000;
  const label = opts?.label ? ` (${opts.label})` : "";

  if (skipDuringBuild && env.isBuildTime()) {
    logger.log(`[BuildSafe] Skipping async execution during build${label}`);
    return fallback;
  }

  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    );
    return await Promise.race([fn(), timeout]);
  } catch (err) {
    logger.error(`[BuildSafe] Async execution failed${label}`, err);
    return fallback;
  }
}

/**
 * External service availability check.
 * Keeps it boring: if env var missing => not available.
 */
export function hasServiceEnv(service: "redis" | "database"): boolean {
  switch (service) {
    case "redis":
      return typeof process.env.REDIS_URL === "string" && process.env.REDIS_URL.length > 0;
    case "database":
      return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
  }
}

/**
 * Create a client only when it’s safe.
 */
export function createBuildSafeClient<T>(args: {
  create: () => T;
  fallback: T;
  label?: string;
  logger?: Logger;
}): T {
  const logger = args.logger ?? defaultLogger;
  const label = args.label ? ` (${args.label})` : "";

  if (env.isBuildTime()) {
    logger.log(`[BuildSafe] Using fallback client during build${label}`);
    return args.fallback;
  }

  try {
    return args.create();
  } catch (err) {
    logger.error(`[BuildSafe] Failed to create client${label}`, err);
    return args.fallback;
  }
}

/**
 * Safe localStorage wrapper (no-ops on server).
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    return safeBrowserExecute(() => localStorage.getItem(key), null, { warn: false });
  },
  setItem(key: string, value: string): void {
    safeBrowserExecute(() => localStorage.setItem(key, value), undefined as unknown as void, { warn: false });
  },
  removeItem(key: string): void {
    safeBrowserExecute(() => localStorage.removeItem(key), undefined as unknown as void, { warn: false });
  },
};

/**
 * Safe fetch wrapper for client-only telemetry.
 */
export function safePostJson(url: string, body: unknown): void {
  if (!env.isClient()) return;
  try {
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow
  }
}

/**
 * Feature flags (centralise the logic).
 */
export const buildConfig = {
  ...env,
  features: {
    enableRedis: !env.isBuildTime() && hasServiceEnv("redis"),
    enableDatabase: !env.isBuildTime() && hasServiceEnv("database"),
    enableAnalytics: env.isClient() && !env.isTest(),
  },
};