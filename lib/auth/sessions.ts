/* lib/auth/sessions.ts — SESSION ARCHITECTURE (INTEGRITY MODE) */
import { safeSlice } from "@/lib/utils/safe";
import { randomBytes, timingSafeEqual } from 'crypto';
// Types
export type SessionType = 'admin' | 'inner-circle' | 'public' | 'api';
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'compromised';
export interface SessionData {
  id: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  sessionType: SessionType;
  permissions: string[];
  issuedAt: Date;
  expiresAt: Date;
  lastActiveAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  status: SessionStatus;
  metadata?: Record<string, any>;
  csrfToken: string;
  refreshToken?: string;
}
export interface CreateSessionOptions {
  userId: string;
  userEmail?: string;
  userRole?: string;
  sessionType?: SessionType;
  permissions?: string[];
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  metadata?: Record<string, any>;
}
export interface VerifySessionOptions {
  requireCsrf?: boolean;
  csrfToken?: string;
  validateIp?: boolean;
  currentIp?: string;
  validateUserAgent?: boolean;
  currentUserAgent?: string;
}
// Constants
const SESSION_CONFIG = {
  admin: {
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    refreshable: true,
    maxActiveSessions: 5,
    requiresCsrf: true
  },
  'inner-circle': {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshable: true,
    maxActiveSessions: 3,
    requiresCsrf: true
  },
  public: {
    ttl: 24 * 60 * 60 * 1000, // 1 day
    refreshable: false,
    maxActiveSessions: 1,
    requiresCsrf: false
  },
  api: {
    ttl: 24 * 60 * 60 * 1000, // 1 day
    refreshable: true,
    maxActiveSessions: 10,
    requiresCsrf: false
  }
} as const;
// ==================== SESSION STORAGE ====================
class InMemStore {
  private static instance: InMemStore;
  private sessions = new Map<string, SessionData>();
  private constructor() {}
  static getInstance(): InMemStore {
    if (!InMemStore.instance) {
      InMemStore.instance = new InMemStore();
    }
    return InMemStore.instance;
  }
  async set(id: string, data: SessionData, ttl?: number): Promise<void> {
    this.sessions.set(id, data);
    if (ttl) {
      setTimeout(() => {
        this.sessions.delete(id);
      }, ttl);
    }
  }
  async get(id: string): Promise<SessionData | null> {
    return this.sessions.get(id) || null;
  }
  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }
  async findByUserId(userId: string, type?: SessionType): Promise<SessionData[]> {
    return Array.from(this.sessions.values()).filter(s => 
      s.userId === userId && (!type || s.sessionType === type)
    );
  }
}
/**
 * STRATEGIC FIX: REDIS INTEGRITY
 * Resolves: Property 'keys' does not exist on type 'RedisLike'
 * Pattern: Dynamic Type Casting with Runtime Safety
 */
