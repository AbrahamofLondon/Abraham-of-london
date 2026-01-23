// types/auth.ts
export type UserRole = 'guest' | 'viewer' | 'editor' | 'admin' | 
                      'member' | 'patron' | 'inner-circle' | 'founder';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: string[];
  membershipDate?: string;
  lastAccess?: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'guest': 0,
  'viewer': 1,
  'editor': 2,
  'admin': 3,
  'member': 4,
  'patron': 5,
  'inner-circle': 6,
  'founder': 7
} as const;

// Content access levels mapped to roles
export const CONTENT_ACCESS = {
  'public': ['guest', 'viewer', 'editor', 'admin', 'member', 'patron', 'inner-circle', 'founder'],
  'member': ['member', 'patron', 'inner-circle', 'founder'],
  'patron': ['patron', 'inner-circle', 'founder'],
  'inner-circle': ['inner-circle', 'founder'],
  'founder': ['founder'],
  'admin': ['admin'],
  'editor': ['editor', 'admin']
} as const;

export type ContentAccessLevel = keyof typeof CONTENT_ACCESS;

/**
 * Check if a user role has access to a specific content level
 */
export function hasContentAccess(userRole: UserRole, contentLevel: ContentAccessLevel): boolean {
  return CONTENT_ACCESS[contentLevel].includes(userRole);
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

// Re-export for backward compatibility
export type { UserRole };