/* lib/resilience/bootstrap.ts */

import { logger } from "@/lib/observability/logger";

let bootstrapped = false;

export function bootstrapResilience() {
  if (bootstrapped) return;
  bootstrapped = true;

  logger.info("Resilience layer bootstrapped", "resilience");
}