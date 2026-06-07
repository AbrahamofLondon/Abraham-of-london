/**
 * Next.js Instrumentation Hook
 *
 * Registers Sentry for error monitoring at the framework level.
 * This is the official Sentry Next.js integration point.
 * Only active when SENTRY_DSN is configured.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
  ) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment:
        process.env.NEXT_PUBLIC_VERCEL_ENV ||
        process.env.NODE_ENV ||
        "development",
      tracesSampleRate:
        (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV) ===
        "production"
          ? 0.1
          : 0.0,
      enabled:
        (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV) ===
          "production" ||
        (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV) ===
          "staging",
    });
  }
}
