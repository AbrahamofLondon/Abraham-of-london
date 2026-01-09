// lib/auth/withUnifiedAuth.tsx
import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from "@/components/LoadingSpinner";
import { getInnerCircleAccess } from '@/lib/inner-circle';
import type { User, UserRole } from '@/types/auth';
import type { InnerCircleAccess } from '@/lib/inner-circle';

interface WithUnifiedAuthProps {
  user?: User;
  innerCircleAccess?: InnerCircleAccess;
  requiredRole?: UserRole | 'inner-circle';
}

export function withUnifiedAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithUnifiedAuthProps>,
  options?: {
    requiredRole?: UserRole | 'inner-circle';
    redirectTo?: string;
    fallbackComponent?: React.ComponentType<{ requiredRole?: string }>;
    publicFallback?: boolean; // Show public version if no access
  }
) {
  const ComponentWithAuth = (props: P) => {
    const router = useRouter();
    const [user, setUser] = useState<User>();
    const [innerCircleAccess, setInnerCircleAccess] = useState<InnerCircleAccess>();
    const [isLoading, setIsLoading] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    
    const requiredRole = options?.requiredRole || 'inner-circle';
    const redirectTo = options?.redirectTo || 
      (requiredRole === 'inner-circle' 
        ? `/inner-circle/locked?returnTo=${encodeURIComponent(router.asPath)}`
        : `/login?redirect=${encodeURIComponent(router.asPath)}`);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // Check both systems in parallel
          const [sessionResponse, innerCircleCheck] = await Promise.allSettled([
            fetch('/api/auth/session'),
            getInnerCircleAccess()
          ]);

          let currentUser: User | undefined;
          let currentInnerCircleAccess: InnerCircleAccess | undefined;

          // Check admin session
          if (sessionResponse.status === 'fulfilled' && sessionResponse.value.ok) {
            const sessionData = await sessionResponse.value.json();
            if (sessionData?.user) {
              currentUser = {
                id: sessionData.user.id,
                email: sessionData.user.email,
                name: sessionData.user.name,
                role: sessionData.user.role as UserRole,
                permissions: sessionData.user.permissions || []
              };
            }
          }

          // Check inner circle access
          if (innerCircleCheck.status === 'fulfilled') {
            currentInnerCircleAccess = innerCircleCheck.value;
          }

          setUser(currentUser);
          setInnerCircleAccess(currentInnerCircleAccess);

          // Check if user has required access
          let canAccess = false;
          
          if (requiredRole === 'inner-circle') {
            canAccess = currentInnerCircleAccess?.hasAccess || false;
          } else if (currentUser) {
            const roleHierarchy: Record<UserRole, number> = {
              'guest': 0,
              'viewer': 1,
              'editor': 2,
              'admin': 3,
              'member': 4,
              'patron': 5,
              'inner-circle': 6,
              'founder': 7
            };
            
            const userHierarchy = roleHierarchy[currentUser.role] || 0;
            const requiredHierarchy = roleHierarchy[requiredRole as UserRole] || 0;
            canAccess = userHierarchy >= requiredHierarchy;
          }

          setHasAccess(canAccess);

          // Handle access denial
          if (!canAccess && !options?.publicFallback) {
            if (options?.fallbackComponent) {
              // Use provided fallback
            } else {
              router.push(redirectTo);
            }
          }

        } catch (error) {
          console.error('Auth check failed:', error);
          if (!options?.publicFallback) {
            router.push('/login');
          }
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router, requiredRole, redirectTo]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <LoadingSpinner message="Verifying access..." />
        </div>
      );
    }

    if (!hasAccess && options?.fallbackComponent) {
      const Fallback = options.fallbackComponent;
      return <Fallback requiredRole={requiredRole.toString()} />;
    }

    return (
      <WrappedComponent 
        {...props} 
        user={user} 
        innerCircleAccess={innerCircleAccess}
        requiredRole={requiredRole}
      />
    );
  };

  ComponentWithAuth.displayName = `withUnifiedAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithAuth;
}