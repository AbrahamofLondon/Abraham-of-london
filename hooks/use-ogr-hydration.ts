import { useState, useEffect } from 'react'

/**
 * Prevents Next.js Hydration Mismatches when using 
 * persisted Zustand stores.
 */
export function useOGRHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    // This only runs on the client after the first render
    setHydrated(true)
  }, [])

  return hydrated
}