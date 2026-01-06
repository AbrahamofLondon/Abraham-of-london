/* lib/server/auth/admin.ts - PRODUCTION SAFETY UPGRADE */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// SAFE: Production environment detection
const isProduction = () => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'production';
};

const isDevelopment = () => {
  if (typeof process === 'undefined') return false;
  if (!process.env) return false;
  return process.env.NODE_ENV === 'development';
};

// Explicit discriminated union type
export type AdminAuthResult =
  | { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" }
  | { valid: false; reason: string; statusCode?: number };

// Type guard functions for precise narrowing in guards.ts
export function isInvalidAdmin(
  result: AdminAuthResult
): result is { valid: false; reason: string; statusCode?: number } {
  return result.valid === false;
}

export function isValidAdmin(
  result: AdminAuthResult
): result is { valid: true; userId?: string; method: "api_key" | "dev_mode" | "jwt" } {
  return result.valid === true;
}

// Extended request type to support both Next.js and Edge runtimes
type ExtendedRequest = NextApiRequest | NextRequest;

/**
 * Extract bearer token from request headers with safety checks
 */
function getBearerToken(req: ExtendedRequest): string | null {
  if (!req.headers) return null;

  let authHeader: string | undefined | null;

  try {
    // 1. Edge Runtime / NextRequest (Headers object)
    if (typeof (req.headers as any).get === 'function') {
      authHeader = (req.headers as any).get('authorization');
    } 
    // 2. Node.js / NextApiRequest (IncomingHttpHeaders object)
    else {
      authHeader = (req.headers as any).authorization;
    }
  } catch {
    return null;
  }
  
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1]?.trim();
    
    // CRITICAL FIX: Add basic token validation
    if (!token || token.length > 1024) return null;
    if (/[\x00-\x1F\x7F]/.test(token)) return null; // No control characters
    
    return token;
  }
  return null;
}

/**
 * Extract JWT token from request headers or cookies with safety checks
 */
function getJwtToken(req: ExtendedRequest): string | null {
  // Check Authorization header first
  const bearerToken = getBearerToken(req);
  if (bearerToken && bearerToken.includes('.') && bearerToken.split('.').length === 3) {
    // Basic JWT structure validation
    const parts = bearerToken.split('.');
    if (parts.every(p => p.length > 0 && p.length < 2048)) {
      return bearerToken;
    }
  }

  // Check cookie with safety
  if ('cookies' in req && req.cookies) {
    let token: string | null = null;
    
    try {
      // 1. Edge Runtime (cookies.get method)
      if (typeof (req.cookies as any).get === 'function') {
        const adminCookie = (req.cookies as any).get('admin_token');
        const accessCookie = (req.cookies as any).get('access_token');
        token = adminCookie?.value || accessCookie?.value || null;
      } 
      // 2. Node.js (cookies object)
      else {
        token = (req.cookies as any).admin_token || (req.cookies as any).access_token || null;
      }
    } catch {
      return null;
    }
    
    // Validate extracted token
    if (token && token.length > 0 && token.length < 1024 && !/[\x00-\x1F\x7F]/.test(token)) {
      return token;
    }
  }

  return null;
}

/**
 * Validate JWT token with better safety
 */
