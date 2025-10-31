// @/lib/hooks/useDebounce.ts

import * as React from "react";

/**
 * Custom hook to debounce a value, returning the value only after a specified delay
 * since the last update to the input value. This is the standard pattern for search inputs.
 *
 * @param value The value to be debounced (e.g., a search string).
 * @param delay The delay in milliseconds. Must be a non-negative number.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const { useState, useEffect } = React;

  // Use the input 'value' as the initial state. This ensures the first render
  // returns the actual value immediately, which is often desirable.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Use a ref to store the latest input value and delay.
  // This is a common pattern to ensure the timeout closure has the current values
  // without including them in the effect's dependency array (though not strictly
  // necessary here, it's good practice for more complex debouncing logic).
  const valueRef = React.useRef(value);
  const delayRef = React.useRef(delay);

  // Update refs whenever props change
  useEffect(() => {
    valueRef.current = value;
    delayRef.current = delay;
  }, [value, delay]);


  useEffect(() => {
    // Check if the input value has changed since the last time the effect ran.
    // In this simple case, the dependency array already handles this, but the 
    // timeout logic remains the core mechanism.
    
    const handler = setTimeout(() => {
      // Use the ref for the most up-to-date value when the timeout fires
      setDebouncedValue(valueRef.current);
    }, delayRef.current);

    // Cleanup: This function is the "debouncing" mechanism. It clears the
    // previous timeout when 'value' or 'delay' changes, effectively
    // resetting the countdown.
    return () => {
      clearTimeout(handler);
    };

  }, [value, delay]); // Re-run effect only when 'value' or 'delay' changes

  return debouncedValue;
}