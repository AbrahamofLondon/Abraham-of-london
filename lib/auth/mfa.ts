// lib/auth/mfa.ts - FIXED TYPE ERROR
import { randomInt, randomBytes } from 'crypto';
import { encode as encodeBase32 } from 'hi-base32';
import { authenticator } from '@otplib/preset-default';

// Types (keep your existing types)
export type MfaMethod = 'totp' | 'sms' | 'email' | 'backup-code' | 'push';
export type MfaStatus = 'pending' | 'verified' | 'expired' | 'failed';
export type MfaChallengeType = 'login' | 'transaction' | 'recovery';

export interface MfaUser {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface MfaChallenge {
  id: string;
  userId: string;
  method: MfaMethod;
  type: MfaChallengeType;
  code?: string;
  secret?: string;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
  status: MfaStatus;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  attempts: number;
  maxAttempts: number;
}

export interface MfaSetup {
  userId: string;
  methods: MfaMethod[];
  totpSecret?: string;
  totpVerified: boolean;
  backupCodes: string[];
  phoneNumber?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  recoveryEmail?: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerifyMfaOptions {
  challengeId: string;
  code: string;
  ipAddress?: string;
  userAgent?: string;
  rememberDevice?: boolean;
}

// Constants
const MFA_CONFIG = {
  totp: {
    window: 1, // Valid codes within ±1 interval
    step: 30, // 30 seconds per code
    digits: 6,
    algorithm: 'SHA1'
  },
  sms: {
    codeLength: 6,
    expiryMinutes: 10,
    maxAttempts: 3
  },
  email: {
    codeLength: 8,
    expiryMinutes: 15,
    maxAttempts: 3
  },
  'backup-code': {
    codeLength: 10,
    usesRemaining: 1,
    maxAttempts: 3
  },
  challenge: {
    defaultExpiryMinutes: 10,
    maxAttempts: 3,
    cleanupHours: 24
  }
} as const;

// ==================== CHALLENGE STORAGE ====================
class MfaChallengeStore {
  private static instance: MfaChallengeStore;
  private challenges = new Map<string, MfaChallenge>();
  
  private constructor() {}

  static getInstance(): MfaChallengeStore {
    if (!MfaChallengeStore.instance) {
      MfaChallengeStore.instance = new MfaChallengeStore();
    }
    return MfaChallengeStore.instance;
  }

  async set(challengeId: string, challenge: MfaChallenge, ttl?: number): Promise<void> {
    this.challenges.set(challengeId, challenge);
    
    if (ttl) {
      setTimeout(() => {
        this.challenges.delete(challengeId);
      }, ttl);
    }
  }

  async get(challengeId: string): Promise<MfaChallenge | null> {
    return this.challenges.get(challengeId) || null;
  }

  async delete(challengeId: string): Promise<void> {
    this.challenges.delete(challengeId);
  }

