// @/lib/hooks/useDebounce.ts

import * as React from 'react';

/**
 * Custom hook to debounce a value, returning the value only after a specified delay 
 * since the last update to the input value. This is the standard pattern for search inputs.
 *
 * @param value The value to be debounced (e.g., a search string).
 * @param delay The delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // This cleanup function runs if 'value' or 'delay' changes (cancels the previous timeout).
    // This is the "debouncing" mechanism.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run only if value or delay changes

  return debouncedValue;
}