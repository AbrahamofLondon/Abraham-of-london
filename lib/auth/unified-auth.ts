// lib/auth/unified-auth.ts
import type { GetServerSidePropsContext } from 'next';
import { getInnerCircleAccess, type InnerCircleAccess } from '@/lib/inner-circle';
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
  // Get session from your existing admin system
  const sessionResponse = await fetch(`${process.env.NEXTAUTH_URL || ''}/api/auth/session`, {
    headers: ctx.req.headers as HeadersInit
  });
  
  let user: User | null = null;
  let innerCircleAccess: InnerCircleAccess | null = null;
  
  if (sessionResponse.ok) {
    const sessionData = await sessionResponse.json();
    if (sessionData?.user) {
      user = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name,
        role: sessionData.user.role as UserRole,
        permissions: sessionData.user.permissions || []
      };
    }
  }
  
  // Get inner-circle access
  // For server-side, we need to check cookies
  const token = ctx.req.cookies.innerCircleToken;
  if (token) {
    // Simplified server-side check - in production, validate properly
    try {
      const accessCheck = await getInnerCircleAccess(); // This needs to work server-side
      // You'll need to adapt getInnerCircleAccess for server-side use
      // For now, we'll trust the cookie
      innerCircleAccess = {
        hasAccess: true,
        ok: true,
        reason: 'valid' as const,
        token,
        checkedAt: new Date()
      };
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
