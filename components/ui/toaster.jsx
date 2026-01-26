'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
      }}
    />
  );
}