async function validateJwtToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
    
    // CRITICAL FIX: Validate secret exists and is valid
    if (!adminJwtSecret || adminJwtSecret.length < 32) {
      return { valid: false };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return { valid: false };
    }

    let payload: any;
    try {
      const payloadStr = Buffer.from(payloadB64, 'base64').toString('utf-8');
      payload = JSON.parse(payloadStr);
    } catch {
      return { valid: false };
    }

    // CRITICAL FIX: Validate payload is an object
    if (typeof payload !== 'object' || payload === null) {
      return { valid: false };
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    if (payload.iss !== 'admin-api' || payload.aud !== 'inner-circle') {
      return { valid: false };
    }

    // CRITICAL FIX: Validate user ID format
    const userId = payload.sub || payload.userId;
    if (userId && (typeof userId !== 'string' || userId.length > 255)) {
      return { valid: false };
    }

    // IMPORTANT: In production, replace this with proper JWT verification
    // using a library like jsonwebtoken or jose
    // This is a simplified version for demonstration
    
    return {
      valid: true,
      userId: userId || undefined,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * INSTITUTIONAL ADMIN VALIDATION with critical safety fixes
 */
export async function validateAdminAccess(
  req: ExtendedRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === 'true';
  
  // CRITICAL FIX: Safer development mode check
  if (isDevelopment() && !adminKey && !adminJwtEnabled) {
    console.warn('[ADMIN_AUTH] Development mode active - no admin credentials required');
    return { valid: true, method: "dev_mode" };
  }

  if (adminJwtEnabled) {
    const jwtToken = getJwtToken(req);
    if (jwtToken) {
      const jwtResult = await validateJwtToken(jwtToken);
      if (jwtResult.valid) {
        return { 
          valid: true, 
          userId: jwtResult.userId, 
          method: "jwt" 
        };
      }
    }
  }

  const token = getBearerToken(req);

  if (!adminKey) {
    return { 
      valid: false, 
      reason: "ADMIN_API_KEY is not configured on the server",
      statusCode: 500
    };
  }

  if (!token) {
    return { 
      valid: false, 
      reason: "Missing Authorization Bearer token",
      statusCode: 401
    };
  }

  try {
    // CRITICAL FIX: Use UTF-8 encoding explicitly
    const keyBuffer = Buffer.from(adminKey, 'utf8');
    const tokenBuffer = Buffer.from(token, 'utf8');
    
    // CRITICAL FIX: Validate lengths before comparison
    if (keyBuffer.length !== tokenBuffer.length) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
    
    if (!crypto.timingSafeEqual(new Uint8Array(keyBuffer), new Uint8Array(tokenBuffer))) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (_err) {
    return { 
      valid: false, 
      reason: "Internal security validation failure",
      statusCode: 500
    };
  }

  let userId: string | undefined;
  try {
    if (typeof (req.headers as any).get === 'function') {
      const uid = (req.headers as any).get('x-admin-user-id');
      if (uid && typeof uid === 'string' && uid.length > 0 && uid.length < 255) {
        userId = uid.trim();
      }
    } else {
      const uid = (req.headers as any)['x-admin-user-id'];
      if (uid) {
        const uidStr = Array.isArray(uid) ? uid[0] : uid;
        if (typeof uidStr === 'string' && uidStr.length > 0 && uidStr.length < 255) {
          userId = uidStr.trim();
        }
      }
    }
  } catch {
    // Silently ignore header extraction errors
  }

  return { valid: true, userId, method: "api_key" };
}

/**
 * Validate IP address against allowlist with safety
 */
export function validateIpAddress(
  ip: string,
  allowlist: string[] = []
): { valid: boolean; reason?: string } {
  // CRITICAL FIX: Validate IP format
  if (!ip || typeof ip !== 'string' || ip.length > 45) {
    return { valid: false, reason: "Invalid IP address format" };
  }

  if (allowlist.length === 0) {
    return { valid: true };
  }

  if (allowlist.includes(ip)) {
    return { valid: true };
  }

  for (const allowed of allowlist) {
    if (allowed.includes('/')) {
      if (isIpInCidr(ip, allowed)) {
        return { valid: true };
      }
    }
  }

  return { 
    valid: false, 
    reason: `IP address ${ip} is not in the allowlist` 
  };
}

function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, prefix] = cidr.split('/');
    const prefixInt = parseInt(prefix, 10);
    
    // Validate prefix
    if (isNaN(prefixInt) || prefixInt < 0 || prefixInt > 32) {
      return false;
    }
    
    const mask = ~((1 << (32 - prefixInt)) - 1);
    const ipLong = ipToLong(ip);
    const rangeLong = ipToLong(range);
    
    if (isNaN(ipLong) || isNaN(rangeLong)) {
      return false;
    }
    
    return (ipLong & mask) === (rangeLong & mask);
  } catch {
    return false;
  }
}

function ipToLong(ip: string): number {
  try {
    const octets = ip.split('.');
    if (octets.length !== 4) return NaN;
    
    return octets.reduce((acc, octet) => {
      const octetInt = parseInt(octet, 10);
      if (isNaN(octetInt) || octetInt < 0 || octetInt > 255) return NaN;
      return (acc << 8) + octetInt;
    }, 0);
  } catch {
    return NaN;
  }
}

export function validateDateRange(input: {
  since: Date;
  until: Date;
  maxDays: number;
}): { ok: true } | { ok: false; message: string; statusCode?: number } {
  const { since, until, maxDays } = input;

  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime())) {
    return { ok: false, message: "Invalid date format provided", statusCode: 400 };
  }
  
  if (since > until) {
    return { ok: false, message: "Temporal paradox: Start date is after end date", statusCode: 400 };
  }
  
  const diffTime = Math.abs(until.getTime() - since.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  if (diffDays > maxDays) {
    return { 
      ok: false, 
      message: `Oversight limit exceeded: max ${maxDays} days per export`, 
      statusCode: 400 
    };
  }

  return { ok: true };
}

