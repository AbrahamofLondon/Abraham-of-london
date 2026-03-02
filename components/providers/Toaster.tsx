'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * 🍞 Institutional Toaster (V2.8 Resilience)
 * Optimized for dark-mode high-contrast interfaces.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      expand={false}
      richColors
      toastOptions={{
        style: {
          background: '#09090b', // zinc-950
          border: '1px solid rgba(245, 158, 11, 0.2)', // amber-500/20
          color: '#fafafa', // zinc-50
          fontFamily: 'var(--font-mono)', // Ensure mono font for briefs
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          borderRadius: '12px',
        },
        className: 'aol-toast-authority',
      }}
    />
  );
}