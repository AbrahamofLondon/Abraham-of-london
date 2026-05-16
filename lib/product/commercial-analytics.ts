/**
 * lib/product/commercial-analytics.ts
 *
 * Browser-safe commercial analytics helpers.
 * Uses the existing launch-event pipeline and never sends raw user text.
 */

import { trackLaunch } from "@/lib/analytics/client-launch-events";
import type { UpgradeAction } from "@/components/product/ContextualUpgradePrompt";

export type CommercialEventName =
  | "upgrade_prompt_seen"
  | "trial_started"
  | "trial_expired"
  | "trial_converted"
  | "trial_declined"
  | "free_limit_reached"
  | "case_archived_after_trial"
  | "professional_upgrade_clicked"
  | "pricing_viewed_from_prompt";

export function trackCommercialEvent(
  eventName: CommercialEventName,
  surface: string,
  extras?: {
    actionType?: UpgradeAction | "trial_expiry" | "free_case_limit" | null;
    caseId?: string | null;
  },
): void {
  trackLaunch(eventName, surface, {
    actionType: extras?.actionType ?? null,
    caseId: extras?.caseId ?? null,
  });
}
