/* hooks/useOGRTelemetry.ts — SOVEREIGN TELEMETRY PROTOCOL */

"use client";

import { useEffect, useRef } from 'react';
import { useOGRStore } from '@/store/useOGRStore';

/**
 * SOVEREIGN TELEMETRY PROTOCOL:
 * 
 * 1. GATED EXECUTION: Oscillation only occurs for authenticated principals.
 * 2. VOLATILITY BUFFER: Drift is clamped to avoid 'Market Shock' during testing.
 * 3. CLEANUP GUARANTEE: Uses Refs to prevent memory leaks in rapid-navigation scenarios.
 * 4. LIVE SIGNAL JITTER: Real-time metrics for friction and certainty.
 */
export function useOGRTelemetry() {
  const { 
    marketFriction, 
    setFriction, 
    resonanceScore,
    computed,
    isAuthenticated 
  } = useOGRStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const liveMetricsRef = useRef({
    friction: marketFriction,
    certainty: computed.sovereignCertainty,
  });

  // 1. Authorization Guard: No telemetry for unverified sessions
  useEffect(() => {
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 2. Initialise Secure Stream with Institutional Cadence
    intervalRef.current = setInterval(() => {
      /**
       * DRIFT CALCULATION:
       * Gaussian-style drift with micro-movements and occasional 0.1% shifts.
       * Maintains institutional feel (less jittery than consumer-grade telemetry).
       */
      const driftMagnitude = 0.08;
      const drift = (Math.random() - 0.5) * driftMagnitude;
      
      // Calculate next state with store's ceiling (99.99) and floor (0)
      const nextFriction = Math.max(0, Math.min(99.99, marketFriction + drift));
      
      // Update store: Triggers re-calculation of Resonance Alpha and Certainty
      setFriction(nextFriction);
      
      // Update live metrics reference for potential external access
      liveMetricsRef.current = {
        friction: nextFriction,
        certainty: computed.sovereignCertainty,
      };
    }, 4000); // 4s cadence for "Institutional" feel

    // 3. Destructor: Ensure no ghost processes remain on logout or unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, marketFriction, setFriction, computed.sovereignCertainty]);

  // 4. Return live metrics for components that need real-time signal jitter
  return {
    friction: liveMetricsRef.current.friction,
    certainty: liveMetricsRef.current.certainty,
    resonanceScore,
    isAuthorized: computed.isAuthorizedToExecute,
  };
}