// lib/content/access.ts
import { UserRole, ROLE_HIERARCHY } from "@/types/auth";

/**
 * Normalizes classification from frontmatter/DB to our UserRole system
 */
export function getRequiredRole(doc: unknown): UserRole {
  if (!doc || typeof doc !== 'object') {
    return 'guest';
  }

  const rawClassification = 
    (doc as any).classification ||
    (doc as any).accessLevel ||
    (doc as any).tier ||
    (doc as any).security ||
    'public';

  const classification = String(rawClassification).toLowerCase().trim();

  switch (classification) {
    case 'public':
    case 'open':
    case 'unclassified':
      return 'guest';
    case 'member':
    case 'members':
    case 'premium':
    case 'subscriber':
      return 'member';
    case 'inner-circle':
    case 'innercircle':
    case 'circle':
    case 'inner':
      return 'inner-circle';
    case 'restricted':
    case 'private':
    case 'sensitive':
    case 'protected':
    case 'admin':
    case 'director':
      return 'admin';
    case 'confidential':
    case 'top-secret':
    case 'secret':
    case 'founder':
    case 'executive':
      return 'founder';
    default:
      return 'guest';
  }
}

/**
 * Core Logic: Can this specific role see this specific document?
 */
export function canAccessDoc(
  doc: unknown, 
  userRole: UserRole = 'guest'
): boolean {
  try {
    const requiredRole = getRequiredRole(doc);
    const userWeight = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredWeight = ROLE_HIERARCHY[requiredRole] ?? 0;
    return userWeight >= requiredWeight;
  } catch (error) {
    console.error('[Access] Error checking document access:', error);
    return false;
  }
}

/**
 * Check if document is publicly accessible
 */
export function isPublic(doc: unknown): boolean {
  return getRequiredRole(doc) === 'guest';
}

/**
 * Check if document requires any authentication at all
 */
export function requiresAuth(doc: unknown): boolean {
  return getRequiredRole(doc) !== 'guest';
}

/**
 * Get all roles that can access this document
 */
export function getAccessibleRoles(doc: unknown): UserRole[] {
  const requiredRole = getRequiredRole(doc);
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, weight]) => weight >= (ROLE_HIERARCHY[requiredRole] ?? 0))
    .map(([role]) => role as UserRole);
}