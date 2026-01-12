// lib/auth/gateway.ts
import { getAdminSession } from './admin';
import { getInnerCircleAccess } from '../inner-circle';
import { getPublicAccess } from './public';

export type AuthContext = {
  // Base authentication
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  
  // System-specific access
  isAdmin: boolean;
  isInnerCircle: boolean;
  
  // Permissions
  permissions: {
    canViewPDFs: boolean;
    canDownloadContent: boolean;
    canAccessBoard: boolean;
    canManageUsers: boolean;
  };
  
  // Token data (for API calls)
  tokens: {
    adminToken?: string;
    innerCircleToken?: string;
  };
};

export async function getAuthContext(request: Request): Promise<AuthContext> {
  // Parallel auth checks for different systems
  const [adminAuth, innerCircleAuth] = await Promise.allSettled([
    getAdminSession(request),
    getInnerCircleAccess(request)
  ]);
  
  const admin = adminAuth.status === 'fulfilled' ? adminAuth.value : null;
  const innerCircle = innerCircleAuth.status === 'fulfilled' ? innerCircleAuth.value : null;
  
  // Determine unified permissions
  const isAdmin = !!admin?.isAdmin;
  const isInnerCircle = !!innerCircle?.hasAccess;
  
  return {
    isAuthenticated: isAdmin || isInnerCircle,
    userId: admin?.userId || innerCircle?.userId,
    userRole: isAdmin ? 'admin' : isInnerCircle ? 'inner-circle' : 'guest',
    
    isAdmin,
    isInnerCircle,
    
    permissions: {
      canViewPDFs: isAdmin || isInnerCircle,
      canDownloadContent: isAdmin || isInnerCircle,
      canAccessBoard: isAdmin,
      canManageUsers: isAdmin && admin?.role === 'superadmin'
    },
    
    tokens: {
      adminToken: admin?.token,
      innerCircleToken: innerCircle?.token
    }
  };
}