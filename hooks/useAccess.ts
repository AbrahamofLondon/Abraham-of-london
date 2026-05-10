// hooks/useAccess.ts — INSTITUTIONAL CLEARANCE ENGINE
'use client';

import { useState, useEffect, useCallback } from 'react';
import { hasAccess, normalizeUserTier } from '@/lib/access/public';

export type AccessTier =
  | 'public'
  | 'member'
  | 'inner-circle'
  | 'client'
  | 'architect'
  | 'owner'
  | 'restricted'
  | 'top-secret'
  | 'legacy';

interface AccessState {
  tier: string;
  isLocked: boolean;
  isValidating: boolean;
  sessionId: string | null;
  error: string | null;
}

type VerifyResponse = {
  ok?: boolean;
  tier?: string | null;
  sessionId?: string | null;
  reason?: string | null;
  error?: string | null;
};

function safeTier(value: unknown): string {
  return normalizeUserTier(
    typeof value === 'string' && value.trim() ? value : 'public',
  );
}

function safeSessionId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * useAccess Hook
 * Global access state for gated Abraham of London content.
 * Uses canonical tier normalization + access evaluation.
 */
export function useAccess() {
  const [state, setState] = useState<AccessState>({
    tier: 'public',
    isLocked: true,
    isValidating: true,
    sessionId: null,
    error: null,
  });

  const verify = useCallback(async (): Promise<string> => {
    setState((prev) => ({
      ...prev,
      isValidating: true,
      error: null,
    }));

    try {
      const res = await fetch('/api/access/verify', {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
        },
      });

      let data: VerifyResponse = {};
      try {
        data = (await res.json()) as VerifyResponse;
      } catch {
        data = {};
      }

      const resolvedTier =
        res.ok && data.ok ? safeTier(data.tier) : 'public';

      const resolvedSessionId =
        res.ok && data.ok ? safeSessionId(data.sessionId) : null;

      const locked = !hasAccess(resolvedTier, 'member') && resolvedTier === 'public';

      if (res.ok && data.ok) {
        setState({
          tier: resolvedTier,
          isLocked: locked,
          isValidating: false,
          sessionId: resolvedSessionId,
          error: null,
        });

        return resolvedTier;
      }

      setState({
        tier: 'public',
        isLocked: true,
        isValidating: false,
        sessionId: null,
        error:
          (typeof data.reason === 'string' && data.reason) ||
          (typeof data.error === 'string' && data.error) ||
          'Unauthorized',
      });

      return 'public';
    } catch {
      setState((prev) => ({
        ...prev,
        tier: 'public',
        isLocked: true,
        isValidating: false,
        sessionId: null,
        error: 'Network failure',
      }));

      return 'public';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/access/clear', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } finally {
      setState({
        tier: 'public',
        isLocked: true,
        isValidating: false,
        sessionId: null,
        error: null,
      });

      window.location.reload();
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  const hasClearance = useCallback(
    (required: string): boolean => {
      const normalizedRequired = safeTier(required);
      const normalizedCurrent = safeTier(state.tier);
      return hasAccess(normalizedCurrent, normalizedRequired);
    },
    [state.tier],
  );

  return {
    ...state,
    verify,
    logout,
    hasClearance,
  };
}