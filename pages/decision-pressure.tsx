/**
 * pages/decision-pressure.tsx — LEGACY ROUTE
 *
 * This page is preserved as a permanent redirect to the canonical /pressure route.
 *
 * ROUTE DECISION:
 *   CANONICAL: /pressure
 *   LEGACY:    /decision-pressure → redirects to /pressure
 *
 * RATIONALE:
 *   /pressure uses the server-side API (/api/pressure/signal) with:
 *   - Zod validation
 *   - Upstash/Redis rate limiting with in-memory fallback
 *   - Event persistence to PressureSignalEvent (hashed input only)
 *   - evaluatePressureSignal engine from operating-layer
 *
 *   /decision-pressure was a client-side-only implementation with:
 *   - No API call
 *   - No rate limiting
 *   - No event persistence
 *   - No input hashing
 *
 * All internal links have been updated to point to /pressure.
 * External links and bookmarks to /decision-pressure are redirected.
 */

import { useEffect } from "react";
import { useRouter } from "next/router";

export default function DecisionPressureRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pressure");
  }, [router]);

  return null;
}