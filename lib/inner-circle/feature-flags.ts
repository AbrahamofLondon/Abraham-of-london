/* lib/inner-circle/feature-flags.ts — Production Readiness Gate */
/* All flags default to disabled/false for production safety. */

export type InnerCircleFeatureFlag =
  | "INNER_CIRCLE_MVP_ENABLED"
  | "INNER_CIRCLE_EMAILS_ENABLED"
  | "INNER_CIRCLE_SUBSCRIPTION_ENABLED"
  | "INNER_CIRCLE_ADMIN_QUEUE_ENABLED";

const FLAG_ENV_MAP: Record<InnerCircleFeatureFlag, string> = {
  INNER_CIRCLE_MVP_ENABLED: "INNER_CIRCLE_MVP_ENABLED",
  INNER_CIRCLE_EMAILS_ENABLED: "INNER_CIRCLE_EMAILS_ENABLED",
  INNER_CIRCLE_SUBSCRIPTION_ENABLED: "INNER_CIRCLE_SUBSCRIPTION_ENABLED",
  INNER_CIRCLE_ADMIN_QUEUE_ENABLED: "INNER_CIRCLE_ADMIN_QUEUE_ENABLED",
};

const FLAG_DEFAULTS: Record<InnerCircleFeatureFlag, boolean> = {
  INNER_CIRCLE_MVP_ENABLED: false,
  INNER_CIRCLE_EMAILS_ENABLED: false,
  INNER_CIRCLE_SUBSCRIPTION_ENABLED: false,
  INNER_CIRCLE_ADMIN_QUEUE_ENABLED: true, // Admin queue is admin-only, safe by default
};

/**
 * Check whether a specific Inner Circle feature flag is enabled.
 * Reads from environment variables; falls back to default.
 */
export function isFeatureEnabled(flag: InnerCircleFeatureFlag): boolean {
  const envVar = FLAG_ENV_MAP[flag];
  const envValue = process.env[envVar]?.trim().toLowerCase();

  if (envValue === "true" || envValue === "1" || envValue === "yes") return true;
  if (envValue === "false" || envValue === "0" || envValue === "no") return false;

  return FLAG_DEFAULTS[flag];
}

/**
 * Check if the entire Inner Circle MVP is available.
 * This is the master gate — all other flags are subordinate.
 */
export function isMvpEnabled(): boolean {
  return isFeatureEnabled("INNER_CIRCLE_MVP_ENABLED");
}

/**
 * Check if email triggers are allowed to send.
 * Production-safe: defaults to false.
 */
export function areEmailsEnabled(): boolean {
  return isFeatureEnabled("INNER_CIRCLE_MVP_ENABLED") && isFeatureEnabled("INNER_CIRCLE_EMAILS_ENABLED");
}

/**
 * Check if subscription enforcement is active.
 * Production-safe: defaults to false — free users can complete diagnostics.
 */
export function isSubscriptionEnforced(): boolean {
  return isFeatureEnabled("INNER_CIRCLE_MVP_ENABLED") && isFeatureEnabled("INNER_CIRCLE_SUBSCRIPTION_ENABLED");
}

/**
 * Check if the admin advisory queue is accessible.
 * Admin-only by default, but can be disabled for maintenance.
 */
export function isAdminQueueEnabled(): boolean {
  return isFeatureEnabled("INNER_CIRCLE_ADMIN_QUEUE_ENABLED");
}
