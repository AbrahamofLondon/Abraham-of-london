/**
 * GMI Feature Flags
 * All flags default to false. Enable explicitly when the feature is ready.
 * No feature flag here permits a live-feed, paid API, or real-time claim.
 */

/**
 * Scenario Explorer UI — disabled until the data model is populated
 * and the UX has been reviewed. The data model (GmiScenarioModel) exists.
 * This flag gates the public-facing route only.
 */
export const GMI_SCENARIO_EXPLORER_ENABLED =
  process.env.GMI_SCENARIO_EXPLORER_ENABLED === "true" ? true : false;

/**
 * Client API monetisation — foundation routes exist, pricing is deferred.
 * When true, rate-limit enforcement and API key auth will be activated.
 */
export const GMI_CLIENT_API_MONETISATION_ENABLED =
  process.env.GMI_CLIENT_API_MONETISATION_ENABLED === "true" ? true : false;

/**
 * Competitive benchmark public claims — gated on having real benchmark rows.
 * This flag is secondary to `canShowBenchmarkClaims()` which checks actual data.
 */
export const GMI_BENCHMARK_PUBLIC_CLAIMS_ENABLED =
  process.env.GMI_BENCHMARK_PUBLIC_CLAIMS_ENABLED === "true" ? true : false;

/**
 * Email alert delivery — disabled. dashboard_only is the only active mode.
 */
export const GMI_EMAIL_ALERTS_ENABLED = false as const;

/**
 * Webhook alert delivery — disabled. dashboard_only is the only active mode.
 */
export const GMI_WEBHOOK_ALERTS_ENABLED = false as const;
