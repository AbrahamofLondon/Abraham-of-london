/**
 * client-launch-events.ts — Browser-safe launch event tracker.
 *
 * Best-effort POST. Never throws to the UI. Never sends raw user text.
 */

import type { LaunchEventName, LaunchEventPayload } from "./launch-events";

type TrackInput = Omit<LaunchEventPayload, "timestamp"> & {
  timestamp?: string;
};

/**
 * Fire a launch instrumentation event. Best-effort — failures are silent.
 */
export function trackLaunchEvent(input: TrackInput): void {
  if (typeof window === "undefined") return;

  const payload: LaunchEventPayload = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  try {
    fetch("/api/analytics/launch-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
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
export function trackLaunch(
  eventName: LaunchEventName,
  surface: string,
  extras?: Partial<Omit<TrackInput, "eventName" | "surface">>,
): void {
  trackLaunchEvent({ eventName, surface, ...extras });
}
