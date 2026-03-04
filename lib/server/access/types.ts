import type { AccessTier as PolicyTier } from "@/lib/access/tier-policy";
export type AccessTier = PolicyTier;

export type AccessSession = {
  sessionId: string;
  tier: AccessTier;
  subject: string;
  issuedAt: number;
  expiresAt: number;
  revoked?: boolean;
};

export type OneTimeToken = {
  token: string;
  tier: AccessTier;
  subject: string;
  expiresAt: number;
  consumedAt?: number;
  revoked?: boolean;
};