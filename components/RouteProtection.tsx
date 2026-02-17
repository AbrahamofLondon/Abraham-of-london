// components/RouteProtection.tsx - PRODUCTION READY (ENHANCED)
'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useInnerCircle } from '@/lib/inner-circle/InnerCircleContext';

// Define the shape of the Inner Circle context for better type safety
interface InnerCircleContextType {
  isLoading?: boolean;
  isAuthenticated?: boolean;
  authenticated?: boolean;
  hasAccess?: boolean;
  access?: {
    hasAccess?: boolean;
  };
}

// Define protected route patterns
const PROTECTED_ROUTES: RegExp[] = [
  /^\/strategic-frameworks\/(?!$).*canon.*/,
  /^\/strategic-frameworks\/ultimate-purpose.*/,
  /^\/canon\//,
  /^\/inner-circle\/(?!locked|join|request|details|access-denied).*/,
  /^\/admin\//,
  /^\/vault\//,
  /^\/api\/protected\//, // Add API routes if needed
];

// Public routes that don't need protection
const PUBLIC_ROUTES: string[] = [
  '/',
  '/about',
  '/resources',
  '/contact',
  '/inner-circle/locked',
  '/inner-circle/join',
  '/inner-circle/request',
  '/inner-circle/details',
  '/inner-circle/access-denied',
  '/login',
  '/signup',
  '/auth',
  '/auth/signin',
  '/auth/callback',
  '/api/auth',
];

// Loading component for better UX
const SecurityLoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-950 to-black flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500/30 border-t-amber-500 mx-auto"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-6 w-6 rounded-full bg-amber-500/20"></div>
        </div>
      </div>
      <div>
        <p className="text-slate-300 font-medium">Securing Access</p>
        <p className="text-slate-500 text-sm mt-1">
          Verifying Inner Circle permissions...
        </p>
      </div>
      <div className="pt-4">
        <div className="h-1 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-amber-500 to-amber-600 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export function RouteProtection({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const innerCircle = useInnerCircle() as InnerCircleContextType;
  const [isChecking, setIsChecking] = useState(true);

  // Safely extract properties with fallbacks
  const isLoading = innerCircle?.isLoading ?? true;
  const isAuthenticated = innerCircle?.isAuthenticated ?? innerCircle?.authenticated ?? false;
  const hasAccess = innerCircle?.hasAccess ?? innerCircle?.access?.hasAccess ?? false;

  useEffect(() => {
    // If pathname is null, we can't check routes
    if (!pathname) {
      setIsChecking(false);
      return;
    }

    // If still loading inner circle context, wait
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    );

    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // Check if route is protected
    const isProtectedRoute = PROTECTED_ROUTES.some(pattern => pattern.test(pathname));

    if (isProtectedRoute) {
      // If user doesn't have access or is not authenticated
      if (!hasAccess || !isAuthenticated) {
        const searchParamsString = searchParams?.toString() ?? '';
        const returnTo = encodeURIComponent(`${pathname}${searchParamsString ? `?${searchParamsString}` : ''}`);
        
        // Use window.location instead of router.push to avoid import issues
        if (typeof window !== 'undefined') {
          // Prevent infinite redirect loops
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/inner-circle/locked')) {
            window.location.href = `/inner-circle/locked?returnTo=${returnTo}`;
          }
        }
        return;
      }
    }

    // All checks passed
    setIsChecking(false);
  }, [pathname, hasAccess, isLoading, isAuthenticated, searchParams]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    const isProtectedRoute = pathname ? PROTECTED_ROUTES.some(pattern => pattern.test(pathname)) : false;
    
    if (isProtectedRoute) {
      return <SecurityLoadingSpinner />;
    }
  }

  return <>{children}</>;
}

// Optional: Add a higher-order component for specific routes
export function withRouteProtection<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function WithRouteProtectionWrapper(props: P) {
    return (
      <RouteProtection>
        <WrappedComponent {...props} />
      </RouteProtection>
    );
  }

  WithRouteProtectionWrapper.displayName = `withRouteProtection(${displayName})`;
  
  return WithRouteProtectionWrapper;
}

// Optional: Add a hook for programmatic access checks
export function useRouteProtection() {
  const pathname = usePathname();
  const innerCircle = useInnerCircle() as InnerCircleContextType;
  
  const isAuthenticated = innerCircle?.isAuthenticated ?? innerCircle?.authenticated ?? false;
  const hasAccess = innerCircle?.hasAccess ?? innerCircle?.access?.hasAccess ?? false;
  
  const isPublicRoute = (route: string) => {
    return PUBLIC_ROUTES.some(r => route === r || route.startsWith(`${r}/`));
  };
  
  const isProtectedRoute = (route: string) => {
    return PROTECTED_ROUTES.some(pattern => pattern.test(route));
  };
  
  const canAccessRoute = (route: string) => {
    if (isPublicRoute(route)) return true;
    if (!isProtectedRoute(route)) return true;
    return hasAccess && isAuthenticated;
  };
  
  return {
    isAuthenticated,
    hasAccess,
    isPublicRoute,
    isProtectedRoute,
    canAccessRoute,
    currentRouteCanAccess: pathname ? canAccessRoute(pathname) : false,
  };
}

export default RouteProtection;