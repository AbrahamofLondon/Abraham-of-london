/* lib/observability/alerts.ts */

import { RESILIENCE_CONFIG } from "@/lib/resilience/config";
import { logger } from "@/lib/observability/logger";

export async function sendOperationalAlert(input: {
  subject: string;
  severity: "warn" | "critical";
  body: string;
  meta?: Record<string, unknown>;
}) {
  logger.warn("Operational alert raised", "alerts", {
    subject: input.subject,
    severity: input.severity,
    meta: input.meta,
  });

  if (!RESILIENCE_CONFIG.alerts.enabled) return { ok: true, mode: "noop" };

  // Upgrade path:
  // call mail provider here later.
  // For now, this is intentionally safe and zero-cost.
  return {
    ok: true,
    mode: "logged",
    recipients: RESILIENCE_CONFIG.alerts.emailTo.split(",").map((x) => x.trim()),
  };
}