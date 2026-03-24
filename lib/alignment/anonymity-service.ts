import { createHash } from "crypto";

/**
 * SEVER_IDENTITY_LINK
 * Converts a participant-linked response into an anonymized data point.
 * This is an irreversible operation.
 */
export function scrubParticipantIdentity(participantId: string, campaignId: string): string {
  // Use a salted hash to ensure IDs cannot be reversed via rainbow tables
  const salt = process.env.ANONYMITY_SALT || "SOVEREIGN_PROTOCOL_2026";
  
  return createHash("sha256")
    .update(`${participantId}-${campaignId}-${salt}`)
    .digest("hex")
    .slice(0, 16); // Shortened hash for internal mapping without PII
}

/**
 * VALIDATE_COHORT_MINIMUM
 * Ensures a report is only generated if the 'n' is high enough 
 * to prevent deductive identification.
 */
export function isCohortSafe(participantCount: number): boolean {
  const MINIMUM_SAFE_COHORT = 5; 
  return participantCount >= MINIMUM_SAFE_COHORT;
}