  async findByUserId(userId: string): Promise<MfaChallenge[]> {
    const challenges: MfaChallenge[] = [];
    
    for (const [_, challenge] of this.challenges) {
      if (challenge.userId === userId) {
        challenges.push(challenge);
      }
    }
    
    return challenges;
  }
}

// Redis storage - FIXED: Using modern Redis SET with EX option
async function getRedisMfaStore() {
  // Server-side only - client-side uses in-memory store
  if (typeof window !== 'undefined') {
    return MfaChallengeStore.getInstance();
  }
  
  try {
    // Import your Redis module correctly
    const redisModule = await import('@/lib/redis');
    
    // Use the default export (redisClient) from your module
    const redis = redisModule.default;
    
    // Check if Redis is available
    if (!redis || typeof redis.get !== 'function') {
      console.warn('[MFA] Redis client not properly initialized, using in-memory store');
      return MfaChallengeStore.getInstance();
    }
    
    return {
      async set(challengeId: string, challenge: MfaChallenge, ttl?: number): Promise<void> {
        try {
          // FIXED: Modern Redis clients use SET with EX option
          // Convert ttl from milliseconds to seconds
          const ttlSeconds = Math.floor((ttl || 3600) / 1000);
          
          await redis.set(
            `mfa:challenge:${challengeId}`,
            JSON.stringify(challenge),
            'EX',
            ttlSeconds
          );
        } catch (error) {
          console.error('[MFA] Redis set error, falling back to in-memory:', error);
          MfaChallengeStore.getInstance().set(challengeId, challenge, ttl);
        }
      },
      
      async get(challengeId: string): Promise<MfaChallenge | null> {
        try {
          const data = await redis.get(`mfa:challenge:${challengeId}`);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error('[MFA] Redis get error, falling back to in-memory:', error);
          return MfaChallengeStore.getInstance().get(challengeId);
        }
      },
      
      async delete(challengeId: string): Promise<void> {
        try {
          await redis.del(`mfa:challenge:${challengeId}`);
        } catch (error) {
          console.error('[MFA] Redis delete error, falling back to in-memory:', error);
          MfaChallengeStore.getInstance().delete(challengeId);
        }
      },
      
      async findByUserId(userId: string): Promise<MfaChallenge[]> {
        // Redis doesn't support this directly - fallback to in-memory
        return MfaChallengeStore.getInstance().findByUserId(userId);
      }
    };
    
  } catch (error) {
    console.warn('[MFA] Redis import failed, using in-memory store:', error);
    return MfaChallengeStore.getInstance();
  }
}

// ==================== TOTP MANAGEMENT ====================
export function generateTotpSecret(): string {
  const secretBytes = randomBytes(20);
  return encodeBase32(secretBytes).replace(/=/g, '');
}

export function generateTotpUri(
  secret: string,
  user: { email: string; issuer: string }
): string {
  return authenticator.keyuri(user.email, user.issuer, secret);
}

export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch (error) {
    console.error('[MFA] TOTP verification error:', error);
    return false;
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = randomBytes(6).toString('hex').toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
    codes.push(formatted);
  }
  
  return codes;
}

// ==================== CHALLENGE MANAGEMENT ====================
export async function createMfaChallenge(
  userId: string,
  method: MfaMethod,
  type: MfaChallengeType = 'login',
  options: {
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  } = {}
): Promise<{
  challengeId: string;
  code?: string;
  secret?: string;
  expiresAt: Date;
}> {
  const { ipAddress, userAgent, metadata } = options;
  
  // Generate challenge ID
  const challengeId = `mfa_${randomBytes(16).toString('hex')}`;
  
  const now = new Date();
  let expiresAt: Date;
  let code: string | undefined;
  let secret: string | undefined;

  switch (method) {
    case 'totp':
      expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes
      break;

    case 'sms':
    case 'email':
      code = generateNumericCode(MFA_CONFIG[method].codeLength);
      expiresAt = new Date(now.getTime() + MFA_CONFIG[method].expiryMinutes * 60 * 1000);
      await sendVerificationCode(method, userId, code);
      break;

    case 'backup-code':
      expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
      break;

    default:
      throw new Error(`Unsupported MFA method: ${method}`);
  }

  const challenge: MfaChallenge = {
    id: challengeId,
    userId,
    method,
    type,
    code,
    secret,
    createdAt: now,
    expiresAt,
    status: 'pending',
    metadata,
    ipAddress,
    userAgent,
    attempts: 0,
    maxAttempts: MFA_CONFIG.challenge.maxAttempts
  };

  // Store challenge
  const store = await getRedisMfaStore();
  await store.set(
    challengeId, 
    challenge, 
    expiresAt.getTime() - now.getTime()
  );

  // Log challenge creation
  await logMfaEvent({
    userId,
    action: 'CHALLENGE_CREATED',
    method,
    challengeId,
    ipAddress,
    userAgent,
    metadata
  });

  return {
    challengeId,
    code,
    secret,
    expiresAt
  };
}

export async function verifyMfaChallenge(
  options: VerifyMfaOptions
): Promise<{
  success: boolean;
  challenge?: MfaChallenge;
  error?: string;
  remainingAttempts?: number;
}> {
  const { challengeId, code, ipAddress, userAgent, rememberDevice } = options;

  if (!challengeId || !code) {
    return { success: false, error: 'Challenge ID and code are required' };
  }

  if (typeof code !== 'string' || code.length > 20) {
    return { success: false, error: 'Invalid code format' };
  }

  const store = await getRedisMfaStore();
  const challenge = await store.get(challengeId);

  if (!challenge) {
    return { success: false, error: 'Challenge not found or expired' };
  }

  const now = new Date();

  // Check expiration
  if (challenge.expiresAt <= now) {
    challenge.status = 'expired';
    await store.set(challengeId, challenge);
    return { success: false, error: 'Challenge expired' };
  }

  // Check attempts
  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.status = 'failed';
    await store.set(challengeId, challenge);
    
    await logSecurityEvent({
      userId: challenge.userId,
      action: 'MFA_MAX_ATTEMPTS',
      ipAddress,
      details: { challengeId, method: challenge.method }
    });
    
    return { success: false, error: 'Maximum attempts exceeded' };
  }