async function getRedisSessionStore() {
  try {
    const redisModule = await import('@/lib/redis');
    const redisClient = redisModule.default || redisModule.redisClient;
    if (!redisClient) throw new Error('Redis Unavailable');
    // Type assertion to bypass strict type checking
    const redisAny = redisClient as any;
    return {
      async set(sessionId: string, data: SessionData, ttl?: number): Promise<void> {
        const key = `session:${sessionId}`;
        const ttlSeconds = ttl ? Math.floor(ttl / 1000) : 3600;
        await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      },
      async get(sessionId: string): Promise<SessionData | null> {
        const data = await redisClient.get(`session:${sessionId}`);
        return data ? JSON.parse(data) : null;
      },
      async delete(sessionId: string): Promise<void> {
        await redisClient.del(`session:${sessionId}`);
      },
      async findByUserId(userId: string, sessionType?: SessionType): Promise<SessionData[]> {
        const pattern = `session:*`;
        // FIX: Cast to 'any' to bypass TypeScript property check
        // Check if keys method exists dynamically at runtime
        if (typeof redisAny.keys === 'function') {
          try {
            const keys: string[] = await redisAny.keys(pattern);
            const sessions: SessionData[] = [];
            // Limit scan for build-time safety
            for (const key of safeSlice(keys, 0, 100)) {
              const data = await redisClient.get(key);
              if (data) {
                const session = JSON.parse(data);
                if (session.userId === userId && (!sessionType || session.sessionType === sessionType)) {
                  sessions.push(session);
                }
              }
            }
            return sessions;
          } catch (e) {
            console.error('[Redis] Scan Failure:', e);
          }
        }
        return InMemStore.getInstance().findByUserId(userId, sessionType);
      },
      async revokeAll(userId: string, sessionType?: SessionType): Promise<void> {
        const sessions = await this.findByUserId(userId, sessionType);
        for (const session of sessions) {
          if (session.status === 'active') {
            session.status = 'revoked';
            await this.set(session.id, session);
          }
        }
      }
    };
  } catch (error) {
    console.warn('[Sessions] Redis fallback to In-Memory');
    return InMemStore.getInstance();
  }
}
// ==================== EXPORT API (CORE LOGIC) ====================
export async function createSession(options: CreateSessionOptions): Promise<{
  sessionId: string;
  csrfToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const {
    userId,
    userEmail,
    userRole,
    sessionType = 'admin',
    permissions = [],
    rememberMe = false,
    ipAddress,
    userAgent,
    deviceId,
    metadata = {}
  } = options;
  if (!userId || typeof userId !== 'string' || userId.length > 255) {
    throw new Error('Invalid userId');
  }
  const config = SESSION_CONFIG[sessionType];
  const ttl = rememberMe ? config.ttl * 2 : config.ttl;
  const sessionId = `sess_${generateSecureToken(32)}`;
  const csrfToken = generateSecureToken(24);
  const refreshToken = config.refreshable ? `refresh_${generateSecureToken(32)}` : undefined;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);
  const sessionData: SessionData = {
    id: sessionId,
    userId,
    userEmail,
    userRole,
    sessionType,
    permissions,
    issuedAt: now,
    expiresAt,
    lastActiveAt: now,
    ipAddress,
    userAgent,
    deviceId,
    status: 'active',
    metadata,
    csrfToken,
    refreshToken
  };
  const store = await getRedisSessionStore();
  await store.set(sessionId, sessionData, ttl);
  return { sessionId, csrfToken, refreshToken, expiresAt };
}
export async function verifySession(
  sessionId: string,
  options: VerifySessionOptions = {}
): Promise<{
  valid: boolean;
  session?: SessionData;
  error?: string;
  statusCode?: number;
}> {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 512) {
    return { valid: false, error: 'Invalid session ID', statusCode: 400 };
  }
  const store = await getRedisSessionStore();
  const session = await store.get(sessionId);
  if (!session) {
    return { valid: false, error: 'Session not found', statusCode: 401 };
  }
  const now = new Date();
  // Check expiration
  if (session.expiresAt <= now) {
    session.status = 'expired';
    await store.set(sessionId, session);
    return { valid: false, error: 'Session expired', statusCode: 401 };
  }
  // Check status
  if (session.status !== 'active') {
    return { 
      valid: false, 
      error: `Session ${session.status}`, 
      statusCode: 401 
    };
  }
  // Check CSRF token if required
  const config = SESSION_CONFIG[session.sessionType];
  if (config.requiresCsrf && options.requireCsrf !== false) {
    if (!options.csrfToken) {
      return { valid: false, error: 'CSRF token required', statusCode: 403 };
    }
    // Create safe comparison
    const providedToken = Buffer.from(options.csrfToken);
    const storedToken = Buffer.from(session.csrfToken);
    if (providedToken.length !== storedToken.length || !timingSafeEqual(providedToken, storedToken)) {
      return { valid: false, error: 'Invalid CSRF token', statusCode: 403 };
    }
  }
  // Update last active timestamp
  session.lastActiveAt = now;
  await store.set(sessionId, session);
  return { valid: true, session };
}
export async function refreshSession(
  sessionId: string,
  refreshToken: string
): Promise<{
  success: boolean;
  newSessionId?: string;
  newCsrfToken?: string;
  error?: string;
}> {
  const store = await getRedisSessionStore();
  const session = await store.get(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found' };
  }
  const config = SESSION_CONFIG[session.sessionType];
  if (!config.refreshable) {
    return { success: false, error: 'Session type not refreshable' };
  }
  if (session.refreshToken !== refreshToken) {
    return { success: false, error: 'Invalid refresh token' };
  }
  if (session.status !== 'active') {
    return { success: false, error: `Session ${session.status}` };
  }
  // Create new session with same data
  const newSessionId = `sess_${generateSecureToken(32)}`;
  const newCsrfToken = generateSecureToken(24);
  const newRefreshToken = `refresh_${generateSecureToken(32)}`;
  const now = new Date();
  const newExpiresAt = new Date(now.getTime() + config.ttl);
  const newSession: SessionData = {
    ...session,
    id: newSessionId,
    csrfToken: newCsrfToken,
    refreshToken: newRefreshToken,
    issuedAt: now,
    expiresAt: newExpiresAt,
    lastActiveAt: now
  };
  // Store new session
  await store.set(newSessionId, newSession, config.ttl);
  // Revoke old session
  session.status = 'revoked';
  await store.set(sessionId, session);
  return {
    success: true,
    newSessionId,
    newCsrfToken
  };
}
export async function revokeSession(sessionId: string): Promise<boolean> {
  const store = await getRedisSessionStore();
  const session = await store.get(sessionId);
  if (!session) {
    return false;
  }
  session.status = 'revoked';
  await store.set(sessionId, session);
  return true;
}
export async function revokeAllUserSessions(
  userId: string,
  sessionType?: SessionType
): Promise<number> {
  const store = await getRedisSessionStore();
  const sessions = await store.findByUserId(userId, sessionType);
  let revokedCount = 0;
  for (const session of sessions) {
    if (session.status === 'active') {
      session.status = 'revoked';
      await store.set(session.id, session);
      revokedCount++;
    }
  }
  return revokedCount;
}
export async function getActiveSessions(
  userId: string,
  sessionType?: SessionType
): Promise<SessionData[]> {
  const store = await getRedisSessionStore();
  const sessions = await store.findByUserId(userId, sessionType);
  const now = new Date();
  return sessions.filter(s => 
    s.status === 'active' && s.expiresAt > now
  );
}
// ==================== SECURITY UTILITIES ====================
function generateSecureToken(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice, 0, length);
}
// ==================== COOKIE MANAGEMENT ====================
export function createSessionCookie(
  sessionId: string,
  sessionType: SessionType = 'admin',
  rememberMe: boolean = false
): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict';
    maxAge: number;
    path: string;
    priority: 'high' | 'medium' | 'low';
  };
} {
  const config = SESSION_CONFIG[sessionType];
  const ttl = rememberMe ? config.ttl * 2 : config.ttl;
  const cookieName = getCookieName(sessionType);
  return {
    name: cookieName,
    value: sessionId,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.floor(ttl / 1000),
      path: '/',
      priority: 'high'
    }
  };
}
export function createCsrfCookie(
  csrfToken: string,
  sessionType: SessionType = 'admin',
  rememberMe: boolean = false
): {
  name: string;
  value: string;
  options: {
    httpOnly: false;
    secure: boolean;
    sameSite: 'strict';
    maxAge: number;
    path: string;
  };
} {
  const config = SESSION_CONFIG[sessionType];
  const ttl = rememberMe ? config.ttl * 2 : config.ttl;
  const cookieName = getCsrfCookieName(sessionType);
  return {
    name: cookieName,
    value: csrfToken,
    options: {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor(ttl / 1000),
      path: '/'
    }
  };
}
function getCookieName(sessionType: SessionType): string {
  const prefix = process.env.SESSION_COOKIE_PREFIX || 'aol';
  return `${prefix}_${sessionType}_session`;
}
function getCsrfCookieName(sessionType: SessionType): string {
  const prefix = process.env.SESSION_COOKIE_PREFIX || 'aol';
  return `${prefix}_${sessionType}_csrf`;
}
// ==================== EXPORT API ====================
const sessionsApi = {
  createSession,
  verifySession,
  refreshSession,
  revokeSession,
  revokeAllUserSessions,
  getActiveSessions,
  createSessionCookie,
  createCsrfCookie,
};
export default sessionsApi;