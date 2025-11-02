// lib/hooks/useDebounce.ts

import { useRef } from 'react';

type DebouncedFunction<T extends any[]> = (...args: T) => void;

export function useDebounce<T extends any[]>(func: DebouncedFunction<T>, delay: number): DebouncedFunction<T> {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFunc = (...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  };

  // Clean up the timer when the component unmounts
  // This is a good practice to prevent memory leaks
  // React.useEffect(() => {
  //   return () => {
  //     if (timeoutRef.current) {
  //       clearTimeout(timeoutRef.current);
  //     }
  //   };
  // }, []);

  return debouncedFunc;
}