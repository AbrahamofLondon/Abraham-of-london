// app/providers.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from '@/lib/server/theme-stub';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/build, render children without providers
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}