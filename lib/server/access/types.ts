export type AccessTier = "public" | "inner-circle" | "private";

export type AccessSession = {
  sessionId: string;
  tier: AccessTier;
  subject: string; // user id or email hash or "anon"
  issuedAt: number;
  expiresAt: number; // epoch ms
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
