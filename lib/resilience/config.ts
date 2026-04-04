/* lib/resilience/config.ts */

export const RESILIENCE_CONFIG = {
  queue: {
    defaultMaxAttempts: 5,
    defaultLeaseMs: 60_000,
    defaultBackoffMs: 1_000,
    maxBackoffMs: 60_000,
    batchSize: 25,
  },
  rateLimit: {
    defaultWindowMs: 60_000,
    defaultMax: 60,
  },
  circuitBreaker: {
    failureThreshold: 5,
    cooldownMs: 30_000,
    successThreshold: 2,
  },
  alerts: {
    enabled: process.env.ALERTS_ENABLED === "true",
    emailTo:
      process.env.ALERTS_EMAIL_TO ||
      "info@abrahamoflondon.org,seunadaramola@gmail.com,abrahamadaramola@outlook.com",
  },
  runtime: {
    nodeEnv: process.env.NODE_ENV || "development",
    useRedis: process.env.USE_REDIS === "true",
  },
} as const;