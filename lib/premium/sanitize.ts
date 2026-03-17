// lib/premium/sanitize.ts
import type { PremiumDownloadAttempt, PremiumDownloadToken } from "@prisma/client";

// Define public-safe types
export type SanitizedAttempt = Omit<
  PremiumDownloadAttempt,
  "ipAddress" | "ipHash" | "userAgent" | "referrer"
>;

export type SanitizedToken = Omit<PremiumDownloadToken, "tokenId">; // ✅ FIXED: Omit tokenId instead of token

export function sanitizeAuditData(data: {
  attempts?: PremiumDownloadAttempt[];
  tokens?: PremiumDownloadToken[];
}) {
  return {
    attempts: data.attempts?.map(({ ipAddress, ipHash, userAgent, referrer, ...rest }) => rest),
    // ✅ FIXED: Omit tokenId (the identifier), not token (which doesn't exist)
    tokens: data.tokens?.map(({ tokenId, ...rest }) => rest),
  };
}