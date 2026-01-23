// hooks/useInnerCircleAccess.ts - PRODUCTION-READY
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { InnerCircleAccess } from '@/lib/inner-circle';

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
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        throw new Error(`Access check failed: ${response.status} ${response.statusText}`);
      }

      const data: InnerCircleAccess = await response.json();
      
      // Validate the response matches the expected type
      if (typeof data.hasAccess !== 'boolean') {
        throw new Error('Invalid access response format');
      }
      
      setAccess(data);
    } catch (err) {
      console.error('Failed to check inner circle access:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Fallback with type-safe reason
      const fallbackAccess: InnerCircleAccess = {
        hasAccess: false,
        reason: 'no_cookie', // Use a valid reason from the union type
        // Add optional fields if needed by your type
        ...(typeof window !== 'undefined' && localStorage.getItem('innerCircleAccess') === 'true' 
          ? { tier: 'inner-circle' as const }
          : {}),
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

  // Optional: Poll for access changes (every 5 minutes)
  useEffect(() => {
    if (!access?.hasAccess) return;
    
    const interval = setInterval(() => {
      checkAccess();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [access?.hasAccess, checkAccess]);

  // Optional: Listen for storage/cookie changes
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