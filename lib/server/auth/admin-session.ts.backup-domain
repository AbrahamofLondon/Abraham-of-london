/* lib/server/auth/admin-session.ts - PRODUCTION VERSION */
import type { NextRequest } from 'next/server';

/**
 * ADMIN SESSION HANDLER
 * Validates administrative credentials against institutional secrets.
 * Aligned with the Gateway parallel check.
 */
export async function getAdminSession(request: any): Promise<{ 
  user: { id: string; email: string; isAdmin: boolean; token?: string } | null;
  isAdmin: boolean; 
  token?: string;
}> {
  try {
    // 1. Polymorphic Header/Cookie Extraction
    let adminToken: string | undefined | null;

    if (typeof request.headers?.get === 'function') {
      // Standard Request / NextRequest (Edge/Middleware)
      adminToken = request.headers.get('x-admin-token');
      if (!adminToken && request.cookies?.get) {
        adminToken = request.cookies.get('admin_token')?.value;
      }
    } else {
      // Node.js / NextApiRequest (IncomingMessage)
      adminToken = request.headers?.['x-admin-token'];
      if (!adminToken && request.cookies) {
        adminToken = request.cookies['admin_token'];
      }
    }

    if (!adminToken) {
      return { user: null, isAdmin: false };
    }

    // 2. Institutional Verification
    // Ensure ADMIN_SECRET_TOKEN is defined in your Neon/Production env
    const isValid = adminToken === process.env.ADMIN_SECRET_TOKEN;

    if (!isValid) {
      return { user: null, isAdmin: false };
    }

    // 3. Return Standardized Admin Context
    const user = {
      id: 'admin-primary',
      email: 'admin@abrahamoflondon.com',
      isAdmin: true,
      token: adminToken
    };

    return {
      user,
      isAdmin: true,
      token: adminToken
    };
  } catch (error) {
    console.error('[ADMIN_SESSION_ERROR]', error);
    return { user: null, isAdmin: false };
  }
}