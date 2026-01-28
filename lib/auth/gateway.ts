// lib/auth/gateway.ts - ALIGNED WITH ADMIN-SESSION
import { NextRequest } from 'next/server';
import { getAdminSession } from '@/lib/server/auth/admin-session';
import { getInnerCircleAccess } from "@/lib/inner-circle/access.server";

// Define types that match the actual return types
interface AdminSessionResult {
  user: { 
    id: string; 
    email: string; 
    isAdmin: boolean; 
    token?: string 
  } | null;
  isAdmin: boolean;
  token?: string;
}

interface InnerCircleAccessResult {
  hasAccess: boolean;
  memberId?: string | null;
  tier?: string | null;
  reason?: string;
  userId?: string;
  email?: string;
  accessLevel?: string;
}

interface AuthGatewayResult {
  adminSession: {
    user: { 
      id: string; 
      email: string; 
      isAdmin: boolean; 
      token?: string 
    } | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
  };
  innerCircleAccess: {
    hasAccess: boolean;
    memberId: string | null;
    tier: string | null;
    reason?: string;
  };
  combined: {
    hasAnyAccess: boolean;
    isAuthenticated: boolean;
  };
}

/**
 * Unified authentication gateway for both admin and inner-circle access
 */
export async function authGateway(request: NextRequest | Request): Promise<AuthGatewayResult> {
  // Convert standard Request to compatible object
  let compatibleReq: any;
  
  if (request instanceof NextRequest) {
    compatibleReq = request;
  } else {
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      headers.append(key, value);
    });

    const cookieHeader = request.headers.get('cookie') || '';
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = value;
      }
    });

    compatibleReq = {
      headers: headers,
      cookies: {
        get: (name: string) => {
          const value = cookies[name];
          return value ? { value } : null;
        }
      },
      url: request.url,
      method: request.method
    };
  }

  // Fetch both sessions in parallel
  const [adminAuth, innerCircleAuth] = await Promise.allSettled([
    getAdminSession(compatibleReq),
    getInnerCircleAccess(compatibleReq)
  ]);

  // Extract admin session (using the actual return type)
  const admin = adminAuth.status === 'fulfilled' 
    ? (adminAuth.value as AdminSessionResult) 
    : null;
  
  const innerCircle = innerCircleAuth.status === 'fulfilled' 
    ? (innerCircleAuth.value as InnerCircleAccessResult) 
    : null;

  const hasAdminAccess = admin?.isAdmin === true;
  const hasInnerCircleAccess = innerCircle?.hasAccess === true;

  // Extract inner circle properties with fallbacks
  const innerCircleMemberId = innerCircle?.memberId || 
                              innerCircle?.userId || 
                              (innerCircle?.email ? `user-${innerCircle.email}` : null);
  
  const innerCircleTier = innerCircle?.tier || 
                         innerCircle?.accessLevel || 
                         (hasInnerCircleAccess ? 'standard' : null);

  return {
    adminSession: {
      user: admin?.user || null,
      isAuthenticated: !!admin?.user,
      isAdmin: hasAdminAccess,
    },
    innerCircleAccess: {
      hasAccess: hasInnerCircleAccess,
      memberId: innerCircleMemberId,
      tier: innerCircleTier,
      reason: innerCircle?.reason,
    },
    combined: {
      hasAnyAccess: hasAdminAccess || hasInnerCircleAccess,
      isAuthenticated: hasAdminAccess || hasInnerCircleAccess,
    },
  };
}

/**
 * Check if user has access to a specific tier
 */
export async function checkTierAccess(
  request: NextRequest | Request,
  requiredTier: string
): Promise<{ hasAccess: boolean; reason?: string }> {
  const auth = await authGateway(request);
  
  // Admins get access to everything
  if (auth.adminSession.isAdmin) {
    return { hasAccess: true };
  }

  // Check if user has any inner-circle access
  if (!auth.innerCircleAccess.hasAccess) {
    return { 
      hasAccess: false, 
      reason: auth.innerCircleAccess.reason || 'INNER_CIRCLE_REQUIRED' 
    };
  }

  const userTier = auth.innerCircleAccess.tier;
  
  // If no tier specified, grant access
  if (!userTier) {
    return { hasAccess: true };
  }

  // Define tier hierarchy
  const tierOrder: Record<string, number> = {
    'elite': 1,
    'premium': 2,  
    'standard': 3,
    'basic': 3,
    'member': 3,
    'public': 4
  };

  const userTierLevel = tierOrder[userTier.toLowerCase()] || 0;
  const requiredTierLevel = tierOrder[requiredTier.toLowerCase()] || 0;

  // User must have equal or higher privilege
  if (userTierLevel > requiredTierLevel) {
    return { 
      hasAccess: false, 
      reason: `INSUFFICIENT_TIER: You have ${userTier} access but ${requiredTier} is required` 
    };
  }

  return { hasAccess: true };
}

/**
 * Middleware wrapper for route handlers
 */
export function withAuth(handler: Function) {
  return async function(request: NextRequest | Request, ...args: any[]) {
    try {
      const auth = await authGateway(request);
      
      // Deny access if no authentication present
      if (!auth.combined.hasAnyAccess) {
        return new Response(
          JSON.stringify({ 
            error: 'Authentication required',
            code: 'AUTH_REQUIRED',
            reason: auth.innerCircleAccess.reason
          }),
          { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Pass authentication context to handler
      const context = { 
        auth,
        request,
        ...args 
      };
      
      return handler(request, context);
      
    } catch (error) {
      console.error('[AuthGateway] Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const statusCode = errorMessage.includes('Invalid') || errorMessage.includes('expired') ? 401 : 500;
      
      return new Response(
        JSON.stringify({ 
          error: 'Authentication system error',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          code: 'AUTH_SYSTEM_ERROR'
        }),
        { 
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}