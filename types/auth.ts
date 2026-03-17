// types/auth.ts
import type { AccessTier } from "@/lib/access/tier-policy";

export type UserRole =
  | "guest"
  | "viewer"
  | "member"
  | "patron"
  | "inner-circle"
  | "editor"
  | "admin"
  | "founder";

export interface AoLClaims {
  tier: AccessTier;
  innerCircleAccess: boolean;
  isInternal: boolean;
  allowPrivate: boolean;
  memberId: string | null;
  emailHash: string | null;
  flags: string[];
  sessionId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string[];
  membershipDate?: string;
  lastAccess?: string;
  image?: string;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  viewer: 1,
  member: 2,
  patron: 3,
  "inner-circle": 4,
  editor: 5,
  admin: 6,
  founder: 7,
} as const;

export const CONTENT_ACCESS = {
  public: ["guest", "viewer", "member", "patron", "inner-circle", "editor", "admin", "founder"],
  member: ["member", "patron", "inner-circle", "editor", "admin", "founder"],
  patron: ["patron", "inner-circle", "editor", "admin", "founder"],
  "inner-circle": ["inner-circle", "editor", "admin", "founder"],
  restricted: ["admin", "founder"],
  admin: ["admin", "founder"],
  editor: ["editor", "admin", "founder"],
} as const;

export type ContentAccessLevel = keyof typeof CONTENT_ACCESS;

export function hasContentAccess(userRole: UserRole, contentLevel: string): boolean {
  const normalized = typeof contentLevel === "string" ? contentLevel.toLowerCase() : "public";
  const level = normalized in CONTENT_ACCESS
    ? (normalized as ContentAccessLevel)
    : "public";

  return (CONTENT_ACCESS[level] as readonly string[]).includes(userRole);
}