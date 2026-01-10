// lib/inner-circle/server-auth.ts
import type { GetServerSidePropsContext } from 'next';
import { verifyToken } from './jwt'; // You'll need to implement this

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
    const decoded = await verifyToken(token); // JWT verification
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
