// hooks/useInnerCircleAccess.ts - Client-side hook
'use client';

import { useEffect, useState } from 'react';
import { getInnerCircleAccess, type InnerCircleAccess } from '@/lib/inner-circle';

export function useInnerCircleAccess(): {
  access: InnerCircleAccess | null;
  isLoading: boolean;
  refresh: () => void;
} {
  const [access, setAccess] = useState<InnerCircleAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = () => {
    setIsLoading(true);
    try {
      // Create a mock request object for client-side
      const mockReq = {
        headers: {
          'user-agent': navigator.userAgent
        },
        cookies: {
          innerCircleAccess: document.cookie
            .split('; ')
            .find(row => row.startsWith('innerCircleAccess='))
            ?.split('=')[1] || ''
        }
      };
      
      const accessResult = getInnerCircleAccess(mockReq as any);
      setAccess(accessResult);
    } catch (error) {
      console.error('Failed to check inner circle access:', error);
      setAccess({
        hasAccess: false,
        reason: 'error'
      } as any);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return {
    access,
    isLoading,
    refresh: checkAccess
  };
}