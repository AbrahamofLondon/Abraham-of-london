// types/auth.ts

export type UserRole = 'guest' | 'viewer' | 'member' | 'patron' | 
                      'inner-circle' | 'editor' | 'admin' | 'founder';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  membershipDate?: string;
  lastAccess?: string;
}

/**
 * FIXED HIERARCHY: 
 * We want Admin/Founder at the top so they can access EVERYTHING.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'guest': 0,
  'viewer': 1,
  'member': 2,
  'patron': 3,
  'inner-circle': 4,
  'editor': 5,
  'admin': 6,
  'founder': 7
} as const;

/**
 * CONTENT ACCESS MAPPING
 * Added 'restricted' to match your MDX classification.
 */
export const CONTENT_ACCESS = {
  'public': ['guest', 'viewer', 'member', 'patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'member': ['member', 'patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'patron': ['patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'inner-circle': ['inner-circle', 'editor', 'admin', 'founder'],
  'restricted': ['admin', 'founder'], // ONLY Directorate level
  'admin': ['admin', 'founder'],
  'editor': ['editor', 'admin', 'founder']
} as const;

export type ContentAccessLevel = keyof typeof CONTENT_ACCESS;

/**
 * Check if a user role has access to a specific content level
 */
export function hasContentAccess(userRole: UserRole, contentLevel: string): boolean {
  // Fallback to public if the level doesn't exist in our map
  const level = (contentLevel.toLowerCase() in CONTENT_ACCESS) 
    ? (contentLevel.toLowerCase() as ContentAccessLevel) 
    : 'public';
    
  return (CONTENT_ACCESS[level] as readonly string[]).includes(userRole);
}

/**
 * Check if role A has at least the privileges of role B
 */
export function hasRolePrivileges(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get the highest role from an array of roles
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => 
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest, 
    'guest' as UserRole
  );
}