  // Verify code based on method
  let isValid = false;

  switch (challenge.method) {
    case 'totp':
      try {
        const { prisma } = await import('@/lib/prisma');
        const mfaSetup = await prisma.mfaSetup.findUnique({
          where: { userId: challenge.userId },
          select: { totpSecret: true }
        });
        
        if (mfaSetup?.totpSecret) {
          isValid = verifyTotpCode(mfaSetup.totpSecret, code);
        }
      } catch (error) {
        console.error('[MFA] Failed to get TOTP secret:', error);
      }
      break;

    case 'sms':
    case 'email':
      isValid = challenge.code?.toUpperCase() === code.toUpperCase();
      break;

    case 'backup-code':
      isValid = await verifyBackupCode(challenge.userId, code);
      break;

    default:
      return { success: false, error: `Unsupported method: ${challenge.method}` };
  }

  // Update challenge
  challenge.attempts++;
  
  if (isValid) {
    challenge.status = 'verified';
    challenge.verifiedAt = now;
    
    // Store verified device if requested
    if (rememberDevice && userAgent) {
      await rememberMfaDevice(challenge.userId, userAgent, ipAddress);
    }
  } else if (challenge.attempts >= challenge.maxAttempts) {
    challenge.status = 'failed';
  }

  await store.set(challengeId, challenge);

  // Log verification attempt
  await logMfaEvent({
    userId: challenge.userId,
    action: isValid ? 'CHALLENGE_VERIFIED' : 'CHALLENGE_FAILED',
    method: challenge.method,
    challengeId,
    ipAddress,
    userAgent,
    metadata: { 
      attempts: challenge.attempts,
      maxAttempts: challenge.maxAttempts,
      rememberDevice 
    }
  });

  if (isValid) {
    return { 
      success: true, 
      challenge,
      remainingAttempts: challenge.maxAttempts - challenge.attempts
    };
  } else {
    return { 
      success: false, 
      error: 'Invalid verification code',
      remainingAttempts: challenge.maxAttempts - challenge.attempts
    };
  }
}

export async function getPendingChallenges(
  userId: string
): Promise<MfaChallenge[]> {
  const store = await getRedisMfaStore();
  const challenges = await store.findByUserId(userId);
  const now = new Date();
  
  return challenges.filter(c => 
    c.status === 'pending' && c.expiresAt > now
  );
}

export async function cancelChallenge(challengeId: string): Promise<boolean> {
  const store = await getRedisMfaStore();
  const challenge = await store.get(challengeId);
  
  if (!challenge || challenge.status !== 'pending') {
    return false;
  }
  
  await store.delete(challengeId);
  
  await logMfaEvent({
    userId: challenge.userId,
    action: 'CHALLENGE_CANCELLED',
    method: challenge.method,
    challengeId
  });
  
  return true;
}

// ==================== SET MFA CHALLENGE (USED BY ADMIN LOGIN) ====================
export async function setMFAChallenge(userId: string, challenge: string): Promise<void> {
  try {
    const store = await getRedisMfaStore();
    
    // Store the challenge reference
    await store.set(`challenge_ref:${userId}`, {
      id: `challenge_ref:${userId}`,
      userId,
      challengeValue: challenge,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 300000), // 5 minutes
      status: 'pending',
      method: 'totp',
      type: 'login',
      attempts: 0,
      maxAttempts: 3
    } as MfaChallenge, 300000);
    
    await logMfaEvent({
      userId,
      action: 'MFA_CHALLENGE_SET',
      challengeId: challenge,
      metadata: { action: 'login' }
    });
  } catch (error) {
    console.error('[MFA] Failed to store challenge:', error);
  }
}

// ==================== SECURITY UTILITIES ====================
function generateNumericCode(length: number): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

