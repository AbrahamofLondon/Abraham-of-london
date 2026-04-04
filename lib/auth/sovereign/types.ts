// lib/auth/sovereign/types.ts
export interface SovereignSession {
  token: string;
  createdAt: number;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
}

export interface SovereignValidationResult {
  valid: boolean;
  reason?: string;
  session?: SovereignSession;
}

export interface SovereignAuthConfig {
  sessionDuration: number; // milliseconds
  maxAttempts: number;
  lockoutDuration: number;
  requireSecureCookie: boolean;
}