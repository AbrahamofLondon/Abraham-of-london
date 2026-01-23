// lib/auth/withInnerCircleAuth.tsx
import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from "@/components/LoadingSpinner";
import type { User, UserRole } from '@/types/auth';
import { ROLE_HIERARCHY } from '@/types/auth'; // ✅ Added import

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
    const [accessChecked, setAccessChecked] = useState(false);
    
    const requiredRole = options?.requiredRole || 'inner-circle';
    const redirectTo = options?.redirectTo || `/access/request?resource=${encodeURIComponent(router.asPath)}`;

    useEffect(() => {
      const checkAuth = async () => {
        try {
          // First check if we have a session
          const sessionResponse = await fetch('/api/auth/session');
          const sessionData = await sessionResponse.json();
          
          if (sessionData?.user) {
            // User is authenticated via NextAuth
            const userRole = sessionData.user.role as UserRole;
            const userHierarchy = ROLE_HIERARCHY[userRole] || 0;
            const requiredHierarchy = ROLE_HIERARCHY[requiredRole] || 0;
            
            if (userHierarchy >= requiredHierarchy) {
              // User has sufficient role
              setUser({
                id: sessionData.user.id,
                email: sessionData.user.email,
                name: sessionData.user.name,
                role: userRole,
                permissions: getPermissionsForRole(userRole),
                membershipDate: sessionData.user.membershipDate,
                lastAccess: sessionData.user.lastAccess
              });
              setAccessChecked(true);
              return;
            } else {
              // Check for inner-circle access as fallback
              try {
                const innerCircleResponse = await fetch('/api/inner-circle/access');
                if (innerCircleResponse.ok) {
                  const accessData = await innerCircleResponse.json();
                  if (accessData.hasAccess) {
                    // Grant inner-circle access even if role is lower
                    setUser({
                      id: `inner-circle-${sessionData.user.id || 'access'}`,
                      email: sessionData.user.email || 'inner-circle@abrahamoflondon.org',
                      name: 'Inner Circle Member',
                      role: 'inner-circle' as UserRole,
                      permissions: getPermissionsForRole('inner-circle'),
                      membershipDate: new Date().toISOString(),
                      lastAccess: new Date().toISOString()
                    });
                    setAccessChecked(true);
                    return;
                  }
                }
              } catch (innerCircleError) {
                // Inner circle check failed, continue with normal flow
              }
            }
          }
          
          // If we get here, user doesn't have required access
          if (options?.fallbackComponent) {
            // Use provided fallback
            setAccessChecked(true);
          } else {
            router.push(redirectTo);
          }
          
        } catch (error) {
          console.error('Auth check failed:', error);
          
          // Try inner-circle standalone access
          try {
            const innerCircleResponse = await fetch('/api/inner-circle/access');
            if (innerCircleResponse.ok) {
              const accessData = await innerCircleResponse.json();
              if (accessData.hasAccess) {
                // Grant inner-circle access
                setUser({
                  id: `inner-circle-guest`,
                  email: 'inner-circle@abrahamoflondon.org',
                  name: 'Inner Circle Member',
                  role: 'inner-circle' as UserRole,
                  permissions: getPermissionsForRole('inner-circle'),
                  membershipDate: new Date().toISOString(),
                  lastAccess: new Date().toISOString()
                });
                setAccessChecked(true);
                return;
              }
            }
          } catch (innerCircleError) {
            // Continue with error flow
          }
          
          // Redirect to login if all checks failed
          router.push(`/login?redirect=${encodeURIComponent(router.asPath)}&tier=${requiredRole}`);
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

    if (!accessChecked && options?.fallbackComponent) {
      const Fallback = options.fallbackComponent;
      return <Fallback />;
    }

    return <WrappedComponent {...props} user={user} requiredRole={requiredRole} />;
  };

  ComponentWithAuth.displayName = `withInnerCircleAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithAuth;
}

// Update permissions function with better typing
function getPermissionsForRole(role: UserRole): string[] {
  const basePermissions: Record<UserRole, string[]> = {
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

// Utility function for checking permissions
export function checkPermission(user: User | undefined, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission) || user.permissions.includes('*');
}

// Hook version for functional components
export function useInnerCircleAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const [user, setUser] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check both auth systems
        const [sessionResponse, innerCircleResponse] = await Promise.allSettled([
          fetch('/api/auth/session'),
          fetch('/api/inner-circle/access')
        ]);

        let foundUser: User | undefined;
        let userHasAccess = false;

        // Check NextAuth session
        if (sessionResponse.status === 'fulfilled' && sessionResponse.value.ok) {
          const sessionData = await sessionResponse.value.json();
          if (sessionData?.user) {
            const userRole = sessionData.user.role as UserRole;
            const userHierarchy = ROLE_HIERARCHY[userRole] || 0;
            const requiredHierarchy = ROLE_HIERARCHY[requiredRole || 'inner-circle'] || 0;
            
            if (userHierarchy >= requiredHierarchy) {
              foundUser = {
                id: sessionData.user.id,
                email: sessionData.user.email,
                name: sessionData.user.name,
                role: userRole,
                permissions: getPermissionsForRole(userRole),
                membershipDate: sessionData.user.membershipDate,
                lastAccess: sessionData.user.lastAccess
              };
              userHasAccess = true;
            }
          }
        }

        // Check inner-circle access as fallback
        if (!userHasAccess && innerCircleResponse.status === 'fulfilled' && innerCircleResponse.value.ok) {
          const innerCircleData = await innerCircleResponse.value.json();
          if (innerCircleData.hasAccess) {
            foundUser = {
              id: `inner-circle-${foundUser?.id || 'access'}`,
              email: foundUser?.email || 'inner-circle@abrahamoflondon.org',
              name: foundUser?.name || 'Inner Circle Member',
              role: 'inner-circle' as UserRole,
              permissions: getPermissionsForRole('inner-circle'),
              membershipDate: new Date().toISOString(),
              lastAccess: new Date().toISOString()
            };
            userHasAccess = true;
          }
        }

        setUser(foundUser);
        setHasAccess(userHasAccess);
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredRole]);

  return {
    user,
    loading,
    hasAccess,
    checkPermission: (permission: string) => checkPermission(user, permission)
  };
}

// Export everything
export default withInnerCircleAuth;