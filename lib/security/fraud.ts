/* lib/security/fraud.ts
   Zero-cost interim fraud heuristics.
   Conservative by design.
*/

type FraudInput = {
  email: string;
  sessionEmail?: string | null;
  ip: string;
  userAgent: string;
  productCode?: string | null;
  entitlementStatus?: string | null;
  artifactCountLastHour?: number;
  failedAttemptsLastHour?: number;
  hasEntitlement?: boolean;
};

export type FraudAssessment = {
  allowed: boolean;
  score: number;
  reasons: string[];
};

export function assessFraud(input: FraudInput): FraudAssessment {
  const reasons: string[] = [];
  let score = 0;

  if (!input.email) {
    score += 60;
    reasons.push("EMAIL_MISSING");
  }

  if (input.sessionEmail && input.email.toLowerCase() !== input.sessionEmail.toLowerCase()) {
    score += 45;
    reasons.push("EMAIL_SESSION_MISMATCH");
  }

  if (!input.hasEntitlement) {
    score += 80;
    reasons.push("NO_ACTIVE_ENTITLEMENT");
  }

  if (input.entitlementStatus && input.entitlementStatus !== "active") {
    score += 50;
    reasons.push("ENTITLEMENT_NOT_ACTIVE");
  }

  if ((input.failedAttemptsLastHour || 0) >= 5) {
    score += 30;
    reasons.push("EXCESSIVE_FAILED_ATTEMPTS");
  }

  if ((input.artifactCountLastHour || 0) >= 15) {
    score += 40;
    reasons.push("UNUSUAL_DOWNLOAD_VOLUME");
  }

  if (!input.userAgent || input.userAgent.length < 10) {
    score += 15;
    reasons.push("WEAK_USER_AGENT_SIGNAL");
  }

  if (input.ip === "unknown") {
    score += 10;
    reasons.push("IP_UNKNOWN");
  }

  return {
    allowed: score < 70,
    score,
    reasons,
  };
}