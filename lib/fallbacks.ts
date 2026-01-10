// lib/fallbacks.ts
/**
 * Safe fallbacks for missing modules during build
 */

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

// Safe require function
export function safeRequire<T>(modulePath: string, fallback: T): T {
  try {
    // @ts-ignore - Dynamic require
    return require(modulePath);
  } catch (error) {
    console.warn(`Module ${modulePath} not found, using fallback`);
    return fallback;
  }
}
