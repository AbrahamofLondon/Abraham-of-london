import React, { ComponentType, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface WithAdminAuthProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}

export function withAdminAuth<P extends object>(
  WrappedComponent: ComponentType<P & WithAdminAuthProps>
) {
  const ComponentWithAuth = (props: P) => {
    const router = useRouter();
    const [user, setUser] = useState<WithAdminAuthProps['user']>();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const checkAuth = async () => {
        try {
          const response = await fetch('/api/auth/session');
          const data = await response.json();
          
          if (data?.user) {
            // Check if user has admin access
            if (!['admin', 'editor'].includes(data.user.role)) {
              router.push('/unauthorized');
              return;
            }
            
            setUser({
              id: data.user.id,
              email: data.user.email,
              name: data.user.name,
              role: data.user.role,
              permissions: getPermissionsForRole(data.user.role),
            });
          } else {
            router.push('/admin/login?redirect=' + encodeURIComponent(router.asPath));
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          router.push('/admin/login');
        } finally {
          setIsLoading(false);
        }
      };

      checkAuth();
    }, [router]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
          <LoadingSpinner message="Verifying access..." />
        </div>
      );
    }

    return <WrappedComponent {...props} user={user} />;
  };

  ComponentWithAuth.displayName = `withAdminAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  return ComponentWithAuth;
}

function getPermissionsForRole(role: string): string[] {
  switch (role) {
    case 'admin':
      return ['pdf:view', 'pdf:create', 'pdf:edit', 'pdf:delete', 'pdf:manage'];
    case 'editor':
      return ['pdf:view', 'pdf:create', 'pdf:edit'];
    case 'viewer':
      return ['pdf:view'];
    default:
      return ['pdf:view'];
  }
}