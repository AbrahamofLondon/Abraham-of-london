/* lib/foundry/track.ts — Browser-safe analytics helper for Foundry pages.
 *
 * IMPORTANT: Never pass free-text decision/claim/release content to analytics.
 * Only metadata: test type, char count, score bucket, source page.
 */

export type FoundryEventName =
  | "foundry_test_run"
  | "foundry_test_sample"
  | "foundry_conversion_click"
  | "foundry_interest_submit"
  | "foundry_verify_attempt"
  | "foundry_continuity_click";

type EventData = Record<string, string | number | boolean>;

export function track(event: FoundryEventName, data?: EventData): void {
  try {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", event, data ?? {});
    }
  } catch {
    // Analytics unavailable — non-blocking
  }
}
