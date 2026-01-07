// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSessionResponse } from '@/middleware/admin-auth';
import { rateLimitRedis } from '@/lib/rate-limit-redis';
import { 
  withEdgeRateLimit, 
  createRateLimitedResponse, 
  RATE_LIMIT_CONFIGS 
} from '@/lib/server/rate-limit-unified';
import { getEmailHash } from '@/lib/crypto-utils';
import { verifyRecaptcha } from '@/lib/recaptchaServer';

// Mock database - replace with your actual database
const ADMIN_USERS = [
  {
    id: '1',
    username: 'admin',
    emailHash: getEmailHash('admin@abrahamoflondon.org'),
    // In production, store hashed password using bcrypt
    passwordHash: '$2b$10$YourHashedPasswordHere', // bcrypt hash
    role: 'superadmin',
    mfaEnabled: false,
    lastLogin: null,
    failedAttempts: 0,
    lockedUntil: null,
  }
];

// Password validation (use bcrypt in production)
async function validatePassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // In production, use: return await bcrypt.compare(inputPassword, storedHash);
  
  // For development only - never do this in production!
  if (process.env.NODE_ENV !== 'production') {
    const devPassword = process.env.ADMIN_DEV_PASSWORD;
    if (devPassword && inputPassword === devPassword) {
      return true;
    }
  }
  
  // Mock validation for now
  console.warn('Using mock password validation - implement bcrypt in production!');
  return inputPassword === 'demo-password-change-this';
}

// Validate admin credentials with security measures
async function validateAdminCredentials(
  username: string, 
  password: string,
  ip: string
): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
  requiresMfa?: boolean;
}> {
  if (!username || !password) {
    return { isValid: false, error: 'Username and password required' };
  }
  
  // Find user by username or email
  const normalizedUsername = username.toLowerCase().trim();
  const emailHash = getEmailHash(normalizedUsername);
  
  const user = ADMIN_USERS.find(u => 
    u.username.toLowerCase() === normalizedUsername || 
    u.emailHash === emailHash
  );
  
  if (!user) {
    // Use constant time to prevent user enumeration
    await new Promise(resolve => setTimeout(resolve, 100));
    return { isValid: false, error: 'Invalid credentials' };
  }
  
  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > Date.now()) {
    const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / (1000 * 60));
    return { 
      isValid: false, 
      error: `Account locked. Try again in ${minutesLeft} minutes.` 
    };
  }
  
  // Validate password
  const isValid = await validatePassword(password, user.passwordHash);
  
  // Update failed attempts
  if (!isValid) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (user.failedAttempts >= 5) {
      user.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
      return { 
        isValid: false, 
        error: 'Too many failed attempts. Account locked for 15 minutes.' 
      };
    }
    
    return { isValid: false, error: 'Invalid credentials' };
  }
  
  // Reset failed attempts on successful login
  user.failedAttempts = 0;
  user.lockedUntil = null;
  user.lastLogin = new Date().toISOString();
  
  return {
    isValid: true,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
    },
    requiresMfa: user.mfaEnabled,
  };
}

// Handle reCAPTCHA verification
async function handleRecaptcha(request: NextRequest): Promise<{
  success: boolean;
  error?: string;
}> {
  const recaptchaToken = request.headers.get('X-Recaptcha-Token');
  
  if (!recaptchaToken) {
    // In development, allow bypass if configured
    if (process.env.NODE_ENV !== 'production' && 
        process.env.ALLOW_RECAPTCHA_BYPASS === 'true') {
      return { success: true };
    }
    return { success: false, error: 'reCAPTCHA token required' };
  }
  
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  
  try {
    const isValid = await verifyRecaptcha(
      recaptchaToken, 
      'admin_login',
      clientIp
    );
    
    return { success: isValid, error: isValid ? undefined : 'reCAPTCHA verification failed' };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, error: 'reCAPTCHA service error' };
  }
}

