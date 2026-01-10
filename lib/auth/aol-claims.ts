// lib/auth/aol-claims.ts
export type AoLTier =
  | "public"
  | "inner-circle"
  | "inner-circle-plus"
  | "inner-circle-elite"
  | "private";

export type AoLClaims = {
  aol?: {
    tier: AoLTier;
    innerCircleAccess: boolean;
    isInternal: boolean; // staff/internal
    allowPrivate: boolean; // explicit private gate
    memberId?: string | null;
    emailHash?: string | null;
    flags?: string[]; // decoded from InnerCircleMember.flags JSON
  };
};


