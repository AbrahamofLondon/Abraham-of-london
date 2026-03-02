/* hooks/useFortifiedAccess.ts — BULLETPROOF */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { checkAccess, type InnerCircleAccess } from "@/lib/inner-circle/access.client";

type HookOptions = {
  endpoint?: string; // optional override
  timeoutMs?: number;
};

export function useFortifiedAccess(initialAccess?: boolean, opts?: HookOptions) {
  const endpoint = opts?.endpoint; // optional
  const timeoutMs = opts?.timeoutMs ?? 4000;

  /**
   * If server already granted access, we keep that as the baseline truth
   * and NEVER downgrade it on client error/timeout.
   */
  const [access, setAccess] = useState<InnerCircleAccess | null>(() => {
    if (initialAccess) return { hasAccess: true, reason: "no_request" };
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => !initialAccess);
  const [isSystemBusy, setIsSystemBusy] = useState(false);

  const initialized = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);

  const verify = useCallback(
    async (force = false) => {
      // prevent parallel storms
      if (inFlight.current) return;

      setIsSystemBusy(false);
      // Only show loading spinner when we don't already have a server "YES"
      if (!initialAccess) setIsLoading(true);

      const run = (async () => {
        try {
          const result = await checkAccess({
            force,
            timeoutMs,
            ...(endpoint ? { endpoint } : {}),
          });

          // Busy signal (429/infra) — but do NOT flip a server-granted YES to NO
          const busy = result.reason === "rate_limited" || result.reason === "internal_error";
          setIsSystemBusy(busy);

          setAccess((prev) => {
            // If server said YES, never downgrade due to busy/error.
            if (initialAccess && prev?.hasAccess) {
              if (result.hasAccess) return result; // upgrade details is allowed
              if (busy) return prev; // keep the YES
              return prev; // keep the YES even if result says no (server verdict wins)
            }
            return result;
          });
        } catch (err) {
          console.error("[ACCESS_HOOK] Verification failed:", err);
          setIsSystemBusy(true);

          setAccess((prev) => {
            // If we already have a YES, keep it.
            if (prev?.hasAccess) return prev;
            return prev ?? { hasAccess: false, reason: "internal_error" };
          });
        } finally {
          setIsLoading(false);
          inFlight.current = null;
        }
      })();

      inFlight.current = run;
      await run;
    },
    [initialAccess, endpoint, timeoutMs]
  );

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If we already have initialAccess (server YES), don't auto-verify.
    // The guard already bypasses; this avoids pointless API calls.
    if (!initialAccess) verify(false);
  }, [verify, initialAccess]);

  return {
    access,
    isLoading,
    isSystemBusy,
    retry: () => verify(true),
  };
}