// Main login handler
export async function POST(request: NextRequest) {
  try {
    // ==================== PHASE 1: RATE LIMITING ====================
    const { allowed, headers, result } = await withEdgeRateLimit(
      request,
      RATE_LIMIT_CONFIGS.AUTH
    );
    
    if (!allowed) {
      return createRateLimitedResponse(result);
    }
    
// In the handler, before processing:
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
const result = await rateLimitRedis.check(`auth:${ip}`, {
  windowMs: 60000,
  max: 5,
  keyPrefix: 'auth_login',
  blockDuration: 300000,
});

if (!result.allowed) {
  return new Response('Too many login attempts', { status: 429 });
}
    // ==================== PHASE 2: REQUEST VALIDATION ====================
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }
    
    const { username, password, rememberMe, mfaCode } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // ==================== PHASE 3: reCAPTCHA VERIFICATION ====================
    const recaptchaResult = await handleRecaptcha(request);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'Security check failed' },
        { status: 400 }
      );
    }
    
    // ==================== PHASE 4: CREDENTIAL VALIDATION ====================
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const credentialResult = await validateAdminCredentials(username, password, clientIp);
    
    if (!credentialResult.isValid) {
      // Log failed attempt
      console.warn(`[ADMIN] Failed login attempt for ${username} from ${clientIp}: ${credentialResult.error}`);
      
      return NextResponse.json(
        { 
          error: credentialResult.error || 'Invalid credentials',
          remainingAttempts: 5 - (credentialResult.user?.failedAttempts || 0)
        },
        { 
          status: 401,
          headers: { 'X-Login-Attempt': 'failed' }
        }
      );
    }
    
    // ==================== PHASE 5: MFA VERIFICATION ====================
    if (credentialResult.requiresMfa) {
      if (!mfaCode) {
        return NextResponse.json(
          { 
            error: 'MFA required',
            requiresMfa: true,
            mfaType: 'totp' // or 'sms', 'email', etc.
          },
          { status: 428 } // Precondition Required
        );
      }
      
      // Validate MFA code (implement your MFA logic here)
      const isMfaValid = await validateMfaCode(
        credentialResult.user!.id,
        mfaCode
      );
      
      if (!isMfaValid) {
        return NextResponse.json(
          { error: 'Invalid MFA code' },
          { status: 401 }
        );
      }
    }
    
    // ==================== PHASE 6: CREATE SESSION ====================
    const response = createSessionResponse(
      credentialResult.user!.id,
      request,
      rememberMe
    );
    
    // ==================== PHASE 7: PREPARE RESPONSE ====================
    const responseBody = { 
      success: true, 
      user: {
        id: credentialResult.user!.id,
        username: credentialResult.user!.username,
        role: credentialResult.user!.role,
        requiresMfa: credentialResult.requiresMfa,
      },
      session: {
        expires: rememberMe ? 
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : // 30 days
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }
    };
    
    // Add rate limit headers
    const finalResponse = NextResponse.json(responseBody, {
      status: 200,
      headers: response.headers,
    });
    
    Object.entries(headers || {}).forEach(([key, value]) => {
      finalResponse.headers.set(key, value);
    });
    
    // Add security headers
    finalResponse.headers.set('X-Login-Success', 'true');
    finalResponse.headers.set('X-User-Role', credentialResult.user!.role);
    
    // Log successful login
    console.log(`[ADMIN] Successful login for ${username} from ${clientIp}`);
    
    return finalResponse;
    
  } catch (error) {
    console.error('[ADMIN] Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function for MFA validation (placeholder)
async function validateMfaCode(userId: string, code: string): Promise<boolean> {
  // Implement your MFA logic here (TOTP, SMS, etc.)
  // For now, return true for development
  return process.env.NODE_ENV !== 'production';
}

// Optional: GET endpoint for login page data
export async function GET(request: NextRequest) {
  return NextResponse.json({
    recaptchaEnabled: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? true : false,
    mfaEnabled: false, // Configure based on your setup
    allowRememberMe: true,
    maxSessionAge: 24 * 60 * 60, // 24 hours in seconds
  });
}

// Configuration
export const runtime = 'edge';
export const dynamic = 'force-dynamic';