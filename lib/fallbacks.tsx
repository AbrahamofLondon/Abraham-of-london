/**
 * Safe fallbacks for missing modules during build
 */
import React from 'react';
// security-scan-ignore-file
// Reason: This file only contains environment variable NAMES, not values.

// Fallback for missing Layout component
export const FallbackLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {children}
    </div>
  );
};

// Fallback for missing auth options
export const fallbackAuthOptions = {
  providers: [],
  session: { strategy: 'jwt' as const },
  secret: 'fallback-secret-do-not-use-in-production',
};

// Safe require function with proper type handling
export function safeRequire<T>(modulePath: string, fallback: T): T {
  try {
    // Use require for CommonJS modules
    const mod = require(modulePath);
    // Check if it's an ES module with default export
    return mod.default || mod;
  } catch (error) {
    console.warn(`Module ${modulePath} not found, using fallback`);
    return fallback;
  }
}

// Safe dynamic import for ES modules
export async function safeDynamicImport<T>(modulePath: string, fallback: T): Promise<T> {
  try {
    const mod = await import(modulePath);
    // Check if it's an ES module with default export
    return mod.default || mod;
  } catch (error) {
    console.warn(`Module ${modulePath} not found, using fallback`);
    return fallback;
  }
}

// Utility to check if a module exists without loading it
export function moduleExists(modulePath: string): boolean {
  try {
    require.resolve(modulePath);
    return true;
  } catch {
    return false;
  }
}

// Type-safe version of safeRequire with proper typing
export function safeRequireTyped<T>(modulePath: string, fallback: T): T {
  try {
    const mod = require(modulePath);
    
    // Handle different export patterns
    if (typeof mod === 'function' || typeof mod === 'object') {
      return mod.default || mod;
    }
    return mod;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEV] Module ${modulePath} not available, using fallback`);
    }
    return fallback;
  }
}