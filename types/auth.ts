// types/auth.ts (extending your existing types)
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
};

// Content access levels mapped to roles
export const CONTENT_ACCESS = {
  'public': ['guest', 'viewer', 'editor', 'admin', 'member', 'patron', 'inner-circle', 'founder'],
  'member': ['member', 'patron', 'inner-circle', 'founder'],
  'patron': ['patron', 'inner-circle', 'founder'],
  'inner-circle': ['inner-circle', 'founder'],
  'founder': ['founder'],
  // Keep your existing admin permissions
  'admin': ['admin'],
  'editor': ['editor', 'admin']
} as const;