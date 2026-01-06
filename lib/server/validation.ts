/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextApiRequest } from "next";
import type { NextRequest } from "next/server";
import crypto from "crypto";

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
 * Extract bearer token from request headers
 */
function getBearerToken(req: ExtendedRequest): string | null {
  if (!req.headers) return null;

  let authHeader: string | undefined | null;

  // 1. Edge Runtime / NextRequest (Headers object)
  if (typeof (req.headers as any).get === 'function') {
    authHeader = (req.headers as any).get('authorization');
  } 
  // 2. Node.js / NextApiRequest (IncomingHttpHeaders object)
  else {
    authHeader = (req.headers as any).authorization;
  }
  
  if (typeof authHeader === 'string') {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() || null;
  }
  return null;
}

/**
 * Extract JWT token from request headers or cookies
 */
function getJwtToken(req: ExtendedRequest): string | null {
  // Check Authorization header first
  const bearerToken = getBearerToken(req);
  if (bearerToken && bearerToken.includes('.')) {
    return bearerToken; // JWT tokens contain dots
  }

  // Check cookie
  if ('cookies' in req && req.cookies) {
    // 1. Edge Runtime (cookies.get method)
    if (typeof (req.cookies as any).get === 'function') {
      const adminCookie = (req.cookies as any).get('admin_token');
      const accessCookie = (req.cookies as any).get('access_token');
      return adminCookie?.value || accessCookie?.value || null;
    } 
    // 2. Node.js (cookies object)
    else {
      return (req.cookies as any).admin_token || (req.cookies as any).access_token || null;
    }
  }

  return null;
}

/**
 * Validate JWT token (simplified - in production use a proper JWT library)
 */
async function validateJwtToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const adminJwtSecret = process.env.ADMIN_JWT_SECRET;
    
    if (!adminJwtSecret) {
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

    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf-8')
    );

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false };
    }

    if (payload.iss !== 'admin-api' || payload.aud !== 'inner-circle') {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.sub || payload.userId,
    };
  } catch {
    return { valid: false };
  }
}

/**
 * INSTITUTIONAL ADMIN VALIDATION
 */
export async function validateAdminAccess(
  req: ExtendedRequest
): Promise<AdminAuthResult> {
  const adminKey = process.env.ADMIN_API_KEY;
  const adminJwtEnabled = process.env.ADMIN_JWT_ENABLED === 'true';
  
  if (process.env.NODE_ENV !== "production" && !adminKey && !adminJwtEnabled) {
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
    const keyBuffer = Buffer.from(adminKey);
    const tokenBuffer = Buffer.from(token);
    
    if (keyBuffer.length !== tokenBuffer.length || !crypto.timingSafeEqual(new Uint8Array(keyBuffer), new Uint8Array(tokenBuffer))) {
      return { 
        valid: false, 
        reason: "Invalid admin token",
        statusCode: 403
      };
    }
  } catch (_err) {
    return { 
      valid: false, 
      reason: "Internal security comparison failure",
      statusCode: 500
    };
  }

  let userId: string | undefined;
  if (typeof (req.headers as any).get === 'function') {
    userId = (req.headers as any).get('x-admin-user-id') || undefined;
  } else {
    const uid = (req.headers as any)['x-admin-user-id'];
    userId = Array.isArray(uid) ? uid[0] : uid;
  }

  return { valid: true, userId, method: "api_key" };
}

/**
 * Validate IP address against allowlist
 */
export function validateIpAddress(
  ip: string,
  allowlist: string[] = []
): { valid: boolean; reason?: string } {
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
    const mask = ~((1 << (32 - parseInt(prefix))) - 1);
    const ipLong = ipToLong(ip);
    const rangeLong = ipToLong(range);
    return (ipLong & mask) === (rangeLong & mask);
  } catch {
    return false;
  }
}

function ipToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
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

  if (!password || password.length < 8) {
    messages.push("Password must be at least 8 characters long");
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

  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
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

  for (const [key, validator] of Object.entries(schema)) {
    const result = validator(body[key]);
    if (!result.valid) {
      errors[key] = result.message || `Invalid value for ${key}`;
    } else {
      validData[key] = body[key];
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

  if (file.size > maxSize) {
    return { valid: false, message: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB` };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, message: `File type ${file.type} is not allowed` };
  }

  if (allowedExtensions.length > 0) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return { valid: false, message: `File extension .${extension} is not allowed` };
    }
  }

  return { valid: true };
}

/**
 * Middleware wrapper for validation
 */
export function withValidation<T>(
  // FIX: Explicitly allow extra arguments (...args) to be passed to handler
  handler: (req: ExtendedRequest, validatedData: T, ...args: any[]) => Promise<any>,
  schema: Record<string, (value: any) => { valid: boolean; message?: string }>
) {
  return async (req: ExtendedRequest, ...args: any[]) => {
    try {
      let body: any;
      
      if ('body' in req && req.body) {
        body = req.body;
      } else if ('json' in req) {
        body = await req.json();
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
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }

      // Spread args here is now valid because handler accepts ...args
      return handler(req, validationResult.data!, ...args);
    } catch (error) {
      console.error('[VALIDATION_ERROR]', error);
      return new Response(
        JSON.stringify({ error: 'Internal validation error' }),
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