async function sendVerificationCode(
  method: 'sms' | 'email',
  userId: string,
  code: string
): Promise<void> {
  try {
    console.log(`[MFA] ${method.toUpperCase()} verification code for ${userId}: ${code}`);
    
    if (method === 'email') {
      // Try to import email dispatcher
      try {
        const { sendEmail } = await import('@/lib/email/dispatcher');
        await sendEmail({
          to: userId,
          subject: 'Your Verification Code',
          text: `Your verification code is: ${code}`,
          html: `<p>Your verification code is: <strong>${code}</strong></p>`
        });
      } catch (error) {
        console.warn('[MFA] Email dispatcher not available, logging code only:', error);
      }
    }
    
  } catch (error) {
    console.error(`[MFA] Failed to send ${method} code:`, error);
    throw error;
  }
}

async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const setup = await prisma.mfaSetup.findUnique({
      where: { userId },
      select: { backupCodes: true }
    });
    
    if (!setup) return false;
    
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    
    // FIXED: Handle the database type properly without unnecessary type assertion
    const backupCodes = setup.backupCodes;
    
    // Ensure backupCodes is an array
    if (!Array.isArray(backupCodes)) {
      console.error('[MFA] backupCodes is not an array:', typeof backupCodes);
      return false;
    }
    
    const index = backupCodes.findIndex((bc: any) => 
      bc.replace(/-/g, '').toUpperCase() === normalizedCode
    );
    
    if (index === -1) return false;
    
    // Remove used backup code
    backupCodes.splice(index, 1);
    await prisma.mfaSetup.update({
      where: { userId },
      data: { backupCodes }
    });
    
    return true;
    
  } catch (error) {
    console.error('[MFA] Backup code verification error:', error);
    return false;
  }
}

async function rememberMfaDevice(
  userId: string,
  userAgent: string,
  ipAddress?: string
): Promise<void> {
  try {
    const deviceId = generateDeviceId(userAgent, ipAddress);
    const store = await getRedisMfaStore();
    
    await store.set(
      `mfa:device:${userId}:${deviceId}`,
      {
        userAgent,
        ipAddress,
        lastUsed: new Date().toISOString(),
        userId
      } as any,
      30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    );
    
  } catch (error) {
    console.warn('[MFA] Failed to remember device:', error);
  }
}

export async function isDeviceRemembered(
  userId: string,
  userAgent: string,
  ipAddress?: string
): Promise<boolean> {
  try {
    const deviceId = generateDeviceId(userAgent, ipAddress);
    const store = await getRedisMfaStore();
    
    const device = await store.get(`mfa:device:${userId}:${deviceId}`);
    return !!device;
    
  } catch (error) {
    return false;
  }
}

function generateDeviceId(userAgent: string, ipAddress?: string): string {
  const data = `${userAgent}:${ipAddress || ''}`;
  const hash = randomBytes(16).toString('hex');
  return hash.substring(0, 16);
}

// ==================== LOGGING ====================
async function logMfaEvent(event: {
  userId: string;
  action: string;
  method?: MfaMethod;
  challengeId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: `MFA_${event.action}`,
        details: JSON.stringify({
          method: event.method,
          challengeId: event.challengeId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          timestamp: new Date().toISOString(),
          metadata: event.metadata
        }),
        ipAddress: event.ipAddress || 'unknown',
        userAgent: event.userAgent || 'unknown',
        severity: event.action.includes('FAILED') ? 'MEDIUM' : 'LOW'
      }
    });
  } catch (error) {
    console.error('[MFA] Failed to log event:', error);
  }
}

async function logSecurityEvent(event: {
  userId: string;
  action: string;
  ipAddress?: string;
  details?: Record<string, any>;
}): Promise<void> {
  try {
    const { prisma } = await import('@/lib/prisma');
    
    await prisma.securityLog.create({
      data: {
        userId: event.userId,
        action: `SECURITY_${event.action}`,
        details: JSON.stringify({
          ipAddress: event.ipAddress,
          timestamp: new Date().toISOString(),
          details: event.details
        }),
        ipAddress: event.ipAddress || 'unknown',
        userAgent: 'mfa-system',
        severity: 'HIGH'
      }
    });
  } catch (error) {
    console.error('[SecurityLog] Failed to log event:', error);
  }
}

// ==================== EXPORTS ====================
const mfaApi = {
  // Challenge Management
  createMfaChallenge,
  verifyMfaChallenge,
  getPendingChallenges,
  cancelChallenge,
  setMFAChallenge,
  
  // TOTP
  generateTotpSecret,
  generateTotpUri,
  verifyTotpCode,
  generateBackupCodes,
  
  // Device Management
  isDeviceRemembered
};

export default mfaApi;