// components/RouteProtection.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useInnerCircle } from '@/lib/inner-circle/InnerCircleContext';

const PROTECTED_ROUTES = [
  /^\/strategic-frameworks\/(?!$).*canon.*/,
  /^\/strategic-frameworks\/ultimate-purpose.*/,
  /^\/canon\//,
  /^\/inner-circle\/(?!locked|join|request|details).*/,
];

export function RouteProtection({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { access, isLoading } = useInnerCircle();

  useEffect(() => {
    // Skip on initial load or if loading
    if (isLoading) return;

    const isProtected = PROTECTED_ROUTES.some(pattern => pattern.test(pathname));
    
    if (isProtected && (!access || !access.hasAccess)) {
      // Redirect to locked page
      const returnTo = encodeURIComponent(pathname);
      router.push(`/inner-circle/locked?returnTo=${returnTo}`);
    }
  }, [pathname, access, isLoading, router]);

  // Show loading state while checking access
  if (isLoading && PROTECTED_ROUTES.some(pattern => pattern.test(pathname))) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying Inner Circle access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
