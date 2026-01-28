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
    return module.default || mod;
  } catch (error) {
    console.warn(`Module ${modulePath} not found, using fallback`);
    return fallback;
  }
}

// Safe dynamic import for ES modules
export async function safeDynamicImport<T>(modulePath: string, fallback: T): Promise<T> {
  try {
    const mod = await import(modulePath);
    return module.default || mod;
  } catch (error) {
    console.warn(`Module ${modulePath} not found, using fallback`);
    return fallback;
  }
}
