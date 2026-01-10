// lib/auth/withInnerCircleAuth.tsx
import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from "@/components/LoadingSpinner";
import type { User, UserRole } from '@/types/auth';

interface WithInnerCircleAuthProps {
  user?: User;
  requiredRole?: UserRole;
}

export function withInnerCircleAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithInnerCircleAuthProps>,
  options?: {
    requiredRole?: UserRole;
    redirectTo?: string;
    fallbackComponent?: React.ComponentType;
  }
) {
  const ComponentWithAuth = (props: P) => {
    const router = useRouter();
    const [user, setUser] = useState<User>();
    const [isLoading, setIsLoading] = useState(true);
    
    const requiredRole = options?.requiredRole || 'inner-circle';
    const redirectTo = options?.redirectTo || `/access/request?resource=${encodeURIComponent(router.asPath)}`;

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          
          if (data?.user) {
            // Check if user has required role
            const userRole = data.user.role as UserRole;
            const userHierarchy = ROLE_HIERARCHY[userRole] || 0;
            const requiredHierarchy = ROLE_HIERARCHY[requiredRole] || 0;
            
            if (userHierarchy >= requiredHierarchy) {
              setUser({
                id: data.user.id,
                email: data.user.email,
                name: data.user.name,
                role: userRole,
                permissions: getPermissionsForRole(userRole),
                membershipDate: data.user.membershipDate,
                lastAccess: data.user.lastAccess
              });
            } else {
              // Insufficient permissions
              if (options?.fallbackComponent) {
                // Use provided fallback
              } else {
                router.push(redirectTo);
              }
            }
          } else {
            // Not authenticated
            router.push(`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${requiredRole}`);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          router.push('/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router, requiredRole, redirectTo]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
          <LoadingSpinner message="Verifying inner circle access..." />
        </div>
      );
    }

    if (!user && options?.fallbackComponent) {
      const Fallback = options.fallbackComponent;
      return <Fallback />;
    }

    return <WrappedComponent {...props} user={user} requiredRole={requiredRole} />;
  };

  ComponentWithAuth.displayName = `withInnerCircleAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithAuth;
}

// Update permissions function
function getPermissionsForRole(role: UserRole): string[] {
  const basePermissions = {
    'guest': ['content:view:public'],
    'viewer': ['content:view:public', 'pdf:view'],
    'editor': ['content:view:public', 'pdf:view', 'pdf:create', 'pdf:edit'],
    'admin': ['content:view:public', 'pdf:view', 'pdf:create', 'pdf:edit', 'pdf:delete', 'pdf:manage', 'admin:access'],
    'member': ['content:view:public', 'content:view:member', 'pdf:view'],
    'patron': ['content:view:public', 'content:view:member', 'content:view:patron', 'pdf:view', 'pdf:download'],
    'inner-circle': [
      'content:view:public', 
      'content:view:member', 
      'content:view:patron', 
      'content:view:inner-circle',
      'pdf:view', 
      'pdf:download',
      'strategic:view',
      'canon:full'
    ],
    'founder': [
      'content:view:public', 
      'content:view:member', 
      'content:view:patron', 
      'content:view:inner-circle',
      'content:view:founder',
      'pdf:view', 
      'pdf:download',
      'strategic:view',
      'canon:full',
      'founder:access'
    ]
  };

  return basePermissions[role] || basePermissions.guest;
}
