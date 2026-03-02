// lib/downloads/security-fixes.ts
import type { AccessTier } from "@/lib/access/tier-policy";
import { hasAccess, normalizeUserTier } from "@/lib/access/tier-policy";

// Re-export everything from security.ts
export * from './security';

// Add missing exports
export function tierAtLeast(userTier: string | AccessTier | null | undefined, requiredTier: AccessTier): boolean {
  return hasAccess(userTier, requiredTier);
}

export function getUserTierFromCookies(req: any): AccessTier {
  const cookieHeader = req.headers?.cookie || '';
  const cookies: Record<string, string> = {};
  
  cookieHeader.split(';').forEach((part: string) => {
    const [key, ...val] = part.trim().split('=');
    if (key) {
      cookies[key] = decodeURIComponent(val.join('=') || '');
    }
  });
  
  const rawTier = 
    cookies.aol_tier ||
    cookies.aol_ic_tier ||
    cookies.inner_circle_tier ||
    cookies.ic_tier ||
    'public';
  
  return normalizeUserTier(rawTier);
}