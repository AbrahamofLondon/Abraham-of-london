// hooks/useInnerCircleAccess.ts - PRODUCTION-READY
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { InnerCircleAccess } from '@/lib/inner-circle/access.client';

export function useInnerCircleAccess(): {
  access: InnerCircleAccess | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  error: Error | null;
} {
  const [access, setAccess] = useState<InnerCircleAccess | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAccess = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/check-access', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Access check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate the response matches InnerCircleAccess type
      if (typeof data !== 'object' || data === null) {
        throw new Error('Invalid access response format');
      }

      // Check for hasAccess property (as defined in the type)
      if (typeof data.hasAccess !== 'boolean') {
        throw new Error('Response missing required field: hasAccess must be boolean');
      }

      // The response matches our type, so we can set it directly
      setAccess(data as InnerCircleAccess);
    } catch (err) {
      console.error('Failed to check inner circle access:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Create fallback that matches InnerCircleAccess exactly
      const fallbackAccess: InnerCircleAccess = {
        hasAccess: false,
        reason: 'error',
        // tier is optional, so we can omit it
      };
      
      setAccess(fallbackAccess);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Poll for access changes (every 5 minutes)
  useEffect(() => {
    if (!access?.hasAccess) return;
    
    const interval = setInterval(() => {
      checkAccess();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [access?.hasAccess, checkAccess]);

  // Listen for storage/cookie changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'innerCircleAccess') {
        checkAccess();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAccess]);

  return {
    access,
    isLoading,
    refresh: checkAccess,
    error,
  };
}