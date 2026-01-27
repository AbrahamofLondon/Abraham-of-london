// lib/server/theme-stub.tsx
import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Log props in dev to see what's being passed
  if (process.env.NODE_ENV !== 'production') {
    console.log('[ThemeProvider stub] Props received:', props);
  }
  return <>{children}</>;
}