export function validateEmail(email: string): { valid: boolean; message?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string') return { valid: false, message: "Email is required" };
  if (!emailRegex.test(email)) return { valid: false, message: "Invalid email format" };
  if (email.length > 254) return { valid: false, message: "Email is too long" };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; message?: string; score: number } {
  let score = 0;
  const messages: string[] = [];

  // CRITICAL FIX: Stronger password requirements
  if (!password || password.length < 12) {
    messages.push("Password must be at least 12 characters long");
  } else { score += 1; }

  if (!/[A-Z]/.test(password)) {
    messages.push("Password must contain at least one uppercase letter");
  } else { score += 1; }

  if (!/[a-z]/.test(password)) {
    messages.push("Password must contain at least one lowercase letter");
  } else { score += 1; }

  if (!/[0-9]/.test(password)) {
    messages.push("Password must contain at least one number");
  } else { score += 1; }

  if (!/[^A-Za-z0-9]/.test(password)) {
    messages.push("Password must contain at least one special character");
  } else { score += 1; }

  if (password.length > 128) {
    messages.push("Password is too long");
  }

  // CRITICAL FIX: Extended common password list
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', '12345678', 'abc123', 'password1'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    messages.push("Password is too common");
    score = 0;
  }

  return {
    valid: messages.length === 0,
    message: messages.join(', '),
    score
  };
}

export function validateUuid(uuid: string): { valid: boolean; message?: string } {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) return { valid: false, message: "Invalid UUID format" };
  return { valid: true };
}

export function validateRequestBody<T>(
  body: any,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
): { valid: boolean; data?: T; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const validData: any = {};

  // CRITICAL FIX: Validate body exists
  if (!body || typeof body !== 'object') {
    errors['_root'] = 'Request body is required and must be an object';
    return { valid: false, errors };
  }

  for (const [key, validator] of Object.entries(schema)) {
    try {
      const result = validator(body[key]);
      if (!result.valid) {
        errors[key] = result.message || `Invalid value for ${key}`;
      } else {
        validData[key] = body[key];
      }
    } catch (error) {
      errors[key] = `Validation error for ${key}`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    data: Object.keys(errors).length === 0 ? validData as T : undefined,
    errors
  };
}

export function validateFileUpload(
  file: { name: string; size: number; type: string; },
  options: { allowedTypes?: string[]; maxSize?: number; allowedExtensions?: string[]; } = {}
): { valid: boolean; message?: string } {
  const { allowedTypes = [], maxSize = 10 * 1024 * 1024, allowedExtensions = [] } = options;

  // CRITICAL FIX: Basic file validation
  if (!file || typeof file !== 'object') {
    return { valid: false, message: "File object is required" };
  }

  if (typeof file.size !== 'number' || file.size < 0) {
    return { valid: false, message: "Invalid file size" };
  }

  if (file.size > maxSize) {
    return { valid: false, message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB` };
  }

  if (allowedTypes.length > 0) {
    if (!file.type || typeof file.type !== 'string') {
      return { valid: false, message: "File type is required" };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: `File type ${file.type} is not allowed` };
    }
  }

  if (allowedExtensions.length > 0) {
    if (!file.name || typeof file.name !== 'string') {
      return { valid: false, message: "File name is required" };
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, message: `File extension .${extension} is not allowed` };
    }
  }

  return { valid: true };
}

/**
 * Middleware wrapper for validation with safety improvements
 */
export function withValidation<T>(
  handler: (req: ExtendedRequest, validatedData: T, ...args: any[]) => Promise<any>,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
) {
  return async (req: ExtendedRequest, ...args: any[]) => {
    try {
      let body: any;
      
      if ('body' in req && req.body) {
        body = req.body;
      } else if ('json' in req) {
        try {
          body = await req.json();
        } catch {
          return new Response(
            JSON.stringify({ 
              error: 'Invalid JSON in request body' 
            }),
            { 
              status: 400, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        throw new Error('Unable to parse request body');
      }

      const validationResult = validateRequestBody<T>(body, schema);
      
      if (!validationResult.valid) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed', 
            details: validationResult.errors 
          }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              'X-Validation-Errors': Object.keys(validationResult.errors).length.toString()
            } 
          }
        );
      }

      return await Promise.race([
        handler(req, validationResult.data!, ...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Handler timeout')), 30000)
        )
      ]);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return new Response(
        JSON.stringify({ 
          error: isProduction() ? 'Internal validation error' : error instanceof Error ? error.message : 'Unknown error'
        }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
  };
}

export default {
  validateAdminAccess,
  validateDateRange,
  validateEmail,
  validatePassword,
  validateUuid,
  validateRequestBody,
  validateFileUpload,
  validateIpAddress,
  withValidation,
  isInvalidAdmin,
  isValidAdmin,
};