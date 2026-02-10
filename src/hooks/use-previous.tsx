'use client';

import { useEffect, useRef } from 'react';

/**
 * A custom hook that returns the value of a variable from the previous render.
 * @param value The value to track.
 * @returns The value from the previous render.
 */
export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  
  // Store current value in ref after the component renders
  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes
  
  // Return the value from the previous render
  return ref.current;
}
