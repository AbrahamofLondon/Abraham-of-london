export type UserRole = 
  | 'guest' 
  | 'viewer' 
  | 'member' 
  | 'patron' 
  | 'inner-circle' 
  | 'editor' 
  | 'admin' 
  | 'founder';

/**
 * STRATEGIC HIERARCHY
 * Higher numbers = Higher clearance.
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
 * Maps MDX classification strings to allowed Roles.
 */
export const CONTENT_ACCESS = {
  'public': ['guest', 'viewer', 'member', 'patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'member': ['member', 'patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'patron': ['patron', 'inner-circle', 'editor', 'admin', 'founder'],
  'inner-circle': ['inner-circle', 'editor', 'admin', 'founder'],
  'restricted': ['admin', 'founder'], // Directorate Level Only
  'admin': ['admin', 'founder'],
  'editor': ['editor', 'admin', 'founder']
} as const;

export type ContentAccessLevel = keyof typeof CONTENT_ACCESS;

export function hasContentAccess(userRole: UserRole, contentLevel: string): boolean {
  const level = (contentLevel.toLowerCase() in CONTENT_ACCESS) 
    ? (contentLevel.toLowerCase() as ContentAccessLevel) 
    : 'public';
  return (CONTENT_ACCESS[level] as readonly string[]).includes(userRole);
}