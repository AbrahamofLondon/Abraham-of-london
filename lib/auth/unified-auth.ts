// lib/auth/unified-auth.ts
import type { GetServerSidePropsContext } from 'next';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";
import type { User, UserRole } from '@/types/auth';

export type UnifiedAuthResult = {
  isAuthenticated: boolean;
  user: User | null;
  innerCircleAccess: InnerCircleAccess | null;
  canAccess: (requiredRole: UserRole | 'inner-circle') => boolean;
};

/**
 * Unified auth check that works with both admin system and inner-circle system
 */
export async function checkUnifiedAuth(ctx: GetServerSidePropsContext): Promise<UnifiedAuthResult> {
  let user: User | null = null;
  let innerCircleAccess: InnerCircleAccess | null = null;
  
  // Check admin session (if you have server-side session checking)
  try {
    // If you have a server-side session checker, use it here
    // For example: const session = await getServerSession(authOptions);
    
    // For now, let's check the session cookie directly
    const sessionToken = ctx.req.cookies['next-auth.session-token'] || 
                        ctx.req.cookies['__Secure-next-auth.session-token'];
    
    if (sessionToken) {
      // You should validate the session token properly here
      // This is a simplified version
      user = {
        id: 'temporary-id',
        email: 'user@example.com',
        name: 'User',
        role: 'admin' as UserRole,
        permissions: ['access:admin']
      };
    }
  } catch (error) {
    console.error('Admin session check failed:', error);
  }
  
  // Get inner-circle access
  const token = ctx.req.cookies.innerCircleToken;
  if (token) {
    try {
      // Use a server-side compatible version of getInnerCircleAccess
      innerCircleAccess = await checkServerSideInnerCircleAccess(token, ctx.req.headers);
    } catch (error) {
      console.error('Inner circle access check failed:', error);
    }
  }
  
  const canAccess = (requiredRole: UserRole | 'inner-circle'): boolean => {
    if (requiredRole === 'inner-circle') {
      return innerCircleAccess?.hasAccess || false;
    }
    
    if (!user) return false;
    
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
    
    const userHierarchy = roleHierarchy[user.role] || 0;
    const requiredHierarchy = roleHierarchy[requiredRole] || 0;
    
    return userHierarchy >= requiredHierarchy;
  };
  
  return {
    isAuthenticated: !!user || !!innerCircleAccess,
    user,
    innerCircleAccess,
    canAccess
  };
}

/**
 * Server-side inner circle access check
 */
async function checkServerSideInnerCircleAccess(
  token: string,
  headers?: Record<string, string | string[] | undefined>
): Promise<InnerCircleAccess | null> {
  try {
    // Validate the token server-side
    // You can call your inner-circle validation API or validate directly
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/api/inner-circle/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `innerCircleToken=${token}`,
        ...(headers as Record<string, string>)
      },
      body: JSON.stringify({ token })
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        hasAccess: result.hasAccess || false,
        ok: result.ok || false,
        reason: result.reason || undefined,
        token: result.token || token,
        checkedAt: new Date()
      };
    }
    
    return {
      hasAccess: false,
      ok: false,
      reason: 'api_error' as const,
      token,
      checkedAt: new Date()
    };
  } catch (error) {
    return {
      hasAccess: false,
      ok: false,
      reason: 'api_error' as const,
      token,
      checkedAt: new Date()
    };
  }
}

/**
 * Check if user has specific access level
 */
export function hasAccessLevel(
  authResult: UnifiedAuthResult,
  requiredLevel: UserRole | 'inner-circle'
): boolean {
  return authResult.canAccess(requiredLevel);
}

/**
 * Create a simplified auth check for middleware
 */
export async function getAuthCheck(ctx: GetServerSidePropsContext) {
  const auth = await checkUnifiedAuth(ctx);
  
  return {
    ...auth,
    requireAuth: (role: UserRole | 'inner-circle' = 'guest') => {
      if (!hasAccessLevel(auth, role)) {
        return {
          redirect: {
            destination: role === 'inner-circle' ? '/inner-circle/access' : '/admin/login',
            permanent: false
          }
        };
      }
      return null;
    }
  };
}

/**
 * Type guard for authenticated users
 */
export function isAuthenticatedUser(
  authResult: UnifiedAuthResult
): authResult is UnifiedAuthResult & { user: User } {
  return authResult.user !== null;
}

/**
 * Type guard for inner circle members
 */
export function isInnerCircleMember(
  authResult: UnifiedAuthResult
): authResult is UnifiedAuthResult & { innerCircleAccess: InnerCircleAccess } {
  return authResult.innerCircleAccess?.hasAccess || false;
}

// Re-export types for convenience
export type { User, UserRole, InnerCircleAccess };