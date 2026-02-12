/* lib/server/admin-security.ts */
import { NextRequest, NextResponse } from 'next/server';
import { getClientIp, withEdgeRateLimit } from '@/lib/server/rate-limit-unified';

const ALLOWED_IPS = process.env.ADMIN_ALLOWED_IPS?.split(',') || [];
const NODE_ENV = process.env.NODE_ENV;

/**
 * PHASE: IP Whitelisting
 */
export function isAllowedIp(ip: string): boolean {
  if (NODE_ENV !== 'production' && (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost')) return true;
  if (ALLOWED_IPS.length === 0) return NODE_ENV !== 'production';
  return ALLOWED_IPS.some(allowed => ip.startsWith(allowed.split('/')[0]));
}

/**
 * PHASE: Sensitive Operations check
 */
export function isSensitiveOperation(pathname: string, method: string): boolean {
  const sensitive = [
    { path: '/api/admin/system', methods: ['POST', 'PUT', 'DELETE'] },
    { path: '/api/admin/backup', methods: ['POST'] },
    { path: '/api/vault', methods: ['POST', 'DELETE'] },
  ];
  return sensitive.some(route => pathname.startsWith(route.path) && route.methods.includes(method));
}

/**
 * PHASE: Rate Limiting
 */
export async function checkAdminRateLimit(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let config = { limit: 100, windowMs: 60000, keyPrefix: 'admin_ops' }; // Default

  if (pathname.includes('/login')) config = { limit: 5, windowMs: 900000, keyPrefix: 'admin_login' };
  
  return await withEdgeRateLimit(request, {
    ...config,
    blockDuration: 60000, 
  });
}