// lib/inner-circle/server-auth.ts
import type { GetServerSidePropsContext } from 'next';
import { verifyInnerCircleToken } from './jwt'; // ✅ FIXED: Correct function name

export async function validateInnerCircleAccess(ctx: GetServerSidePropsContext) {
  // Check cookies or headers for auth token
  const token = ctx.req.cookies.innerCircleToken || 
                ctx.req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return {
      hasAccess: false,
      user: null
    };
  }

  try {
    const decoded = await verifyInnerCircleToken(token); // ✅ FIXED: Use correct function name
    
    if (!decoded) {
      return {
        hasAccess: false,
        user: null
      };
    }

    const validRoles = ['inner-circle', 'founder'];
    
    if (!validRoles.includes(decoded.role)) {
      return {
        hasAccess: false,
        user: null
      };
    }

    return {
      hasAccess: true,
      user: decoded
    };
  } catch (error) {
    return {
      hasAccess: false,
      user: null
    };
  }
}