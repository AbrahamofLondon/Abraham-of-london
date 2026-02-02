// hooks/useAccess.ts — INSTITUTIONAL CLEARANCE ENGINE
'use client';

import { useState, useEffect, useCallback } from 'react';

export type Tier = 'public' | 'inner-circle' | 'private';

interface AccessState {
  tier: Tier;
  isLocked: boolean;
  isValidating: boolean;
  sessionId: string | null;
  error: string | null;
}

/**
 * useAccess Hook
 * Manages the global clearance level for Abraham of London intelligence briefs.
 */
export function useAccess() {
  const [state, setState] = useState<AccessState>({
    tier: 'public',
    isLocked: true,
    isValidating: true,
    sessionId: null,
    error: null,
  });

  const verify = useCallback(async () => {
    setState((prev) => ({ ...prev, isValidating: true }));
    try {
      const res = await fetch('/api/access/verify');
      const data = await res.json();

      if (res.ok && data.ok) {
        setState({
          tier: data.tier as Tier,
          isLocked: false,
          isValidating: false,
          sessionId: data.sessionId,
          error: null,
        });
        return data.tier;
      } else {
        setState((prev) => ({
          ...prev,
          tier: 'public',
          isLocked: true,
          isValidating: false,
          error: data.reason || 'Unauthorized',
        }));
        return 'public';
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isValidating: false,
        error: 'Network failure',
      }));
      return 'public';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Assuming you have an api/access/clear to delete the cookie
      await fetch('/api/access/clear', { method: 'POST' });
    } finally {
      setState({
        tier: 'public',
        isLocked: true,
        isValidating: false,
        sessionId: null,
        error: null,
      });
      window.location.reload(); // Hard reset for security
    }
  }, []);

  useEffect(() => {
    verify();
  }, [verify]);

  return {
    ...state,
    verify,
    logout,
    // Helper: checks if user meets or exceeds a required tier
    hasClearance: (required: Tier) => {
      if (required === 'public') return true;
      if (state.tier === 'private') return true; // Private sees all
      if (state.tier === 'inner-circle' && required === 'inner-circle') return true;
      return false;
    },
  };
}