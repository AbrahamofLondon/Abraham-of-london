/**
 * lib/analytics/server-launch-event.ts — Server-side launch event tracker.
 *
 * Fires launch events from API routes and webhooks where `window` is not available.
 * Best-effort POST to the same receiver endpoint. Never throws.
 * Never sends raw user text.
 */

import type { LaunchEventName, LaunchEventPayload } from "./launch-events";

type TrackInput = Omit<LaunchEventPayload, "timestamp"> & {
  timestamp?: string;
};

/**
 * Fire a launch instrumentation event from a server-side context.
 * Best-effort — failures are silent.
 */
export function trackServerLaunchEvent(input: TrackInput): void {
  const payload: LaunchEventPayload = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000";

  try {
    fetch(`${baseUrl}/api/analytics/launch-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* silent — instrumentation must never block UX */
    });
  } catch {
    /* silent */
  }
}

/**
 * Convenience: track with just event name + surface + optional extras.
 */
export function trackServerLaunch(
  eventName: LaunchEventName,
  surface: string,
  extras?: Partial<Omit<TrackInput, "eventName" | "surface">>,
): void {
  trackServerLaunchEvent({ eventName, surface, ...extras });
}
