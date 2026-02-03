/* ============================================================================
 * SOVEREIGN CONTENT ENGINE [CLIENT-SAFE]
 * ============================================================================ */

import { UserRole, ROLE_HIERARCHY } from "@/types/auth";

export type { UserRole };

/**
 * Normalizes classification from frontmatter/DB to our UserRole system
 */
export function getRequiredRole(doc: any): UserRole {
  // Map "Restricted" or "Private" classification to the 'admin' role requirement
  const classification = doc?.classification?.toLowerCase() || 'public';
  
  if (classification === 'restricted' || classification === 'private') return 'admin';
  if (classification === 'inner-circle') return 'inner-circle';
  if (classification === 'member') return 'member';
  
  return 'guest';
}

/**
 * Core Logic: Can this specific role see this specific document?
 */
export function canAccessDoc(doc: any, userRole: UserRole = 'guest'): boolean {
  const requiredRole = getRequiredRole(doc);
  
  const userWeight = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredWeight = ROLE_HIERARCHY[requiredRole] ?? 0;
  
  return userWeight >= requiredWeight;
}

export function isPublic(doc: any): boolean {
  return getRequiredRole(doc) === 'guest';
}