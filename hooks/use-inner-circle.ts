// hooks/use-inner-circle.ts

import { useState, useEffect } from 'react';

interface UseInnerCircleResult {
  isUnlocked: boolean;
  isLoading: boolean;
  unlock: (key: string) => Promise<{ success: boolean; message?: string }>;
  lock: () => void;
}

export function useInnerCircle(): UseInnerCircleResult {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Check for existing key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('inner_circle_key');
    if (savedKey) {
      verifyKey(savedKey);
    } else {
      setIsLoading(false);
    }
  }, []);

  // 2. Verification logic
  const verifyKey = async (key: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inner-circle/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('inner_circle_key', key);
        setIsUnlocked(true);
      } else {
        localStorage.removeItem('inner_circle_key');
        setIsUnlocked(false);
      }
    } catch (error) {
      console.error('Inner Circle verification failed', error);
      setIsUnlocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const unlock = async (key: string) => {
    await verifyKey(key);
    return isUnlocked ? { success: true } : { success: false, message: 'Invalid key' };
  };

  const lock = () => {
    localStorage.removeItem('inner_circle_key');
    setIsUnlocked(false);
  };

  return { isUnlocked, isLoading, unlock, lock };
}
